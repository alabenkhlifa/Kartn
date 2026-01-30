import { MODELS, SYSTEM_PROMPTS } from './config.ts';
import {
  ClassificationResult,
  GroqChatRequest,
  GroqChatResponse,
  Intent,
  Language,
} from './types.ts';

const DEFAULT_CLASSIFICATION: ClassificationResult = {
  intent: 'general_info',
  language: 'french',
  confidence: 0.5,
};

/**
 * Classify user query using Llama 3.1 8B (fast)
 */
export async function classifyQuery(
  message: string,
  groqApiKey: string
): Promise<ClassificationResult> {
  const request: GroqChatRequest = {
    model: MODELS.classifier,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.classifier },
      { role: 'user', content: message },
    ],
    temperature: 0.1, // Low temperature for consistent classification
    max_tokens: 500,
    response_format: { type: 'json_object' },
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
      console.error('Groq classification error:', error);
      return DEFAULT_CLASSIFICATION;
    }

    const data: GroqChatResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return DEFAULT_CLASSIFICATION;
    }

    const parsed = JSON.parse(content);

    // Validate and normalize the response
    const result: ClassificationResult = {
      intent: validateIntent(parsed.intent),
      language: validateLanguage(parsed.language),
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };

    // Add filters if car search
    if (result.intent === 'car_search' && parsed.filters) {
      result.filters = {
        budget_min: parsed.filters.budget_min,
        budget_max: parsed.filters.budget_max,
        brand: parsed.filters.brand?.toLowerCase(),
        fuel_type: parsed.filters.fuel_type?.toLowerCase(),
        year_min: parsed.filters.year_min,
        year_max: parsed.filters.year_max,
        fcr_tre_only: parsed.filters.fcr_tre_only,
        fcr_famille_only: parsed.filters.fcr_famille_only,
        country: parsed.filters.country,
      };
    }

    // Add calculation params if cost calculation
    if (result.intent === 'cost_calculation' && parsed.calculation_params) {
      result.calculation_params = {
        price_eur: parsed.calculation_params.price_eur,
        price_tnd: parsed.calculation_params.price_tnd,
        engine_cc: parsed.calculation_params.engine_cc,
        fuel_type: parsed.calculation_params.fuel_type?.toLowerCase(),
        regime: parsed.calculation_params.regime?.toLowerCase(),
        vehicle_type: parsed.calculation_params.vehicle_type?.toLowerCase(),
        origin: parsed.calculation_params.origin?.toLowerCase(),
      };
    }

    return result;
  } catch (error) {
    console.error('Classification error:', error);
    return DEFAULT_CLASSIFICATION;
  }
}

function validateIntent(intent: string | undefined): Intent {
  const validIntents: Intent[] = [
    'eligibility',
    'car_search',
    'cost_calculation',
    'general_info',
    'off_topic',
  ];
  if (intent && validIntents.includes(intent as Intent)) {
    return intent as Intent;
  }
  return 'general_info';
}

function validateLanguage(language: string | undefined): Language {
  const validLanguages: Language[] = ['french', 'arabic', 'derja'];
  if (language && validLanguages.includes(language as Language)) {
    return language as Language;
  }
  return 'french';
}
