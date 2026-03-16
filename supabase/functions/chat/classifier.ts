import { MODELS, SYSTEM_PROMPTS } from './config.ts';
import { getLLMProvider, getFallbackProvider } from './providers/factory.ts';
import {
  ClassificationResult,
  Intent,
  Language,
} from './types.ts';

const DEFAULT_CLASSIFICATION: ClassificationResult = {
  intent: 'general_info',
  language: 'french',
  confidence: 0.5,
};

/**
 * Detect language from script (Arabic characters)
 * This is a fast, reliable fallback for Arabic/Derja detection
 */
function detectLanguageFromScript(message: string): Language | null {
  // Check for Arabic script (Unicode range 0600-06FF includes Arabic, Persian, Urdu)
  if (/[\u0600-\u06FF]/.test(message)) {
    // Derja-specific patterns (Tunisian dialect)
    // Common Derja words and phrases that distinguish it from MSA
    const derjaPatterns = /أحكيلي|برّا|تشري|كرهبة|ما\s*يهمش|شنوة|كيفاش|وين|شكون|باهي|برشا|يزي|توا|موش|عندي|نحب|فيسع|صحيت|لازم|هاذي|هاذا|متاع|متاعي|تحب|فيها|عليها|هكا|هكاكا|خويا|نشري|إيه|ما عنديش|يا خويا|ياسر|شنية|فلوس|بالحق|خاطر/;
    if (derjaPatterns.test(message)) {
      return 'derja';
    }
    return 'arabic';
  }
  return null;
}

/**
 * Classify user query using Llama 3.1 8B (fast)
 */
export async function classifyQuery(
  message: string,
  groqApiKey: string
): Promise<ClassificationResult> {
  // First, check for Arabic script - this is more reliable than API for language detection
  const scriptLanguage = detectLanguageFromScript(message);

  try {
    const provider = getLLMProvider();
    const fallback = getFallbackProvider();
    const chatOptions = {
      model: MODELS.classifier,
      messages: [
        { role: 'system' as const, content: SYSTEM_PROMPTS.classifier },
        { role: 'user' as const, content: message },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' as const },
    };
    const completion = await (async () => {
      try {
        return await provider.chat(chatOptions);
      } catch (err) {
        if (fallback) {
          console.error(JSON.stringify({ error: 'Primary LLM failed for classification, trying fallback', detail: err instanceof Error ? err.message : String(err) }));
          return await fallback.chat(chatOptions);
        }
        throw err;
      }
    })();
    const content = completion.content;

    if (!content) {
      // Use script-detected language if available
      if (scriptLanguage) {
        return { ...DEFAULT_CLASSIFICATION, language: scriptLanguage, confidence: 0.9 };
      }
      return DEFAULT_CLASSIFICATION;
    }

    const parsed = JSON.parse(content);

    // Determine language: prefer script detection for Arabic, otherwise use API
    let detectedLanguage = validateLanguage(parsed.language);
    if (scriptLanguage) {
      // Script detection is more reliable for Arabic/Derja
      detectedLanguage = scriptLanguage;
    }

    // Validate and normalize the response
    const result: ClassificationResult = {
      intent: validateIntent(parsed.intent),
      language: detectedLanguage,
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
    console.error(JSON.stringify({
      error: 'Classification failed',
      detail: error instanceof Error ? error.message : String(error),
      message_preview: message.substring(0, 50),
    }));
    // Use script-detected language if available
    if (scriptLanguage) {
      return { ...DEFAULT_CLASSIFICATION, language: scriptLanguage, confidence: 0.9 };
    }
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
