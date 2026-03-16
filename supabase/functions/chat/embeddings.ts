import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EMBEDDING_CONFIG } from './config.ts';

async function hashQuery(query: string): Promise<string> {
  const normalized = query.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate embedding for a query using HuggingFace API.
 * When a supabase client is provided, checks the cache first and stores
 * new embeddings for future reuse.
 */
export async function generateQueryEmbedding(
  text: string,
  apiKey: string,
  supabase?: SupabaseClient
): Promise<number[]> {
  if (supabase) {
    const queryHash = await hashQuery(text);

    // Check cache
    const { data: cached } = await supabase
      .from('query_embeddings_cache')
      .select('embedding')
      .eq('query_hash', queryHash)
      .single();

    if (cached?.embedding) {
      console.log(`Embedding cache hit for query hash: ${queryHash.substring(0, 8)}...`);
      const embedding = typeof cached.embedding === 'string'
        ? JSON.parse(cached.embedding.replace(/^\[/, '[').replace(/\]$/, ']'))
        : cached.embedding;
      return embedding;
    }

    console.log(`Embedding cache miss for query hash: ${queryHash.substring(0, 8)}...`);

    const embedding = await fetchEmbeddingFromHF(text, apiKey);

    // Insert into cache (fire-and-forget with error logging)
    supabase.from('query_embeddings_cache').insert({
      query_hash: queryHash,
      embedding: `[${embedding.join(',')}]`,
    }).then(({ error }) => {
      if (error) console.error(JSON.stringify({ error: 'Embedding cache insert failed', detail: error.message }));
    });

    // Periodic cache eviction (1 in 50 cache misses)
    if (Math.random() < 0.02) {
      void supabase.rpc('evict_stale_embeddings');
    }

    return embedding;
  }

  return fetchEmbeddingFromHF(text, apiKey);
}

async function fetchEmbeddingFromHF(text: string, apiKey: string): Promise<number[]> {
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
      signal: AbortSignal.timeout(8000),
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
