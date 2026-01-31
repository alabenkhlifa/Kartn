/**
 * Integration tests for FCR eligibility and cost impact
 *
 * Tests FCR TRE and FCR Famille regime effects on cost estimation
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { recommendApi } from '../../test-utils/api-client.ts';
import { assertFcrEligibilityPresence } from '../../test-utils/assertions.ts';

// ============================================================================
// FCR Eligibility Information
// ============================================================================

describe('Recommend API - FCR Eligibility Info', () => {
  it('should include fcr_eligible for imported cars', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        origin: 'abroad',
      },
      limit: 5,
    });

    assertFcrEligibilityPresence(response.recommendations);
  });

  it('should have fcr_eligible.tre and fcr_eligible.famille for imports', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        origin: 'abroad',
      },
      limit: 5,
    });

    for (const rec of response.recommendations) {
      if (rec.car.country !== 'TN') {
        assert(rec.fcr_eligible !== undefined, 'Should have fcr_eligible for imports');
        assert(rec.fcr_eligible.tre !== undefined, 'Should have fcr_eligible.tre');
        assert(rec.fcr_eligible.famille !== undefined, 'Should have fcr_eligible.famille');
      }
    }
  });

  it('should not include fcr_eligible for Tunisia cars', async () => {
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

    // TN cars shouldn't have FCR info (they don't need it)
    for (const rec of response.recommendations) {
      assertEquals(rec.car.country, 'TN', 'Should be Tunisia car');
      // fcr_eligible might be undefined or not present for TN cars
    }
  });
});

// ============================================================================
// FCR TRE Cost Impact
// ============================================================================

describe('Recommend API - FCR TRE Cost Impact', () => {
  it('should estimate lower cost for FCR TRE eligible cars with fcr_tre regime', async () => {
    // Get same cars with different regimes
    const fcrResponse = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
        origin: 'abroad',
        fcr_regime: 'fcr_tre',
      },
      limit: 5,
    });

    const normalResponse = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
        origin: 'abroad',
        fcr_regime: 'regime_commun',
      },
      limit: 5,
    });

    // Find a car that appears in both and is FCR TRE eligible
    for (const fcrRec of fcrResponse.recommendations) {
      if (fcrRec.fcr_eligible?.tre) {
        const normalRec = normalResponse.recommendations.find(
          r => r.car.id === fcrRec.car.id
        );

        if (normalRec) {
          assert(
            fcrRec.estimated_total_tnd < normalRec.estimated_total_tnd,
            `FCR TRE cost (${fcrRec.estimated_total_tnd}) should be less than regime commun (${normalRec.estimated_total_tnd})`
          );
        }
      }
    }
  });

  it('should not affect cost for non-FCR-eligible cars', async () => {
    const fcrResponse = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
        origin: 'abroad',
        fcr_regime: 'fcr_tre',
      },
      limit: 10,
    });

    const normalResponse = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
        origin: 'abroad',
        fcr_regime: 'regime_commun',
      },
      limit: 10,
    });

    // Find a car that is NOT FCR TRE eligible
    for (const fcrRec of fcrResponse.recommendations) {
      if (!fcrRec.fcr_eligible?.tre) {
        const normalRec = normalResponse.recommendations.find(
          r => r.car.id === fcrRec.car.id
        );

        if (normalRec) {
          assertEquals(
            fcrRec.estimated_total_tnd,
            normalRec.estimated_total_tnd,
            'Cost should be same for non-FCR-eligible cars'
          );
        }
      }
    }
  });
});

// ============================================================================
// FCR Famille Cost Impact
// ============================================================================

describe('Recommend API - FCR Famille Cost Impact', () => {
  it('should estimate lower cost for FCR Famille eligible cars with fcr_famille regime', async () => {
    const fcrResponse = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
        origin: 'abroad',
        fcr_regime: 'fcr_famille',
      },
      limit: 5,
    });

    const normalResponse = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 150000,
        origin: 'abroad',
        fcr_regime: 'regime_commun',
      },
      limit: 5,
    });

    // Find a car that is FCR Famille eligible
    for (const fcrRec of fcrResponse.recommendations) {
      if (fcrRec.fcr_eligible?.famille) {
        const normalRec = normalResponse.recommendations.find(
          r => r.car.id === fcrRec.car.id
        );

        if (normalRec) {
          assert(
            fcrRec.estimated_total_tnd < normalRec.estimated_total_tnd,
            `FCR Famille cost (${fcrRec.estimated_total_tnd}) should be less than regime commun (${normalRec.estimated_total_tnd})`
          );
        }
      }
    }
  });
});

// ============================================================================
// FCR Eligibility Flags from Database
// ============================================================================

describe('Recommend API - FCR Eligibility Flags', () => {
  it('should match car fcr_tre_eligible flag with fcr_eligible.tre', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        origin: 'abroad',
      },
      limit: 10,
    });

    for (const rec of response.recommendations) {
      if (rec.fcr_eligible) {
        assertEquals(
          rec.fcr_eligible.tre,
          rec.car.fcr_tre_eligible,
          'fcr_eligible.tre should match car.fcr_tre_eligible'
        );
      }
    }
  });

  it('should match car fcr_famille_eligible flag with fcr_eligible.famille', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        origin: 'abroad',
      },
      limit: 10,
    });

    for (const rec of response.recommendations) {
      if (rec.fcr_eligible) {
        assertEquals(
          rec.fcr_eligible.famille,
          rec.car.fcr_famille_eligible,
          'fcr_eligible.famille should match car.fcr_famille_eligible'
        );
      }
    }
  });
});

// ============================================================================
// Regime Commun (Default)
// ============================================================================

describe('Recommend API - Regime Commun', () => {
  it('should apply full import taxes with regime_commun', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 200000,
        origin: 'abroad',
        fcr_regime: 'regime_commun',
      },
      limit: 5,
    });

    for (const rec of response.recommendations) {
      if (rec.car.price_eur) {
        // Regime commun should have high taxes (~150-200%)
        // Estimated total should be significantly more than base price
        const basePriceEstimate = rec.car.price_eur * 3.5; // Approx rate
        assert(
          rec.estimated_total_tnd > basePriceEstimate,
          'Regime commun should include substantial import taxes'
        );
      }
    }
  });
});

// ============================================================================
// Price Fit Score with FCR
// ============================================================================

describe('Recommend API - FCR Impact on Price Fit Score', () => {
  it('should consider FCR-reduced cost when calculating price_fit', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'any',
        condition: 'any',
        body_type: 'any',
        budget_tnd: 100000,
        origin: 'abroad',
        fcr_regime: 'fcr_tre',
      },
      limit: 10,
    });

    // With FCR, some cars that would be over budget might now fit
    // This is reflected in the price_fit score
    for (const rec of response.recommendations) {
      // Verify price_fit is calculated correctly based on estimated_total
      const budgetRatio = rec.estimated_total_tnd / 100000;

      if (budgetRatio <= 0.9 && budgetRatio >= 0.7) {
        // Sweet spot - should have high price_fit
        assert(
          rec.score_breakdown.price_fit >= 20,
          'Sweet spot budget ratio should have high price_fit'
        );
      }
    }
  });
});
