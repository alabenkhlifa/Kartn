/**
 * HTTP client for testing chat and recommend edge functions
 */

const BASE_URL = 'http://127.0.0.1:54321/functions/v1';

// Anon key from TESTING.md - safe to include, this is the Supabase demo key
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  language?: 'french' | 'arabic' | 'derja';
}

export interface ChatResponse {
  message: string;
  intent: string;
  language: 'french' | 'arabic' | 'derja';
  sources?: string[];
  cars?: CarResult[];
  calculation?: unknown;
  conversation_id?: string;
  state?: string;
  options?: string[];
}

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
  limit?: number;
  offset?: number;
  include_cost_breakdown?: boolean;
}

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

export interface CarRecommendation {
  car: {
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
    country: string;
    source: string;
    url: string;
    fcr_tre_eligible: boolean;
    fcr_famille_eligible: boolean;
  };
  rank: number;
  estimated_total_tnd: number;
  score: number;
  score_breakdown: ScoreBreakdown;
  recommendation_strength: 'excellent' | 'good' | 'fair' | 'poor';
  cost_breakdown?: unknown;
  fcr_eligible?: {
    tre: boolean;
    famille: boolean;
  };
}

export interface RecommendResponse {
  total: number;
  limit: number;
  offset: number;
  recommendations: CarRecommendation[];
}

export interface ApiError {
  error: string;
}

/**
 * Chat API client
 */
export const chatApi = {
  /**
   * Send a message to the chat endpoint
   */
  async send(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(`Chat API error (${response.status}): ${error.error}`);
    }

    return await response.json() as ChatResponse;
  },

  /**
   * Send a raw request (for testing error cases)
   */
  async sendRaw(body: unknown, options: { method?: string } = {}): Promise<Response> {
    return await fetch(`${BASE_URL}/chat`, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};

/**
 * Recommend API client
 */
export const recommendApi = {
  /**
   * Get car recommendations
   */
  async post(request: RecommendRequest): Promise<RecommendResponse> {
    const response = await fetch(`${BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json() as ApiError;
      throw new Error(`Recommend API error (${response.status}): ${error.error}`);
    }

    return await response.json() as RecommendResponse;
  },

  /**
   * Send a raw request (for testing error cases)
   */
  async sendRaw(body: unknown, options: { method?: string } = {}): Promise<Response> {
    return await fetch(`${BASE_URL}/recommend`, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};

/**
 * Helper to run a complete conversation flow
 */
export async function runConversationFlow(
  steps: string[],
  options: { language?: 'french' | 'arabic' | 'derja' } = {}
): Promise<ChatResponse[]> {
  const responses: ChatResponse[] = [];
  let conversationId: string | undefined;

  for (const message of steps) {
    const response = await chatApi.send({
      message,
      conversation_id: conversationId,
      language: options.language,
    });
    responses.push(response);
    conversationId = response.conversation_id;
  }

  return responses;
}
