import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { classifyQuery } from './classifier.ts';
import { getOrCreateConversation, updateConversation } from './state.ts';
import { getTemplate } from './templates.ts';
import { isGreeting, isReset, parseGoal } from './parser.ts';
import { generateResponseStream } from './generator.ts';
import { retrieve } from './retrieval.ts';
import { ChatRequest, ChatResponse, Language } from './types.ts';
import { getHandler } from './handlers/index.ts';
import { checkRateLimit } from './rate-limiter.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let parsedMessage: string | undefined;
  let parsedConversationId: string | undefined;
  let parsedRequestLanguage: string | undefined;
  let conversationRef: { language?: string } | undefined;

  try {
    // Parse request
    const body: ChatRequest = await req.json();
    const { message, conversation_id, language: requestLanguage } = body;
    parsedMessage = message;
    parsedConversationId = conversation_id;
    parsedRequestLanguage = requestLanguage;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: 'Message too long (max 2000 characters)' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const huggingfaceKey = Deno.env.get('HUGGINGFACE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!groqApiKey) {
      throw new Error('Missing GROQ_API_KEY environment variable');
    }

    if (!huggingfaceKey) {
      throw new Error('Missing HUGGINGFACE_API_KEY environment variable');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting
    const rateLimitKey = conversation_id || req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimit = await checkRateLimit(rateLimitKey, supabase);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      });
    }

    console.log(`Processing message: "${message.substring(0, 100)}..."`);

    // Step 1: Get or create conversation
    const conversation = await getOrCreateConversation(conversation_id, supabase);
    conversationRef = conversation;
    console.log(`Conversation ${conversation.id}: state=${conversation.state}`);

    // Fetch last 6 messages for conversation history
    const { data: historyRows } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(6);

    const messageHistory = (historyRows || []).map((r: { role: string; content: string }) => ({
      role: r.role,
      content: r.content,
    }));

    // Step 2: Detect language (quick classification)
    const classification = await classifyQuery(message, groqApiKey);
    let language: Language = classification.language;

    // Check if message is language-ambiguous (numbers, single chars, etc.)
    const isAmbiguousInput = /^[\d\s.,!?]+$/.test(message.trim()) || message.trim().length <= 3;

    // Priority: 1. Request language (first message with language selection)
    //           2. High-confidence classifier detection (skip for ambiguous inputs)
    //           3. Existing conversation language
    if (requestLanguage && ['french', 'arabic', 'derja'].includes(requestLanguage)) {
      language = requestLanguage as Language;
      if (conversation.language !== language) {
        await updateConversation(conversation.id, { language }, supabase);
        conversation.language = language;
      }
    } else if (isAmbiguousInput) {
      // For ambiguous inputs (numbers, short text), always preserve conversation language
      language = conversation.language;
    } else if (conversation.language !== language && classification.confidence >= 0.9) {
      // Derja<->Arabic guard: require very high confidence to switch between these two
      const isDerjaArabicSwitch =
        (conversation.language === 'derja' && language === 'arabic') ||
        (conversation.language === 'arabic' && language === 'derja');
      if (isDerjaArabicSwitch && classification.confidence < 0.95) {
        // Not confident enough to switch between Derja and Arabic -- preserve current
        language = conversation.language;
      } else {
        await updateConversation(conversation.id, { language }, supabase);
        conversation.language = language;
      }
    } else if (classification.confidence < 0.9) {
      // Preserve existing conversation language for low-confidence detections
      language = conversation.language;
    }

    // Step 3: Handle reset or greeting (greetings always reset conversation)
    if (isReset(message) || isGreeting(message)) {
      await updateConversation(conversation.id, {
        state: 'goal_selection',
        goal: null,
        car_origin: null,
        residency: null,
        fcr_famille: false,
        fuel_preference: null,
        car_type_preference: null,
        condition_preference: null,
        budget_tnd: null,
        calc_price_eur: null,
        calc_engine_cc: null,
        calc_fuel_type: null,
        selected_procedure: null,
      }, supabase);

      return sendResponse({
        message: getTemplate('goal_selection', language),
        intent: 'general_info',
        language,
        conversation_id: conversation.id,
        state: 'goal_selection',
      });
    }

    // Step 4: Dispatch to appropriate state handler

    // Insert user message into history
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
    });

    // Check if streaming is requested for LLM-powered states
    const isStreamableState = ['showing_cars', 'showing_comparison'].includes(conversation.state);
    if (body.stream && isStreamableState && classification.intent !== 'off_topic' && !parseGoal(message, true)) {
      const context = await retrieve(message, classification.intent, classification.filters, supabase, huggingfaceKey);

      let fullContent = '';
      const rawStream = await generateResponseStream(message, classification, context, groqApiKey, messageHistory);
      const reader = rawStream.getReader();
      const textDecoder = new TextDecoder();

      const responseStream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            // Save the complete message to history after stream ends
            await supabase.from('messages').insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: fullContent || '[streamed response]',
            });
            controller.close();
            return;
          }
          // Capture content from SSE data lines for history
          const chunk = textDecoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                if (parsed.content) fullContent += parsed.content;
              } catch { /* skip malformed */ }
            }
          }
          controller.enqueue(value);
        },
        cancel() {
          reader.cancel();
        },
      });

      return new Response(responseStream, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const handler = getHandler(conversation.state);
    const result = await handler({
      message,
      conversation,
      language,
      classification,
      supabase,
      groqApiKey,
      huggingfaceKey,
      messageHistory,
    });

    // Insert assistant message into history
    const { data: insertedMsg } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: result.response.message,
    }).select('id').single();

    // Add message_id to response for feedback
    if (insertedMsg?.id) {
      result.response.message_id = insertedMsg.id;
    }

    return sendResponse(result.response);

  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      conversation_id: parsedConversationId || 'unknown',
      message_preview: parsedMessage ? parsedMessage.substring(0, 50) : 'N/A',
    }));

    const errorMessages: Record<string, string> = {
      french: "Désolé, une erreur technique est survenue. Veuillez réessayer.",
      arabic: 'عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى.',
      derja: 'سامحني، صار مشكل تقني. عاود جرب.',
    };
    const errorLang = conversationRef?.language || parsedRequestLanguage || 'french';
    return new Response(
      JSON.stringify({
        error: errorMessages[errorLang] || errorMessages.french,
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});

function sendResponse(response: ChatResponse): Response {
  console.log(`Response: "${response.message.substring(0, 100)}..."`);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
