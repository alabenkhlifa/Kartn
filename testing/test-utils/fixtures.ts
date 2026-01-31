/**
 * Test fixtures for chat and recommend functions
 */

import type { ScoreBreakdown } from './api-client.ts';

// ============================================================================
// PARSER TEST DATA
// ============================================================================

export const goalInputs = {
  find_car: ['1', 'acheter', 'acheter une voiture', 'cherche voiture', 'تشري', 'شراء', 'voiture', 'كرهبة'],
  procedure: ['2', 'procédure', 'fcr', 'إجراءات'],
  compare_cars: ['3', 'comparer', 'comparaison', 'vs', 'مقارن', 'تقارن'],
  ev_info: ['4', 'électrique', 'ev', 'كهربائ'],
  browse_offers: ['5', 'parcourir', 'offres', 'تصفح', 'عروض', 'تشوف'],
  popular_cars: ['6', 'populaire', 'subvention', 'شعبي', 'مدعوم'],
};

export const carOriginInputs = {
  tunisia: ['1', 'tunisie', 'تونس', 'محلي', 'local'],
  abroad: ['2', 'étranger', 'خارج', 'استيراد', 'import', 'برّا', 'برا'],
};

export const residencyInputs = {
  local: ['1', 'tunisie', 'local'],
  abroad: ['2', 'étranger', 'tre', 'abroad'],
};

export const budgetInputs = {
  presets: [
    { input: '1', expected: 50000 },
    { input: '2', expected: 70000 },
    { input: '3', expected: 90000 },
    { input: '4', expected: 120000 },
    { input: '5', expected: 150000 },
    { input: '6', expected: 200000 },
    { input: '7', expected: 300000 },
  ],
  // Note: Parser checks first char for presets (1-7), so custom values
  // starting with 1-7 will be treated as presets. Use values starting with 8-9
  // or small values (<500) that get multiplied by 1000.
  custom: [
    { input: '80000', expected: 80000 },
    { input: '85k', expected: 85000 },
    { input: '95 000', expected: 95000 },
    { input: '99 000 TND', expected: 99000 },
    { input: '80000dt', expected: 80000 },
    { input: '80', expected: 80000 }, // < 500 assumed thousands
    { input: '99k', expected: 99000 },
  ],
};

export const fuelTypeInputs = {
  essence: ['1', 'essence', 'بنزين', 'petrol', 'gasoline'],
  diesel: ['2', 'diesel', 'مازوط', 'ديزل', 'gasoil'],
  hybrid: ['3', 'hybrid', 'hybride', 'هيبريد', 'هجين'],
  hybrid_rechargeable: ['4', 'phev', 'rechargeable', 'يتشارج', 'قابل للشحن', 'plug'],
  electric: ['5', 'électrique', 'electric', 'كهربائي', 'ev', 'bev'],
  any: ['6', 'importe', 'يهم', 'any', 'all', 'tout'],
};

export const carTypeInputs = {
  suv: ['1', 'suv', '4x4'],
  sedan: ['2', 'berline', 'sedan', 'سيدان', 'برلين'],
  compact: ['3', 'compact', 'مدمجة', 'صغيرة'],
  any: ['4', 'importe', 'يهم', 'any', 'all'],
};

export const conditionInputs = {
  new: ['1', 'neuve', 'new', 'جديدة', 'neuf'],
  used: ['2', 'occasion', 'used', 'مستعملة', 'occ'],
  any: ['3', 'importe', 'يهم', 'any', 'all', 'both'],
};

export const fcrFamilleInputs = {
  yes: ['1', 'oui', 'نعم', 'إيه', 'yes'],
  no: ['2', 'non', 'لا', 'no'],
};

export const priceInputs = [
  { input: '15000', expected: 15000 },
  { input: '15000€', expected: 15000 },
  { input: '15 000', expected: 15000 },
  { input: '15k', expected: 15000 },
  { input: '15k eur', expected: 15000 },
  { input: '20', expected: 20000 }, // < 500 assumed thousands
];

export const engineCCInputs = {
  small: ['1', '1600', 'petit', 'صغير'], // → 1400
  medium: ['2', '2000', 'moyen', 'متوسط'], // → 1800
  large: ['3', 'gros', 'grand', 'كبير'], // → 2200
};

export const calcFuelTypeInputs = {
  essence: ['1', 'essence', 'بنزين', 'petrol'],
  diesel: ['2', 'diesel', 'مازوط', 'ديزل', 'gasoil'],
  electric: ['3', 'électrique', 'electric', 'كهربائي', 'ev'],
};

export const yesNoInputs = {
  yes: ['1', 'oui', 'نعم', 'إيه', 'yes', 'ok', "d'accord"],
  no: ['2', 'non', 'لا', 'no', 'menu', 'retour', 'رجوع'],
};

export const procedureInputs = {
  fcr_tre: ['1', 'fcr tre', 'tre', 'توريد', 'import', 'étranger', 'خارج'],
  fcr_famille: ['2', 'fcr famille', 'famille', 'عائلة', 'عايلة', 'article 55', 'art 55', 'فصل 55'],
};

export const evTopicInputs = {
  hybrid_vs_ev: ['1', 'différence', 'hybrid', 'phev', 'فرق', 'هيبريد'],
  ev_law: ['2', 'loi', 'law', 'قانون', 'fiscal'],
  charging_stations: ['3', 'borne', 'recharge', 'charging', 'شحن', 'محطات'],
  solar_panels: ['4', 'solaire', 'solar', 'panneau', 'شمس', 'پانو'],
};

export const popularCarsSelectionInputs = {
  eligibility: ['1', 'éligib', 'vérif', 'أهلي', 'تثبت'],
  models: ['2', 'modèle', 'voir', 'موديل', 'شوف'],
};

export const salaryLevelInputs = {
  eligible: ['1'], // under 1500
  not_eligible: ['2'], // over 1500
};

export const greetingInputs = [
  'bonjour', 'Bonjour', 'BONJOUR',
  'bonsoir', 'salut', 'hello', 'hi', 'hey',
  'مرحبا', 'السلام', 'اهلا', 'صباح', 'مساء',
  'salam', 'ahla', 'marhba',
];

export const resetInputs = [
  'recommencer', 'reset', 'début', 'start', 'nouveau', 'من جديد',
];

export const invalidInputs = [
  'xyz', 'random', '999', 'asdfgh', '', '   ',
];

// ============================================================================
// STATE MACHINE TEST DATA
// ============================================================================

export const stateTransitions = {
  goal_selection: [
    { goal: 'find_car', expected: 'asking_car_origin' },
    { goal: 'procedure', expected: 'procedure_info' },
    { goal: 'compare_cars', expected: 'car_comparison_input' },
    { goal: 'ev_info', expected: 'ev_topic_selection' },
    { goal: 'browse_offers', expected: 'asking_car_origin' },
    { goal: 'popular_cars', expected: 'popular_cars_selection' },
  ],
  asking_car_origin: [
    { carOrigin: 'tunisia', expected: 'asking_condition' },
    { carOrigin: 'abroad', expected: 'asking_residency' },
  ],
  asking_residency: [
    { residency: 'local', expected: 'asking_fcr_famille' },
    { residency: 'abroad', expected: 'asking_fuel_type' },
  ],
};

// ============================================================================
// RECOMMEND API TEST DATA
// ============================================================================

export const recommendFilters = {
  allAny: {
    fuel_type: 'any' as const,
    condition: 'any' as const,
    body_type: 'any' as const,
    budget_tnd: 100000,
  },
  specificEssence: {
    fuel_type: 'essence' as const,
    condition: 'used' as const,
    body_type: 'suv' as const,
    budget_tnd: 100000,
  },
  electricOnly: {
    fuel_type: 'electric' as const,
    condition: 'any' as const,
    body_type: 'any' as const,
    budget_tnd: 150000,
  },
  newCarsOnly: {
    fuel_type: 'any' as const,
    condition: 'new' as const,
    body_type: 'any' as const,
    budget_tnd: 200000,
  },
  tunisiaOrigin: {
    fuel_type: 'any' as const,
    condition: 'any' as const,
    body_type: 'any' as const,
    budget_tnd: 100000,
    origin: 'tunisia' as const,
  },
  importOrigin: {
    fuel_type: 'any' as const,
    condition: 'any' as const,
    body_type: 'any' as const,
    budget_tnd: 100000,
    origin: 'abroad' as const,
  },
  fcrTre: {
    fuel_type: 'any' as const,
    condition: 'any' as const,
    body_type: 'any' as const,
    budget_tnd: 100000,
    fcr_regime: 'fcr_tre' as const,
  },
  voiturePopulaire: {
    fuel_type: 'any' as const,
    condition: 'any' as const,
    body_type: 'any' as const,
    budget_tnd: 80000,
    is_voiture_populaire: true,
  },
};

// ============================================================================
// MOCK CAR DATA FOR UNIT TESTS
// ============================================================================

export interface MockCar {
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

export const mockCars: MockCar[] = [
  {
    id: 'mock_1',
    brand: 'Toyota',
    model: 'Yaris',
    variant: 'Hybrid',
    full_name: 'Toyota Yaris Hybrid',
    year: 2023,
    price_eur: 15000,
    price_tnd: null,
    fuel_type: 'hybrid',
    engine_cc: 1500,
    mileage_km: 20000,
    body_type: 'Kleinwagen',
    country: 'DE',
    source: 'autoscout24',
    url: 'https://example.com/1',
    seller_type: 'dealer',
    fcr_tre_eligible: true,
    fcr_famille_eligible: true,
  },
  {
    id: 'mock_2',
    brand: 'Peugeot',
    model: '208',
    variant: null,
    full_name: 'Peugeot 208',
    year: 2022,
    price_eur: null,
    price_tnd: 55000,
    fuel_type: 'essence',
    engine_cc: 1200,
    mileage_km: 35000,
    body_type: 'citadine',
    country: 'TN',
    source: 'automobile_tn_used',
    url: 'https://example.com/2',
    seller_type: 'private',
    fcr_tre_eligible: false,
    fcr_famille_eligible: false,
  },
  {
    id: 'mock_3',
    brand: 'BMW',
    model: 'X3',
    variant: 'xDrive20d',
    full_name: 'BMW X3 xDrive20d',
    year: 2021,
    price_eur: 35000,
    price_tnd: null,
    fuel_type: 'diesel',
    engine_cc: 1995,
    mileage_km: 60000,
    body_type: 'SUV',
    country: 'DE',
    source: 'autoscout24',
    url: 'https://example.com/3',
    seller_type: 'dealer',
    fcr_tre_eligible: true,
    fcr_famille_eligible: false,
  },
  {
    id: 'mock_4',
    brand: 'BYD',
    model: 'Dolphin',
    variant: null,
    full_name: 'BYD Dolphin Populaire',
    year: 2024,
    price_eur: null,
    price_tnd: 75000,
    fuel_type: 'electric',
    engine_cc: null,
    mileage_km: 0,
    body_type: 'citadine',
    country: 'TN',
    source: 'automobile_tn_new',
    url: 'https://example.com/4',
    seller_type: 'dealer',
    fcr_tre_eligible: false,
    fcr_famille_eligible: false,
  },
  {
    id: 'mock_5',
    brand: 'Fiat',
    model: 'Punto',
    variant: null,
    full_name: 'Fiat Punto',
    year: 2015,
    price_eur: 5000,
    price_tnd: null,
    fuel_type: 'essence',
    engine_cc: 1400,
    mileage_km: 120000,
    body_type: 'citadine',
    country: 'IT',
    source: 'autoscout24',
    url: 'https://example.com/5',
    seller_type: 'private',
    fcr_tre_eligible: true,
    fcr_famille_eligible: true,
  },
];

// ============================================================================
// SCORING TEST DATA
// ============================================================================

export const scoringTestCases = {
  // Price fit test cases (budget ratio)
  priceFit: [
    { ratio: 0.3, expectedRange: [10, 15] },  // Way under
    { ratio: 0.5, expectedRange: [10, 15] },  // Under
    { ratio: 0.6, expectedRange: [15, 20] },  // Good
    { ratio: 0.75, expectedRange: [20, 23] }, // Sweet spot
    { ratio: 0.85, expectedRange: [20, 23] }, // Sweet spot
    { ratio: 0.95, expectedRange: [18, 22] }, // At limit
    { ratio: 1.05, expectedRange: [8, 12] },  // Slightly over
    { ratio: 1.2, expectedRange: [0, 5] },    // Over budget
  ],

  // Age score test cases
  age: [
    { yearsOld: 0, expectedRange: [16, 18] },
    { yearsOld: 1, expectedRange: [16, 18] },
    { yearsOld: 2, expectedRange: [14, 17] },
    { yearsOld: 5, expectedRange: [8, 12] },
    { yearsOld: 10, expectedRange: [0, 5] },
  ],

  // Mileage score test cases
  mileage: [
    { km: 0, expectedRange: [12, 14] },
    { km: 15000, expectedRange: [11, 14] },
    { km: 50000, expectedRange: [8, 11] },
    { km: 90000, expectedRange: [4, 7] },
    { km: 160000, expectedRange: [0, 3] },
  ],

  // Brand reliability
  brandReliability: {
    toyota: [13, 15],
    peugeot: [9, 12],
    fiat: [7, 10],
  },
};

export const recommendationStrengthThresholds = {
  excellent: 75,
  good: 60,
  fair: 45,
  poor: 0,
};

/**
 * Helper to validate score breakdown sums correctly
 */
export function validateScoreBreakdown(breakdown: ScoreBreakdown, totalScore: number): boolean {
  const sum =
    breakdown.price_fit +
    breakdown.age +
    breakdown.mileage +
    breakdown.reliability +
    breakdown.parts_availability +
    breakdown.fuel_efficiency +
    breakdown.preference_match +
    breakdown.practicality;

  // Allow for rounding differences (0.5 tolerance)
  return Math.abs(sum - totalScore) < 0.5;
}
