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
  fuel_type?: 'essence' | 'diesel' | 'electric' | 'hybrid';
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
  country: string;
  url: string;
  fcr_tre_eligible: boolean;
  fcr_famille_eligible: boolean;
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
