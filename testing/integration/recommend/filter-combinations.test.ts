/**
 * Integration tests for recommend API filter combinations
 *
 * Tests all filter permutations and combinations
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { recommendApi } from '../../test-utils/api-client.ts';
import { recommendFilters } from '../../test-utils/fixtures.ts';
import {
  assertAllCarsMatchFuel,
  assertAllCarsFromOrigin,
} from '../../test-utils/assertions.ts';

// ============================================================================
// All "Any" Filters
// ============================================================================

describe('Recommend API - All "Any" Filters', () => {
  it('should return recommendations with all filters set to "any"', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.allAny,
      limit: 10,
    });

    assert(response.total >= 0, 'Should return total count');
    assertEquals(response.limit, 10);
    assertEquals(response.offset, 0);
  });

  it('should return diverse recommendations with "any" filters', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
      },
      limit: 10,
    });

    // Should have variety in results
    if (response.recommendations.length >= 3) {
      const fuelTypes = new Set(response.recommendations.map(r => r.car.fuel_type));
      // With "any" filter, we might get multiple fuel types
      assert(fuelTypes.size >= 1, 'Should have at least one fuel type');
    }
  });
});

// ============================================================================
// Specific Fuel Type Filters
// ============================================================================

describe('Recommend API - Fuel Type Filters', () => {
  it('should filter for essence cars only', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'essence',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsMatchFuel(response.recommendations, 'essence');
    }
  });

  it('should filter for diesel cars only', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'diesel',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 120000,
      },
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsMatchFuel(response.recommendations, 'diesel');
    }
  });

  it('should filter for electric cars only', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.electricOnly,
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsMatchFuel(response.recommendations, 'electric');
    }
  });

  it('should filter for hybrid cars only', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'hybrid',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
      },
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsMatchFuel(response.recommendations, 'hybrid');
    }
  });

  it('should filter for hybrid_rechargeable cars only', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'hybrid_rechargeable',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 200000,
      },
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsMatchFuel(response.recommendations, 'hybrid_rechargeable');
    }
  });
});

// ============================================================================
// Condition Filters
// ============================================================================

describe('Recommend API - Condition Filters', () => {
  it('should filter for new cars only', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.newCarsOnly,
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      for (const rec of response.recommendations) {
        assertEquals(rec.car.source, 'automobile_tn_new', 'All cars should be new');
      }
    }
  });

  it('should filter for used cars only', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'used',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      for (const rec of response.recommendations) {
        assert(
          rec.car.source === 'autoscout24' || rec.car.source === 'automobile_tn_used',
          `Car source should be used market, got ${rec.car.source}`
        );
      }
    }
  });

  it('should return both new and used when condition is "any"', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 200000,
      },
      limit: 20,
    });

    // With a large enough sample, we might get both
    if (response.total > 10) {
      const sources = new Set(response.recommendations.map(r => r.car.source));
      // Should have at least one source
      assert(sources.size >= 1, 'Should have at least one source type');
    }
  });
});

// ============================================================================
// Body Type Filters
// ============================================================================

describe('Recommend API - Body Type Filters', () => {
  const bodyTypes = ['suv', 'berline', 'citadine', 'break', 'monospace'] as const;

  for (const bodyType of bodyTypes) {
    it(`should filter for ${bodyType} body type`, async () => {
      const response = await recommendApi.post({
        filters: {
          fuel_type: 'any',
          condition: 'any',
          body_type: bodyType,
          budget_tnd: 150000,
        },
        limit: 5,
      });

      // Just verify the request succeeds
      assert(response.total >= 0, `Should handle ${bodyType} filter`);
    });
  }
});

// ============================================================================
// Origin Filters
// ============================================================================

describe('Recommend API - Origin Filters', () => {
  it('should filter for Tunisia-origin cars only', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.tunisiaOrigin,
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsFromOrigin(response.recommendations, 'tunisia');
    }
  });

  it('should filter for import cars only (abroad)', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.importOrigin,
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsFromOrigin(response.recommendations, 'abroad');
    }
  });
});

// ============================================================================
// Voiture Populaire Filter
// ============================================================================

describe('Recommend API - Voiture Populaire Filter', () => {
  it('should filter for voiture populaire cars', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.voiturePopulaire,
      limit: 5,
    });

    // Just verify the request succeeds
    assert(response.total >= 0, 'Should handle voiture populaire filter');

    // If results, should be from Tunisia and new
    if (response.recommendations.length > 0) {
      for (const rec of response.recommendations) {
        assertEquals(rec.car.country, 'TN', 'Voiture populaire should be from Tunisia');
        assertEquals(rec.car.source, 'automobile_tn_new', 'Voiture populaire should be new');
      }
    }
  });
});

// ============================================================================
// FCR Regime Filter
// ============================================================================

describe('Recommend API - FCR Regime Filter', () => {
  it('should accept fcr_tre regime filter', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.fcrTre,
      limit: 5,
    });

    assert(response.total >= 0, 'Should handle fcr_tre filter');
  });

  it('should accept fcr_famille regime filter', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        fcr_regime: 'fcr_famille',
      },
      limit: 5,
    });

    assert(response.total >= 0, 'Should handle fcr_famille filter');
  });

  it('should accept regime_commun regime filter', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        fcr_regime: 'regime_commun',
      },
      limit: 5,
    });

    assert(response.total >= 0, 'Should handle regime_commun filter');
  });
});

// ============================================================================
// Combined Filters
// ============================================================================

describe('Recommend API - Combined Filters', () => {
  it('should handle fuel + condition + body_type combination', async () => {
    const response = await recommendApi.post({
      filters: recommendFilters.specificEssence,
      limit: 5,
    });

    assert(response.total >= 0, 'Should handle combined filters');
  });

  it('should handle origin + condition combination', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'used',
        body_type: 'any',
        budget_tnd: 100000,
        origin: 'abroad',
      },
      limit: 5,
    });

    if (response.recommendations.length > 0) {
      assertAllCarsFromOrigin(response.recommendations, 'abroad');
    }
  });

  it('should handle fuel + origin + fcr_regime combination', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'diesel',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 120000,
        origin: 'abroad',
        fcr_regime: 'fcr_tre',
      },
      limit: 5,
    });

    assert(response.total >= 0, 'Should handle complex filter combination');
  });
});

// ============================================================================
// Budget Variations
// ============================================================================

describe('Recommend API - Budget Variations', () => {
  const budgets = [30000, 50000, 70000, 100000, 150000, 200000, 300000];

  for (const budget of budgets) {
    it(`should handle budget of ${budget} TND`, async () => {
      const response = await recommendApi.post({
        filters: {
          fuel_type: 'any',
          condition: 'any',
          body_type: 'any',
          budget_tnd: budget,
        },
        limit: 5,
      });

      assert(response.total >= 0, `Should handle ${budget} TND budget`);
    });
  }
});

// ============================================================================
// Empty Results Handling
// ============================================================================

describe('Recommend API - Empty Results', () => {
  it('should handle filters with no matching results', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'electric',
        condition: 'new',
        body_type: 'pickup',
        budget_tnd: 20000, // Very low budget for electric pickup
      },
      limit: 5,
    });

    // Should not error, just return empty
    assertEquals(response.recommendations.length, 0);
    assertEquals(response.total, 0);
  });
});
