/**
 * Language-aware input helpers for flow specifications
 */

import type { Language } from './types.ts';

/**
 * Multi-language input mappings
 */
export const INPUTS = {
  // Goal selection
  goal: {
    find_car: { french: '1', arabic: '1', derja: '1' },
    procedure: { french: '2', arabic: '2', derja: '2' },
    compare_cars: { french: '3', arabic: '3', derja: '3' },
    ev_info: { french: '4', arabic: '4', derja: '4' },
    browse_offers: { french: '5', arabic: '5', derja: '5' },
    popular_cars: { french: '6', arabic: '6', derja: '6' },
  },

  // Car origin
  car_origin: {
    tunisia: { french: '1', arabic: '1', derja: '1' },
    abroad: { french: '2', arabic: '2', derja: '2' },
  },

  // Residency
  residency: {
    local: { french: '1', arabic: '1', derja: '1' },
    abroad: { french: '2', arabic: '2', derja: '2' },
  },

  // FCR Famille
  fcr_famille: {
    yes: { french: '1', arabic: '1', derja: '1' },
    no: { french: '2', arabic: '2', derja: '2' },
  },

  // Fuel type
  fuel_type: {
    essence: { french: '1', arabic: '1', derja: '1' },
    diesel: { french: '2', arabic: '2', derja: '2' },
    hybrid: { french: '3', arabic: '3', derja: '3' },
    hybrid_rechargeable: { french: '4', arabic: '4', derja: '4' },
    electric: { french: '5', arabic: '5', derja: '5' },
    any: { french: '6', arabic: '6', derja: '6' },
  },

  // Car type
  car_type: {
    suv: { french: '1', arabic: '1', derja: '1' },
    sedan: { french: '2', arabic: '2', derja: '2' },
    compact: { french: '3', arabic: '3', derja: '3' },
    any: { french: '4', arabic: '4', derja: '4' },
  },

  // Condition
  condition: {
    new: { french: '1', arabic: '1', derja: '1' },
    used: { french: '2', arabic: '2', derja: '2' },
    any: { french: '3', arabic: '3', derja: '3' },
  },

  // Budget presets
  budget: {
    '50k': { french: '1', arabic: '1', derja: '1' },
    '70k': { french: '2', arabic: '2', derja: '2' },
    '90k': { french: '3', arabic: '3', derja: '3' },
    '120k': { french: '4', arabic: '4', derja: '4' },
    '150k': { french: '5', arabic: '5', derja: '5' },
    '200k': { french: '6', arabic: '6', derja: '6' },
    '300k': { french: '7', arabic: '7', derja: '7' },
  },

  // Yes/No
  yes_no: {
    yes: { french: '1', arabic: '1', derja: '1' },
    no: { french: '2', arabic: '2', derja: '2' },
  },

  // Procedure type
  procedure: {
    fcr_tre: { french: '1', arabic: '1', derja: '1' },
    fcr_famille: { french: '2', arabic: '2', derja: '2' },
  },

  // EV topics
  ev_topic: {
    hybrid_vs_ev: { french: '1', arabic: '1', derja: '1' },
    ev_law: { french: '2', arabic: '2', derja: '2' },
    charging_stations: { french: '3', arabic: '3', derja: '3' },
    solar_panels: { french: '4', arabic: '4', derja: '4' },
  },

  // Popular cars selection
  popular_cars: {
    eligibility: { french: '1', arabic: '1', derja: '1' },
    models: { french: '2', arabic: '2', derja: '2' },
  },

  // Salary level for popular car eligibility
  salary_level: {
    single_eligible: { french: '1', arabic: '1', derja: '1' },
    couple_eligible: { french: '2', arabic: '2', derja: '2' },
    not_eligible: { french: '3', arabic: '3', derja: '3' },
  },

  // Calculator engine CC
  engine_cc: {
    small: { french: '1', arabic: '1', derja: '1' },  // ≤1600
    medium: { french: '2', arabic: '2', derja: '2' }, // 1601-2000
    large: { french: '3', arabic: '3', derja: '3' },  // >2000
  },

  // Calculator fuel type (simplified)
  calc_fuel: {
    essence: { french: '1', arabic: '1', derja: '1' },
    diesel: { french: '2', arabic: '2', derja: '2' },
    electric: { french: '3', arabic: '3', derja: '3' },
  },

  // Greetings
  greeting: {
    french: { french: 'Bonjour', arabic: 'مرحبا', derja: 'مرحبا' },
    arabic: { french: 'Bonjour', arabic: 'السلام عليكم', derja: 'سلام' },
  },
};

/**
 * Get input for a specific action and language
 */
export function getInput(
  category: keyof typeof INPUTS,
  value: string,
  language: Language
): string {
  const categoryInputs = INPUTS[category] as Record<string, Record<Language, string>>;
  return categoryInputs[value]?.[language] ?? categoryInputs[value]?.french ?? value;
}

/**
 * Create a language-aware input function
 */
export function input(category: keyof typeof INPUTS, value: string) {
  return (ctx: { language: Language }) => getInput(category, value, ctx.language);
}

/**
 * Greetings for each language
 */
export const GREETINGS: Record<Language, string> = {
  french: 'Bonjour',
  arabic: 'مرحبا',
  derja: 'مرحبا',
};

/**
 * Get greeting for language
 */
export function greeting(language: Language): string {
  return GREETINGS[language];
}

/**
 * Keywords for testing keyword-based parsing (for testing edge cases)
 */
export const KEYWORDS = {
  goal: {
    find_car: {
      french: ['acheter', 'cherche voiture', 'voiture'],
      arabic: ['شراء', 'تشري'],
      derja: ['تشري كرهبة', 'كرهبة'],
    },
    procedure: {
      french: ['procédure', 'fcr'],
      arabic: ['إجراءات', 'fcr'],
      derja: ['إجراءات'],
    },
    ev_info: {
      french: ['électrique', 'ev'],
      arabic: ['كهربائ'],
      derja: ['كهربائية'],
    },
    popular_cars: {
      french: ['populaire', 'subvention'],
      arabic: ['شعبي', 'مدعوم'],
      derja: ['شعبية', 'مدعومة'],
    },
  },

  car_origin: {
    tunisia: {
      french: ['tunisie', 'local'],
      arabic: ['تونس', 'محلي'],
      derja: ['تونس'],
    },
    abroad: {
      french: ['étranger', 'import'],
      arabic: ['خارج', 'استيراد'],
      derja: ['برّا', 'برا', 'توريد'],
    },
  },

  residency: {
    local: {
      french: ['tunisie', 'local'],
      arabic: ['تونس'],
      derja: ['تونس'],
    },
    abroad: {
      french: ['étranger', 'tre', 'abroad'],
      arabic: ['خارج'],
      derja: ['خارج', 'tre'],
    },
  },

  fuel_type: {
    essence: {
      french: ['essence', 'petrol'],
      arabic: ['بنزين'],
      derja: ['بنزين'],
    },
    diesel: {
      french: ['diesel', 'gasoil'],
      arabic: ['ديزل', 'مازوط'],
      derja: ['مازوط', 'ديزل'],
    },
    electric: {
      french: ['électrique', 'electric'],
      arabic: ['كهربائي'],
      derja: ['كهربائي'],
    },
    hybrid: {
      french: ['hybride', 'hybrid'],
      arabic: ['هجين', 'هيبريد'],
      derja: ['هيبريد'],
    },
  },

  condition: {
    new: {
      french: ['neuve', 'neuf', 'new'],
      arabic: ['جديدة'],
      derja: ['جديدة'],
    },
    used: {
      french: ['occasion', 'used', 'occ'],
      arabic: ['مستعملة'],
      derja: ['مستعملة'],
    },
  },
};
