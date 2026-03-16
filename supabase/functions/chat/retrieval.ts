import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { RETRIEVAL_CONFIG, EXCHANGE_RATE } from './config.ts';
import { generateQueryEmbedding } from './embeddings.ts';
import { rerankChunks } from './reranker.ts';
import {
  CarResult,
  CarSearchFilters,
  Intent,
  KnowledgeChunk,
  RetrievalContext,
} from './types.ts';

/**
 * Apply feedback-based score boost to retrieved chunks.
 * Adjusts similarity by up to ±5% based on aggregated user feedback.
 */
async function applyFeedbackBoost(
  chunks: KnowledgeChunk[],
  supabase: SupabaseClient
): Promise<KnowledgeChunk[]> {
  if (chunks.length === 0) return chunks;

  const chunkIds = chunks.map(c => c.id);
  const { data: feedbackScores } = await supabase
    .from('chunk_feedback_scores')
    .select('chunk_id, feedback_score')
    .in('chunk_id', chunkIds);

  if (feedbackScores && feedbackScores.length > 0) {
    const scoreMap = new Map(feedbackScores.map(f => [f.chunk_id, Number(f.feedback_score)]));
    for (const chunk of chunks) {
      const boost = scoreMap.get(chunk.id) || 0;
      // Apply small boost: up to ±5% of similarity
      chunk.similarity += chunk.similarity * (boost * 0.05);
    }
    // Re-sort after applying feedback boost
    chunks.sort((a, b) => b.similarity - a.similarity);
  }

  return chunks;
}

// Topic mapping for intent-based filtering
const INTENT_TOPIC_MAP: Record<string, string[]> = {
  eligibility: ['fcr_eligibility'],
  cost_calculation: ['tax_calculation', 'fcr_eligibility'],
  general_info: [], // No filter - search all topics
};

/**
 * Retrieve relevant knowledge chunks using vector similarity
 */
export async function retrieveKnowledge(
  query: string,
  intent: Intent,
  supabase: SupabaseClient,
  huggingfaceKey: string
): Promise<KnowledgeChunk[]> {
  // Generate query embedding
  const embedding = await generateQueryEmbedding(query, huggingfaceKey, supabase);

  // Determine topic filter based on intent
  const topics = INTENT_TOPIC_MAP[intent];
  const filterTopic = topics?.length === 1 ? topics[0] : null;

  // Detect if query contains Arabic script
  const isArabicQuery = /[\u0600-\u06FF]/.test(query);
  // Arabic queries should weight semantic higher since French text search config doesn't tokenize Arabic
  const semanticWeight = isArabicQuery ? 0.9 : RETRIEVAL_CONFIG.hybrid_alpha;

  // Call hybrid search function
  const { data, error } = await supabase.rpc('hybrid_match_knowledge', {
    query_embedding: `[${embedding.join(',')}]`,
    query_text: query,
    match_count: RETRIEVAL_CONFIG.knowledge_top_k * 2,  // Fetch more for reranking
    filter_topic: filterTopic,
    semantic_weight: semanticWeight,
  });

  if (error) {
    console.error(JSON.stringify({
      error: 'Knowledge retrieval failed',
      detail: error?.message || String(error),
      query_preview: query.substring(0, 50),
      intent,
    }));
    return [];
  }

  const chunks: KnowledgeChunk[] = data || [];

  // Skip reranking for small result sets (not worth the latency)
  if (chunks.length <= 3) {
    let topChunks = chunks.slice(0, RETRIEVAL_CONFIG.knowledge_top_k);
    topChunks = await applyFeedbackBoost(topChunks, supabase);
    // Dynamic pruning: if at least 2 chunks exceed 0.6 similarity,
    // drop chunks below 0.6 to reduce noise
    const highQualityCount = topChunks.filter(c => c.similarity >= 0.6).length;
    if (highQualityCount >= 2) {
      const pruned = topChunks.filter(c => c.similarity >= 0.6);
      console.log(`Dynamic pruning (no rerank): ${topChunks.length} → ${pruned.length} chunks`);
      return pruned;
    }
    return topChunks;
  }

  // Rerank with cross-encoder for better relevance
  const reranked = await rerankChunks(query, chunks, huggingfaceKey);

  // Take top-k after reranking
  let topChunks = reranked.slice(0, RETRIEVAL_CONFIG.knowledge_top_k);
  topChunks = await applyFeedbackBoost(topChunks, supabase);

  // Dynamic pruning: if at least 2 chunks exceed 0.6 similarity,
  // drop chunks below 0.6 to reduce noise
  const highQualityCount = topChunks.filter(c => c.similarity >= 0.6).length;
  if (highQualityCount >= 2) {
    const pruned = topChunks.filter(c => c.similarity >= 0.6);
    console.log(`Dynamic pruning: ${topChunks.length} → ${pruned.length} chunks`);
    return pruned;
  }

  return topChunks;
}

/**
 * Search cars based on extracted filters
 * Returns unranked results - scoring is done separately
 */
export async function searchCars(
  filters: CarSearchFilters,
  supabase: SupabaseClient
): Promise<CarResult[]> {
  let query = supabase
    .from('cars')
    .select(
      `
      id, brand, model, variant, year,
      price_eur, price_tnd, fuel_type, engine_cc,
      mileage_km, body_type, country, url,
      fcr_tre_eligible, fcr_famille_eligible
    `
    )
    .eq('is_active', true);

  // Apply filters
  if (filters.brand) {
    query = query.ilike('brand', `%${filters.brand}%`);
  }

  if (filters.fuel_type) {
    const fuelMap: Record<string, string[]> = {
      essence: ['essence', 'petrol', 'gasoline'],
      diesel: ['diesel'],
      electric: ['electric', 'électrique'],
      hybrid: ['hybrid', 'hybride'],
      hybrid_rechargeable: ['hybrid_rechargeable', 'plug-in hybrid', 'phev'],
    };
    const fuelValues = fuelMap[filters.fuel_type] || [filters.fuel_type];
    query = query.in('fuel_type', fuelValues);
  }

  if (filters.body_type) {
    // Use ilike for partial matching since DB has values like "SUV/Geländewagen/Pickup"
    const bodyPatterns: Record<string, string> = {
      suv: '%SUV%',
      berline: '%berline%',
      citadine: '%citadine%',
      break: '%break%',
      monospace: '%monospace%',
      compact: '%compact%',
    };
    const pattern = bodyPatterns[filters.body_type] || `%${filters.body_type}%`;
    query = query.ilike('body_type', pattern);
  }

  // Condition filter (new vs used) - based on mileage since there's no condition column
  if (filters.condition) {
    if (filters.condition === 'new') {
      // New cars have 0 mileage or null mileage
      query = query.or('mileage_km.eq.0,mileage_km.is.null');
    } else if (filters.condition === 'used') {
      // Used cars have mileage > 0
      query = query.gt('mileage_km', 0);
    }
  }

  if (filters.year_min) {
    query = query.gte('year', filters.year_min);
  }

  if (filters.year_max) {
    query = query.lte('year', filters.year_max);
  }

  if (filters.budget_max) {
    // For TND cars: allow up to 20% over budget (scoring penalizes)
    const maxBudgetTnd = filters.budget_max * 1.2;
    // For EUR cars: account for import costs (~1.25x CIF for FCR, ~2x for regular)
    // Use conservative FCR multiplier to not exclude valid candidates
    // CIF = EUR × effective_rate, then × 1.2 for FCR costs, then × 1.2 margin
    const fcrMultiplier = EXCHANGE_RATE.effective_rate * 1.2;
    const maxBudgetEur = (filters.budget_max * 1.2) / fcrMultiplier;
    query = query.or(
      `and(price_tnd.not.is.null,price_tnd.lte.${maxBudgetTnd}),and(price_eur.not.is.null,price_eur.lte.${Math.round(maxBudgetEur)})`
    );
  }

  if (filters.budget_min) {
    const minBudgetTnd = filters.budget_min;
    const minBudgetEur = filters.budget_min / EXCHANGE_RATE.rate;
    query = query.or(
      `and(price_tnd.not.is.null,price_tnd.gte.${minBudgetTnd}),and(price_eur.not.is.null,price_eur.gte.${minBudgetEur})`
    );
  }

  if (filters.fcr_tre_only) {
    query = query.eq('fcr_tre_eligible', true);
  }

  if (filters.fcr_famille_only) {
    query = query.eq('fcr_famille_eligible', true);
  }

  if (filters.country) {
    query = query.eq('country', filters.country.toUpperCase());
  }

  // Fetch more candidates for scoring (we'll rank and limit later)
  // Don't sort by price - we'll sort by score instead
  query = query.limit(100);

  const { data, error } = await query;

  if (error) {
    console.error(JSON.stringify({
      error: 'Car search failed',
      detail: error?.message || String(error),
    }));
    return [];
  }

  // Add computed condition field based on mileage
  return (data || []).map((car) => ({
    ...car,
    condition: car.mileage_km && car.mileage_km > 0 ? 'used' : 'new',
  }));
}

/**
 * Main retrieval function - combines KB and car search based on intent
 */
export async function retrieve(
  query: string,
  intent: Intent,
  filters: CarSearchFilters | undefined,
  supabase: SupabaseClient,
  huggingfaceKey: string
): Promise<RetrievalContext> {
  const context: RetrievalContext = {
    knowledge_chunks: [],
    cars: [],
  };

  // Skip retrieval for off-topic
  if (intent === 'off_topic') {
    return context;
  }

  // Always retrieve knowledge (except off-topic)
  context.knowledge_chunks = await retrieveKnowledge(
    query,
    intent,
    supabase,
    huggingfaceKey
  );

  // Retrieve cars for car_search intent
  if (intent === 'car_search' && filters) {
    context.cars = await searchCars(filters, supabase);
  }

  return context;
}
