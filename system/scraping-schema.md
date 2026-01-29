# 🕷️ Car Scraping Schema - Knowledge Base

## Data Structure & Sources for Tunisia Car Import Chatbot

> **Last Updated:** January 29, 2026
> **Status:** P0 - Critical for Implementation
> **Purpose:** Define what data to scrape, from where, and how to structure it

---

## 📋 Table of Contents

1. [Data Sources Overview](#1-data-sources-overview)
2. [Scraping Criteria](#2-scraping-criteria)
3. [Unified Car Schema](#3-unified-car-schema)
4. [Source-Specific Schemas](#4-source-specific-schemas)
5. [Data Enrichment Rules](#5-data-enrichment-rules)
6. [FCR Compatibility Flags](#6-fcr-compatibility-flags)
7. [Update Frequency & Strategy](#7-update-frequency--strategy)
8. [Storage Schema (Database)](#8-storage-schema-database)
9. [API Endpoints Design](#9-api-endpoints-design)

---

## 1. Data Sources Overview

### Primary Sources

| Source | Countries | Purpose | Priority |
|--------|-----------|---------|----------|
| **autoscout24** | 🇩🇪 DE, 🇫🇷 FR, 🇮🇹 IT, 🇧🇪 BE | FCR imports (primary European source) | 🔴 Critical |
| **automobile.tn** | 🇹🇳 TN | New car prices (concessionnaires) | 🔴 Critical |
| **automobile.tn/occasion** | 🇹🇳 TN | Used car market (local) | 🔴 Critical |

### Secondary Sources (Reference Data)

| Source | Purpose |
|--------|---------|
| **BCT** (bct.gov.tn) | Exchange rates EUR/TND |
| **Douane** (douane.gov.tn) | Tax rates verification |
| **STEG** (steg.com.tn) | Electricity rates (EV cost calc) |
| **GlobalPetrolPrices** | Fuel prices |

---

## 2. Scraping Criteria

### AutoScout24 Scraping Configuration

```bash
--countries de,fr,it,be
--max-listings 500
--max-age 8
--max-price 100000
--fuel-types "petrol,diesel,electric,hybrid,plug-in hybrid"
```

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `countries` | de, fr, it, be | Primary EU markets for FCR imports |
| `max-listings` | 500 | Per scraping run, balanced coverage |
| `max-age` | 8 years | FCR Famille limit (most restrictive) |
| `max-price` | €100,000 | Covers luxury and EV segments |
| `fuel-types` | petrol, diesel, electric, hybrid, plug-in hybrid | All FCR-eligible fuel types |

### Filtering Rationale

- **Age ≤8 years**: Matches FCR Famille maximum age requirement
- **Price ≤€100K**: Extended to cover luxury EVs (no engine CC limit for electric)
- **Multi-country**: Single scraper handles DE/FR/IT/BE via autoscout24 regional sites

---

## 3. Unified Car Schema

### Core Fields (Required)

```yaml
CarListing:
  # Identification
  id: string                    # Unique ID (source_prefix + original_id)
  source: string                # "autoscout24" | "automobile_tn_new" | "automobile_tn_used"
  url: string                   # Direct link to listing

  # Basic Info
  brand: string                 # Normalized: "Volkswagen" not "VW"
  model: string                 # Normalized: "Golf" not "GOLF 7"
  variant: string               # "1.4 TSI Highline" (optional detail)
  full_name: string             # Complete listing title

  # Technical Specs (CRITICAL for FCR)
  year: integer                 # Manufacturing year (2020, 2021, etc.)
  engine_cc: integer            # Engine displacement in cm³ (1395, 1968, etc.)
  fuel_type: enum               # "essence" | "diesel" | "hybrid" | "hybrid_rechargeable" | "electric"
  cv_fiscal: integer            # Puissance fiscale (French tax horsepower)
  cv_din: integer               # Actual horsepower (ch/hp)
  transmission: enum            # "manual" | "automatic"
  body_type: enum               # "citadine" | "berline" | "break" | "suv" | "monospace" | "coupe" | "cabriolet" | "utilitaire"
  doors: integer                # 3, 4, 5
  seats: integer                # 2, 4, 5, 7, 9

  # Condition
  mileage_km: integer           # Kilometers driven
  condition: enum               # "new" | "used" | "demo"
  first_registration: date      # First registration date (more precise than year)

  # Pricing
  price_eur: decimal            # Price in EUR (European sources)
  price_tnd: decimal            # Price in TND (Tunisian sources or converted)

  # Location
  country: string               # "DE", "FR", "TN", "BE", "IT"
  seller_location: string       # City/region name

  # Seller Info
  seller_type: enum             # "dealer" | "private" | "concessionnaire"
  seller_name: string           # Dealer name or "Particulier"

  # Metadata
  scraped_at: datetime          # When we scraped this

  # Computed Fields
  age_years: integer            # Current year - manufacturing year
  price_per_km: decimal         # price / mileage_km (value indicator)
  fcr_eligible: object          # See section 6
```

### Field Mapping Between Sources

| Unified Field | AutoScout24 | Automobile.tn New | Automobile.tn Used |
|---------------|-------------|-------------------|---------------------|
| `brand` | `make` | `brand` | `brand` |
| `url` | `listing_url` | `url` | `url` |
| `cv_din` | `power_hp` | `cv_din` | `cv_din` |
| `engine_cc` | `engine_cc` | `engine_cc` | - |
| `price_eur` | `price_eur` | - | - |
| `price_tnd` | (converted) | `price_tnd` | `price_tnd` |

### Enum Definitions

```yaml
FuelType:
  - essence           # Petrol/Gasoline
  - diesel            # Diesel
  - hybrid            # Non-rechargeable hybrid (HEV)
  - hybrid_rechargeable  # Plug-in hybrid (PHEV)
  - electric          # 100% electric (BEV)

BodyType:
  - citadine          # City car (Polo, 208, Clio)
  - berline           # Sedan (Golf, 308, Corolla)
  - break             # Wagon/Estate
  - suv               # SUV/Crossover
  - monospace         # MPV/Minivan
  - coupe             # Coupe
  - cabriolet         # Convertible
  - utilitaire        # Commercial/Van
  - pickup            # Pickup truck

Transmission:
  - manual
  - automatic

Condition:
  - new               # Brand new (0 km)
  - used              # Used
```

---

## 4. Source-Specific Schemas

### 4.1 AutoScout24 (Multi-Country European Source)

```yaml
Source: autoscout24
Type: Pan-European car marketplace
Countries: DE, FR, IT, BE
URL Pattern: https://www.autoscout24.{country}/lst?...
Update Frequency: Daily (critical for FCR)

Fields Scraped:
  # Identification
  id: string                    # Unique listing ID
  listing_url: string           # Full URL to listing
  country: string               # DE, FR, IT, BE

  # Vehicle Info
  make: string                  # Brand name
  model: string                 # Model name
  variant: string               # Trim/variant
  full_name: string             # Complete vehicle name

  # Pricing
  price_eur: decimal            # Listed price in EUR
  price_original_eur: decimal   # Original price before discount
  vat_deductible: boolean       # VAT reclaimable (dealer listings)

  # Age & Condition
  year: integer                 # Model year
  first_registration: date      # First registration date
  mileage_km: integer           # Odometer reading
  previous_owners: integer      # Number of previous owners
  condition: string             # Vehicle condition

  # Engine & Performance
  fuel_type: string             # petrol, diesel, electric, hybrid, plug-in hybrid
  power_kw: integer             # Power in kilowatts
  power_hp: integer             # Power in horsepower
  engine_cc: integer            # Engine displacement
  emission_class: string        # Euro emission standard
  co2_emissions: integer        # g/km CO2
  consumption_combined: decimal # L/100km or kWh/100km

  # Transmission & Drivetrain
  transmission: string          # Manual, Automatic
  gears: integer                # Number of gears
  drivetrain: string            # FWD, RWD, AWD

  # Body
  body_type: string             # Sedan, SUV, Hatchback, etc.
  doors: integer                # Number of doors
  seats: integer                # Number of seats
  color_exterior: string        # Exterior color
  color_interior: string        # Interior color

  # Features
  features: array[string]       # General features list
  safety_features: array[string]
  comfort_features: array[string]

  # Seller Info
  seller_type: string           # Dealer or Private
  seller_name: string           # Seller/Dealer name
  seller_location: string       # City
  seller_country: string        # Country code

  # Media & Metadata
  image_count: integer          # Number of photos
  scraped_at: datetime          # Scraping timestamp

  # Computed Fields
  price_per_km: decimal         # price_eur / mileage_km
  age_years: integer            # Current year - year
```

### 4.2 Automobile.tn New Cars

```yaml
Source: automobile.tn
Type: Official concessionnaire prices
URL Pattern: https://www.automobile.tn/fr/neuf/{brand}/{model}
Update Frequency: Weekly (prices rarely change)

Fields Scraped:
  # Identification
  id: string                    # Unique ID
  brand: string                 # Brand name
  model: string                 # Model name
  trim: string                  # Trim level
  full_name: string             # Complete name
  url: string                   # Listing URL

  # Pricing
  price_tnd: decimal            # Listed price in TND
  price_original: decimal       # Original price before discount
  discount_tnd: decimal         # Discount amount
  has_discount: boolean         # Whether discounted

  # Engine & Performance
  engine_cc: integer            # Engine displacement
  cv_fiscal: integer            # Fiscal horsepower
  cv_din: integer               # DIN horsepower
  torque_nm: integer            # Torque in Nm
  top_speed_kmh: integer        # Top speed
  acceleration_0_100: decimal   # 0-100 km/h time

  # Fuel & Consumption
  fuel_type: string             # Type of fuel
  consumption_mixed: decimal    # Mixed cycle L/100km
  consumption_city: decimal     # City cycle
  consumption_highway: decimal  # Highway cycle
  co2_emissions: integer        # CO2 g/km
  fuel_tank_liters: integer     # Fuel tank capacity

  # Transmission
  transmission: string          # Manual, Automatic
  gearbox_speeds: integer       # Number of gears
  drivetrain: string            # FWD, RWD, 4WD

  # Dimensions
  length_mm: integer            # Length
  width_mm: integer             # Width
  height_mm: integer            # Height
  wheelbase_mm: integer         # Wheelbase
  trunk_liters: integer         # Trunk capacity
  weight_kg: integer            # Curb weight

  # Body
  body_type: string             # Body style
  doors: integer                # Number of doors
  seats: integer                # Number of seats
  warranty_years: integer       # Warranty period

  # Electric/Hybrid Specific
  is_electric: boolean          # Is BEV
  is_hybrid: boolean            # Is HEV/PHEV
  battery_kwh: decimal          # Battery capacity
  range_km: integer             # Electric range

  # Metadata
  is_new: boolean               # Always true for this source
  is_populaire: boolean         # Featured/popular model
  concessionnaire: string       # Dealer name
  scraped_at: datetime          # Scraping timestamp
```

### 4.3 Automobile.tn Used Cars (Occasion)

```yaml
Source: automobile.tn/occasion
Type: Classified listings (dealers + private)
URL Pattern: https://www.automobile.tn/fr/occasion/recherche?...
Update Frequency: Daily (high turnover)

Fields Scraped:
  # Identification
  id: string                    # Unique listing ID
  brand: string                 # Brand name
  model: string                 # Model name
  full_name: string             # Complete name
  url: string                   # Listing URL

  # Pricing & Value
  price_tnd: decimal            # Listed price
  price_evaluation: string      # Market evaluation (bon prix, etc.)

  # Age & Condition
  registration_date: date       # First registration
  year: integer                 # Model year
  mileage_km: integer           # Odometer reading
  ownership: string             # First hand, second hand
  condition: string             # Vehicle condition

  # Technical Specs
  cv_fiscal: integer            # Fiscal horsepower
  cv_din: integer               # DIN horsepower
  fuel_type: string             # Fuel type

  # Transmission & Body
  transmission: string          # Manual, Automatic
  drivetrain: string            # FWD, RWD, 4WD
  body_type: string             # Body style

  # Colors
  color_exterior: string        # Exterior color
  color_interior: string        # Interior color
  upholstery: string            # Upholstery material

  # Configuration
  doors: integer                # Number of doors
  seats: integer                # Number of seats

  # Equipment (Arrays)
  equipment_safety: array[string]     # Safety features
  equipment_interior: array[string]   # Interior features
  equipment_exterior: array[string]   # Exterior features
  equipment_functional: array[string] # Functional features

  # Seller Info
  governorate: string           # Tunisian governorate (location)
  seller_phone: string          # Contact phone
  listing_date: date            # When listed

  # Metadata
  scraped_at: datetime          # Scraping timestamp
```

---

## 5. Data Enrichment Rules

### 5.1 CV Fiscal Calculation

When `cv_fiscal` is not provided, calculate it:

```python
def calculate_cv_fiscal(engine_cc: int, cv_din: int) -> int:
    """
    French CV fiscal formula (approximate)
    Official: CV = (CO2/45) + (kW/40)^1.6
    Simplified when CO2 unknown:
    """
    kw = cv_din * 0.7355  # Convert hp to kW

    # Approximate CO2 from engine size
    if engine_cc <= 1000:
        co2_estimate = 100
    elif engine_cc <= 1400:
        co2_estimate = 120
    elif engine_cc <= 1600:
        co2_estimate = 140
    elif engine_cc <= 2000:
        co2_estimate = 160
    else:
        co2_estimate = 180 + (engine_cc - 2000) * 0.02

    cv = (co2_estimate / 45) + (kw / 40) ** 1.6
    return max(1, round(cv))
```

### 5.2 Price Conversion (EUR → TND)

```python
def convert_to_tnd(price_eur: float, rate: float = 3.40) -> float:
    """
    Convert EUR to TND
    Rate should be fetched from BCT daily
    Default: ~3.40 (Jan 2026)
    """
    return round(price_eur * rate, 2)
```

### 5.3 Age Calculation

```python
from datetime import date


def calculate_age(first_registration: date) -> int:
    """Calculate vehicle age in years"""
    today = date.today()
    age = today.year - first_registration.year

    # Adjust if registration anniversary hasn't passed
    if (today.month, today.day) < (first_registration.month, first_registration.day):
        age -= 1

    return age


def calculate_age_from_year(year: int) -> int:
    """Fallback when only year is known"""
    return date.today().year - year
```

### 5.4 Price Per Kilometer

```python
def calculate_price_per_km(price: float, mileage_km: int) -> float:
    """
    Calculate value indicator: price per kilometer driven
    Lower is better value for used cars
    """
    if mileage_km <= 0:
        return None
    return round(price / mileage_km, 4)
```

### 5.5 Body Type Normalization

```python
BODY_TYPE_MAPPING = {
    # German
    "limousine": "berline",
    "kleinwagen": "citadine",
    "kombi": "break",
    "suv/geländewagen": "suv",
    "van/minibus": "monospace",
    "cabrio/roadster": "cabriolet",
    "sportwagen/coupé": "coupe",

    # French
    "citadine": "citadine",
    "berline": "berline",
    "break": "break",
    "monospace": "monospace",
    "4x4, suv": "suv",
    "coupé": "coupe",
    "cabriolet": "cabriolet",

    # English (AutoScout24)
    "sedan": "berline",
    "hatchback": "citadine",
    "wagon": "break",
    "suv": "suv",
    "minivan": "monospace",
    "compact": "citadine",
    "station wagon": "break",
}


def normalize_body_type(raw: str) -> str:
    return BODY_TYPE_MAPPING.get(raw.lower().strip(), "berline")
```

### 5.6 Brand Normalization

```python
BRAND_MAPPING = {
    "vw": "Volkswagen",
    "volkswagen": "Volkswagen",
    "mercedes-benz": "Mercedes",
    "mercedes": "Mercedes",
    "bmw": "BMW",
    "alfa romeo": "Alfa Romeo",
    "land rover": "Land Rover",
    # ... etc
}


def normalize_brand(raw: str) -> str:
    return BRAND_MAPPING.get(raw.lower().strip(), raw.title())
```

### 5.7 Fuel Type Normalization

```python
FUEL_TYPE_MAPPING = {
    # AutoScout24 values
    "petrol": "essence",
    "diesel": "diesel",
    "electric": "electric",
    "hybrid": "hybrid",
    "plug-in hybrid": "hybrid_rechargeable",

    # French values
    "essence": "essence",
    "hybride": "hybrid",
    "hybride rechargeable": "hybrid_rechargeable",
    "électrique": "electric",
}


def normalize_fuel_type(raw: str) -> str:
    return FUEL_TYPE_MAPPING.get(raw.lower().strip(), raw.lower())
```

---

## 6. FCR Compatibility Flags

### Computed for Each Listing

```python
def calculate_fcr_eligibility(car: CarListing) -> dict:
    """
    Determine FCR eligibility for all regimes
    """
    age = car.age_years
    cc = car.engine_cc
    fuel = car.fuel_type

    result = {
        "fcr_tre_eligible": False,
        "fcr_tre_reason": "",
        "fcr_famille_eligible": False,
        "fcr_famille_reason": "",
        "une_voiture_eligible": False,
        "une_voiture_reason": "",
        "tax_regime": None,
    }

    # === FCR TRE (Expats) ===
    # Age limit: ≤5 years
    # Engine: Essence ≤2000cc, Diesel ≤2500cc

    if age > 5:
        result["fcr_tre_reason"] = f"Véhicule trop ancien ({age} ans > 5 ans max)"
    elif fuel == "essence" and cc > 2000:
        result["fcr_tre_reason"] = f"Cylindrée essence trop élevée ({cc}cc > 2000cc)"
    elif fuel == "diesel" and cc > 2500:
        result["fcr_tre_reason"] = f"Cylindrée diesel trop élevée ({cc}cc > 2500cc)"
    else:
        result["fcr_tre_eligible"] = True
        result["fcr_tre_reason"] = "Éligible FCR TRE"

    # === FCR Famille (Article 55) ===
    # Age limit: ≤8 years
    # Engine: Essence ≤1600cc, Diesel ≤1900cc
    # Electric/Hybrid: Always eligible

    if fuel in ["electric", "hybrid_rechargeable"]:
        result["fcr_famille_eligible"] = True
        result["fcr_famille_reason"] = "Véhicule électrique/hybride rechargeable - 0% DC"
        result["tax_regime"] = "fcr_famille_ev"
    elif age > 8:
        result["fcr_famille_reason"] = f"Véhicule trop ancien ({age} ans > 8 ans max)"
    elif fuel == "essence" and cc > 1600:
        result["fcr_famille_reason"] = f"Cylindrée essence trop élevée ({cc}cc > 1600cc)"
    elif fuel == "diesel" and cc > 1900:
        result["fcr_famille_reason"] = f"Cylindrée diesel trop élevée ({cc}cc > 1900cc)"
    else:
        result["fcr_famille_eligible"] = True
        result["fcr_famille_reason"] = "Éligible Une Voiture pour Chaque Famille"
        result["tax_regime"] = "fcr_famille_thermal"

    # === Une Voiture (same as FCR Famille for car requirements) ===
    result["une_voiture_eligible"] = result["fcr_famille_eligible"]
    result["une_voiture_reason"] = result["fcr_famille_reason"]

    return result
```

### Example Output

```json
{
  "car": "VW Golf 1.4 TSI 2022",
  "fcr_eligibility": {
    "fcr_tre_eligible": true,
    "fcr_tre_reason": "Éligible FCR TRE",
    "fcr_famille_eligible": true,
    "fcr_famille_reason": "Éligible Une Voiture pour Chaque Famille",
    "une_voiture_eligible": true,
    "tax_regime": "fcr_famille_thermal"
  }
}
```

---

## 7. Update Frequency & Strategy

### Scraping Schedule

| Source | Frequency | Reason | Volume/Run |
|--------|-----------|--------|------------|
| **autoscout24** (DE/FR/IT/BE) | Daily | Primary FCR source | ~500 listings |
| **automobile.tn (neuf)** | Weekly | Prices rarely change | ~500 models |
| **automobile.tn (occasion)** | Every 12 hours | Active local market | ~5,000 listings |
| **BCT Exchange Rate** | Daily | Currency conversion | 1 data point |

### Scraping Strategy

```python
class ScrapingOrchestrator:

    def daily_scrape(self):
        """Run daily at 2 AM Tunisia time"""

        # 1. Get fresh exchange rate
        rate = self.scrape_bct_exchange_rate()
        self.cache.set("eur_tnd_rate", rate)

        # 2. Scrape AutoScout24 (multi-country)
        listings = self.scrape_autoscout24(
            countries=["de", "fr", "it", "be"],
            max_listings=500,
            max_age=8,
            max_price=100000,
            fuel_types=["petrol", "diesel", "electric", "hybrid", "plug-in hybrid"]
        )

        # Enrich and store
        for listing in listings:
            listing = self.enrich_listing(listing, rate)
            self.db.upsert(listing)

        # 3. Scrape Tunisia sources
        self.scrape_automobile_tn_neuf()
        self.scrape_automobile_tn_occasion()

        # 4. Mark stale listings as inactive
        self.mark_stale_listings(hours=72)

    def weekly_new_cars(self):
        """Run weekly for new car prices"""
        self.scrape_automobile_tn_neuf()
```

### Deduplication Rules

```python
def is_duplicate(new_listing, existing_listings):
    """
    Detect duplicate listings across sources
    """
    for existing in existing_listings:
        # Same source = use source_id
        if new_listing.source == existing.source:
            return new_listing.id == existing.id

        # Cross-source = fuzzy match
        if (
                new_listing.brand == existing.brand and
                new_listing.model == existing.model and
                abs(new_listing.price_eur - existing.price_eur) < 500 and
                abs(new_listing.mileage_km - existing.mileage_km) < 1000 and
                new_listing.year == existing.year
        ):
            return True

    return False
```

---

## 8. Storage Schema (Database)

### PostgreSQL Schema

```sql
-- Main listings table
CREATE TABLE car_listings
(
    id                     VARCHAR(50) PRIMARY KEY,
    source                 VARCHAR(30)    NOT NULL, -- autoscout24, automobile_tn_new, automobile_tn_used
    url                    TEXT           NOT NULL,

    -- Basic info
    brand                  VARCHAR(50)    NOT NULL,
    model                  VARCHAR(100)   NOT NULL,
    variant                VARCHAR(200),
    full_name              TEXT,

    -- Technical specs
    year                   INTEGER        NOT NULL,
    engine_cc              INTEGER,
    fuel_type              VARCHAR(30)    NOT NULL,
    cv_fiscal              INTEGER,
    cv_din                 INTEGER,
    transmission           VARCHAR(20),
    body_type              VARCHAR(30),
    doors                  INTEGER,
    seats                  INTEGER,

    -- Condition
    mileage_km             INTEGER,
    condition              VARCHAR(20) DEFAULT 'used',
    first_registration     DATE,

    -- Pricing
    price_eur              DECIMAL(12, 2),
    price_tnd              DECIMAL(12, 2),

    -- Location
    country                VARCHAR(3)     NOT NULL,
    seller_location        VARCHAR(100),

    -- Seller
    seller_type            VARCHAR(20),
    seller_name            VARCHAR(200),

    -- FCR Eligibility (computed)
    fcr_tre_eligible       BOOLEAN     DEFAULT FALSE,
    fcr_famille_eligible   BOOLEAN     DEFAULT FALSE,

    -- Computed fields
    age_years              INTEGER,
    price_per_km           DECIMAL(10, 4),

    -- Estimated costs (computed)
    estimated_shipping_eur DECIMAL(10, 2),
    estimated_tax_tnd      DECIMAL(12, 2),
    estimated_total_tnd    DECIMAL(12, 2),

    -- Metadata
    scraped_at             TIMESTAMP   DEFAULT NOW(),
    updated_at             TIMESTAMP   DEFAULT NOW(),
    is_active              BOOLEAN     DEFAULT TRUE
);

-- Indexes for fast queries
CREATE INDEX idx_listings_brand ON car_listings (brand);
CREATE INDEX idx_listings_price_tnd ON car_listings (price_tnd);
CREATE INDEX idx_listings_price_eur ON car_listings (price_eur);
CREATE INDEX idx_listings_year ON car_listings (year);
CREATE INDEX idx_listings_fuel ON car_listings (fuel_type);
CREATE INDEX idx_listings_country ON car_listings (country);
CREATE INDEX idx_listings_fcr_tre ON car_listings (fcr_tre_eligible) WHERE fcr_tre_eligible = TRUE;
CREATE INDEX idx_listings_fcr_famille ON car_listings (fcr_famille_eligible) WHERE fcr_famille_eligible = TRUE;
CREATE INDEX idx_listings_active ON car_listings (is_active) WHERE is_active = TRUE;

-- Full-text search on full_name
CREATE INDEX idx_listings_fullname_fts ON car_listings USING gin (to_tsvector('french', full_name));

-- Exchange rates history
CREATE TABLE exchange_rates
(
    id            SERIAL PRIMARY KEY,
    currency_pair VARCHAR(10)    NOT NULL, -- EUR_TND
    rate          DECIMAL(10, 4) NOT NULL,
    source        VARCHAR(50),
    fetched_at    TIMESTAMP DEFAULT NOW()
);

-- Scraping logs
CREATE TABLE scraping_logs
(
    id               SERIAL PRIMARY KEY,
    source           VARCHAR(30) NOT NULL,
    started_at       TIMESTAMP   NOT NULL,
    completed_at     TIMESTAMP,
    listings_found   INTEGER,
    listings_new     INTEGER,
    listings_updated INTEGER,
    errors           TEXT[],
    status           VARCHAR(20) -- 'success', 'partial', 'failed'
);
```

---

## 9. API Endpoints Design

### REST API for Chatbot

```yaml
# Search cars
GET /api/cars/search
Parameters:
  - budget_tnd: integer (max total cost including taxes)
  - regime: "fcr_tre" | "fcr_famille" | "regular"
  - fuel_type: "essence" | "diesel" | "hybrid" | "electric"
  - body_type: "citadine" | "berline" | "suv" | ...
  - brand: string (optional)
  - year_min: integer
  - year_max: integer
  - mileage_max: integer
  - source: "europe" | "tunisia" | "all"
  - country: "DE" | "FR" | "IT" | "BE" | "TN"
  - sort_by: "price_asc" | "price_desc" | "year_desc" | "mileage_asc"
  - page: integer
  - limit: integer (default 20, max 100)

Response:
  {
    "total": 1234,
    "page": 1,
    "limit": 20,
    "cars": [
      {
        "id": "autoscout24_12345",
        "brand": "Volkswagen",
        "model": "Golf",
        "variant": "1.4 TSI",
        "year": 2022,
        "price_eur": 18500,
        "price_tnd": 62900,
        "estimated_total_tnd": 78500,
        "fcr_tre_eligible": true,
        "fcr_famille_eligible": true,
        "country": "DE",
        "url": "https://...",
        ...
      }
    ]
  }

# Get single car details
GET /api/cars/{id}
Response:
  {
    "car": { ... full listing ... },
    "cost_breakdown": {
      "cif_eur": 19500,
      "cif_tnd": 66300,
      "shipping_estimate_eur": 1000,
      "fcr_tre": {
        "tax_tnd": 16575,
        "total_tnd": 82875
      },
      "fcr_famille": {
        "tax_tnd": 11000,
        "total_tnd": 77300
      },
      "regular": {
        "tax_tnd": 95000,
        "total_tnd": 161300
      }
    },
    "similar_cars": [ ... ]
  }

# Get price statistics
GET /api/stats/prices
Parameters:
  - brand: string
  - model: string
  - year: integer
Response:
  {
    "brand": "Volkswagen",
    "model": "Golf",
    "year": 2022,
    "stats": {
      "min_eur": 15000,
      "max_eur": 28000,
      "avg_eur": 19500,
      "median_eur": 18500,
      "count": 847
    }
  }

# Get exchange rate
GET /api/rates/eur-tnd
Response:
  {
    "rate": 3.40,
    "source": "BCT",
    "updated_at": "2026-01-29T08:00:00Z"
  }
```

---

## 10. Sample Queries for Chatbot

### "I have 80,000 TND, I'm TRE, what can I get?"

```sql
SELECT *
FROM car_listings
WHERE is_active = TRUE
  AND fcr_tre_eligible = TRUE
  AND estimated_total_tnd <= 80000
  AND source = 'autoscout24'
ORDER BY estimated_total_tnd DESC,
         year DESC,
         mileage_km ASC
LIMIT 20;
```

### "Show me electric SUVs for FCR Famille"

```sql
SELECT *
FROM car_listings
WHERE is_active = TRUE
  AND fcr_famille_eligible = TRUE
  AND fuel_type = 'electric'
  AND body_type = 'suv'
ORDER BY price_tnd ASC
LIMIT 20;
```

### "Compare Golf prices in Germany vs Tunisia"

```sql
-- Germany (for import)
SELECT 'Germany (Import)' as market,
       AVG(price_eur)     as avg_price_eur,
       MIN(price_eur)     as min_price_eur,
       COUNT(*)           as listings
FROM car_listings
WHERE brand = 'Volkswagen'
  AND model = 'Golf'
  AND country = 'DE'
  AND year >= 2022

UNION ALL

-- Tunisia local market
SELECT 'Tunisia (Local)' as market,
       AVG(price_tnd)    as avg_price_tnd,
       MIN(price_tnd)    as min_price_tnd,
       COUNT(*)          as listings
FROM car_listings
WHERE brand = 'Volkswagen'
  AND model = 'Golf'
  AND country = 'TN'
  AND year >= 2022;
```

---

## 📝 Change Log

| Date | Change |
|------|--------|
| 2026-01-26 | Initial scraping schema KB created |
| 2026-01-29 | **Major update: Aligned schema with actual implementation** |
| | - Removed mobile.de, leboncoin references (not implemented) |
| | - AutoScout24 is now the primary/only European source |
| | - Added multi-country support (DE, FR, IT, BE) |
| | - Updated field schemas to match actual CSV exports |
| | - Added scraping criteria configuration section |
| | - Added price_per_km and age_years computed fields |
| | - Updated field mappings between sources |

---

*This document defines the data foundation for the car recommendation chatbot. The scraper implementation should follow these schemas exactly to ensure compatibility with the recommendation engine.*
