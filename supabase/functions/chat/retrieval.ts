import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { RETRIEVAL_CONFIG } from './config.ts';
import { generateQueryEmbedding } from './embeddings.ts';
import {
  CarResult,
  CarSearchFilters,
  Intent,
  KnowledgeChunk,
  RetrievalContext,
} from './types.ts';

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
  const embedding = await generateQueryEmbedding(query, huggingfaceKey);

  // Determine topic filter based on intent
  const topics = INTENT_TOPIC_MAP[intent];
  const filterTopic = topics?.length === 1 ? topics[0] : null;

  // Call the match function
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: RETRIEVAL_CONFIG.knowledge_threshold,
    match_count: RETRIEVAL_CONFIG.knowledge_top_k,
    filter_topic: filterTopic,
  });

  if (error) {
    console.error('Knowledge retrieval error:', error);
    return [];
  }

  return data || [];
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
    const bodyMap: Record<string, string[]> = {
      suv: ['suv', '4x4', 'crossover'],
      berline: ['berline', 'sedan', 'limousine'],
      citadine: ['citadine', 'compact', 'kleinwagen', 'hatchback'],
      break: ['break', 'wagon', 'kombi', 'station wagon'],
      monospace: ['monospace', 'mpv', 'minivan', 'van'],
      compact: ['compact', 'citadine', 'kleinwagen'],
    };
    const bodyValues = bodyMap[filters.body_type] || [filters.body_type];
    query = query.in('body_type', bodyValues);
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
    // For budget filtering, we're more lenient (allow up to 20% over)
    // The scoring system will penalize over-budget cars
    const maxBudgetWithMargin = filters.budget_max * 1.2;
    query = query.or(
      `price_tnd.lte.${maxBudgetWithMargin},price_eur.lte.${maxBudgetWithMargin / 3.3}`
    );
  }

  if (filters.budget_min) {
    query = query.or(
      `price_tnd.gte.${filters.budget_min},price_eur.gte.${filters.budget_min / 3.3}`
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
    console.error('Car search error:', error);
    return [];
  }

  return data || [];
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
