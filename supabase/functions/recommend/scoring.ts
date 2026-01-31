import { CarListing, RecommendationFilters, ScoreBreakdown } from './types.ts';

// EUR to TND exchange rate (with buffer) - matches cost-calculator.ts
const EXCHANGE_RATE = {
  rate: 3.35,
  buffer_percent: 5,
  get effective_rate() {
    return this.rate * (1 + this.buffer_percent / 100);
  },
};

/**
 * Brand reliability scores (1-10)
 * Based on J.D. Power, Consumer Reports, and local mechanic feedback
 */
const BRAND_RELIABILITY: Record<string, number> = {
  toyota: 9.5,
  lexus: 9.5,
  honda: 9.0,
  mazda: 8.5,
  hyundai: 8.0,
  kia: 8.0,
  suzuki: 8.0,
  volkswagen: 7.5,
  skoda: 7.5,
  seat: 7.0,
  peugeot: 7.0,
  renault: 7.0,
  citroen: 6.5,
  ford: 7.0,
  opel: 7.0,
  bmw: 7.0,
  mercedes: 7.0,
  audi: 7.0,
  fiat: 6.0,
  'alfa romeo': 5.5,
  dacia: 7.5,
  nissan: 7.5,
  mitsubishi: 7.0,
  chevrolet: 6.5,
  jeep: 6.0,
  // Chinese brands (newer, less data)
  byd: 7.0,
  mg: 6.5,
  chery: 6.0,
  geely: 6.0,
  haval: 6.0,
  greatwall: 5.5,
  // Tunisian assembled
  bako: 5.0,
  wallyscar: 6.0,
};

/**
 * Parts availability in Tunisia (1-10)
 * Based on local market presence and dealer networks
 */
const PARTS_AVAILABILITY: Record<string, number> = {
  peugeot: 9.5,
  renault: 9.5,
  citroen: 9.0,
  volkswagen: 8.5,
  toyota: 8.5,
  hyundai: 8.5,
  kia: 8.5,
  fiat: 8.0,
  opel: 8.0,
  suzuki: 8.0,
  ford: 7.5,
  nissan: 7.5,
  honda: 7.0,
  dacia: 8.0,
  seat: 7.0,
  skoda: 7.0,
  bmw: 6.5,
  mercedes: 6.5,
  audi: 6.5,
  mazda: 6.0,
  mitsubishi: 6.5,
  chevrolet: 6.0,
  jeep: 5.5,
  'alfa romeo': 5.0,
  lexus: 5.0,
  // Chinese brands
  byd: 6.0,
  mg: 5.5,
  chery: 5.0,
  geely: 5.0,
  haval: 5.0,
  // Local
  bako: 7.0,
  wallyscar: 7.5,
};

/**
 * Fuel efficiency scores by fuel type and engine size
 * When user specifies a fuel preference, that fuel type gets max score.
 * When user says "any", EVs don't dominate - they're normalized to same level as efficient thermals.
 */
function getFuelEfficiencyScore(fuelType: string, engineCc: number | null, preferredFuel?: string): number {
  const fuel = fuelType.toLowerCase();
  const cc = engineCc || 1400;

  // If user explicitly wants electric, give full bonus
  if (preferredFuel === 'electric' && fuel.includes('electric')) return 10;

  // If user said "any" or didn't specify, normalize EV advantage
  // This prevents EVs from dominating when user has no preference
  if (!preferredFuel || preferredFuel === 'any') {
    if (fuel.includes('electric')) return 7;
    if (fuel.includes('hybrid_rechargeable') || fuel.includes('plug')) return 7;
    if (fuel.includes('hybrid')) return 7;
  } else {
    // User specified a fuel type - use original scoring for EVs/hybrids
    if (fuel.includes('electric')) return 10;
    if (fuel.includes('hybrid_rechargeable') || fuel.includes('plug')) return 9;
    if (fuel.includes('hybrid')) return 8;
  }

  // Thermal engines - smaller is more efficient
  if (fuel.includes('diesel')) {
    if (cc <= 1500) return 7;
    if (cc <= 1900) return 6;
    return 5;
  }

  // Essence
  if (cc <= 1200) return 7;
  if (cc <= 1600) return 6;
  if (cc <= 2000) return 5;
  return 4;
}

/**
 * Determine if FCR applies based on user's regime AND car eligibility
 * Only considers FCR if user specified a FCR regime AND car is eligible for that regime
 */
function isFcrApplicable(car: CarListing, fcrRegime?: string): boolean {
  if (!fcrRegime || fcrRegime === 'regime_commun') return false;
  if (fcrRegime === 'fcr_tre') return car.fcr_tre_eligible;
  if (fcrRegime === 'fcr_famille') return car.fcr_famille_eligible;
  return false;
}

/**
 * Calculate estimated total cost in TND
 */
function calculateEstimatedTotalTnd(car: CarListing, isFcrEligible: boolean): number {
  if (car.price_tnd && car.country === 'TN') {
    // Local car - price is final
    return car.price_tnd;
  }

  if (car.price_eur) {
    // Import car - estimate total with taxes
    const cifTnd = car.price_eur * EXCHANGE_RATE.effective_rate;

    // Simplified tax estimation
    if (isFcrEligible) {
      // FCR: ~20-30% additional costs (shipping + reduced taxes)
      return Math.round(cifTnd * 1.25);
    } else {
      // Regular import: ~150-200% taxes
      return Math.round(cifTnd * 2.5);
    }
  }

  return car.price_tnd || 0;
}

/**
 * Practicality score based on local availability
 * Local Tunisian cars get bonus for immediate availability, no import hassle
 */
function getPracticalityScore(car: CarListing): number {
  // Local Tunisian cars - immediate availability, no import risk
  if (car.country === 'TN') {
    return 5;
  }

  // Common European import routes - easier process
  const easyImportCountries = ['DE', 'FR', 'BE', 'IT'];
  if (easyImportCountries.includes(car.country)) {
    return 2;
  }

  // Other imports - more hassle
  return 1;
}

/**
 * Normalize fuel type for comparison
 */
function normalizeFuelType(fuelType: string): string {
  const fuel = fuelType.toLowerCase();

  if (fuel.includes('essence') || fuel.includes('petrol') || fuel.includes('gasoline') || fuel.includes('benzin')) {
    return 'essence';
  }
  if (fuel.includes('diesel')) {
    return 'diesel';
  }
  if (fuel.includes('hybrid_rechargeable') || fuel.includes('plug-in') || fuel.includes('phev')) {
    return 'hybrid_rechargeable';
  }
  if (fuel.includes('hybrid') || fuel.includes('hybride')) {
    return 'hybrid';
  }
  if (fuel.includes('electric') || fuel.includes('électrique') || fuel.includes('elektro')) {
    return 'electric';
  }

  return fuel;
}

/**
 * Normalize body type for comparison
 */
function normalizeBodyType(bodyType: string | null): string {
  if (!bodyType) return '';
  const body = bodyType.toLowerCase();

  if (body.includes('suv') || body.includes('geländewagen') || body.includes('crossover') || body.includes('4x4')) {
    return 'suv';
  }
  if (body.includes('berline') || body.includes('sedan') || body.includes('limousine')) {
    return 'berline';
  }
  if (body.includes('citadine') || body.includes('kleinwagen') || body.includes('compact') || body.includes('hatchback')) {
    return 'citadine';
  }
  if (body.includes('break') || body.includes('kombi') || body.includes('wagon') || body.includes('estate')) {
    return 'break';
  }
  if (body.includes('monospace') || body.includes('van') || body.includes('minivan') || body.includes('mpv')) {
    return 'monospace';
  }
  if (body.includes('coupe') || body.includes('coupé')) {
    return 'coupe';
  }
  if (body.includes('cabriolet') || body.includes('cabrio') || body.includes('convertible') || body.includes('roadster')) {
    return 'cabriolet';
  }
  if (body.includes('utilitaire') || body.includes('utility') || body.includes('transporter')) {
    return 'utilitaire';
  }
  if (body.includes('pickup') || body.includes('pick-up')) {
    return 'pickup';
  }

  return body;
}

/**
 * Map source field to condition
 */
function getConditionFromSource(source: string): 'new' | 'used' {
  if (source === 'automobile_tn_new') {
    return 'new';
  }
  return 'used';
}

export interface ScoredCar extends CarListing {
  score: number;
  score_breakdown: ScoreBreakdown;
  estimated_total_tnd: number;
  recommendation_strength: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Score a single car based on multiple factors (100 point system)
 *
 * Weight distribution:
 * - Price fit: 23 pts
 * - Age: 18 pts
 * - Mileage: 14 pts
 * - Reliability: 15 pts
 * - Parts availability: 10 pts
 * - Fuel efficiency: 10 pts
 * - Preference match: 5 pts
 * - Practicality: 5 pts
 * Total: 100 pts
 */
export function scoreCar(
  car: CarListing,
  filters: RecommendationFilters
): ScoredCar {
  const scores: ScoreBreakdown = {
    price_fit: 0,
    age: 0,
    mileage: 0,
    reliability: 0,
    parts_availability: 0,
    fuel_efficiency: 0,
    preference_match: 0,
    practicality: 0,
  };

  const budget = filters.budget_tnd || 100000;
  // Use FCR only if user's regime matches car eligibility
  const isFcrEligible = isFcrApplicable(car, filters.fcr_regime);
  const estimatedTotalTnd = calculateEstimatedTotalTnd(car, isFcrEligible);

  // === 1. PRICE FIT (0-23 points) ===
  // Rewards utilizing more of the budget - sweet spot at 70-90%
  const budgetRatio = estimatedTotalTnd / budget;

  if (budgetRatio <= 0.5) {
    scores.price_fit = 12; // Way under - not maximizing value
  } else if (budgetRatio <= 0.7) {
    scores.price_fit = 18; // Under budget - good
  } else if (budgetRatio <= 0.9) {
    scores.price_fit = 23; // Sweet spot - maximizing value
  } else if (budgetRatio <= 1.0) {
    scores.price_fit = 20; // At limit - acceptable
  } else if (budgetRatio <= 1.1) {
    scores.price_fit = 10; // Slightly over
  } else {
    scores.price_fit = 0; // Over budget
  }

  // === 2. AGE SCORE (0-18 points) ===
  const currentYear = new Date().getFullYear();
  const carAge = currentYear - car.year;

  if (carAge <= 1) {
    scores.age = 18;
  } else if (carAge <= 2) {
    scores.age = 16;
  } else if (carAge <= 3) {
    scores.age = 14;
  } else if (carAge <= 4) {
    scores.age = 12;
  } else if (carAge <= 5) {
    scores.age = 10;
  } else if (carAge <= 6) {
    scores.age = 8;
  } else if (carAge <= 8) {
    scores.age = 5;
  } else {
    scores.age = 2;
  }

  // === 3. MILEAGE SCORE (0-14 points) ===
  const mileage = car.mileage_km || 0;

  if (mileage === 0) {
    scores.mileage = 14; // New car
  } else if (mileage < 20000) {
    scores.mileage = 13;
  } else if (mileage < 40000) {
    scores.mileage = 11;
  } else if (mileage < 60000) {
    scores.mileage = 9;
  } else if (mileage < 80000) {
    scores.mileage = 7;
  } else if (mileage < 100000) {
    scores.mileage = 5;
  } else if (mileage < 150000) {
    scores.mileage = 3;
  } else {
    scores.mileage = 1;
  }

  // === 4. RELIABILITY SCORE (0-15 points) ===
  const brand = car.brand.toLowerCase();
  const reliability = BRAND_RELIABILITY[brand] || 6.0;
  scores.reliability = Math.round((reliability / 10) * 15);

  // === 5. PARTS AVAILABILITY (0-10 points) ===
  const partsScore = PARTS_AVAILABILITY[brand] || 5.0;
  scores.parts_availability = Math.round((partsScore / 10) * 10);

  // === 6. FUEL EFFICIENCY (0-10 points) ===
  scores.fuel_efficiency = getFuelEfficiencyScore(car.fuel_type, car.engine_cc, filters.fuel_type);

  // === 7. PREFERENCE MATCH (0-5 points) ===
  let prefScore = 2.5; // Start neutral

  // Fuel type match
  if (filters.fuel_type && filters.fuel_type !== 'any') {
    const carFuel = normalizeFuelType(car.fuel_type);
    if (carFuel === filters.fuel_type) {
      prefScore += 1;
    }
  }

  // Body type match
  if (filters.body_type && filters.body_type !== 'any') {
    const carBody = normalizeBodyType(car.body_type);
    if (carBody === filters.body_type) {
      prefScore += 1;
    }
  }

  // Condition match
  if (filters.condition && filters.condition !== 'any') {
    const carCondition = getConditionFromSource(car.source);
    if (carCondition === filters.condition) {
      prefScore += 0.5;
    }
  }

  scores.preference_match = Math.min(5, Math.max(0, prefScore));

  // === 8. PRACTICALITY / LOCAL AVAILABILITY (0-5 points) ===
  scores.practicality = getPracticalityScore(car);

  // === CALCULATE TOTAL ===
  const totalScore =
    scores.price_fit +
    scores.age +
    scores.mileage +
    scores.reliability +
    scores.parts_availability +
    scores.fuel_efficiency +
    scores.preference_match +
    scores.practicality;

  // Determine recommendation strength
  let recommendationStrength: 'excellent' | 'good' | 'fair' | 'poor';
  if (totalScore >= 75) {
    recommendationStrength = 'excellent';
  } else if (totalScore >= 60) {
    recommendationStrength = 'good';
  } else if (totalScore >= 45) {
    recommendationStrength = 'fair';
  } else {
    recommendationStrength = 'poor';
  }

  return {
    ...car,
    score: Math.round(totalScore * 10) / 10,
    score_breakdown: scores,
    estimated_total_tnd: estimatedTotalTnd,
    recommendation_strength: recommendationStrength,
  };
}

/**
 * Check if a car matches the filters (skipping 'any' values)
 */
export function matchesFilters(car: CarListing, filters: RecommendationFilters): boolean {
  // Fuel type: skip if 'any' or undefined
  if (filters.fuel_type && filters.fuel_type !== 'any') {
    const normalizedCarFuel = normalizeFuelType(car.fuel_type);
    if (normalizedCarFuel !== filters.fuel_type) {
      return false;
    }
  }

  // Condition: skip if 'any' or undefined
  if (filters.condition && filters.condition !== 'any') {
    const carCondition = getConditionFromSource(car.source);
    if (carCondition !== filters.condition) {
      return false;
    }
  }

  // Body type: skip if 'any' or undefined
  if (filters.body_type && filters.body_type !== 'any') {
    const normalizedCarBody = normalizeBodyType(car.body_type);
    if (normalizedCarBody !== filters.body_type) {
      return false;
    }
  }

  return true;
}

/**
 * Get top recommendations with diversity
 * Ensures we don't just return many of the same car model
 */
export function getTopRecommendations(
  scoredCars: ScoredCar[],
  limit: number = 5
): ScoredCar[] {
  const recommendations: ScoredCar[] = [];

  for (const car of scoredCars) {
    const modelKey = `${car.brand.toLowerCase()}-${car.model.toLowerCase()}`;

    // Allow max 2 of same model
    const modelCount = recommendations.filter(
      (r) => `${r.brand.toLowerCase()}-${r.model.toLowerCase()}` === modelKey
    ).length;

    if (modelCount < 2) {
      recommendations.push(car);

      if (recommendations.length >= limit) {
        break;
      }
    }
  }

  return recommendations;
}
