import { CarResult, ScoredCarResult, Conversation } from './types.ts';
import { EXCHANGE_RATE } from './config.ts';

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
  'ds automobiles': 6.5,
  ds: 6.5,
  'land rover': 5.5,
  volvo: 8.0,
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
  lexus: 6.0, // shares Toyota parts
  'ds automobiles': 6.0, // PSA/Stellantis network
  ds: 6.0,
  'land rover': 4.5, // KB: difficult availability
  volvo: 5.5,
  // Chinese brands
  byd: 6.0,
  mg: 5.5,
  chery: 5.0,
  geely: 5.0,
  haval: 5.0,
  // Local
  bako: 7.0, // Local assembly = easier parts
  wallyscar: 7.5,
};

/**
 * Fuel efficiency scores by fuel type and engine size
 */
function getFuelEfficiencyScore(fuelType: string, engineCc: number | null): number {
  const fuel = fuelType.toLowerCase();
  const cc = engineCc || 1400;

  if (fuel.includes('electric')) return 10;
  if (fuel.includes('hybrid_rechargeable') || fuel.includes('plug')) return 9;
  if (fuel.includes('hybrid')) return 8;

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

// Average shipping cost Europe→Tunisia (EUR) — added to price to form CIF
const AVERAGE_SHIPPING_EUR = 1200;

/**
 * Get consumption tax (DC) rate based on engine size and fuel type
 * Source: KB/customs-taxes.md — "Taxe de Consommation" tables
 */
function getDcRate(cc: number, fuel: string, bodyType: string | null): number {
  const body = (bodyType || '').toLowerCase();
  const is4x4 = body.includes('suv') || body.includes('4x4') || body.includes('pick');

  if (fuel.includes('electric') || fuel.includes('hybrid_rechargeable') || fuel.includes('plug')) return 0;
  if (fuel.includes('hybrid') && cc <= 1700) return getDcRate(cc, 'essence', null) * 0.5; // HEV ≤1700cc: 50% reduction

  // 4x4 / SUV: flat 90% DC under régime commun
  if (is4x4) return 0.90;

  if (fuel.includes('diesel')) {
    if (cc <= 1500) return 0.38;
    if (cc <= 1700) return 0.38;
    if (cc <= 1900) return 0.40;
    if (cc <= 2100) return 0.55;
    if (cc <= 2300) return 0.63;
    if (cc <= 2500) return 0.70;
    return 0.88;
  }
  // Essence
  if (cc <= 1000) return 0.16;
  if (cc <= 1300) return 0.16;
  if (cc <= 1500) return 0.30;
  if (cc <= 1700) return 0.38;
  if (cc <= 2000) return 0.52;
  if (cc <= 2400) return 0.67;
  return 0.67;
}

/**
 * Calculate estimated total cost in TND using the actual tax formula from KB.
 *
 * Formula (KB/customs-taxes.md):
 *   CIF = price + shipping + insurance
 *   DD  = CIF × dd_rate (0% for EU)
 *   DC  = (CIF + DD) × dc_rate
 *   TVA = (CIF + DD + DC) × tva_rate
 *   TFD = (DD + DC) × 3%
 *   total_taxes = DD + DC + TVA + TFD
 *
 * FCR TRE: final = CIF + (total_taxes × 0.25)   [25% of normal taxes]
 * FCR Famille: DC = 10%, TVA = 7%, electric/hybrid DC = 0%
 * Régime Commun: full rates
 */
function calculateEstimatedTotalTnd(
  car: CarResult,
  regime: 'fcr_tre' | 'fcr_famille' | 'commun'
): number {
  if (car.price_tnd && car.country === 'TN') {
    return car.price_tnd;
  }

  if (car.price_eur) {
    const cc = car.engine_cc || 1400;
    const fuel = (car.fuel_type || '').toLowerCase();
    const isElectric = fuel.includes('electric');
    const isPhev = fuel.includes('hybrid_rechargeable') || fuel.includes('plug');

    // CIF = price + shipping + insurance (all converted to TND)
    const cif = (car.price_eur + AVERAGE_SHIPPING_EUR) * EXCHANGE_RATE.effective_rate;

    // Assume EU origin (0% customs) — most cars in DB are from EU
    const ddRate = 0;
    const dd = cif * ddRate;

    if (regime === 'fcr_tre' && car.fcr_tre_eligible) {
      // FCR TRE: calculate full taxes, then pay only 25%
      const dcRate = getDcRate(cc, fuel, car.body_type);
      const dc = (cif + dd) * dcRate;
      const tvaRate = (isElectric || isPhev) ? 0.07 : 0.19;
      const tva = (cif + dd + dc) * tvaRate;
      const tfd = (dd + dc) * 0.03;
      const totalTaxes = dd + dc + tva + tfd;
      return Math.round(cif + totalTaxes * 0.25);

    } else if (regime === 'fcr_famille' && car.fcr_famille_eligible) {
      // FCR Famille (Art.55): DC = 10% (0% for electric/hybrid), TVA = 7%
      const dcRate = (isElectric || isPhev) ? 0 : 0.10;
      const dc = (cif + dd) * dcRate;
      const tva = (cif + dd + dc) * 0.07;
      const tfd = (dd + dc) * 0.03;
      return Math.round(cif + dd + dc + tva + tfd);

    } else {
      // Régime Commun: full tax rates
      const dcRate = getDcRate(cc, fuel, car.body_type);
      const dc = (cif + dd) * dcRate;
      const tva = (cif + dd + dc) * 0.19;
      const tfd = (dd + dc) * 0.03;
      return Math.round(cif + dd + dc + tva + tfd);
    }
  }

  return car.price_tnd || 0;
}

/**
 * Score a single car based on multiple factors
 */
export function scoreCar(
  car: CarResult,
  conversation: Conversation
): ScoredCarResult {
  const scores = {
    price_fit: 0,
    age: 0,
    mileage: 0,
    reliability: 0,
    parts_availability: 0,
    fuel_efficiency: 0,
    preference_match: 0,
  };

  const budget = conversation.budget_tnd || 100000;

  // Determine import regime based on user's conversation flow
  const regime: 'fcr_tre' | 'fcr_famille' | 'commun' =
    (conversation.residency === 'abroad' && car.fcr_tre_eligible) ? 'fcr_tre' :
    (conversation.residency === 'local' && conversation.fcr_famille && car.fcr_famille_eligible) ? 'fcr_famille' :
    'commun';
  const estimatedTotalTnd = calculateEstimatedTotalTnd(car, regime);

  // === 1. PRICE FIT (0-30 points) ===
  // How well does the estimated total fit the budget?
  // Curve peaks at 70-90% of budget (best value), drops steeply over 100%
  const budgetRatio = estimatedTotalTnd / budget;

  if (budgetRatio <= 0.3) {
    scores.price_fit = 8;  // Way under budget — suspiciously cheap or poor value
  } else if (budgetRatio <= 0.5) {
    scores.price_fit = 15; // Under budget — decent but leaving money on table
  } else if (budgetRatio <= 0.7) {
    scores.price_fit = 25; // Good value zone
  } else if (budgetRatio <= 0.9) {
    scores.price_fit = 30; // Sweet spot — maximizing value within budget
  } else if (budgetRatio <= 1.0) {
    scores.price_fit = 22; // At budget limit — acceptable
  } else if (budgetRatio <= 1.1) {
    scores.price_fit = 10; // Slightly over budget
  } else if (budgetRatio <= 1.2) {
    scores.price_fit = 3;  // Over budget — last resort
  } else {
    scores.price_fit = 0;  // Way over budget
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
  } else if (carAge <= 7) {
    scores.age = 7;
  } else if (carAge <= 10) {
    scores.age = 4;
  } else if (carAge <= 15) {
    scores.age = 2;
  } else {
    scores.age = 0; // 15+ years — no age points
  }

  // === 3. MILEAGE SCORE (0-15 points) ===
  const mileage = car.mileage_km || 0;

  if (mileage === 0) {
    scores.mileage = 15; // New car
  } else if (mileage < 20000) {
    scores.mileage = 14;
  } else if (mileage < 40000) {
    scores.mileage = 12;
  } else if (mileage < 60000) {
    scores.mileage = 10;
  } else if (mileage < 80000) {
    scores.mileage = 8;
  } else if (mileage < 100000) {
    scores.mileage = 6;
  } else if (mileage < 150000) {
    scores.mileage = 3;
  } else if (mileage < 200000) {
    scores.mileage = 1;
  } else {
    scores.mileage = 0; // 200k+ km — no mileage points
  }

  // === 4. RELIABILITY SCORE (0-15 points) ===
  const brand = car.brand.toLowerCase();
  const reliability = BRAND_RELIABILITY[brand] || 6.0;
  scores.reliability = Math.round((reliability / 10) * 15);

  // === 5. PARTS AVAILABILITY (0-10 points) ===
  const partsScore = PARTS_AVAILABILITY[brand] || 5.0;
  scores.parts_availability = Math.round((partsScore / 10) * 10);

  // === 6. FUEL EFFICIENCY (0-10 points) ===
  scores.fuel_efficiency = getFuelEfficiencyScore(car.fuel_type, car.engine_cc);

  // === 7. PREFERENCE MATCH (0-5 points) ===
  let prefScore = 2.5; // Start neutral

  // Fuel type match
  if (conversation.fuel_preference && conversation.fuel_preference !== 'any') {
    const carFuel = car.fuel_type.toLowerCase();
    const prefFuel = conversation.fuel_preference.toLowerCase();

    if (carFuel.includes(prefFuel) || prefFuel.includes(carFuel)) {
      prefScore += 1;
    } else if (
      (prefFuel === 'hybrid' && carFuel.includes('hybrid')) ||
      (prefFuel === 'hybrid_rechargeable' && carFuel.includes('plug'))
    ) {
      prefScore += 1;
    }
  }

  // Car type match
  if (conversation.car_type_preference && conversation.car_type_preference !== 'any') {
    const carBody = (car.body_type || '').toLowerCase();
    const pref = conversation.car_type_preference.toLowerCase();

    const bodyMatches: Record<string, string[]> = {
      suv: ['suv', '4x4', 'crossover'],
      sedan: ['berline', 'sedan', 'limousine'],
      compact: ['citadine', 'compact', 'hatchback', 'kleinwagen'],
    };

    const matchingTerms = bodyMatches[pref] || [pref];
    if (matchingTerms.some((term) => carBody.includes(term))) {
      prefScore += 1;
    }
  }

  // Condition match
  if (conversation.condition_preference && conversation.condition_preference !== 'any') {
    const isNew = (car.mileage_km || 0) === 0 || (car.condition || '').toLowerCase() === 'new';

    if (conversation.condition_preference === 'new' && isNew) {
      prefScore += 0.5;
    } else if (conversation.condition_preference === 'used' && !isNew) {
      prefScore += 0.5;
    }
  }

  scores.preference_match = Math.min(5, Math.max(0, prefScore));

  // === CALCULATE TOTAL ===
  const totalScore =
    scores.price_fit +
    scores.age +
    scores.mileage +
    scores.reliability +
    scores.parts_availability +
    scores.fuel_efficiency +
    scores.preference_match;

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
 * Score and rank a list of cars
 */
export function rankCars(
  cars: CarResult[],
  conversation: Conversation
): ScoredCarResult[] {
  // Score all cars
  const scoredCars = cars.map((car) => scoreCar(car, conversation));

  // Quality floor: exclude cars that are clearly poor recommendations
  const filtered = scoredCars.filter((car) => {
    const age = new Date().getFullYear() - car.year;
    if (age > 15) return false;         // No cars older than 15 years
    if ((car.mileage_km || 0) > 250000) return false;  // No extreme mileage
    if (car.score < 25) return false;   // Minimum quality threshold
    return true;
  });

  // Sort by score (highest first)
  filtered.sort((a, b) => b.score - a.score);

  return filtered;
}

/**
 * Get top recommendations with diversity
 * Ensures we don't just return 10 of the same car model
 */
export function getTopRecommendations(
  scoredCars: ScoredCarResult[],
  limit: number = 5
): ScoredCarResult[] {
  const recommendations: ScoredCarResult[] = [];
  const seenModels = new Set<string>();

  for (const car of scoredCars) {
    const modelKey = `${car.brand.toLowerCase()}-${car.model.toLowerCase()}`;

    // Allow max 2 of same model
    const modelCount = recommendations.filter(
      (r) => `${r.brand.toLowerCase()}-${r.model.toLowerCase()}` === modelKey
    ).length;

    if (modelCount < 2) {
      recommendations.push(car);
      seenModels.add(modelKey);

      if (recommendations.length >= limit) {
        break;
      }
    }
  }

  return recommendations;
}
