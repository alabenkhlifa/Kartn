import {
  AutoScout24Row,
  AutomobileTnNewRow,
  AutomobileTnUsedRow,
  CarRecord,
  SourceConfig,
} from './types.ts';
import {
  extractYear,
  parseDecimalOrNull,
  parseIntOrNull,
} from './parser.ts';

// Brand name normalization map
const BRAND_NORMALIZATION: Record<string, string> = {
  vw: 'Volkswagen',
  volkswagen: 'Volkswagen',
  'mercedes-benz': 'Mercedes-Benz',
  mercedes: 'Mercedes-Benz',
  bmw: 'BMW',
  audi: 'Audi',
  peugeot: 'Peugeot',
  renault: 'Renault',
  citroen: 'Citroën',
  citroën: 'Citroën',
  fiat: 'Fiat',
  ford: 'Ford',
  opel: 'Opel',
  toyota: 'Toyota',
  honda: 'Honda',
  nissan: 'Nissan',
  hyundai: 'Hyundai',
  kia: 'Kia',
  skoda: 'Škoda',
  škoda: 'Škoda',
  seat: 'SEAT',
  volvo: 'Volvo',
  mazda: 'Mazda',
  suzuki: 'Suzuki',
  dacia: 'Dacia',
  jeep: 'Jeep',
  alfa: 'Alfa Romeo',
  'alfa romeo': 'Alfa Romeo',
  mini: 'MINI',
  porsche: 'Porsche',
  tesla: 'Tesla',
  cupra: 'Cupra',
};

// Fuel type normalization map
const FUEL_NORMALIZATION: Record<string, string> = {
  petrol: 'essence',
  gasoline: 'essence',
  essence: 'essence',
  benzin: 'essence',
  benzine: 'essence',
  diesel: 'diesel',
  gasoil: 'diesel',
  electric: 'electric',
  électrique: 'electric',
  elektro: 'electric',
  hybrid: 'hybrid',
  hybride: 'hybrid',
  'plug-in hybrid': 'hybrid_rechargeable',
  'hybrid rechargeable': 'hybrid_rechargeable',
  'hybride rechargeable': 'hybrid_rechargeable',
};

/**
 * Normalize brand name
 */
function normalizeBrand(brand: string): string {
  const lower = brand.toLowerCase().trim();
  return BRAND_NORMALIZATION[lower] || brand.trim();
}

/**
 * Normalize fuel type
 */
function normalizeFuelType(fuelType: string): string {
  const lower = fuelType.toLowerCase().trim();
  return FUEL_NORMALIZATION[lower] || fuelType.toLowerCase().trim();
}

/**
 * Generate unique ID for a car record
 */
function generateId(source: string, url: string): string {
  // Create a deterministic ID from source and URL
  const input = `${source}:${url}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${source}_${Math.abs(hash).toString(36)}`;
}

/**
 * Compute FCR eligibility based on Tunisian import regulations
 * FCR only applies to imported cars - local TN cars are NOT eligible
 *
 * FCR TRE (fcr-renouvelable.md):
 * - Age: ≤5 years
 * - Electric: always eligible
 * - PHEV (hybrid_rechargeable): always eligible (no cylinder limit per 2026 law)
 * - Hybrid HEV: essence ≤2000cc (follows petrol limits)
 * - Essence: ≤2000cc
 * - Diesel: ≤2500cc
 *
 * FCR Famille (une-voiture-famille.md):
 * - Age: ≤8 years
 * - Electric: always eligible
 * - PHEV: always eligible (no cylinder limit)
 * - Hybrid HEV: essence ≤1700cc (per ev-hybrid-laws.md)
 * - Essence: ≤1400cc
 * - Diesel: ≤1700cc
 */
function computeFcrEligibility(car: {
  year: number;
  fuel_type: string;
  engine_cc: number | null;
  country: string;
}): { fcr_tre_eligible: boolean; fcr_famille_eligible: boolean; age_years: number } {
  const currentYear = new Date().getFullYear();
  const age = currentYear - car.year;

  // FCR only for imports - TN local cars are NOT eligible
  if (car.country === 'TN') {
    return { fcr_tre_eligible: false, fcr_famille_eligible: false, age_years: age };
  }

  // FCR TRE: ≤5 years
  // - Electric: always eligible
  // - PHEV: always eligible (no cylinder limit per 2026 law)
  // - Hybrid HEV: essence ≤2000cc (follows petrol limits)
  // - Essence: ≤2000cc
  // - Diesel: ≤2500cc
  const fcrTre =
    car.fuel_type === 'electric' ||
    car.fuel_type === 'hybrid_rechargeable' ||
    (age <= 5 &&
      ((car.fuel_type === 'essence' && (car.engine_cc || 0) <= 2000) ||
        (car.fuel_type === 'diesel' && (car.engine_cc || 0) <= 2500) ||
        (car.fuel_type === 'hybrid' && (car.engine_cc || 0) <= 2000)));

  // FCR Famille (Article 55): ≤8 years
  // - Electric: always eligible
  // - PHEV: always eligible (no cylinder limit)
  // - Hybrid HEV: essence ≤1700cc (per ev-hybrid-laws.md)
  // - Essence: ≤1400cc
  // - Diesel: ≤1700cc
  const fcrFamille =
    car.fuel_type === 'electric' ||
    car.fuel_type === 'hybrid_rechargeable' ||
    (age <= 8 &&
      ((car.fuel_type === 'essence' && (car.engine_cc || 0) <= 1400) ||
        (car.fuel_type === 'diesel' && (car.engine_cc || 0) <= 1700) ||
        (car.fuel_type === 'hybrid' && (car.engine_cc || 0) <= 1700)));

  return { fcr_tre_eligible: fcrTre, fcr_famille_eligible: fcrFamille, age_years: age };
}

/**
 * Transform AutoScout24 row to unified CarRecord
 */
export function transformAutoScout24Row(
  row: AutoScout24Row,
  config: SourceConfig
): CarRecord | null {
  try {
    const brand = normalizeBrand(row.make);
    const model = row.model || 'Unknown';
    const variant = row.variant || null;
    const currentYear = new Date().getFullYear();

    // For new cars (first_registration is "new" or "True"), use current year
    const firstReg = row.first_registration?.toLowerCase();
    const isNewCar = firstReg === 'new' || firstReg === 'true';
    const year = parseIntOrNull(row.year) || extractYear(row.first_registration) || (isNewCar ? currentYear : null);

    if (!year) {
      console.warn(`Skipping row with invalid year: ${row.full_name}`);
      return null;
    }

    const fuelType = normalizeFuelType(row.fuel_type);
    const engineCc = parseIntOrNull(row.engine_cc);
    const cvDin = parseIntOrNull(row.power_hp);

    const fcr = computeFcrEligibility({ year, fuel_type: fuelType, engine_cc: engineCc, country: config.country });

    return {
      id: generateId(config.source, row.listing_url),
      source: config.source,
      url: row.listing_url,
      brand,
      model,
      variant,
      full_name: row.full_name,
      year,
      engine_cc: engineCc,
      fuel_type: fuelType,
      cv_fiscal: null,
      cv_din: cvDin,
      transmission: row.transmission?.toLowerCase() || null,
      body_type: row.body_type || null,
      mileage_km: parseIntOrNull(row.mileage_km),
      price_eur: parseDecimalOrNull(row.price_eur),
      price_tnd: null,
      country: config.country,
      seller_location: row.seller_location || null,
      seller_type: row.seller_type?.toLowerCase() || null,
      fcr_tre_eligible: fcr.fcr_tre_eligible,
      fcr_famille_eligible: fcr.fcr_famille_eligible,
      age_years: fcr.age_years,
      scraped_at: row.scraped_at || null,
      is_active: true,
    };
  } catch (error) {
    console.error('Error transforming AutoScout24 row:', error, row);
    return null;
  }
}

/**
 * Transform automobile.tn new car row to unified CarRecord
 */
export function transformAutomobileTnNewRow(
  row: AutomobileTnNewRow,
  config: SourceConfig
): CarRecord | null {
  try {
    const brand = normalizeBrand(row.brand);
    const currentYear = new Date().getFullYear();
    const fuelType = normalizeFuelType(row.fuel_type);
    const engineCc = parseIntOrNull(row.engine_cc);

    const fcr = computeFcrEligibility({
      year: currentYear,
      fuel_type: fuelType,
      engine_cc: engineCc,
      country: 'TN',
    });

    return {
      id: generateId(config.source, row.url),
      source: config.source,
      url: row.url,
      brand,
      model: row.model,
      variant: row.trim || null,
      full_name: row.full_name || `${brand} ${row.model} ${row.trim || ''}`.trim(),
      year: currentYear,
      engine_cc: engineCc,
      fuel_type: fuelType,
      cv_fiscal: parseIntOrNull(row.cv_fiscal),
      cv_din: parseIntOrNull(row.cv_din),
      transmission: row.transmission?.toLowerCase() || null,
      body_type: row.body_type || null,
      mileage_km: 0, // New car
      price_eur: null,
      price_tnd: parseDecimalOrNull(row.price_tnd),
      country: config.country,
      seller_location: null,
      seller_type: 'dealer',
      fcr_tre_eligible: fcr.fcr_tre_eligible,
      fcr_famille_eligible: fcr.fcr_famille_eligible,
      age_years: fcr.age_years,
      scraped_at: row.scraped_at || null,
      is_active: true,
    };
  } catch (error) {
    console.error('Error transforming automobile.tn new row:', error, row);
    return null;
  }
}

/**
 * Transform automobile.tn used car row to unified CarRecord
 */
export function transformAutomobileTnUsedRow(
  row: AutomobileTnUsedRow,
  config: SourceConfig
): CarRecord | null {
  try {
    const brand = normalizeBrand(row.brand);
    const model = row.model || 'Unknown';
    const year = parseIntOrNull(row.year);

    if (!year) {
      console.warn(`Skipping used car row with invalid year: ${row.full_name}`);
      return null;
    }

    const fuelType = normalizeFuelType(row.fuel_type);
    const engineCc = parseIntOrNull(row.cv_fiscal) ? null : null; // Used cars don't have engine_cc in CSV

    const fcr = computeFcrEligibility({ year, fuel_type: fuelType, engine_cc: engineCc, country: 'TN' });

    return {
      id: generateId(config.source, row.url),
      source: config.source,
      url: row.url,
      brand,
      model,
      variant: null,
      full_name: row.full_name,
      year,
      engine_cc: null,
      fuel_type: fuelType,
      cv_fiscal: parseIntOrNull(row.cv_fiscal),
      cv_din: parseIntOrNull(row.cv_din),
      transmission: row.transmission?.toLowerCase() || null,
      body_type: row.body_type || null,
      mileage_km: parseIntOrNull(row.mileage_km),
      price_eur: null,
      price_tnd: parseDecimalOrNull(row.price_tnd),
      country: config.country,
      seller_location: row.governorate || null,
      seller_type: 'private',
      fcr_tre_eligible: fcr.fcr_tre_eligible,
      fcr_famille_eligible: fcr.fcr_famille_eligible,
      age_years: fcr.age_years,
      scraped_at: row.scraped_at || null,
      is_active: true,
    };
  } catch (error) {
    console.error('Error transforming automobile.tn used row:', error, row);
    return null;
  }
}
