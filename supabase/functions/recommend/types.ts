// Recommendation request filters
export interface RecommendationFilters {
  fuel_type?: 'essence' | 'diesel' | 'electric' | 'hybrid' | 'hybrid_rechargeable' | 'any';
  condition?: 'new' | 'used' | 'any';
  body_type?: 'citadine' | 'berline' | 'break' | 'suv' | 'monospace' | 'coupe' | 'cabriolet' | 'utilitaire' | 'pickup' | 'any';
  budget_tnd?: number;
  fcr_regime?: 'fcr_tre' | 'fcr_famille' | 'regime_commun';
  origin?: 'tunisia' | 'abroad';
  is_voiture_populaire?: boolean;
}

// Detailed cost breakdown for transparency
export interface DetailedCostBreakdown {
  // Car cost
  car_price_eur: number;
  car_price_tnd: number;

  // Transport
  shipping_eur: number;
  shipping_tnd: number;
  insurance_transit_eur: number;
  insurance_transit_tnd: number;

  // CIF total
  cif_eur: number;
  cif_tnd: number;

  // Customs taxes
  droits_douane: number;
  taxe_consommation: number;
  tva: number;
  tfd: number;
  total_taxes: number;

  // Local fees
  port_handling_tnd: number;
  transitaire_tnd: number;
  registration_tnd: number;
  inspection_tnd: number;
  total_local_fees: number;

  // Final
  estimated_total_tnd: number;
  tax_burden_percent: number;
}

// Car listing from database
export interface CarListing {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  full_name: string | null;
  year: number;
  price_eur: number | null;
  price_tnd: number | null;
  fuel_type: string;
  engine_cc: number | null;
  mileage_km: number | null;
  body_type: string | null;
  country: string;
  source: string;
  url: string;
  seller_type: string | null;
  fcr_tre_eligible: boolean;
  fcr_famille_eligible: boolean;
}

// Score breakdown for transparency
export interface ScoreBreakdown {
  price_fit: number;
  age: number;
  mileage: number;
  reliability: number;
  parts_availability: number;
  fuel_efficiency: number;
  preference_match: number;
  practicality: number;
}

// Single car recommendation with cost details
export interface CarRecommendation {
  car: CarListing;
  rank: number;
  estimated_total_tnd: number;
  score: number;
  score_breakdown: ScoreBreakdown;
  recommendation_strength: 'excellent' | 'good' | 'fair' | 'poor';
  cost_breakdown?: DetailedCostBreakdown;

  // FCR eligibility - ONLY included for imported cars (country != 'TN')
  fcr_eligible?: {
    tre: boolean;
    famille: boolean;
  };
}

// API request
export interface RecommendRequest {
  filters: {
    fuel_type?: string;
    condition?: 'new' | 'used' | 'any';
    body_type?: string;
    budget_tnd?: number;
    fcr_regime?: string;
    origin?: 'tunisia' | 'abroad';
    is_voiture_populaire?: boolean;
  };
  limit?: number;  // Default 5
  offset?: number; // For pagination
  include_cost_breakdown?: boolean;
}

// API response
export interface RecommendResponse {
  total: number;
  limit: number;
  offset: number;
  recommendations: CarRecommendation[];
}
