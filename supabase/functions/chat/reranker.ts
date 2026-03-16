interface RankedChunk {
  index: number;
  score: number;
}

/**
 * Rerank chunks using a cross-encoder model via HuggingFace API.
 * Takes the query and candidate chunks, returns them re-sorted by relevance.
 */
export async function rerankChunks<T extends { content: string }>(
  query: string,
  chunks: T[],
  hfKey: string
): Promise<T[]> {
  if (chunks.length <= 1) return chunks;

  try {
    // Prepare input pairs for cross-encoder
    const inputs = chunks.map(chunk => ({
      source_sentence: query,
      sentences: [chunk.content],
    }));

    // Use sentence-similarity endpoint which works with cross-encoders
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/cross-encoder/ms-marco-MiniLM-L-6-v2/pipeline/text-classification',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: chunks.map(chunk => ({
            text: query,
            text_pair: chunk.content,
          })),
          options: { wait_for_model: true },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.error(`Reranker API error: ${response.status}`);
      return chunks; // Fallback to original order
    }

    const results = await response.json();

    // Parse scores - the API returns scores for each pair
    const scored: RankedChunk[] = [];
    if (Array.isArray(results)) {
      for (let i = 0; i < chunks.length; i++) {
        const result = results[i];
        // Handle different response formats
        let score = 0;
        if (Array.isArray(result)) {
          // Format: [[{label, score}]]
          score = result[0]?.score ?? 0;
        } else if (typeof result === 'object' && result !== null) {
          // Format: {label, score}
          score = (result as { score?: number }).score ?? 0;
        } else if (typeof result === 'number') {
          score = result;
        }
        scored.push({ index: i, score });
      }
    } else {
      console.error('Unexpected reranker response format');
      return chunks;
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Return reranked chunks
    return scored.map(s => chunks[s.index]);
  } catch (error) {
    console.error('Reranker error:', error);
    return chunks; // Fallback to original order on any error
  }
}
