/**
 * Unit tests for chat state machine
 *
 * Tests getNextState() and needsQuestion() from supabase/functions/chat/state.ts
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';

// Import the actual state functions
import { getNextState, needsQuestion } from '../../../supabase/functions/chat/state.ts';
import type { ConversationState, Goal, CarOrigin, Residency } from '../../../supabase/functions/chat/types.ts';

// ============================================================================
// getNextState tests - Goal Selection
// ============================================================================

describe('getNextState - goal_selection', () => {
  const currentState: ConversationState = 'goal_selection';

  it('should transition to asking_car_origin for find_car goal', () => {
    assertEquals(getNextState(currentState, { goal: 'find_car' }), 'asking_car_origin');
  });

  it('should transition to procedure_info for procedure goal', () => {
    assertEquals(getNextState(currentState, { goal: 'procedure' }), 'procedure_info');
  });

  it('should transition to car_comparison_input for compare_cars goal', () => {
    assertEquals(getNextState(currentState, { goal: 'compare_cars' }), 'car_comparison_input');
  });

  it('should transition to ev_topic_selection for ev_info goal', () => {
    assertEquals(getNextState(currentState, { goal: 'ev_info' }), 'ev_topic_selection');
  });

  it('should transition to asking_car_origin for browse_offers goal (same as find_car)', () => {
    assertEquals(getNextState(currentState, { goal: 'browse_offers' }), 'asking_car_origin');
  });

  it('should transition to popular_cars_selection for popular_cars goal', () => {
    assertEquals(getNextState(currentState, { goal: 'popular_cars' }), 'popular_cars_selection');
  });

  it('should stay in goal_selection if no goal provided', () => {
    assertEquals(getNextState(currentState, {}), 'goal_selection');
  });
});

// ============================================================================
// getNextState tests - Tunisia Flow
// ============================================================================

describe('getNextState - Tunisia flow (car_origin=tunisia)', () => {
  it('asking_car_origin → asking_condition (when origin is tunisia)', () => {
    assertEquals(
      getNextState('asking_car_origin', { carOrigin: 'tunisia' }),
      'asking_condition'
    );
  });

  it('asking_condition → asking_budget (with condition)', () => {
    assertEquals(
      getNextState('asking_condition', { hasCondition: true }),
      'asking_budget'
    );
  });

  it('asking_budget → asking_fuel_type (Tunisia flow with budget)', () => {
    assertEquals(
      getNextState('asking_budget', { hasBudget: true, isTunisiaFlow: true }),
      'asking_fuel_type'
    );
  });

  it('asking_fuel_type → asking_car_type (with fuel type)', () => {
    assertEquals(
      getNextState('asking_fuel_type', { hasFuelType: true }),
      'asking_car_type'
    );
  });

  it('asking_car_type → showing_cars (Tunisia flow with car type)', () => {
    assertEquals(
      getNextState('asking_car_type', { hasCarType: true, isTunisiaFlow: true }),
      'showing_cars'
    );
  });

  describe('full Tunisia flow sequence', () => {
    it('should follow: car_origin → condition → budget → fuel → car_type → cars', () => {
      // Step 1: Select car origin (tunisia)
      const state1 = getNextState('asking_car_origin', { carOrigin: 'tunisia' });
      assertEquals(state1, 'asking_condition');

      // Step 2: Select condition
      const state2 = getNextState(state1, { hasCondition: true });
      assertEquals(state2, 'asking_budget');

      // Step 3: Set budget (Tunisia flow)
      const state3 = getNextState(state2, { hasBudget: true, isTunisiaFlow: true });
      assertEquals(state3, 'asking_fuel_type');

      // Step 4: Select fuel type
      const state4 = getNextState(state3, { hasFuelType: true });
      assertEquals(state4, 'asking_car_type');

      // Step 5: Select car type (Tunisia flow - goes to cars)
      const state5 = getNextState(state4, { hasCarType: true, isTunisiaFlow: true });
      assertEquals(state5, 'showing_cars');
    });
  });
});

// ============================================================================
// getNextState tests - Import Flow (TRE)
// ============================================================================

describe('getNextState - Import flow TRE (residency=abroad)', () => {
  it('asking_car_origin → asking_residency (when origin is abroad)', () => {
    assertEquals(
      getNextState('asking_car_origin', { carOrigin: 'abroad' }),
      'asking_residency'
    );
  });

  it('asking_residency → asking_fuel_type (when residency is abroad/TRE)', () => {
    assertEquals(
      getNextState('asking_residency', { residency: 'abroad' }),
      'asking_fuel_type'
    );
  });

  it('asking_fuel_type → asking_car_type', () => {
    assertEquals(
      getNextState('asking_fuel_type', { hasFuelType: true }),
      'asking_car_type'
    );
  });

  it('asking_car_type → asking_condition (Import flow, not Tunisia)', () => {
    assertEquals(
      getNextState('asking_car_type', { hasCarType: true, isTunisiaFlow: false }),
      'asking_condition'
    );
  });

  it('asking_condition → asking_budget', () => {
    assertEquals(
      getNextState('asking_condition', { hasCondition: true }),
      'asking_budget'
    );
  });

  it('asking_budget → showing_cars (Import flow)', () => {
    assertEquals(
      getNextState('asking_budget', { hasBudget: true, isTunisiaFlow: false }),
      'showing_cars'
    );
  });

  describe('full TRE flow sequence', () => {
    it('should follow: car_origin → residency → fuel → car_type → condition → budget → cars', () => {
      // Step 1: Select car origin (abroad)
      const state1 = getNextState('asking_car_origin', { carOrigin: 'abroad' });
      assertEquals(state1, 'asking_residency');

      // Step 2: Select residency (TRE - abroad)
      const state2 = getNextState(state1, { residency: 'abroad' });
      assertEquals(state2, 'asking_fuel_type');

      // Step 3: Select fuel type
      const state3 = getNextState(state2, { hasFuelType: true });
      assertEquals(state3, 'asking_car_type');

      // Step 4: Select car type (Import flow)
      const state4 = getNextState(state3, { hasCarType: true, isTunisiaFlow: false });
      assertEquals(state4, 'asking_condition');

      // Step 5: Select condition
      const state5 = getNextState(state4, { hasCondition: true });
      assertEquals(state5, 'asking_budget');

      // Step 6: Set budget (Import flow - goes to cars)
      const state6 = getNextState(state5, { hasBudget: true, isTunisiaFlow: false });
      assertEquals(state6, 'showing_cars');
    });
  });
});

// ============================================================================
// getNextState tests - Import Flow (FCR Famille)
// ============================================================================

describe('getNextState - Import flow FCR Famille (residency=local)', () => {
  it('asking_residency → asking_fcr_famille (when residency is local)', () => {
    assertEquals(
      getNextState('asking_residency', { residency: 'local' }),
      'asking_fcr_famille'
    );
  });

  it('asking_fcr_famille → asking_fuel_type (after FCR choice)', () => {
    assertEquals(
      getNextState('asking_fcr_famille', { hasFcrFamille: true }),
      'asking_fuel_type'
    );
  });

  describe('full FCR Famille flow sequence', () => {
    it('should follow: car_origin → residency → fcr_famille → fuel → car_type → condition → budget → cars', () => {
      // Step 1: Select car origin (abroad)
      const state1 = getNextState('asking_car_origin', { carOrigin: 'abroad' });
      assertEquals(state1, 'asking_residency');

      // Step 2: Select residency (local - Tunisia resident)
      const state2 = getNextState(state1, { residency: 'local' });
      assertEquals(state2, 'asking_fcr_famille');

      // Step 3: Answer FCR Famille question
      const state3 = getNextState(state2, { hasFcrFamille: true });
      assertEquals(state3, 'asking_fuel_type');

      // Step 4: Select fuel type
      const state4 = getNextState(state3, { hasFuelType: true });
      assertEquals(state4, 'asking_car_type');

      // Step 5: Select car type (Import flow)
      const state5 = getNextState(state4, { hasCarType: true, isTunisiaFlow: false });
      assertEquals(state5, 'asking_condition');

      // Step 6: Select condition
      const state6 = getNextState(state5, { hasCondition: true });
      assertEquals(state6, 'asking_budget');

      // Step 7: Set budget (Import flow - goes to cars)
      const state7 = getNextState(state6, { hasBudget: true, isTunisiaFlow: false });
      assertEquals(state7, 'showing_cars');
    });
  });
});

// ============================================================================
// getNextState tests - Procedure Info Flow
// ============================================================================

describe('getNextState - Procedure info flow', () => {
  it('procedure_info → showing_procedure_detail (with procedure selected)', () => {
    assertEquals(
      getNextState('procedure_info', { hasProcedure: true }),
      'showing_procedure_detail'
    );
  });

  it('procedure_info stays if no procedure selected', () => {
    assertEquals(
      getNextState('procedure_info', {}),
      'procedure_info'
    );
  });

  it('showing_procedure_detail → asking_car_origin (if transitionToCars)', () => {
    assertEquals(
      getNextState('showing_procedure_detail', { transitionToCars: true }),
      'asking_car_origin'
    );
  });

  it('showing_procedure_detail → goal_selection (if not transitionToCars)', () => {
    assertEquals(
      getNextState('showing_procedure_detail', { transitionToCars: false }),
      'goal_selection'
    );
  });
});

// ============================================================================
// getNextState tests - Compare Cars Flow
// ============================================================================

describe('getNextState - Compare cars flow', () => {
  it('car_comparison_input → showing_comparison (with comparison query)', () => {
    assertEquals(
      getNextState('car_comparison_input', { hasComparisonQuery: true }),
      'showing_comparison'
    );
  });

  it('car_comparison_input stays if no query', () => {
    assertEquals(
      getNextState('car_comparison_input', {}),
      'car_comparison_input'
    );
  });

  it('showing_comparison → asking_car_origin (if transitionToCars)', () => {
    assertEquals(
      getNextState('showing_comparison', { transitionToCars: true }),
      'asking_car_origin'
    );
  });

  it('showing_comparison → goal_selection (if not transitionToCars)', () => {
    assertEquals(
      getNextState('showing_comparison', { transitionToCars: false }),
      'goal_selection'
    );
  });
});

// ============================================================================
// getNextState tests - EV Info Flow
// ============================================================================

describe('getNextState - EV info flow', () => {
  it('ev_topic_selection → showing_ev_info (with topic selected)', () => {
    assertEquals(
      getNextState('ev_topic_selection', { hasEVTopic: true }),
      'showing_ev_info'
    );
  });

  it('ev_topic_selection stays if no topic selected', () => {
    assertEquals(
      getNextState('ev_topic_selection', {}),
      'ev_topic_selection'
    );
  });

  it('showing_ev_info → asking_car_origin (if transitionToCars)', () => {
    assertEquals(
      getNextState('showing_ev_info', { transitionToCars: true }),
      'asking_car_origin'
    );
  });

  it('showing_ev_info → goal_selection (if not transitionToCars)', () => {
    assertEquals(
      getNextState('showing_ev_info', { transitionToCars: false }),
      'goal_selection'
    );
  });
});

// ============================================================================
// getNextState tests - Popular Cars Flow
// ============================================================================

describe('getNextState - Popular cars flow', () => {
  it('popular_cars_selection → asking_popular_eligibility (when eligibility selected)', () => {
    assertEquals(
      getNextState('popular_cars_selection', { popularSelection: 'eligibility' }),
      'asking_popular_eligibility'
    );
  });

  it('popular_cars_selection → showing_popular_models (when models selected)', () => {
    assertEquals(
      getNextState('popular_cars_selection', { popularSelection: 'models' }),
      'showing_popular_models'
    );
  });

  it('popular_cars_selection stays if no selection', () => {
    assertEquals(
      getNextState('popular_cars_selection', {}),
      'popular_cars_selection'
    );
  });

  it('asking_popular_eligibility → goal_selection (always)', () => {
    assertEquals(
      getNextState('asking_popular_eligibility', {}),
      'goal_selection'
    );
  });

  it('showing_popular_models → asking_car_origin (if transitionToCars)', () => {
    assertEquals(
      getNextState('showing_popular_models', { transitionToCars: true }),
      'asking_car_origin'
    );
  });

  it('showing_popular_models → goal_selection (if not transitionToCars)', () => {
    assertEquals(
      getNextState('showing_popular_models', { transitionToCars: false }),
      'goal_selection'
    );
  });
});

// ============================================================================
// getNextState tests - Cost Calculator Flow
// ============================================================================

describe('getNextState - Cost calculator flow', () => {
  it('asking_calc_price → asking_calc_engine (with price)', () => {
    assertEquals(
      getNextState('asking_calc_price', { hasCalcPrice: true }),
      'asking_calc_engine'
    );
  });

  it('asking_calc_engine → asking_calc_fuel (with engine)', () => {
    assertEquals(
      getNextState('asking_calc_engine', { hasCalcEngine: true }),
      'asking_calc_fuel'
    );
  });

  it('asking_calc_fuel → showing_calculation (with fuel)', () => {
    assertEquals(
      getNextState('asking_calc_fuel', { hasCalcFuel: true }),
      'showing_calculation'
    );
  });

  it('showing_calculation → asking_car_origin (if transitionToCars)', () => {
    assertEquals(
      getNextState('showing_calculation', { transitionToCars: true }),
      'asking_car_origin'
    );
  });

  it('showing_calculation → goal_selection (if not transitionToCars)', () => {
    assertEquals(
      getNextState('showing_calculation', { transitionToCars: false }),
      'goal_selection'
    );
  });
});

// ============================================================================
// getNextState tests - Edge Cases
// ============================================================================

describe('getNextState - Edge cases', () => {
  it('showing_cars stays in showing_cars', () => {
    assertEquals(getNextState('showing_cars', {}), 'showing_cars');
  });

  it('unknown state defaults to goal_selection', () => {
    assertEquals(getNextState('unknown_state' as ConversationState, {}), 'goal_selection');
  });

  it('should handle undefined options', () => {
    assertEquals(getNextState('goal_selection'), 'goal_selection');
  });
});

// ============================================================================
// needsQuestion tests
// ============================================================================

describe('needsQuestion', () => {
  describe('states that need questions', () => {
    const statesNeedingQuestions: ConversationState[] = [
      'goal_selection',
      'asking_car_origin',
      'asking_residency',
      'asking_fcr_famille',
      'asking_fuel_type',
      'asking_car_type',
      'asking_condition',
      'asking_budget',
      'asking_calc_price',
      'asking_calc_engine',
      'asking_calc_fuel',
      'procedure_info',
      'car_comparison_input',
      'ev_topic_selection',
      'browse_origin_selection',
      'popular_cars_selection',
      'asking_popular_eligibility',
    ];

    for (const state of statesNeedingQuestions) {
      it(`should return true for ${state}`, () => {
        assertEquals(needsQuestion(state), true);
      });
    }
  });

  describe('states that do not need questions', () => {
    const statesNotNeedingQuestions: ConversationState[] = [
      'showing_cars',
      'showing_calculation',
      'showing_procedure_detail',
      'showing_comparison',
      'showing_ev_info',
      'showing_popular_models',
    ];

    for (const state of statesNotNeedingQuestions) {
      it(`should return false for ${state}`, () => {
        assertEquals(needsQuestion(state), false);
      });
    }
  });
});
