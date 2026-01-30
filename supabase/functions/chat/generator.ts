import { MODELS, OFF_TOPIC_RESPONSES, SYSTEM_PROMPTS } from './config.ts';
import {
  calculateTax,
  compareFCRRegimes,
  formatFCRComparison,
  formatTaxBreakdown,
} from './calculator.ts';
import {
  CalculationParams,
  CarResult,
  ClassificationResult,
  FCRComparison,
  GroqChatRequest,
  GroqChatResponse,
  KnowledgeChunk,
  Language,
  RetrievalContext,
  TaxBreakdown,
} from './types.ts';

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
  groqApiKey: string
): Promise<{
  message: string;
  calculation?: TaxBreakdown | FCRComparison;
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

  // Build context string
  const contextStr = buildContext(context, calcResult);

  // Build prompt
  const userPrompt = contextStr
    ? `Context:\n${contextStr}\n\n---\n\nUser question: ${userMessage}`
    : `User question: ${userMessage}`;

  const request: GroqChatRequest = {
    model: MODELS.generator,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.generator },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 300,
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq generation error:', error);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data: GroqChatResponse = await response.json();
    const message = data.choices[0]?.message?.content || 'Désolé, une erreur est survenue.';

    return {
      message,
      calculation: calcResult,
    };
  } catch (error) {
    console.error('Generation error:', error);

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
