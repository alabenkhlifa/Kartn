// Conversation state machine
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
  // Browse offers flow (uses same wizard as find_car)
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
export type CarOrigin = 'tunisia' | 'abroad';
export type Residency = 'local' | 'abroad';
export type FuelPreference = 'essence' | 'diesel' | 'hybrid' | 'hybrid_rechargeable' | 'electric' | 'any';
export type CarTypePreference = 'suv' | 'sedan' | 'compact' | 'any';
export type ConditionPreference = 'new' | 'used' | 'any';

export type CalcFuelType = 'essence' | 'diesel' | 'electric';
export type ProcedureType = 'fcr_tre' | 'fcr_famille';

export type EVTopic = 'hybrid_vs_ev' | 'ev_law' | 'charging_stations' | 'solar_panels';

export interface Conversation {
  id: string;
  state: ConversationState;
  goal: Goal | null;
  car_origin: CarOrigin | null;
  residency: Residency | null;
  fcr_famille: boolean;
  fuel_preference: FuelPreference | null;
  car_type_preference: CarTypePreference | null;
  condition_preference: ConditionPreference | null;
  budget_tnd: number | null;
  language: Language;
  // Cost calculator fields
  calc_price_eur: number | null;
  calc_engine_cc: number | null;
  calc_fuel_type: CalcFuelType | null;
  // Procedure flow field
  selected_procedure: ProcedureType | null;
  // EV info flow field
  selected_ev_topic: EVTopic | null;
  // Compare cars flow field
  comparison_query: string | null;
}

// Intent types for query classification
export type Intent =
  | 'eligibility'
  | 'car_search'
  | 'cost_calculation'
  | 'general_info'
  | 'off_topic';

// Detected language
export type Language = 'french' | 'arabic' | 'derja';

// Classification result from fast LLM
export interface ClassificationResult {
  intent: Intent;
  language: Language;
  filters?: CarSearchFilters;
  calculation_params?: CalculationParams;
  confidence: number;
}

// Filters extracted for car search
export interface CarSearchFilters {
  budget_min?: number;
  budget_max?: number;
  brand?: string;
  fuel_type?: 'essence' | 'diesel' | 'electric' | 'hybrid' | 'hybrid_rechargeable';
  body_type?: 'suv' | 'berline' | 'citadine' | 'break' | 'monospace' | 'compact';
  condition?: 'new' | 'used';
  year_min?: number;
  year_max?: number;
  fcr_tre_only?: boolean;
  fcr_famille_only?: boolean;
  country?: string;
}

// Parameters for cost calculation
export interface CalculationParams {
  price_eur?: number;
  price_tnd?: number;
  engine_cc?: number;
  fuel_type?: 'essence' | 'diesel' | 'electric' | 'hybrid_rechargeable' | 'hybrid_non_rechargeable';
  regime?: 'fcr_tre' | 'fcr_famille' | 'regime_commun';
  vehicle_type?: 'standard' | '4x4';
  origin?: 'eu' | 'turkey' | 'other';
}

// Knowledge chunk from retrieval
export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  section: string | null;
  subsection: string | null;
  topic: string;
  similarity: number;
}

// Car result from SQL query
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
}

// Scored car result for ranking
export interface ScoredCarResult extends CarResult {
  score: number;
  score_breakdown: {
    price_fit: number;
    age: number;
    mileage: number;
    reliability: number;
    parts_availability: number;
    fuel_efficiency: number;
    preference_match: number;
  };
  estimated_total_tnd: number;
  recommendation_strength: 'excellent' | 'good' | 'fair' | 'poor';
}

// Tax calculation breakdown
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

// FCR comparison result
export interface FCRComparison {
  regime_commun: TaxBreakdown;
  fcr_tre?: TaxBreakdown;
  fcr_famille?: TaxBreakdown;
  recommended: string;
  savings: number;
}

// Retrieved context for LLM
export interface RetrievalContext {
  knowledge_chunks: KnowledgeChunk[];
  cars: CarResult[];
  calculation?: TaxBreakdown | FCRComparison;
}

// Chat request/response
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
  cars?: CarResult[];
  calculation?: TaxBreakdown | FCRComparison;
  conversation_id?: string;
}

// Groq API types
export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

export interface GroqChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
