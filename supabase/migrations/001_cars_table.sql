-- Cars table for storing vehicle data from multiple sources
CREATE TABLE cars (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,              -- 'autoscout24' | 'automobile_tn_new' | 'automobile_tn_used'
  url TEXT NOT NULL,

  -- Basic info
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  full_name TEXT,

  -- Technical specs
  year INTEGER NOT NULL,
  engine_cc INTEGER,
  fuel_type TEXT NOT NULL,
  cv_fiscal INTEGER,
  cv_din INTEGER,
  transmission TEXT,
  body_type TEXT,

  -- Condition
  mileage_km INTEGER,

  -- Pricing
  price_eur DECIMAL(12,2),
  price_tnd DECIMAL(12,2),

  -- Location
  country TEXT NOT NULL,             -- 'DE', 'FR', 'IT', 'BE', 'TN'
  seller_location TEXT,
  seller_type TEXT,

  -- FCR Eligibility (computed on insert)
  fcr_tre_eligible BOOLEAN DEFAULT FALSE,
  fcr_famille_eligible BOOLEAN DEFAULT FALSE,
  age_years INTEGER,

  -- Metadata
  scraped_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  UNIQUE(source, url)
);

-- Indexes for common query patterns
CREATE INDEX idx_cars_country ON cars(country);
CREATE INDEX idx_cars_price_tnd ON cars(price_tnd);
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_cars_fcr_tre ON cars(fcr_tre_eligible) WHERE fcr_tre_eligible = TRUE;
CREATE INDEX idx_cars_fcr_famille ON cars(fcr_famille_eligible) WHERE fcr_famille_eligible = TRUE;
CREATE INDEX idx_cars_active ON cars(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_fuel_type ON cars(fuel_type);
