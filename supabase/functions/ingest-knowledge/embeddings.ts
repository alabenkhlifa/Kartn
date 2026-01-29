import { EMBEDDING_CONFIG } from './config.ts';
import { KnowledgeChunk } from './types.ts';

/**
 * Generate embeddings using HuggingFace Inference API
 */
async function fetchEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${EMBEDDING_CONFIG.model}/pipeline/feature-extraction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: texts,
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

  // Validate dimensions
  if (
    Array.isArray(embeddings) &&
    embeddings.length > 0 &&
    Array.isArray(embeddings[0])
  ) {
    const dims = embeddings[0].length;
    if (dims !== EMBEDDING_CONFIG.dimensions) {
      console.warn(
        `Warning: Expected ${EMBEDDING_CONFIG.dimensions} dimensions, got ${dims}`
      );
    }
  }

  return embeddings;
}

/**
 * Add delay between batches to respect rate limits
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate embeddings for chunks in batches
 */
export async function generateEmbeddings(
  chunks: KnowledgeChunk[],
  apiKey: string
): Promise<KnowledgeChunk[]> {
  const { batchSize, delayBetweenBatches } = EMBEDDING_CONFIG;
  const results: KnowledgeChunk[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content);

    console.log(
      `Generating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`
    );

    try {
      const embeddings = await fetchEmbeddings(texts, apiKey);

      for (let j = 0; j < batch.length; j++) {
        results.push({
          ...batch[j],
          embedding: embeddings[j],
        });
      }
    } catch (error) {
      console.error(`Error generating embeddings for batch:`, error);
      // Add chunks without embeddings on error
      for (const chunk of batch) {
        results.push({
          ...chunk,
          embedding: null,
        });
      }
    }

    // Delay between batches (except for last batch)
    if (i + batchSize < chunks.length) {
      await delay(delayBetweenBatches);
    }
  }

  return results;
}

/**
 * Generate embedding for a single query text
 */
export async function generateQueryEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const embeddings = await fetchEmbeddings([text], apiKey);
  return embeddings[0];
}
