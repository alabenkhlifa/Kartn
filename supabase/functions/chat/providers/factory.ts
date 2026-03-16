import { LLMProvider } from './types.ts';
import { OpenAICompatibleProvider } from './openai-compatible.ts';

const PROVIDER_CONFIGS: Record<string, { baseUrl: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1' },
  together: { baseUrl: 'https://api.together.xyz/v1' },
  fireworks: { baseUrl: 'https://api.fireworks.ai/inference/v1' },
  openai: { baseUrl: 'https://api.openai.com/v1' },
};

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = Deno.env.get('LLM_PROVIDER') || 'groq';
  const apiKey = Deno.env.get('LLM_API_KEY') || Deno.env.get('GROQ_API_KEY') || '';

  const config = PROVIDER_CONFIGS[providerName];
  if (!config) {
    throw new Error(`Unknown LLM provider: ${providerName}. Valid: ${Object.keys(PROVIDER_CONFIGS).join(', ')}`);
  }

  cachedProvider = new OpenAICompatibleProvider(config.baseUrl, apiKey);
  return cachedProvider;
}

/**
 * Get a fallback provider if the primary one fails.
 * Returns null if no fallback is configured.
 */
export function getFallbackProvider(): LLMProvider | null {
  const fallbackName = Deno.env.get('LLM_FALLBACK_PROVIDER');
  const fallbackKey = Deno.env.get('LLM_FALLBACK_API_KEY');

  if (!fallbackName || !fallbackKey) return null;

  const config = PROVIDER_CONFIGS[fallbackName];
  if (!config) return null;

  return new OpenAICompatibleProvider(config.baseUrl, fallbackKey);
}

/**
 * Execute an LLM call with automatic fallback to secondary provider.
 */
export async function withFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  try {
    return await primaryFn();
  } catch (error) {
    console.error(JSON.stringify({
      error: 'Primary LLM provider failed, trying fallback',
      detail: error instanceof Error ? error.message : String(error),
    }));
    const fallback = getFallbackProvider();
    if (fallback && fallbackFn) {
      return await fallbackFn();
    }
    throw error;
  }
}
