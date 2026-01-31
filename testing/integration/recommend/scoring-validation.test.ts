/**
 * Integration tests for recommend API scoring validation
 *
 * Tests score breakdown, sorting, and recommendation strength
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { recommendApi } from '../../test-utils/api-client.ts';
import {
  assertSortedByScore,
  assertSequentialRanks,
  assertScoreBreakdownSumsCorrectly,
  assertRecommendationStrength,
  assertDiversityConstraint,
} from '../../test-utils/assertions.ts';

// ============================================================================
// Score Breakdown Validation
// ============================================================================

describe('Recommend API - Score Breakdown', () => {
  it('should return score_breakdown for each recommendation', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
    });

    for (const rec of response.recommendations) {
      assert(rec.score_breakdown !== undefined, 'Should have score_breakdown');
      assert(rec.score_breakdown.price_fit !== undefined, 'Should have price_fit');
      assert(rec.score_breakdown.age !== undefined, 'Should have age');
      assert(rec.score_breakdown.mileage !== undefined, 'Should have mileage');
      assert(rec.score_breakdown.reliability !== undefined, 'Should have reliability');
      assert(rec.score_breakdown.parts_availability !== undefined, 'Should have parts_availability');
      assert(rec.score_breakdown.fuel_efficiency !== undefined, 'Should have fuel_efficiency');
      assert(rec.score_breakdown.preference_match !== undefined, 'Should have preference_match');
      assert(rec.score_breakdown.practicality !== undefined, 'Should have practicality');
    }
  });

  it('should have score breakdown that sums to total score', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 10,
    });

    for (const rec of response.recommendations) {
      assertScoreBreakdownSumsCorrectly(rec.score_breakdown, rec.score);
    }
  });

  it('should have score breakdown values within expected ranges', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
      },
      limit: 10,
    });

    for (const rec of response.recommendations) {
      assert(rec.score_breakdown.price_fit >= 0 && rec.score_breakdown.price_fit <= 23, 'price_fit should be 0-23');
      assert(rec.score_breakdown.age >= 0 && rec.score_breakdown.age <= 18, 'age should be 0-18');
      assert(rec.score_breakdown.mileage >= 0 && rec.score_breakdown.mileage <= 14, 'mileage should be 0-14');
      assert(rec.score_breakdown.reliability >= 0 && rec.score_breakdown.reliability <= 15, 'reliability should be 0-15');
      assert(rec.score_breakdown.parts_availability >= 0 && rec.score_breakdown.parts_availability <= 10, 'parts_availability should be 0-10');
      assert(rec.score_breakdown.fuel_efficiency >= 0 && rec.score_breakdown.fuel_efficiency <= 10, 'fuel_efficiency should be 0-10');
      assert(rec.score_breakdown.preference_match >= 0 && rec.score_breakdown.preference_match <= 5, 'preference_match should be 0-5');
      assert(rec.score_breakdown.practicality >= 0 && rec.score_breakdown.practicality <= 5, 'practicality should be 0-5');
    }
  });
});

// ============================================================================
// Score Sorting
// ============================================================================

describe('Recommend API - Score Sorting', () => {
  it('should sort recommendations by score (descending)', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 10,
    });

    if (response.recommendations.length > 1) {
      assertSortedByScore(response.recommendations);
    }
  });

  it('should maintain sort order across different budgets', async () => {
    const budgets = [50000, 100000, 200000];

    for (const budget of budgets) {
      const response = await recommendApi.post({
        filters: {
          fuel_type: 'any',
          condition: 'any',
          body_type: 'any',
          budget_tnd: budget,
        },
        limit: 10,
      });

      if (response.recommendations.length > 1) {
        assertSortedByScore(response.recommendations);
      }
    }
  });
});

// ============================================================================
// Rank Validation
// ============================================================================

describe('Recommend API - Rank Values', () => {
  it('should have sequential ranks starting from 1', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 10,
    });

    assertSequentialRanks(response.recommendations);
  });

  it('should have rank matching array index + 1', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'essence',
        condition: 'used',
        body_type: 'any',
        budget_tnd: 80000,
      },
      limit: 5,
    });

    response.recommendations.forEach((rec, index) => {
      assertEquals(rec.rank, index + 1, `Rank should be ${index + 1}`);
    });
  });
});

// ============================================================================
// Recommendation Strength
// ============================================================================

describe('Recommend API - Recommendation Strength', () => {
  it('should have valid recommendation_strength values', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
      },
      limit: 20,
    });

    const validStrengths = ['excellent', 'good', 'fair', 'poor'];

    for (const rec of response.recommendations) {
      assert(
        validStrengths.includes(rec.recommendation_strength),
        `Invalid strength: ${rec.recommendation_strength}`
      );
    }
  });

  it('should have strength matching score thresholds', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 200000,
      },
      limit: 20,
    });

    for (const rec of response.recommendations) {
      assertRecommendationStrength(rec.score, rec.recommendation_strength);
    }
  });

  it('should have "excellent" for high scores (>= 75)', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 200000,
      },
      limit: 20,
    });

    for (const rec of response.recommendations) {
      if (rec.score >= 75) {
        assertEquals(rec.recommendation_strength, 'excellent');
      }
    }
  });

  it('should have "good" for scores 60-74', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
      },
      limit: 20,
    });

    for (const rec of response.recommendations) {
      if (rec.score >= 60 && rec.score < 75) {
        assertEquals(rec.recommendation_strength, 'good');
      }
    }
  });
});

// ============================================================================
// Diversity Constraint
// ============================================================================

describe('Recommend API - Diversity', () => {
  it('should have max 2 of same brand+model', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 20,
    });

    assertDiversityConstraint(response.recommendations, 2);
  });

  it('should maintain diversity across different filter combinations', async () => {
    const filterSets: Array<{ fuel_type: string; condition: 'new' | 'used' | 'any'; body_type: string }> = [
      { fuel_type: 'essence', condition: 'used', body_type: 'any' },
      { fuel_type: 'diesel', condition: 'any', body_type: 'suv' },
      { fuel_type: 'any', condition: 'new', body_type: 'any' },
    ];

    for (const filters of filterSets) {
      const response = await recommendApi.post({
        filters: {
          ...filters,
          budget_tnd: 150000,
        },
        limit: 15,
      });

      assertDiversityConstraint(response.recommendations, 2);
    }
  });
});

// ============================================================================
// Estimated Total TND
// ============================================================================

describe('Recommend API - Estimated Total TND', () => {
  it('should have estimated_total_tnd for all recommendations', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 10,
    });

    for (const rec of response.recommendations) {
      assert(rec.estimated_total_tnd !== undefined, 'Should have estimated_total_tnd');
      assert(rec.estimated_total_tnd > 0, 'estimated_total_tnd should be positive');
    }
  });

  it('should have lower estimated_total for TN cars (no import costs)', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        origin: 'tunisia',
      },
      limit: 5,
    });

    for (const rec of response.recommendations) {
      // TN cars: estimated_total should equal or be close to price_tnd
      if (rec.car.price_tnd) {
        assertEquals(rec.estimated_total_tnd, rec.car.price_tnd, 'TN car total should match price_tnd');
      }
    }
  });
});

// ============================================================================
// Score Consistency
// ============================================================================

describe('Recommend API - Score Consistency', () => {
  it('should return consistent scores for same request', async () => {
    const filters = {
      fuel_type: 'any' as const,
      condition: 'any' as const,
      body_type: 'any' as const,
      budget_tnd: 100000,
    };

    const response1 = await recommendApi.post({ filters, limit: 5 });
    const response2 = await recommendApi.post({ filters, limit: 5 });

    // Same request should return same scores (deterministic)
    if (response1.recommendations.length > 0 && response2.recommendations.length > 0) {
      assertEquals(
        response1.recommendations[0].score,
        response2.recommendations[0].score,
        'Scores should be consistent'
      );
    }
  });
});
