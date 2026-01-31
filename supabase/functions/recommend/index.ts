import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { RecommendRequest, RecommendResponse, RecommendationFilters, CarListing } from './types.ts';
import { filterAndRank } from './ranker.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Validate recommendation filters
 */
function validateFilters(filters: RecommendRequest['filters']): { valid: boolean; error?: string } {
  const validFuelTypes = ['essence', 'diesel', 'electric', 'hybrid', 'hybrid_rechargeable', 'any'];
  const validConditions = ['new', 'used', 'any'];
  const validBodyTypes = ['citadine', 'berline', 'break', 'suv', 'monospace', 'coupe', 'cabriolet', 'utilitaire', 'pickup', 'any'];
  const validRegimes = ['fcr_tre', 'fcr_famille', 'regime_commun'];
  const validOrigins = ['tunisia', 'abroad'];

  // Validate fuel_type if provided
  if (filters.fuel_type && !validFuelTypes.includes(filters.fuel_type)) {
    return { valid: false, error: `Invalid fuel_type. Must be one of: ${validFuelTypes.join(', ')}` };
  }

  // Validate condition if provided
  if (filters.condition && !validConditions.includes(filters.condition)) {
    return { valid: false, error: `Invalid condition. Must be one of: ${validConditions.join(', ')}` };
  }

  // Validate body_type if provided
  if (filters.body_type && !validBodyTypes.includes(filters.body_type)) {
    return { valid: false, error: `Invalid body_type. Must be one of: ${validBodyTypes.join(', ')}` };
  }

  if (filters.fcr_regime && !validRegimes.includes(filters.fcr_regime)) {
    return { valid: false, error: `Invalid fcr_regime. Must be one of: ${validRegimes.join(', ')}` };
  }

  // Validate origin if provided
  if (filters.origin && !validOrigins.includes(filters.origin)) {
    return { valid: false, error: `Invalid origin. Must be one of: ${validOrigins.join(', ')}` };
  }

  // Validate is_voiture_populaire if provided
  if (filters.is_voiture_populaire !== undefined && typeof filters.is_voiture_populaire !== 'boolean') {
    return { valid: false, error: 'is_voiture_populaire must be a boolean' };
  }

  if (filters.budget_tnd !== undefined && (typeof filters.budget_tnd !== 'number' || filters.budget_tnd <= 0)) {
    return { valid: false, error: 'budget_tnd must be a positive number' };
  }

  return { valid: true };
}

/**
 * Build source filter based on condition
 */
function getSourcesForCondition(condition: 'new' | 'used'): string[] {
  if (condition === 'new') {
    return ['automobile_tn_new'];
  }
  return ['autoscout24', 'automobile_tn_used'];
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

interface FetchCarsOptions {
  condition?: 'new' | 'used' | 'any';
  origin?: 'tunisia' | 'abroad';
  isVoiturePopulaire?: boolean;
}

/**
 * Fetch cars from database with initial filtering
 * When condition is 'any' or undefined, fetch all sources
 */
async function fetchCars(
  supabase: AnySupabaseClient,
  options: FetchCarsOptions = {}
): Promise<CarListing[]> {
  const { condition, origin, isVoiturePopulaire } = options;

  let query = supabase
    .from('cars')
    .select(`
      id, brand, model, variant, year,
      price_eur, price_tnd, fuel_type, engine_cc,
      mileage_km, body_type, country, source, url,
      seller_type, fcr_tre_eligible, fcr_famille_eligible,
      full_name
    `)
    .eq('is_active', true);

  // Only filter by source if condition is specific (not 'any' and not undefined)
  if (condition && condition !== 'any') {
    const sources = getSourcesForCondition(condition);
    query = query.in('source', sources);
  }

  // Filter by origin if specified
  if (origin === 'tunisia') {
    query = query.eq('country', 'TN');
  } else if (origin === 'abroad') {
    query = query.neq('country', 'TN');
  }

  // Filter for voiture populaire (subsidized cars)
  if (isVoiturePopulaire === true) {
    query = query.ilike('full_name', '%Populaire%');
  }

  const { data, error } = await query.limit(500);

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return (data || []) as CarListing[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request
    const body: RecommendRequest = await req.json();
    const { filters, limit = 5, offset = 0, include_cost_breakdown = false } = body;

    // Validate filters
    if (!filters) {
      return new Response(JSON.stringify({ error: 'filters is required' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const validation = validateFilters(filters);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle voiture populaire: automatically set origin to tunisia and condition to new
    let effectiveOrigin = filters.origin;
    let effectiveCondition = filters.condition;
    if (filters.is_voiture_populaire === true) {
      effectiveOrigin = 'tunisia';
      effectiveCondition = 'new';
    }

    console.log(`Processing recommendation request: fuel=${filters.fuel_type || 'any'}, condition=${effectiveCondition || 'any'}, body=${filters.body_type || 'any'}, budget=${filters.budget_tnd}, origin=${effectiveOrigin || 'any'}, voiture_populaire=${filters.is_voiture_populaire || false}`);

    // Fetch cars from database (pre-filtered by condition/source, origin, and voiture populaire)
    const cars = await fetchCars(supabase, {
      condition: effectiveCondition,
      origin: effectiveOrigin,
      isVoiturePopulaire: filters.is_voiture_populaire,
    });
    console.log(`Fetched ${cars.length} cars from database`);

    // Apply filtering and multi-factor scoring
    const recommendationFilters: RecommendationFilters = {
      fuel_type: (filters.fuel_type || 'any') as RecommendationFilters['fuel_type'],
      condition: (effectiveCondition || 'any') as RecommendationFilters['condition'],
      body_type: (filters.body_type || 'any') as RecommendationFilters['body_type'],
      budget_tnd: filters.budget_tnd,
      fcr_regime: filters.fcr_regime as RecommendationFilters['fcr_regime'],
      origin: effectiveOrigin,
      is_voiture_populaire: filters.is_voiture_populaire,
    };

    const result = filterAndRank(cars, recommendationFilters, {
      limit,
      offset,
      includeCostBreakdown: include_cost_breakdown,
    });

    console.log(`Found ${result.total} matching cars, returning ${result.recommendations.length} recommendations`);

    const response: RecommendResponse = {
      total: result.total,
      limit,
      offset,
      recommendations: result.recommendations,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Recommend error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});
