import { CarListing, DetailedCostBreakdown } from './types.ts';

// EUR to TND exchange rate (with buffer)
const EXCHANGE_RATE = {
  rate: 3.35,
  buffer_percent: 5,
  get effective_rate() {
    return this.rate * (1 + this.buffer_percent / 100);
  },
};

// Shipping costs by country (EUR)
export const SHIPPING_COSTS_EUR: Record<string, number> = {
  DE: 1000,  // Germany - most common, good logistics
  FR: 1200,  // France - slightly higher
  BE: 1100,  // Belgium - similar to Germany
  IT: 1500,  // Italy - longer route
};

// Local fees in TND
const LOCAL_FEES = {
  port_handling: 400,
  transitaire: 800,
  registration: 500,
  inspection: 150,
};

// Transit insurance rate (% of car price)
const TRANSIT_INSURANCE_RATE = 0.015; // 1.5%

// Tax rates
const TAX_RATES = {
  // Droits de Douane by origin
  dd: {
    eu: 0,
    turkey: 0.20,
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
  } as Record<number | 'max', number>,

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
  } as Record<number | 'max', number>,

  // TVA rates
  tva_standard: 0.19,
  tva_reduced: 0.07, // Electric, PHEV, FCR Famille

  // TFD
  tfd_rate: 0.03,

  // FCR Famille special rate
  dc_fcr_famille: 0.10,
};

// FCR cylinder limits
const FCR_LIMITS = {
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

/**
 * Convert EUR to TND with buffer
 */
export function eurToTnd(amountEur: number): number {
  return amountEur * EXCHANGE_RATE.effective_rate;
}

/**
 * Get shipping cost for a country
 */
export function getShippingCost(country: string): number {
  return SHIPPING_COSTS_EUR[country.toUpperCase()] || 1300; // Default if unknown
}

/**
 * Get Droits de Douane rate based on origin
 */
function getDDRate(country: string): number {
  const euCountries = ['DE', 'FR', 'IT', 'BE'];
  if (euCountries.includes(country.toUpperCase())) {
    return TAX_RATES.dd.eu;
  }
  if (country.toUpperCase() === 'TR') {
    return TAX_RATES.dd.turkey;
  }
  return TAX_RATES.dd.other;
}

/**
 * Get Taxe de Consommation rate based on engine size and fuel type
 */
function getDCRate(engineCC: number, fuelType: string): number {
  const fuel = fuelType.toLowerCase();

  // Electric and PHEV: 0%
  if (fuel.includes('electric') || fuel.includes('hybrid_rechargeable') || fuel.includes('plug')) {
    return 0;
  }

  // Get rate table based on fuel type
  const rateTable = fuel.includes('diesel') ? TAX_RATES.dc_diesel : TAX_RATES.dc_essence;

  // Find applicable rate
  const thresholds = Object.keys(rateTable)
    .filter((k) => k !== 'max')
    .map(Number)
    .sort((a, b) => a - b);

  for (const threshold of thresholds) {
    if (engineCC <= threshold) {
      return rateTable[threshold];
    }
  }

  return rateTable.max;
}

/**
 * Get TVA rate
 */
function getTVARate(fuelType: string, regime?: string): number {
  const fuel = fuelType.toLowerCase();
  if (
    fuel.includes('electric') ||
    fuel.includes('hybrid_rechargeable') ||
    fuel.includes('plug') ||
    regime === 'fcr_famille'
  ) {
    return TAX_RATES.tva_reduced;
  }
  return TAX_RATES.tva_standard;
}

/**
 * Check FCR eligibility based on car specs
 */
export function checkFCREligibility(
  engineCC: number | null,
  fuelType: string,
  year: number
): { tre: boolean; famille: boolean } {
  const currentYear = new Date().getFullYear();
  const ageYears = currentYear - year;
  const cc = engineCC || 1400;
  const fuel = fuelType.toLowerCase();

  const isEssence = fuel.includes('essence') || fuel.includes('petrol') || fuel.includes('gasoline');
  const isDiesel = fuel.includes('diesel');
  const isElectric = fuel.includes('electric') || fuel.includes('hybrid_rechargeable') || fuel.includes('plug');

  // FCR TRE eligibility
  let treEligible = false;
  if (isElectric) {
    treEligible = ageYears <= FCR_LIMITS.tre.max_age_years;
  } else if (isEssence) {
    treEligible = cc <= FCR_LIMITS.tre.essence_max_cc && ageYears <= FCR_LIMITS.tre.max_age_years;
  } else if (isDiesel) {
    treEligible = cc <= FCR_LIMITS.tre.diesel_max_cc && ageYears <= FCR_LIMITS.tre.max_age_years;
  }

  // FCR Famille eligibility
  let familleEligible = false;
  if (isElectric) {
    familleEligible = ageYears <= FCR_LIMITS.famille.max_age_years;
  } else if (isEssence) {
    familleEligible = cc <= FCR_LIMITS.famille.essence_max_cc && ageYears <= FCR_LIMITS.famille.max_age_years;
  } else if (isDiesel) {
    familleEligible = cc <= FCR_LIMITS.famille.diesel_max_cc && ageYears <= FCR_LIMITS.famille.max_age_years;
  }

  return { tre: treEligible, famille: familleEligible };
}

/**
 * Calculate detailed cost breakdown for an imported car
 */
export function calculateDetailedCost(
  car: CarListing,
  regime?: 'fcr_tre' | 'fcr_famille' | 'regime_commun'
): DetailedCostBreakdown {
  const priceEur = car.price_eur || 0;
  const engineCC = car.engine_cc || 1400;
  const fuelType = car.fuel_type || 'essence';
  const country = car.country || 'DE';
  const effectiveRegime = regime || 'regime_commun';

  // Car price
  const carPriceTnd = eurToTnd(priceEur);

  // Shipping
  const shippingEur = getShippingCost(country);
  const shippingTnd = eurToTnd(shippingEur);

  // Transit insurance (1.5% of car price)
  const insuranceTransitEur = priceEur * TRANSIT_INSURANCE_RATE;
  const insuranceTransitTnd = eurToTnd(insuranceTransitEur);

  // CIF (Cost + Insurance + Freight)
  const cifEur = priceEur + shippingEur + insuranceTransitEur;
  const cifTnd = eurToTnd(cifEur);

  // Step 1: Droits de Douane
  const ddRate = getDDRate(country);
  const droitsDuoane = cifTnd * ddRate;

  // Step 2: Taxe de Consommation
  let dcRate: number;
  if (effectiveRegime === 'fcr_famille') {
    dcRate = fuelType.toLowerCase().includes('electric') ||
             fuelType.toLowerCase().includes('hybrid_rechargeable')
      ? 0
      : TAX_RATES.dc_fcr_famille;
  } else {
    dcRate = getDCRate(engineCC, fuelType);
  }
  const taxeConsommation = (cifTnd + droitsDuoane) * dcRate;

  // Step 3: TVA
  const tvaRate = getTVARate(fuelType, effectiveRegime);
  const tva = (cifTnd + droitsDuoane + taxeConsommation) * tvaRate;

  // Step 4: TFD (Taxe de Formalité Douanière)
  const tfd = (droitsDuoane + taxeConsommation) * TAX_RATES.tfd_rate;

  // Total taxes
  let totalTaxes = droitsDuoane + taxeConsommation + tva + tfd;

  // FCR TRE special case: pay only 25% of taxes
  if (effectiveRegime === 'fcr_tre') {
    totalTaxes = totalTaxes * 0.25;
  }

  // Local fees
  const totalLocalFees =
    LOCAL_FEES.port_handling +
    LOCAL_FEES.transitaire +
    LOCAL_FEES.registration +
    LOCAL_FEES.inspection;

  // Final total
  const estimatedTotalTnd = cifTnd + totalTaxes + totalLocalFees;
  const taxBurdenPercent = (totalTaxes / cifTnd) * 100;

  return {
    // Car cost
    car_price_eur: Math.round(priceEur),
    car_price_tnd: Math.round(carPriceTnd),

    // Transport
    shipping_eur: Math.round(shippingEur),
    shipping_tnd: Math.round(shippingTnd),
    insurance_transit_eur: Math.round(insuranceTransitEur),
    insurance_transit_tnd: Math.round(insuranceTransitTnd),

    // CIF
    cif_eur: Math.round(cifEur),
    cif_tnd: Math.round(cifTnd),

    // Customs taxes
    droits_douane: Math.round(droitsDuoane),
    taxe_consommation: Math.round(taxeConsommation),
    tva: Math.round(tva),
    tfd: Math.round(tfd),
    total_taxes: Math.round(totalTaxes),

    // Local fees
    port_handling_tnd: LOCAL_FEES.port_handling,
    transitaire_tnd: LOCAL_FEES.transitaire,
    registration_tnd: LOCAL_FEES.registration,
    inspection_tnd: LOCAL_FEES.inspection,
    total_local_fees: totalLocalFees,

    // Final
    estimated_total_tnd: Math.round(estimatedTotalTnd),
    tax_burden_percent: Math.round(taxBurdenPercent),
  };
}

/**
 * Calculate estimated total TND for a car (simplified version for ranking)
 */
export function calculateEstimatedTotalTnd(
  car: CarListing,
  regime?: 'fcr_tre' | 'fcr_famille' | 'regime_commun'
): number {
  // Local Tunisian car - price is final
  if (car.country === 'TN' && car.price_tnd) {
    return car.price_tnd;
  }

  // Imported car - calculate full cost
  if (car.price_eur) {
    const breakdown = calculateDetailedCost(car, regime);
    return breakdown.estimated_total_tnd;
  }

  // Fallback to TND price if available
  return car.price_tnd || 0;
}
