import { EXCHANGE_RATE, FCR_LIMITS, TAX_RATES } from './config.ts';
import {
  CalculationParams,
  FCRComparison,
  TaxBreakdown,
} from './types.ts';

/**
 * Convert EUR to TND with buffer
 */
export function eurToTnd(amountEur: number): number {
  return amountEur * EXCHANGE_RATE.effective_rate;
}

/**
 * Get Droits de Douane rate based on origin
 */
function getDDRate(origin: string): number {
  switch (origin) {
    case 'eu':
      return TAX_RATES.dd.eu;
    case 'turkey':
      return TAX_RATES.dd.turkey;
    default:
      return TAX_RATES.dd.other;
  }
}

/**
 * Get Taxe de Consommation rate based on engine size and fuel type
 */
function getDCRate(
  engineCC: number,
  fuelType: string,
  vehicleType: string
): number {
  // Special cases
  if (fuelType === 'electric' || fuelType === 'hybrid_rechargeable') {
    return 0;
  }

  if (vehicleType === '4x4') {
    return TAX_RATES.dc_4x4;
  }

  // Get rate table based on fuel type
  const rateTable =
    fuelType === 'diesel' ? TAX_RATES.dc_diesel : TAX_RATES.dc_essence;

  // Find applicable rate
  const thresholds = Object.keys(rateTable)
    .filter((k) => k !== 'max')
    .map(Number)
    .sort((a, b) => a - b);

  for (const threshold of thresholds) {
    if (engineCC <= threshold) {
      return rateTable[threshold as keyof typeof rateTable] as number;
    }
  }

  return rateTable.max;
}

/**
 * Get TVA rate
 */
function getTVARate(fuelType: string, regime: string): number {
  if (
    fuelType === 'electric' ||
    fuelType === 'hybrid_rechargeable' ||
    regime === 'fcr_famille'
  ) {
    return TAX_RATES.tva_reduced;
  }
  return TAX_RATES.tva_standard;
}

/**
 * Calculate import taxes for a vehicle
 */
export function calculateTax(params: CalculationParams): TaxBreakdown {
  // Default values
  const origin = params.origin || 'eu';
  const fuelType = params.fuel_type || 'essence';
  const vehicleType = params.vehicle_type || 'standard';
  const regime = params.regime || 'regime_commun';
  const engineCC = params.engine_cc || 1400;

  // Calculate CIF (Cost + Insurance + Freight)
  // Assume ~3000 EUR for shipping/insurance if only vehicle price given
  let cif: number;
  if (params.price_tnd) {
    cif = params.price_tnd;
  } else if (params.price_eur) {
    cif = eurToTnd(params.price_eur + 3000); // Add shipping estimate
  } else {
    throw new Error('Price required for calculation');
  }

  // Step 1: Droits de Douane
  const ddRate = getDDRate(origin);
  const droitsDuoane = cif * ddRate;

  // Step 2: Taxe de Consommation
  let dcRate: number;
  if (regime === 'fcr_famille') {
    dcRate = fuelType === 'electric' || fuelType === 'hybrid_rechargeable'
      ? 0
      : TAX_RATES.dc_fcr_famille;
  } else {
    dcRate = getDCRate(engineCC, fuelType, vehicleType);
  }
  const taxeConsommation = (cif + droitsDuoane) * dcRate;

  // Step 3: TVA
  const tvaRate = getTVARate(fuelType, regime);
  const tva = (cif + droitsDuoane + taxeConsommation) * tvaRate;

  // Step 4: TFD (Taxe de Formalité Douanière)
  const tfd = (droitsDuoane + taxeConsommation) * TAX_RATES.tfd_rate;

  // Total
  const totalTaxes = droitsDuoane + taxeConsommation + tva + tfd;
  let finalPrice = cif + totalTaxes;

  // FCR TRE special case: pay only 25% of taxes
  if (regime === 'fcr_tre') {
    finalPrice = cif + totalTaxes * 0.25;
  }

  const taxBurdenPercent = (totalTaxes / cif) * 100;

  return {
    cif: Math.round(cif),
    droits_douane: Math.round(droitsDuoane),
    taxe_consommation: Math.round(taxeConsommation),
    tva: Math.round(tva),
    tfd: Math.round(tfd),
    total_taxes: Math.round(totalTaxes),
    final_price: Math.round(finalPrice),
    tax_burden_percent: Math.round(taxBurdenPercent),
  };
}

/**
 * Check FCR eligibility
 */
function checkFCREligibility(
  engineCC: number,
  fuelType: string,
  ageYears: number
): { tre: boolean; famille: boolean } {
  const isEssence = fuelType === 'essence' || fuelType === 'hybrid_non_rechargeable';
  const isDiesel = fuelType === 'diesel';
  const isElectric = fuelType === 'electric' || fuelType === 'hybrid_rechargeable';

  // FCR TRE eligibility
  let treEligible = false;
  if (isElectric) {
    treEligible = ageYears <= FCR_LIMITS.tre.max_age_years;
  } else if (isEssence) {
    treEligible =
      engineCC <= FCR_LIMITS.tre.essence_max_cc &&
      ageYears <= FCR_LIMITS.tre.max_age_years;
  } else if (isDiesel) {
    treEligible =
      engineCC <= FCR_LIMITS.tre.diesel_max_cc &&
      ageYears <= FCR_LIMITS.tre.max_age_years;
  }

  // FCR Famille eligibility
  let familleEligible = false;
  if (isElectric) {
    familleEligible = ageYears <= FCR_LIMITS.famille.max_age_years;
  } else if (isEssence) {
    familleEligible =
      engineCC <= FCR_LIMITS.famille.essence_max_cc &&
      ageYears <= FCR_LIMITS.famille.max_age_years;
  } else if (isDiesel) {
    familleEligible =
      engineCC <= FCR_LIMITS.famille.diesel_max_cc &&
      ageYears <= FCR_LIMITS.famille.max_age_years;
  }

  return { tre: treEligible, famille: familleEligible };
}

/**
 * Compare all FCR regimes for a vehicle
 */
export function compareFCRRegimes(params: CalculationParams): FCRComparison {
  const ageYears = 3; // Assume 3 years if not specified
  const engineCC = params.engine_cc || 1400;
  const fuelType = params.fuel_type || 'essence';

  const eligibility = checkFCREligibility(engineCC, fuelType, ageYears);

  // Calculate for each regime
  const regimeCommun = calculateTax({ ...params, regime: 'regime_commun' });

  const comparison: FCRComparison = {
    regime_commun: regimeCommun,
    recommended: 'regime_commun',
    savings: 0,
  };

  if (eligibility.tre) {
    comparison.fcr_tre = calculateTax({ ...params, regime: 'fcr_tre' });
  }

  if (eligibility.famille) {
    comparison.fcr_famille = calculateTax({ ...params, regime: 'fcr_famille' });
  }

  // Determine recommended regime
  let minPrice = regimeCommun.final_price;
  let recommended = 'regime_commun';

  if (comparison.fcr_tre && comparison.fcr_tre.final_price < minPrice) {
    minPrice = comparison.fcr_tre.final_price;
    recommended = 'fcr_tre';
  }

  if (comparison.fcr_famille && comparison.fcr_famille.final_price < minPrice) {
    minPrice = comparison.fcr_famille.final_price;
    recommended = 'fcr_famille';
  }

  comparison.recommended = recommended;
  comparison.savings = regimeCommun.final_price - minPrice;

  return comparison;
}

/**
 * Format tax breakdown as text for LLM context
 */
export function formatTaxBreakdown(breakdown: TaxBreakdown): string {
  return `
Calcul des taxes d'importation:
- Valeur CIF: ${breakdown.cif.toLocaleString()} TND
- Droits de Douane: ${breakdown.droits_douane.toLocaleString()} TND
- Taxe de Consommation: ${breakdown.taxe_consommation.toLocaleString()} TND
- TVA: ${breakdown.tva.toLocaleString()} TND
- TFD: ${breakdown.tfd.toLocaleString()} TND
- Total taxes: ${breakdown.total_taxes.toLocaleString()} TND
- **Prix final: ${breakdown.final_price.toLocaleString()} TND**
- Charge fiscale: ${breakdown.tax_burden_percent}% du CIF
`.trim();
}

/**
 * Format FCR comparison as text for LLM context
 */
export function formatFCRComparison(comparison: FCRComparison): string {
  let text = `Comparaison des régimes:\n\n`;

  text += `**Régime Commun**: ${comparison.regime_commun.final_price.toLocaleString()} TND\n`;

  if (comparison.fcr_tre) {
    text += `**FCR TRE**: ${comparison.fcr_tre.final_price.toLocaleString()} TND\n`;
  } else {
    text += `FCR TRE: Non éligible (cylindrée ou âge hors limites)\n`;
  }

  if (comparison.fcr_famille) {
    text += `**FCR Famille (Art.55)**: ${comparison.fcr_famille.final_price.toLocaleString()} TND\n`;
  } else {
    text += `FCR Famille: Non éligible (cylindrée ou âge hors limites)\n`;
  }

  text += `\n**Recommandation**: ${comparison.recommended}`;
  if (comparison.savings > 0) {
    text += ` (économie de ${comparison.savings.toLocaleString()} TND)`;
  }

  return text;
}
