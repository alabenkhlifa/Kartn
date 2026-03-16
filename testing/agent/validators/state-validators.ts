/**
 * Reusable state validators
 */

import type { ChatResponse, ValidationResult } from '../types.ts';

/**
 * All valid conversation states
 */
export const VALID_STATES = [
  'goal_selection',
  'asking_car_origin',
  'asking_residency',
  'asking_fcr_famille',
  'asking_fuel_type',
  'asking_car_type',
  'asking_condition',
  'asking_budget',
  'showing_cars',
  'asking_calc_price',
  'asking_calc_engine',
  'asking_calc_fuel',
  'showing_calculation',
  'procedure_info',
  'showing_procedure_detail',
  'car_comparison_input',
  'showing_comparison',
  'ev_topic_selection',
  'showing_ev_info',
  'browse_origin_selection',
  'popular_cars_selection',
  'asking_popular_eligibility',
  'showing_popular_models',
] as const;

export type ValidState = typeof VALID_STATES[number];

/**
 * Validate state is a known valid state
 */
export function isValidState(): (response: ChatResponse) => ValidationResult {
  return (response) => {
    if (!response.state) {
      return {
        passed: false,
        message: 'No state returned in response',
      };
    }

    if (VALID_STATES.includes(response.state as ValidState)) {
      return { passed: true, message: `Valid state: ${response.state}` };
    }

    return {
      passed: false,
      message: `Unknown state: ${response.state}`,
    };
  };
}

/**
 * Validate state is one of expected states
 */
export function stateIsOneOf(
  expectedStates: string[]
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    if (!response.state) {
      return {
        passed: false,
        message: 'No state returned in response',
      };
    }

    if (expectedStates.includes(response.state)) {
      return { passed: true, message: `State ${response.state} is expected` };
    }

    return {
      passed: false,
      message: `State '${response.state}' not in expected: ${expectedStates.join(', ')}`,
    };
  };
}

/**
 * Validate conversation progressed from previous state
 */
export function stateProgressed(
  previousState: string
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    if (!response.state) {
      return {
        passed: false,
        message: 'No state returned in response',
      };
    }

    if (response.state !== previousState) {
      return {
        passed: true,
        message: `State progressed from ${previousState} to ${response.state}`,
      };
    }

    return {
      passed: false,
      message: `State did not progress, still at ${previousState}`,
    };
  };
}

/**
 * Validate conversation returned to goal selection (reset)
 */
export function stateIsReset(): (response: ChatResponse) => ValidationResult {
  return (response) => {
    if (response.state === 'goal_selection') {
      return { passed: true, message: 'Conversation reset to goal_selection' };
    }

    return {
      passed: false,
      message: `Expected goal_selection after reset, got ${response.state}`,
    };
  };
}

/**
 * State flow validators for specific paths
 */
export const STATE_FLOWS = {
  tunisiaCarSearch: [
    'goal_selection',
    'asking_car_origin',
    'asking_condition',
    'asking_budget',
    'asking_fuel_type',
    'asking_car_type',
    'showing_cars',
  ],
  importTRE: [
    'goal_selection',
    'asking_car_origin',
    'asking_residency',
    'asking_fuel_type',
    'asking_car_type',
    'asking_condition',
    'asking_budget',
    'showing_cars',
  ],
  importFCRFamille: [
    'goal_selection',
    'asking_car_origin',
    'asking_residency',
    'asking_fcr_famille',
    'asking_fuel_type',
    'asking_car_type',
    'asking_condition',
    'asking_budget',
    'showing_cars',
  ],
  procedure: [
    'goal_selection',
    'procedure_info',
    'showing_procedure_detail',
  ],
  evInfo: [
    'goal_selection',
    'ev_topic_selection',
    'showing_ev_info',
  ],
  popularCarsEligibility: [
    'goal_selection',
    'popular_cars_selection',
    'asking_popular_eligibility',
  ],
  popularCarsModels: [
    'goal_selection',
    'popular_cars_selection',
    'showing_popular_models',
  ],
} as const;

/**
 * Validate response follows expected state flow
 */
export function followsStateFlow(
  flowName: keyof typeof STATE_FLOWS,
  stepIndex: number
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const flow = STATE_FLOWS[flowName];
    const expectedState = flow[stepIndex];

    if (!expectedState) {
      return {
        passed: false,
        message: `Invalid step index ${stepIndex} for flow ${flowName}`,
      };
    }

    if (response.state === expectedState) {
      return {
        passed: true,
        message: `Correct state for ${flowName} step ${stepIndex}: ${expectedState}`,
      };
    }

    return {
      passed: false,
      message: `Expected ${expectedState} at step ${stepIndex} of ${flowName}, got ${response.state}`,
    };
  };
}
