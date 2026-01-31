/**
 * Unit tests for recommend filter matching logic
 *
 * Tests matchesFilters and normalization functions from scoring.ts
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';

// Import the actual functions
import { matchesFilters } from '../../../supabase/functions/recommend/scoring.ts';
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
// Fuel Type Filtering
// ============================================================================

describe('matchesFilters - Fuel Type', () => {
  describe('essence matching', () => {
    const essenceVariants = ['essence', 'Essence', 'ESSENCE', 'petrol', 'Petrol', 'benzin', 'Benzin', 'gasoline'];

    for (const variant of essenceVariants) {
      it(`should match "${variant}" as essence`, () => {
        const car = createTestCar({ fuel_type: variant });
        const filters: RecommendationFilters = { fuel_type: 'essence' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('diesel matching', () => {
    const dieselVariants = ['diesel', 'Diesel', 'DIESEL'];

    for (const variant of dieselVariants) {
      it(`should match "${variant}" as diesel`, () => {
        const car = createTestCar({ fuel_type: variant });
        const filters: RecommendationFilters = { fuel_type: 'diesel' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('electric matching', () => {
    const electricVariants = ['electric', 'Electric', 'électrique', 'elektro', 'Elektro'];

    for (const variant of electricVariants) {
      it(`should match "${variant}" as electric`, () => {
        const car = createTestCar({ fuel_type: variant });
        const filters: RecommendationFilters = { fuel_type: 'electric' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('hybrid matching', () => {
    const hybridVariants = ['hybrid', 'Hybrid', 'hybride', 'Hybride'];

    for (const variant of hybridVariants) {
      it(`should match "${variant}" as hybrid`, () => {
        const car = createTestCar({ fuel_type: variant });
        const filters: RecommendationFilters = { fuel_type: 'hybrid' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('hybrid_rechargeable matching', () => {
    // Note: normalizeFuelType only checks for 'hybrid_rechargeable', 'plug-in', 'phev'
    // It does NOT match standalone 'rechargeable'
    const phevVariants = ['plug-in', 'Plug-In', 'phev', 'PHEV', 'hybrid_rechargeable'];

    for (const variant of phevVariants) {
      it(`should match "${variant}" as hybrid_rechargeable`, () => {
        const car = createTestCar({ fuel_type: variant });
        const filters: RecommendationFilters = { fuel_type: 'hybrid_rechargeable' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('any fuel type', () => {
    const allFuelTypes = ['essence', 'diesel', 'electric', 'hybrid', 'plug-in'];

    for (const fuelType of allFuelTypes) {
      it(`should match "${fuelType}" when filter is "any"`, () => {
        const car = createTestCar({ fuel_type: fuelType });
        const filters: RecommendationFilters = { fuel_type: 'any' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('fuel type mismatches', () => {
    it('should not match diesel car with essence filter', () => {
      const car = createTestCar({ fuel_type: 'diesel' });
      const filters: RecommendationFilters = { fuel_type: 'essence' };
      assertEquals(matchesFilters(car, filters), false);
    });

    it('should not match essence car with electric filter', () => {
      const car = createTestCar({ fuel_type: 'essence' });
      const filters: RecommendationFilters = { fuel_type: 'electric' };
      assertEquals(matchesFilters(car, filters), false);
    });
  });
});

// ============================================================================
// Condition Filtering
// ============================================================================

describe('matchesFilters - Condition', () => {
  describe('new car matching', () => {
    it('should match automobile_tn_new source as new', () => {
      const car = createTestCar({ source: 'automobile_tn_new' });
      const filters: RecommendationFilters = { condition: 'new' };
      assert(matchesFilters(car, filters));
    });

    it('should not match autoscout24 source as new', () => {
      const car = createTestCar({ source: 'autoscout24' });
      const filters: RecommendationFilters = { condition: 'new' };
      assertEquals(matchesFilters(car, filters), false);
    });

    it('should not match automobile_tn_used source as new', () => {
      const car = createTestCar({ source: 'automobile_tn_used' });
      const filters: RecommendationFilters = { condition: 'new' };
      assertEquals(matchesFilters(car, filters), false);
    });
  });

  describe('used car matching', () => {
    it('should match autoscout24 source as used', () => {
      const car = createTestCar({ source: 'autoscout24' });
      const filters: RecommendationFilters = { condition: 'used' };
      assert(matchesFilters(car, filters));
    });

    it('should match automobile_tn_used source as used', () => {
      const car = createTestCar({ source: 'automobile_tn_used' });
      const filters: RecommendationFilters = { condition: 'used' };
      assert(matchesFilters(car, filters));
    });

    it('should not match automobile_tn_new source as used', () => {
      const car = createTestCar({ source: 'automobile_tn_new' });
      const filters: RecommendationFilters = { condition: 'used' };
      assertEquals(matchesFilters(car, filters), false);
    });
  });

  describe('any condition', () => {
    const allSources = ['automobile_tn_new', 'autoscout24', 'automobile_tn_used'];

    for (const source of allSources) {
      it(`should match "${source}" when condition is "any"`, () => {
        const car = createTestCar({ source });
        const filters: RecommendationFilters = { condition: 'any' };
        assert(matchesFilters(car, filters));
      });
    }
  });
});

// ============================================================================
// Body Type Filtering
// ============================================================================

describe('matchesFilters - Body Type', () => {
  describe('SUV matching', () => {
    const suvVariants = ['suv', 'SUV', 'Geländewagen', 'crossover', 'Crossover', '4x4', '4X4'];

    for (const variant of suvVariants) {
      it(`should match "${variant}" as suv`, () => {
        const car = createTestCar({ body_type: variant });
        const filters: RecommendationFilters = { body_type: 'suv' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('berline/sedan matching', () => {
    const sedanVariants = ['berline', 'Berline', 'sedan', 'Sedan', 'limousine', 'Limousine'];

    for (const variant of sedanVariants) {
      it(`should match "${variant}" as berline`, () => {
        const car = createTestCar({ body_type: variant });
        const filters: RecommendationFilters = { body_type: 'berline' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('citadine/compact matching', () => {
    const compactVariants = ['citadine', 'Citadine', 'kleinwagen', 'Kleinwagen', 'compact', 'hatchback', 'Hatchback'];

    for (const variant of compactVariants) {
      it(`should match "${variant}" as citadine`, () => {
        const car = createTestCar({ body_type: variant });
        const filters: RecommendationFilters = { body_type: 'citadine' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('break/wagon matching', () => {
    const wagonVariants = ['break', 'Break', 'kombi', 'Kombi', 'wagon', 'estate', 'Estate'];

    for (const variant of wagonVariants) {
      it(`should match "${variant}" as break`, () => {
        const car = createTestCar({ body_type: variant });
        const filters: RecommendationFilters = { body_type: 'break' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('monospace/van matching', () => {
    const vanVariants = ['monospace', 'Monospace', 'van', 'Van', 'minivan', 'mpv', 'MPV'];

    for (const variant of vanVariants) {
      it(`should match "${variant}" as monospace`, () => {
        const car = createTestCar({ body_type: variant });
        const filters: RecommendationFilters = { body_type: 'monospace' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('any body type', () => {
    const allBodyTypes = ['suv', 'berline', 'citadine', 'break', 'monospace'];

    for (const bodyType of allBodyTypes) {
      it(`should match "${bodyType}" when filter is "any"`, () => {
        const car = createTestCar({ body_type: bodyType });
        const filters: RecommendationFilters = { body_type: 'any' };
        assert(matchesFilters(car, filters));
      });
    }
  });

  describe('body type mismatches', () => {
    it('should not match SUV car with berline filter', () => {
      const car = createTestCar({ body_type: 'SUV' });
      const filters: RecommendationFilters = { body_type: 'berline' };
      assertEquals(matchesFilters(car, filters), false);
    });
  });

  describe('null body type handling', () => {
    it('should not match null body_type with specific filter', () => {
      const car = createTestCar({ body_type: null });
      const filters: RecommendationFilters = { body_type: 'suv' };
      assertEquals(matchesFilters(car, filters), false);
    });

    it('should match null body_type with "any" filter', () => {
      const car = createTestCar({ body_type: null });
      const filters: RecommendationFilters = { body_type: 'any' };
      assert(matchesFilters(car, filters));
    });
  });
});

// ============================================================================
// Combined Filters
// ============================================================================

describe('matchesFilters - Combined Filters', () => {
  it('should match car that satisfies all filters', () => {
    const car = createTestCar({
      fuel_type: 'diesel',
      body_type: 'SUV',
      source: 'autoscout24',
    });
    const filters: RecommendationFilters = {
      fuel_type: 'diesel',
      body_type: 'suv',
      condition: 'used',
    };
    assert(matchesFilters(car, filters));
  });

  it('should not match car that fails one filter', () => {
    const car = createTestCar({
      fuel_type: 'essence', // Mismatch
      body_type: 'SUV',
      source: 'autoscout24',
    });
    const filters: RecommendationFilters = {
      fuel_type: 'diesel', // Expects diesel
      body_type: 'suv',
      condition: 'used',
    };
    assertEquals(matchesFilters(car, filters), false);
  });

  it('should handle mixed specific and "any" filters', () => {
    const car = createTestCar({
      fuel_type: 'hybrid',
      body_type: 'citadine',
      source: 'automobile_tn_new',
    });
    const filters: RecommendationFilters = {
      fuel_type: 'any',
      body_type: 'citadine',
      condition: 'new',
    };
    assert(matchesFilters(car, filters));
  });
});

// ============================================================================
// Empty/Undefined Filters
// ============================================================================

describe('matchesFilters - Empty/Undefined Filters', () => {
  it('should match any car with empty filters object', () => {
    const car = createTestCar();
    const filters: RecommendationFilters = {};
    assert(matchesFilters(car, filters));
  });

  it('should match any car when fuel_type is undefined', () => {
    const car = createTestCar({ fuel_type: 'electric' });
    const filters: RecommendationFilters = { condition: 'any' };
    assert(matchesFilters(car, filters));
  });

  it('should match any car when condition is undefined', () => {
    const car = createTestCar({ source: 'automobile_tn_new' });
    const filters: RecommendationFilters = { fuel_type: 'any' };
    assert(matchesFilters(car, filters));
  });

  it('should match any car when body_type is undefined', () => {
    const car = createTestCar({ body_type: 'SUV' });
    const filters: RecommendationFilters = { fuel_type: 'any' };
    assert(matchesFilters(car, filters));
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('matchesFilters - Edge Cases', () => {
  it('should handle mixed case fuel types', () => {
    const car = createTestCar({ fuel_type: 'DIESEL' });
    const filters: RecommendationFilters = { fuel_type: 'diesel' };
    assert(matchesFilters(car, filters));
  });

  it('should handle fuel types with extra text', () => {
    const car = createTestCar({ fuel_type: 'essence / petrol' });
    const filters: RecommendationFilters = { fuel_type: 'essence' };
    assert(matchesFilters(car, filters));
  });

  it('should handle body types with extra text', () => {
    const car = createTestCar({ body_type: 'SUV / Geländewagen' });
    const filters: RecommendationFilters = { body_type: 'suv' };
    assert(matchesFilters(car, filters));
  });
});
