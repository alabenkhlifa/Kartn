import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { classifyQuery } from './classifier.ts';
import { generateResponse, getOffTopicResponse } from './generator.ts';
import { retrieve } from './retrieval.ts';
import { ChatRequest, ChatResponse } from './types.ts';

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

  try {
    // Parse request
    const body: ChatRequest = await req.json();
    const { message, conversation_id, user_context } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
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

    console.log(`Processing message: "${message.substring(0, 100)}..."`);

    // Step 1: Classify the query (fast LLM)
    console.log('Step 1: Classifying query...');
    const classification = await classifyQuery(message, groqApiKey);
    console.log(`Classification: intent=${classification.intent}, language=${classification.language}`);

    // Step 2: Handle off-topic immediately (skip retrieval)
    if (classification.intent === 'off_topic') {
      console.log('Off-topic query, returning redirect response');
      const response: ChatResponse = {
        message: getOffTopicResponse(classification.language),
        intent: classification.intent,
        language: classification.language,
        conversation_id,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Retrieve relevant context
    console.log('Step 2: Retrieving context...');
    const context = await retrieve(
      message,
      classification.intent,
      classification.filters,
      supabase,
      huggingfaceKey
    );
    console.log(
      `Retrieved: ${context.knowledge_chunks.length} KB chunks, ${context.cars.length} cars`
    );

    // Step 4: Generate response (main LLM)
    console.log('Step 3: Generating response...');
    const { message: responseMessage, calculation } = await generateResponse(
      message,
      classification,
      context,
      groqApiKey
    );

    // Build response
    const response: ChatResponse = {
      message: responseMessage,
      intent: classification.intent,
      language: classification.language,
      conversation_id,
    };

    // Add sources from KB
    if (context.knowledge_chunks.length > 0) {
      response.sources = [...new Set(context.knowledge_chunks.map((c) => c.source))];
    }

    // Add cars if car search
    if (context.cars.length > 0) {
      response.cars = context.cars;
    }

    // Add calculation if performed
    if (calculation) {
      response.calculation = calculation;
    }

    console.log('Response generated successfully');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
