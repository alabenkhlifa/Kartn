import { EMBEDDING_CONFIG } from './config.ts';

/**
 * Generate embedding for a query using HuggingFace API
 */
export async function generateQueryEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${EMBEDDING_CONFIG.model}/pipeline/feature-extraction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [text],
        options: {
          wait_for_model: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
  }

  const embeddings = await response.json();

  if (!Array.isArray(embeddings) || !Array.isArray(embeddings[0])) {
    throw new Error('Invalid embedding response format');
  }

  return embeddings[0];
}
