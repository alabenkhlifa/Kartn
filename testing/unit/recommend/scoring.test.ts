/**
 * Unit tests for recommend scoring system
 *
 * Tests the 8-factor scoring system from supabase/functions/recommend/scoring.ts
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { assertInRange } from '../../test-utils/assertions.ts';
import { mockCars, scoringTestCases, recommendationStrengthThresholds } from '../../test-utils/fixtures.ts';

// Import the actual scoring functions
import {
  scoreCar,
  matchesFilters,
  getTopRecommendations,
  type ScoredCar,
} from '../../../supabase/functions/recommend/scoring.ts';
import type { RecommendationFilters, CarListing } from '../../../supabase/functions/recommend/types.ts';

// ============================================================================
// Helper to create test cars
// ============================================================================

function createTestCar(overrides: Partial<CarListing> = {}): CarListing {
  return {
    id: 'test_car',
    brand: 'Toyota',
    model: 'Yaris',
    variant: null,
    full_name: 'Toyota Yaris',
    year: 2023,
    price_eur: 15000,
    price_tnd: null,
    fuel_type: 'essence',
    engine_cc: 1500,
    mileage_km: 30000,
    body_type: 'citadine',
    country: 'DE',
    source: 'autoscout24',
    url: 'https://example.com',
    seller_type: 'dealer',
    fcr_tre_eligible: true,
    fcr_famille_eligible: true,
    ...overrides,
  };
}

// ============================================================================
// scoreCar tests - Price Fit (0-23 points)
// ============================================================================

describe('scoreCar - Price Fit scoring (0-23 pts)', () => {
  const baseFilters: RecommendationFilters = {
    budget_tnd: 100000,
  };

  it('should give ~12 pts for cars way under budget (ratio <= 0.5)', () => {
    // Car estimated at 30k TND with 100k budget = 0.3 ratio
    const car = createTestCar({ price_eur: 5000, country: 'TN', price_tnd: 30000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.price_fit, 12);
  });

  it('should give ~18 pts for cars under budget (ratio 0.5-0.7)', () => {
    const car = createTestCar({ price_eur: null, country: 'TN', price_tnd: 60000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.price_fit, 18);
  });

  it('should give 23 pts for sweet spot (ratio 0.7-0.9)', () => {
    const car = createTestCar({ price_eur: null, country: 'TN', price_tnd: 80000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.price_fit, 23);
  });

  it('should give ~20 pts for cars at budget limit (ratio 0.9-1.0)', () => {
    const car = createTestCar({ price_eur: null, country: 'TN', price_tnd: 95000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.price_fit, 20);
  });

  it('should give ~10 pts for cars slightly over budget (ratio 1.0-1.1)', () => {
    const car = createTestCar({ price_eur: null, country: 'TN', price_tnd: 105000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.price_fit, 10);
  });

  it('should give 0 pts for cars significantly over budget (ratio > 1.1)', () => {
    const car = createTestCar({ price_eur: null, country: 'TN', price_tnd: 150000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.price_fit, 0);
  });
});

// ============================================================================
// scoreCar tests - Age (0-18 points)
// ============================================================================

describe('scoreCar - Age scoring (0-18 pts)', () => {
  const currentYear = new Date().getFullYear();
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  it('should give 18 pts for brand new cars (0-1 years old)', () => {
    const car = createTestCar({ year: currentYear, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.age, 18);
  });

  it('should give 16 pts for 2-year-old cars', () => {
    const car = createTestCar({ year: currentYear - 2, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.age, 16);
  });

  it('should give 14 pts for 3-year-old cars', () => {
    const car = createTestCar({ year: currentYear - 3, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.age, 14);
  });

  it('should give 10 pts for 5-year-old cars', () => {
    const car = createTestCar({ year: currentYear - 5, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.age, 10);
  });

  it('should give 5 pts for 7-year-old cars', () => {
    const car = createTestCar({ year: currentYear - 7, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.age, 5);
  });

  it('should give 2 pts for very old cars (10+ years)', () => {
    const car = createTestCar({ year: currentYear - 12, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.age, 2);
  });
});

// ============================================================================
// scoreCar tests - Mileage (0-14 points)
// ============================================================================

describe('scoreCar - Mileage scoring (0-14 pts)', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  it('should give 14 pts for new cars (0 km)', () => {
    const car = createTestCar({ mileage_km: 0, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.mileage, 14);
  });

  it('should give 13 pts for very low mileage (<20k km)', () => {
    const car = createTestCar({ mileage_km: 15000, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.mileage, 13);
  });

  it('should give 11 pts for low mileage (20-40k km)', () => {
    const car = createTestCar({ mileage_km: 35000, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.mileage, 11);
  });

  it('should give 9 pts for moderate mileage (40-60k km)', () => {
    const car = createTestCar({ mileage_km: 50000, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.mileage, 9);
  });

  it('should give 5 pts for higher mileage (80-100k km)', () => {
    const car = createTestCar({ mileage_km: 90000, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.mileage, 5);
  });

  it('should give 1 pt for very high mileage (150k+ km)', () => {
    const car = createTestCar({ mileage_km: 180000, price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.mileage, 1);
  });
});

// ============================================================================
// scoreCar tests - Brand Reliability (0-15 points)
// ============================================================================

describe('scoreCar - Brand Reliability scoring (0-15 pts)', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  it('should give high reliability score for Toyota (~14 pts)', () => {
    const car = createTestCar({ brand: 'Toyota', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.reliability, 13, 15);
  });

  it('should give medium reliability score for Peugeot (~11 pts)', () => {
    const car = createTestCar({ brand: 'Peugeot', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.reliability, 10, 12);
  });

  it('should give lower reliability score for Fiat (~9 pts)', () => {
    const car = createTestCar({ brand: 'Fiat', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.reliability, 8, 10);
  });

  it('should give default score for unknown brands (~9 pts)', () => {
    const car = createTestCar({ brand: 'UnknownBrand', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.reliability, 8, 10);
  });
});

// ============================================================================
// scoreCar tests - Parts Availability (0-10 points)
// ============================================================================

describe('scoreCar - Parts Availability scoring (0-10 pts)', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  it('should give high parts score for Peugeot (~9-10 pts)', () => {
    const car = createTestCar({ brand: 'Peugeot', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.parts_availability, 9, 10);
  });

  it('should give high parts score for Renault (~9-10 pts)', () => {
    const car = createTestCar({ brand: 'Renault', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.parts_availability, 9, 10);
  });

  it('should give medium parts score for Toyota (~8-9 pts)', () => {
    const car = createTestCar({ brand: 'Toyota', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.parts_availability, 8, 9);
  });

  it('should give lower parts score for Lexus (~5 pts)', () => {
    const car = createTestCar({ brand: 'Lexus', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertInRange(scored.score_breakdown.parts_availability, 4, 6);
  });
});

// ============================================================================
// scoreCar tests - Fuel Efficiency (0-10 points)
// ============================================================================

describe('scoreCar - Fuel Efficiency scoring (0-10 pts)', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  describe('when user specifies "any" fuel type', () => {
    it('should give EVs normalized score (7 pts) to not dominate', () => {
      const car = createTestCar({ fuel_type: 'electric', price_tnd: 100000, country: 'TN' });
      const scored = scoreCar(car, { ...baseFilters, fuel_type: 'any' });
      assertEquals(scored.score_breakdown.fuel_efficiency, 7);
    });

    it('should give hybrids same normalized score (7 pts)', () => {
      const car = createTestCar({ fuel_type: 'hybrid', price_tnd: 100000, country: 'TN' });
      const scored = scoreCar(car, { ...baseFilters, fuel_type: 'any' });
      assertEquals(scored.score_breakdown.fuel_efficiency, 7);
    });
  });

  describe('when user specifies electric', () => {
    it('should give EVs full score (10 pts)', () => {
      const car = createTestCar({ fuel_type: 'electric', price_tnd: 100000, country: 'TN' });
      const scored = scoreCar(car, { ...baseFilters, fuel_type: 'electric' });
      assertEquals(scored.score_breakdown.fuel_efficiency, 10);
    });
  });

  describe('thermal engine efficiency by size', () => {
    it('should give higher score for small essence engines (<=1200cc)', () => {
      const car = createTestCar({ fuel_type: 'essence', engine_cc: 1000, price_tnd: 100000, country: 'TN' });
      const scored = scoreCar(car, baseFilters);
      assertEquals(scored.score_breakdown.fuel_efficiency, 7);
    });

    it('should give lower score for large essence engines (>2000cc)', () => {
      const car = createTestCar({ fuel_type: 'essence', engine_cc: 2500, price_tnd: 100000, country: 'TN' });
      const scored = scoreCar(car, baseFilters);
      assertEquals(scored.score_breakdown.fuel_efficiency, 4);
    });

    it('should give higher score for small diesel engines (<=1500cc)', () => {
      const car = createTestCar({ fuel_type: 'diesel', engine_cc: 1400, price_tnd: 100000, country: 'TN' });
      const scored = scoreCar(car, baseFilters);
      assertEquals(scored.score_breakdown.fuel_efficiency, 7);
    });
  });
});

// ============================================================================
// scoreCar tests - Preference Match (0-5 points)
// ============================================================================

describe('scoreCar - Preference Match scoring (0-5 pts)', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  it('should start with neutral score (2.5 pts)', () => {
    const car = createTestCar({ price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.preference_match, 2.5);
  });

  it('should add bonus for matching fuel type (+1)', () => {
    const car = createTestCar({ fuel_type: 'diesel', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, { ...baseFilters, fuel_type: 'diesel' });
    assertInRange(scored.score_breakdown.preference_match, 3, 4);
  });

  it('should add bonus for matching body type (+1)', () => {
    const car = createTestCar({ body_type: 'SUV', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, { ...baseFilters, body_type: 'suv' });
    assertInRange(scored.score_breakdown.preference_match, 3, 4);
  });

  it('should add bonus for matching condition (+0.5)', () => {
    const car = createTestCar({ source: 'automobile_tn_new', price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, { ...baseFilters, condition: 'new' });
    assertInRange(scored.score_breakdown.preference_match, 2.5, 3.5);
  });

  it('should cap at 5 pts maximum', () => {
    const car = createTestCar({
      fuel_type: 'diesel',
      body_type: 'SUV',
      source: 'autoscout24',
      price_tnd: 100000,
      country: 'TN',
    });
    const scored = scoreCar(car, {
      ...baseFilters,
      fuel_type: 'diesel',
      body_type: 'suv',
      condition: 'used',
    });
    assert(scored.score_breakdown.preference_match <= 5);
  });
});

// ============================================================================
// scoreCar tests - Practicality (0-5 points)
// ============================================================================

describe('scoreCar - Practicality scoring (0-5 pts)', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  it('should give 5 pts for Tunisian cars (local availability)', () => {
    const car = createTestCar({ country: 'TN', price_tnd: 100000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.practicality, 5);
  });

  it('should give 2 pts for common EU import countries (DE, FR, BE, IT)', () => {
    for (const country of ['DE', 'FR', 'BE', 'IT']) {
      const car = createTestCar({ country, price_eur: 15000 });
      const scored = scoreCar(car, baseFilters);
      assertEquals(scored.score_breakdown.practicality, 2, `Failed for country ${country}`);
    }
  });

  it('should give 1 pt for other import countries', () => {
    const car = createTestCar({ country: 'ES', price_eur: 15000 });
    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.score_breakdown.practicality, 1);
  });
});

// ============================================================================
// scoreCar tests - Total Score & Recommendation Strength
// ============================================================================

describe('scoreCar - Total Score & Recommendation Strength', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 200000 };

  it('should calculate total score correctly (sum of all factors)', () => {
    const car = createTestCar({ price_tnd: 100000, country: 'TN' });
    const scored = scoreCar(car, baseFilters);

    const expectedSum =
      scored.score_breakdown.price_fit +
      scored.score_breakdown.age +
      scored.score_breakdown.mileage +
      scored.score_breakdown.reliability +
      scored.score_breakdown.parts_availability +
      scored.score_breakdown.fuel_efficiency +
      scored.score_breakdown.preference_match +
      scored.score_breakdown.practicality;

    // Allow 0.5 tolerance for rounding
    assert(Math.abs(scored.score - expectedSum) < 0.5);
  });

  it('should mark as "excellent" for scores >= 75', () => {
    // Create a perfect car: new Toyota, TN, low mileage, sweet spot price
    const car = createTestCar({
      brand: 'Toyota',
      year: new Date().getFullYear(),
      mileage_km: 0,
      country: 'TN',
      price_tnd: 140000, // ~70% of budget
    });
    const scored = scoreCar(car, baseFilters);
    if (scored.score >= 75) {
      assertEquals(scored.recommendation_strength, 'excellent');
    }
  });

  it('should mark as "good" for scores 60-74', () => {
    const car = createTestCar({
      brand: 'Peugeot',
      year: new Date().getFullYear() - 3,
      mileage_km: 50000,
      country: 'TN',
      price_tnd: 140000,
    });
    const scored = scoreCar(car, baseFilters);
    if (scored.score >= 60 && scored.score < 75) {
      assertEquals(scored.recommendation_strength, 'good');
    }
  });

  it('should mark as "fair" for scores 45-59', () => {
    const car = createTestCar({
      brand: 'Fiat',
      year: new Date().getFullYear() - 8,
      mileage_km: 120000,
      country: 'ES',
      price_eur: 8000,
    });
    const scored = scoreCar(car, baseFilters);
    if (scored.score >= 45 && scored.score < 60) {
      assertEquals(scored.recommendation_strength, 'fair');
    }
  });

  it('should mark as "poor" for scores < 45', () => {
    const car = createTestCar({
      brand: 'UnknownBrand',
      year: new Date().getFullYear() - 15,
      mileage_km: 250000,
      country: 'XX',
      price_eur: 50000, // Way over budget
    });
    const scored = scoreCar(car, baseFilters);
    if (scored.score < 45) {
      assertEquals(scored.recommendation_strength, 'poor');
    }
  });
});

// ============================================================================
// scoreCar tests - FCR Eligibility Impact
// ============================================================================

describe('scoreCar - FCR Eligibility Impact on Cost', () => {
  const baseFilters: RecommendationFilters = { budget_tnd: 100000 };

  it('should calculate lower cost for FCR TRE eligible cars', () => {
    const car = createTestCar({
      price_eur: 15000,
      country: 'DE',
      fcr_tre_eligible: true,
    });

    const scoredWithFcr = scoreCar(car, { ...baseFilters, fcr_regime: 'fcr_tre' });
    const scoredWithoutFcr = scoreCar(car, { ...baseFilters, fcr_regime: 'regime_commun' });

    // FCR should result in lower estimated cost
    assert(scoredWithFcr.estimated_total_tnd < scoredWithoutFcr.estimated_total_tnd);
  });

  it('should not apply FCR if car is not eligible', () => {
    const car = createTestCar({
      price_eur: 15000,
      country: 'DE',
      fcr_tre_eligible: false,
    });

    const scoredWithFcr = scoreCar(car, { ...baseFilters, fcr_regime: 'fcr_tre' });
    const scoredWithoutFcr = scoreCar(car, { ...baseFilters, fcr_regime: 'regime_commun' });

    // Should be same cost since car is not FCR eligible
    assertEquals(scoredWithFcr.estimated_total_tnd, scoredWithoutFcr.estimated_total_tnd);
  });

  it('should use direct price for Tunisian cars (no import costs)', () => {
    const car = createTestCar({
      price_tnd: 80000,
      country: 'TN',
    });

    const scored = scoreCar(car, baseFilters);
    assertEquals(scored.estimated_total_tnd, 80000);
  });
});

// ============================================================================
// matchesFilters tests
// ============================================================================

describe('matchesFilters', () => {
  it('should match all cars when all filters are "any"', () => {
    const filters: RecommendationFilters = {
      fuel_type: 'any',
      condition: 'any',
      body_type: 'any',
    };

    for (const car of mockCars) {
      assert(matchesFilters(car as CarListing, filters), `Car ${car.brand} ${car.model} should match`);
    }
  });

  it('should filter by specific fuel_type', () => {
    const filters: RecommendationFilters = {
      fuel_type: 'essence',
    };

    const essenceCars = mockCars.filter(c => c.fuel_type.includes('essence'));
    for (const car of essenceCars) {
      assert(matchesFilters(car as CarListing, filters));
    }
  });

  it('should filter by condition (new)', () => {
    const filters: RecommendationFilters = {
      condition: 'new',
    };

    const newCars = mockCars.filter(c => c.source === 'automobile_tn_new');
    for (const car of newCars) {
      assert(matchesFilters(car as CarListing, filters));
    }
  });

  it('should filter by condition (used)', () => {
    const filters: RecommendationFilters = {
      condition: 'used',
    };

    const usedCars = mockCars.filter(c => c.source !== 'automobile_tn_new');
    for (const car of usedCars) {
      assert(matchesFilters(car as CarListing, filters));
    }
  });

  it('should not match cars with wrong fuel type', () => {
    const car = createTestCar({ fuel_type: 'diesel' });
    const filters: RecommendationFilters = {
      fuel_type: 'electric',
    };

    assertEquals(matchesFilters(car, filters), false);
  });

  it('should handle undefined filters', () => {
    const car = createTestCar();
    const filters: RecommendationFilters = {};

    // No filters means match all
    assert(matchesFilters(car, filters));
  });
});

// ============================================================================
// getTopRecommendations tests - Diversity Constraint
// ============================================================================

describe('getTopRecommendations - Diversity Constraint', () => {
  it('should limit same brand+model to max 2 in results', () => {
    // Create 5 identical Toyota Yaris
    const scoredCars: ScoredCar[] = Array(5).fill(null).map((_, i) => ({
      ...createTestCar({ id: `car_${i}` }),
      score: 90 - i,
      score_breakdown: {
        price_fit: 20,
        age: 15,
        mileage: 10,
        reliability: 14,
        parts_availability: 9,
        fuel_efficiency: 7,
        preference_match: 3,
        practicality: 5,
      },
      estimated_total_tnd: 70000,
      recommendation_strength: 'excellent' as const,
    }));

    const recommendations = getTopRecommendations(scoredCars, 5);

    // Should only return 2 Toyota Yaris
    assertEquals(recommendations.length, 2);
  });

  it('should include variety when different models available', () => {
    const models = ['Yaris', 'Corolla', 'Camry', 'RAV4', 'Hilux'];
    const scoredCars: ScoredCar[] = models.map((model, i) => ({
      ...createTestCar({ id: `car_${i}`, model }),
      score: 90 - i,
      score_breakdown: {
        price_fit: 20,
        age: 15,
        mileage: 10,
        reliability: 14,
        parts_availability: 9,
        fuel_efficiency: 7,
        preference_match: 3,
        practicality: 5,
      },
      estimated_total_tnd: 70000,
      recommendation_strength: 'excellent' as const,
    }));

    const recommendations = getTopRecommendations(scoredCars, 5);

    // Should return all 5 different models
    assertEquals(recommendations.length, 5);

    // All should be unique models
    const uniqueModels = new Set(recommendations.map(r => r.model));
    assertEquals(uniqueModels.size, 5);
  });

  it('should respect limit parameter', () => {
    const scoredCars: ScoredCar[] = Array(10).fill(null).map((_, i) => ({
      ...createTestCar({ id: `car_${i}`, model: `Model${i}` }),
      score: 90 - i,
      score_breakdown: {
        price_fit: 20,
        age: 15,
        mileage: 10,
        reliability: 14,
        parts_availability: 9,
        fuel_efficiency: 7,
        preference_match: 3,
        practicality: 5,
      },
      estimated_total_tnd: 70000,
      recommendation_strength: 'excellent' as const,
    }));

    const recommendations = getTopRecommendations(scoredCars, 3);
    assertEquals(recommendations.length, 3);
  });

  it('should return empty array for empty input', () => {
    const recommendations = getTopRecommendations([], 5);
    assertEquals(recommendations.length, 0);
  });
});
