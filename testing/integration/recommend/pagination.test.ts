/**
 * Integration tests for recommend API pagination
 *
 * Tests limit, offset, and total count behavior
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { recommendApi } from '../../test-utils/api-client.ts';

// ============================================================================
// Limit Parameter
// ============================================================================

describe('Recommend API - Limit Parameter', () => {
  it('should respect limit of 5', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
    });

    assert(response.recommendations.length <= 5, 'Should return at most 5 results');
    assertEquals(response.limit, 5, 'Response limit should match request');
  });

  it('should respect limit of 10', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 10,
    });

    assert(response.recommendations.length <= 10, 'Should return at most 10 results');
    assertEquals(response.limit, 10, 'Response limit should match request');
  });

  it('should respect limit of 1', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 1,
    });

    assert(response.recommendations.length <= 1, 'Should return at most 1 result');
    assertEquals(response.limit, 1, 'Response limit should match request');
  });

  it('should use default limit of 5 when not specified', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
    });

    assertEquals(response.limit, 5, 'Default limit should be 5');
  });

  it('should return fewer results if total is less than limit', async () => {
    // Use restrictive filters to get fewer results
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'electric',
        condition: 'new',
        body_type: 'pickup', // Very rare combination
        budget_tnd: 50000,
      },
      limit: 100,
    });

    // If total is less than limit, recommendations should equal total
    if (response.total < 100) {
      assertEquals(
        response.recommendations.length,
        response.total,
        'Results should equal total when total < limit'
      );
    }
  });
});

// ============================================================================
// Offset Parameter
// ============================================================================

describe('Recommend API - Offset Parameter', () => {
  it('should respect offset of 0', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
      offset: 0,
    });

    assertEquals(response.offset, 0, 'Response offset should be 0');
    // First result should have rank 1
    if (response.recommendations.length > 0) {
      assertEquals(response.recommendations[0].rank, 1, 'First result should have rank 1');
    }
  });

  it('should use default offset of 0 when not specified', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
    });

    assertEquals(response.offset, 0, 'Default offset should be 0');
  });

  it('should skip results based on offset', async () => {
    // Get first page
    const page1 = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
      offset: 0,
    });

    // Get second page
    const page2 = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
      offset: 5,
    });

    // Results should be different (no overlap)
    if (page1.recommendations.length > 0 && page2.recommendations.length > 0) {
      const page1Ids = new Set(page1.recommendations.map(r => r.car.id));
      const page2Ids = new Set(page2.recommendations.map(r => r.car.id));

      for (const id of page2Ids) {
        assert(!page1Ids.has(id), 'Page 2 should not contain any IDs from page 1');
      }
    }

    assertEquals(page2.offset, 5, 'Response offset should match request');
  });

  it('should return empty array if offset exceeds total', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
      offset: 10000, // Very high offset
    });

    assertEquals(response.recommendations.length, 0, 'Should return empty array');
    assertEquals(response.offset, 10000, 'Offset should still be reflected');
  });
});

// ============================================================================
// Total Count
// ============================================================================

describe('Recommend API - Total Count', () => {
  it('should return total count of matching results', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
    });

    assert(response.total >= 0, 'Total should be non-negative');
    assert(response.total >= response.recommendations.length, 'Total should be >= returned count');
  });

  it('should maintain consistent total across paginated requests', async () => {
    const page1 = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
      offset: 0,
    });

    const page2 = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 5,
      offset: 5,
    });

    assertEquals(page1.total, page2.total, 'Total should be consistent across pages');
  });

  it('should return 0 total for no matching results', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'electric',
        condition: 'new',
        body_type: 'pickup',
        budget_tnd: 1000, // Impossibly low budget
      },
      limit: 5,
    });

    assertEquals(response.total, 0, 'Total should be 0 for no matches');
    assertEquals(response.recommendations.length, 0, 'Should return empty array');
  });

  it('should change total based on filters', async () => {
    const allAny = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 200000,
      },
      limit: 1,
    });

    const electricOnly = await recommendApi.post({
      filters: {
        fuel_type: 'electric',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 200000,
      },
      limit: 1,
    });

    // Electric-only should have fewer or equal results
    assert(
      electricOnly.total <= allAny.total,
      'More specific filter should have fewer results'
    );
  });
});

// ============================================================================
// Pagination Edge Cases
// ============================================================================

describe('Recommend API - Pagination Edge Cases', () => {
  it('should handle limit of 0', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 0,
    });

    // Either returns empty or uses default
    assert(
      response.recommendations.length === 0 || response.limit === 5,
      'Should handle limit 0'
    );
  });

  it('should handle very large limit', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 1000,
    });

    // Should not crash and return results up to total
    assert(response.recommendations.length <= response.total, 'Results should not exceed total');
  });

  it('should maintain rank continuity across pages', async () => {
    // Get first page
    const page1 = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 3,
      offset: 0,
    });

    // Get second page
    const page2 = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
      },
      limit: 3,
      offset: 3,
    });

    // Page 1 ranks should be 1, 2, 3
    // Page 2 ranks should be 4, 5, 6
    if (page1.recommendations.length === 3 && page2.recommendations.length >= 1) {
      const lastRankPage1 = page1.recommendations[2].rank;
      const firstRankPage2 = page2.recommendations[0].rank;

      assertEquals(
        firstRankPage2,
        lastRankPage1 + 1,
        'Ranks should continue across pages'
      );
    }
  });
});

// ============================================================================
// Full Pagination Flow
// ============================================================================

describe('Recommend API - Full Pagination Flow', () => {
  it('should retrieve all results via pagination', async () => {
    const pageSize = 5;
    let offset = 0;
    let allResults: string[] = [];
    let total = -1;

    // Get pages until we have all results
    while (allResults.length < (total === -1 ? Infinity : total)) {
      const response = await recommendApi.post({
        filters: {
          fuel_type: 'any',
          condition: 'any',
          body_type: 'any',
          budget_tnd: 100000,
        },
        limit: pageSize,
        offset,
      });

      if (total === -1) {
        total = response.total;
      }

      if (response.recommendations.length === 0) {
        break;
      }

      allResults = allResults.concat(response.recommendations.map(r => r.car.id));
      offset += pageSize;

      // Safety limit
      if (offset > 500) break;
    }

    // All IDs should be unique
    const uniqueIds = new Set(allResults);
    assertEquals(uniqueIds.size, allResults.length, 'All paginated results should be unique');
  });
});
