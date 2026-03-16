import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { MODELS, OFF_TOPIC_RESPONSES, SYSTEM_PROMPTS } from './config.ts';
import {
  calculateTax,
  compareFCRRegimes,
  formatFCRComparison,
  formatTaxBreakdown,
} from './calculator.ts';
import { getLLMProvider, getFallbackProvider } from './providers/factory.ts';
import { getCachedResponse, setCachedResponse } from './response-cache.ts';
import {
  CalculationParams,
  CarResult,
  ClassificationResult,
  FCRComparison,
  KnowledgeChunk,
  Language,
  RetrievalContext,
  TaxBreakdown,
} from './types.ts';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MAX_CONTEXT_TOKENS = 3000;

/**
 * Format knowledge chunks for context
 */
function formatKnowledgeContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return '';

  const formatted = chunks
    .map((c, i) => {
      const header = c.section
        ? `[Source: ${c.source} - ${c.section}${c.subsection ? ` > ${c.subsection}` : ''}]`
        : `[Source: ${c.source}]`;
      return `${i + 1}. ${header}\n${c.content}`;
    })
    .join('\n\n');

  return `KNOWLEDGE BASE:\n${formatted}`;
}

/**
 * Format car results for context
 */
function formatCarsContext(cars: CarResult[]): string {
  if (cars.length === 0) return '';

  const formatted = cars
    .map((c) => {
      const price = c.price_tnd
        ? `${c.price_tnd.toLocaleString()} TND`
        : c.price_eur
          ? `${c.price_eur.toLocaleString()} EUR`
          : 'Prix non disponible';
      const fcr = [];
      if (c.fcr_tre_eligible) fcr.push('FCR TRE');
      if (c.fcr_famille_eligible) fcr.push('FCR Famille');

      return `- ${c.brand} ${c.model} ${c.variant || ''} (${c.year})
  Prix: ${price} | ${c.fuel_type} | ${c.mileage_km ? c.mileage_km.toLocaleString() + ' km' : 'Neuf'}
  Pays: ${c.country} | ${fcr.length ? 'Éligible: ' + fcr.join(', ') : 'Non éligible FCR'}
  URL: ${c.url}`;
    })
    .join('\n\n');

  return `VEHICLES FOUND:\n${formatted}`;
}

/**
 * Build the full context for the LLM
 */
function buildContext(
  context: RetrievalContext,
  calcResult?: TaxBreakdown | FCRComparison
): string {
  const parts: string[] = [];

  if (context.knowledge_chunks.length > 0) {
    parts.push(formatKnowledgeContext(context.knowledge_chunks));
  }

  if (context.cars.length > 0) {
    parts.push(formatCarsContext(context.cars));
  }

  if (calcResult) {
    if ('recommended' in calcResult) {
      parts.push('CALCULATION RESULT:\n' + formatFCRComparison(calcResult));
    } else {
      parts.push('CALCULATION RESULT:\n' + formatTaxBreakdown(calcResult));
    }
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Get off-topic response in the detected language
 */
export function getOffTopicResponse(language: Language): string {
  return OFF_TOPIC_RESPONSES[language] || OFF_TOPIC_RESPONSES.french;
}

/**
 * Perform calculation if needed and return result
 */
export function performCalculation(
  params: CalculationParams | undefined
): TaxBreakdown | FCRComparison | undefined {
  if (!params) return undefined;

  // If no specific regime requested, compare all
  if (!params.regime) {
    try {
      return compareFCRRegimes(params);
    } catch {
      return undefined;
    }
  }

  // Calculate for specific regime
  try {
    return calculateTax(params);
  } catch {
    return undefined;
  }
}

/**
 * Generate response using Llama 3.3 70B
 */
export async function generateResponse(
  userMessage: string,
  classification: ClassificationResult,
  context: RetrievalContext,
  groqApiKey: string,
  messageHistory?: Array<{ role: string; content: string }>,
  supabase?: SupabaseClient
): Promise<{
  message: string;
  calculation?: TaxBreakdown | FCRComparison;
  suggestions?: string[];
}> {
  // Handle off-topic immediately
  if (classification.intent === 'off_topic') {
    return {
      message: getOffTopicResponse(classification.language),
    };
  }

  // Perform calculation if cost_calculation intent
  let calcResult: TaxBreakdown | FCRComparison | undefined;
  if (classification.intent === 'cost_calculation') {
    calcResult = performCalculation(classification.calculation_params);
    context.calculation = calcResult;
  }

  // Build context string with token guard
  let contextStr = buildContext(context, calcResult);
  if (estimateTokens(contextStr) > MAX_CONTEXT_TOKENS) {
    while (context.knowledge_chunks.length > 1 && estimateTokens(buildContext(context, calcResult)) > MAX_CONTEXT_TOKENS) {
      context.knowledge_chunks.pop();
    }
    contextStr = buildContext(context, calcResult);
    console.log(`Context trimmed to ${estimateTokens(contextStr)} estimated tokens`);
  }

  // Build prompt
  const userPrompt = contextStr
    ? `Context:\n${contextStr}\n\n---\n\nUser question: ${userMessage}`
    : `User question: ${userMessage}`;

  // Check cache for knowledge/eligibility queries (not car search - results change)
  if (supabase && classification.intent !== 'car_search') {
    const cached = await getCachedResponse(userMessage, classification.intent, supabase);
    if (cached) {
      return {
        message: cached.message,
        calculation: calcResult,
        suggestions: cached.suggestions,
      };
    }
  }

  try {
    const provider = getLLMProvider();
    const chatOptions = {
      model: MODELS.generator,
      messages: [
        { role: 'system' as const, content: SYSTEM_PROMPTS.generator },
        ...((messageHistory || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))),
        { role: 'user' as const, content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };
    let result;
    try {
      result = await provider.chat(chatOptions);
    } catch (primaryErr) {
      const fallback = getFallbackProvider();
      if (fallback) {
        console.error(JSON.stringify({ error: 'Primary LLM failed for generation, trying fallback', detail: primaryErr instanceof Error ? primaryErr.message : String(primaryErr) }));
        result = await fallback.chat(chatOptions);
      } else {
        throw primaryErr;
      }
    }
    const rawMessage = result.content || 'Désolé, une erreur est survenue.';

    // Parse out follow-up suggestions (lines starting with Q:)
    const lines = rawMessage.split('\n');
    const suggestions: string[] = [];
    const messageLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Q:') || trimmed.startsWith('Q :')) {
        const suggestion = trimmed.replace(/^Q\s*:\s*/, '').trim();
        if (suggestion) suggestions.push(suggestion);
      } else {
        messageLines.push(line);
      }
    }

    const message = messageLines.join('\n').trim();

    // Cache the response for future use
    if (supabase && classification.intent !== 'car_search') {
      void setCachedResponse(userMessage, classification.intent, { message, suggestions: suggestions.length > 0 ? suggestions : undefined }, supabase);
    }

    return {
      message,
      calculation: calcResult,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Generation failed',
      detail: error instanceof Error ? error.message : String(error),
      intent: classification.intent,
      language: classification.language,
    }));

    // Fallback response in detected language
    const fallbacks: Record<Language, string> = {
      french: "Désolé, une erreur technique est survenue. Veuillez réessayer.",
      arabic: 'عذراً، حدث خطأ تقني. يرجى المحاولة مرة أخرى.',
      derja: 'سامحني، صار مشكل تقني. عاود جرب.',
    };

    return {
      message: fallbacks[classification.language],
    };
  }
}

/**
 * Generate response as a stream using SSE
 */
export async function generateResponseStream(
  userMessage: string,
  classification: ClassificationResult,
  context: RetrievalContext,
  _groqApiKey: string,
  messageHistory?: Array<{ role: string; content: string }>
): Promise<ReadableStream<Uint8Array>> {
  // Build context string (same as generateResponse)
  const contextStr = buildContext(context);
  const userPrompt = contextStr
    ? `Context:\n${contextStr}\n\n---\n\nUser question: ${userMessage}`
    : `User question: ${userMessage}`;

  const provider = getLLMProvider();
  const encoder = new TextEncoder();

  const rawStream = await provider.chatStream({
    model: MODELS.generator,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.generator },
      ...((messageHistory || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))),
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
    stream: true,
  });

  // Transform the raw SSE stream into our own SSE format
  const reader = rawStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          // Send done event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              const chunk = JSON.stringify({ content });
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            }
          } catch {
            // Skip malformed chunks
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
