// Document-to-topic mapping
export const DOCUMENT_TOPICS: Record<string, string> = {
  'fcr-renouvelable.md': 'fcr_eligibility',
  'une-voiture-famille.md': 'fcr_eligibility',
  'voiture-populaire.md': 'fcr_eligibility',
  'smig-eligibility.md': 'fcr_eligibility',
  'customs-taxes.md': 'tax_calculation',
  'vignette-annual-tax.md': 'tax_calculation',
  'financing-options.md': 'financing',
  'payment-methods.md': 'financing',
  'ev-hybrid-laws.md': 'ev_incentives',
  'ev-charging-infrastructure.md': 'ev_incentives',
  'electricity-running-costs.md': 'ev_incentives',
  'solar-installation.md': 'ev_incentives',
  'fuel-spare-parts.md': 'parts_availability',
  'homologation-registration.md': 'import_procedures',
  'shipping-transport.md': 'import_procedures',
  'car-insurance.md': 'insurance',
  'car-market-sources.md': 'market_info',
};

// All KB document filenames
export const ALL_DOCUMENTS = Object.keys(DOCUMENT_TOPICS);

// Chunking configuration
export const CHUNKING_CONFIG = {
  targetTokens: 600, // Target 500-800 tokens per chunk
  maxTokens: 800,
  overlapTokens: 100,
  // Approximate: 1 token ~= 4 characters for multilingual content
  charsPerToken: 4,
};

// Embedding configuration
export const EMBEDDING_CONFIG = {
  model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
  dimensions: 384,
  batchSize: 10,
  delayBetweenBatches: 500, // ms
};

// GitHub raw content base URL for KB files
export const KB_BASE_URL =
  'https://raw.githubusercontent.com/alabenkhlifa/Kartn/main/KB';
