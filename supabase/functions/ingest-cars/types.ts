// Raw CSV row from AutoScout24 files
export interface AutoScout24Row {
  listing_url: string;
  make: string;
  model: string;
  variant: string;
  full_name: string;
  price_eur: string;
  mileage_km: string;
  year: string;
  first_registration: string;
  fuel_type: string;
  power_kw: string;
  power_hp: string;
  engine_cc: string;
  transmission: string;
  body_type: string;
  seller_type: string;
  seller_location: string;
  country: string;
  scraped_at: string;
}

// Raw CSV row from automobile.tn new cars
export interface AutomobileTnNewRow {
  brand: string;
  model: string;
  trim: string;
  full_name: string;
  price_tnd: string;
  engine_cc: string;
  cv_fiscal: string;
  cv_din: string;
  fuel_type: string;
  transmission: string;
  body_type: string;
  url: string;
  scraped_at: string;
}

// Raw CSV row from automobile.tn used cars
export interface AutomobileTnUsedRow {
  brand: string;
  model: string;
  full_name: string;
  url: string;
  price_tnd: string;
  year: string;
  mileage_km: string;
  cv_fiscal: string;
  cv_din: string;
  fuel_type: string;
  transmission: string;
  body_type: string;
  governorate: string;
  scraped_at: string;
}

// Unified car record for database
export interface CarRecord {
  id: string;
  source: 'autoscout24' | 'automobile_tn_new' | 'automobile_tn_used';
  url: string;
  brand: string;
  model: string;
  variant: string | null;
  full_name: string | null;
  year: number;
  engine_cc: number | null;
  fuel_type: string;
  cv_fiscal: number | null;
  cv_din: number | null;
  transmission: string | null;
  body_type: string | null;
  mileage_km: number | null;
  price_eur: number | null;
  price_tnd: number | null;
  country: string;
  seller_location: string | null;
  seller_type: string | null;
  fcr_tre_eligible: boolean;
  fcr_famille_eligible: boolean;
  age_years: number;
  scraped_at: string | null;
  is_active: boolean;
}

// Source configuration
export type SourceKey =
  | 'autoscout24_de'
  | 'autoscout24_fr'
  | 'autoscout24_it'
  | 'autoscout24_be'
  | 'automobile_tn_new'
  | 'automobile_tn_used';

export interface SourceConfig {
  key: SourceKey;
  filename: string;
  country: string;
  source: CarRecord['source'];
}

// Ingestion request/response
export interface IngestRequest {
  sources?: SourceKey[] | 'all';
}

export interface SourceResult {
  inserted: number;
  updated: number;
  errors: number;
}

export interface IngestResponse {
  success: boolean;
  results: Record<SourceKey, SourceResult>;
  totalProcessed: number;
  totalErrors: number;
}
