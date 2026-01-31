// Mirrored from supabase/functions/chat/types.ts

export type ConversationState =
  | 'goal_selection'
  | 'asking_car_origin'
  | 'asking_residency'
  | 'asking_fcr_famille'
  | 'asking_fuel_type'
  | 'asking_car_type'
  | 'asking_condition'
  | 'asking_budget'
  | 'showing_cars'
  // Cost calculator flow
  | 'asking_calc_price'
  | 'asking_calc_engine'
  | 'asking_calc_fuel'
  | 'showing_calculation'
  // Procedure info flow
  | 'procedure_info'
  | 'showing_procedure_detail'
  // Compare cars flow
  | 'car_comparison_input'
  | 'showing_comparison'
  // EV info flow
  | 'ev_topic_selection'
  | 'showing_ev_info'
  // Browse offers flow
  | 'browse_origin_selection'
  // Popular cars flow
  | 'popular_cars_selection'
  | 'asking_popular_eligibility'
  | 'showing_popular_models';

export type Goal =
  | 'find_car'
  | 'procedure'
  | 'compare_cars'
  | 'ev_info'
  | 'browse_offers'
  | 'popular_cars';
export type Residency = 'local' | 'abroad';
export type FuelPreference = 'essence' | 'diesel' | 'hybrid' | 'hybrid_rechargeable' | 'electric' | 'any';
export type CarTypePreference = 'suv' | 'sedan' | 'compact' | 'any';
export type ConditionPreference = 'new' | 'used' | 'any';

export type Intent =
  | 'eligibility'
  | 'car_search'
  | 'cost_calculation'
  | 'general_info'
  | 'off_topic';

export type Language = 'french' | 'arabic' | 'derja';

export interface CarResult {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price_eur: number | null;
  price_tnd: number | null;
  fuel_type: string;
  engine_cc: number | null;
  mileage_km: number | null;
  body_type: string | null;
  condition: string | null;
  country: string;
  url: string;
  fcr_tre_eligible: boolean;
  fcr_famille_eligible: boolean;
  source?: string;
  full_name?: string;
  seller_type?: string;
}

export interface ScoredCarResult extends CarResult {
  score?: number;
  score_breakdown?: {
    price_fit: number;
    age: number;
    mileage: number;
    reliability: number;
    parts_availability: number;
    fuel_efficiency: number;
    preference_match: number;
  };
  estimated_total_tnd?: number;
  recommendation_strength?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TaxBreakdown {
  cif: number;
  droits_douane: number;
  taxe_consommation: number;
  tva: number;
  tfd: number;
  total_taxes: number;
  final_price: number;
  tax_burden_percent: number;
}

export interface FCRComparison {
  regime_commun: TaxBreakdown;
  fcr_tre?: TaxBreakdown;
  fcr_famille?: TaxBreakdown;
  recommended: string;
  savings: number;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  language?: Language;
  user_context?: {
    residency_status?: 'tre' | 'resident';
    years_abroad?: number;
    income_smig_multiple?: number;
  };
}

export interface ChatResponse {
  message: string;
  intent: Intent;
  language: Language;
  sources?: string[];
  cars?: ScoredCarResult[];
  calculation?: TaxBreakdown | FCRComparison;
  conversation_id?: string;
}

// UI-specific types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cars?: ScoredCarResult[];
  calculation?: TaxBreakdown | FCRComparison;
}

export interface ParsedOption {
  number: number;
  text: string;
  emoji?: string;
}
