// Groq models
export const MODELS = {
  classifier: 'llama-3.1-8b-instant', // Fast classification
  generator: 'llama-3.3-70b-versatile', // Response generation
};

// Embedding config (same as ingest-knowledge)
export const EMBEDDING_CONFIG = {
  model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
  dimensions: 384,
};

// Retrieval config
export const RETRIEVAL_CONFIG = {
  knowledge_top_k: 5,
  knowledge_threshold: 0.55,  // was 0.4
  cars_limit: 10,
  hybrid_alpha: 0.7,  // Semantic weight in hybrid search (0.7 semantic, 0.3 keyword)
};

// EUR to TND exchange rate (with buffer)
export const EXCHANGE_RATE = {
  rate: 3.35, // Base rate
  buffer_percent: 5, // Safety buffer
  get effective_rate() {
    return this.rate * (1 + this.buffer_percent / 100);
  },
};

// Tax rates from KB/customs-taxes.md
export const TAX_RATES = {
  // Droits de Douane by origin
  dd: {
    eu: 0,
    turkey: 0.20, // simplified
    other: 0.20,
  },

  // Taxe de Consommation by engine size (essence)
  dc_essence: {
    1000: 0.16,
    1300: 0.16,
    1500: 0.30,
    1700: 0.38,
    2000: 0.52,
    2200: 0.67,
    2400: 0.67,
    max: 0.67,
  },

  // Taxe de Consommation by engine size (diesel)
  dc_diesel: {
    1500: 0.38,
    1700: 0.38,
    1900: 0.40,
    2100: 0.55,
    2300: 0.63,
    2500: 0.70,
    2700: 0.88,
    2800: 0.88,
    max: 0.88,
  },

  // Special rates
  dc_4x4: 0.90,
  dc_fcr_famille: 0.10,

  // TVA rates
  tva_standard: 0.19,
  tva_reduced: 0.07, // Electric, PHEV, FCR Famille

  // TFD
  tfd_rate: 0.03,
};

// FCR cylinder limits
export const FCR_LIMITS = {
  tre: {
    essence_max_cc: 2000,
    diesel_max_cc: 2500,
    max_age_years: 5,
  },
  famille: {
    essence_max_cc: 1400,
    diesel_max_cc: 1700,
    max_age_years: 8,
  },
};

// Shipping costs by country (EUR) - used by recommend function
export const SHIPPING_COSTS_EUR: Record<string, number> = {
  DE: 1000,  // Germany - most common, good logistics
  FR: 1200,  // France - slightly higher
  BE: 1100,  // Belgium - similar to Germany
  IT: 1500,  // Italy - longer route
};

// Local fees in TND - used by recommend function
export const LOCAL_FEES = {
  port_handling: 400,
  transitaire: 800,
  registration: 500,
  inspection: 150,
};

// Transit insurance rate (% of car price)
export const TRANSIT_INSURANCE_RATE = 0.015; // 1.5%

// System prompts
export const SYSTEM_PROMPTS = {
  classifier: `You are a query classifier for KarTN, a Tunisian car purchasing assistant.

Analyze the user's message and return a JSON object with:
- intent: one of "eligibility", "car_search", "cost_calculation", "general_info", "off_topic"
- language: one of "french", "arabic", "derja" (Tunisian dialect)
- confidence: 0.0 to 1.0
- filters: (if car_search) extracted search filters like budget, brand, fuel_type, year
- calculation_params: (if cost_calculation) extracted params like price, engine_cc, regime

Intent definitions:
- eligibility: Questions about FCR programs, who qualifies, requirements
- car_search: Looking for specific cars, recommendations, comparisons
- cost_calculation: Asking about import costs, taxes, total price
- general_info: Questions about procedures, insurance, registration, EVs, etc.
- off_topic: NOT related to cars/importing/Tunisia automotive

Respond ONLY with valid JSON.`,

  generator: `You are KarTN, a Tunisian car assistant.

STRICT RULES:
1. MAX 4 lines per response - NO exceptions
2. Use numbered options: "1. X  2. Y  3. Z"
3. Only these emojis: ✅ ❌ 💰
4. Mirror user's language (French/Arabic/Derja)

RESPONSE TEMPLATES:

For greetings:
"Bienvenue! 1. Trouver voiture  2. Calculer coûts  3. Procédures"

For car results (per car):
"{rank}. {brand} {model} ({year}) 💰 {price}€ → {total_tnd} TND
   {fuel} | {mileage}km | {fcr_status}"

For eligibility questions:
"✅/❌ [Direct answer in 1 line]
Conditions: [2-3 key points max]"

For cost calculation:
"💰 Prix final: {total} TND
Détail: CIF {cif} + Taxes {taxes} = {total}"

For procedures:
"Étapes: 1. X  2. Y  3. Z
⚠️ [One key warning if relevant]"

OFF-TOPIC:
"Je suis KarTN, spécialisé voitures/import Tunisie. Posez-moi une question sur: import, FCR, coûts, procédures."

FORBIDDEN:
- Long explanations
- Multiple paragraphs
- Bullet point lists longer than 3 items
- Repeating information

FOLLOW-UP SUGGESTIONS:
After your response, add 2-3 follow-up questions the user might ask.
Format each on its own line starting with "Q: "
Example:
Q: Quel est le coût total d'importation?
Q: Cette voiture est-elle éligible FCR?
Q: Comparer avec un autre modèle?`,
};

// Off-topic response templates by language
export const OFF_TOPIC_RESPONSES: Record<string, string> = {
  french:
    "Je suis KarTN, spécialisé dans l'achat et l'importation de voitures en Tunisie. Je ne peux pas vous aider avec ce sujet, mais n'hésitez pas à me poser des questions sur l'importation de voitures, le FCR, les coûts d'importation, le financement, etc.",
  arabic:
    'أنا كارتن، مساعد متخصص في شراء واستيراد السيارات في تونس. لا أستطيع مساعدتك في هذا الموضوع، لكن يمكنك أن تسألني عن استيراد السيارات، نظام FCR، تكاليف الاستيراد، التمويل، إلخ.',
  derja:
    'أنا كارتن، نخدم كان في شراء وتوريد الكراهب في تونس. ما نجمش نعاونك في هذا الموضوع، أما تنجم تسألني على توريد الكراهب، FCR، المصاريف، التمويل، إلخ.',
};
