/**
 * Cost Calculator Flow Specification
 *
 * Note: Cost calculator is not a separate goal option, it's typically accessed
 * during car search. For this test, we'll test the car search flow that includes
 * showing calculation results.
 *
 * The showing_calculation state happens when users select cars and get cost breakdown.
 */

import type { FlowSpec } from './types.ts';
import { input, GREETINGS } from './helpers.ts';

// Since cost calculator isn't a direct menu option, we'll create flows
// that test the calculation states if they become accessible via another path.
// For now, we focus on the standard car search flows.

export const costCalculatorFlow: FlowSpec = {
  id: 'cost-calculator-via-search',
  name: 'Cost Calculation via Import Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['calculator', 'import'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Start with greeting',
    },
    {
      input: input('goal', 'find_car'),
      expectedState: 'asking_car_origin',
      description: 'Buy a car',
    },
    {
      input: input('car_origin', 'abroad'),
      expectedState: 'asking_residency',
      description: 'Select abroad for import (includes cost calculations)',
    },
    {
      input: input('residency', 'abroad'),
      expectedState: 'asking_fuel_type',
      description: 'TRE status',
    },
    {
      input: input('fuel_type', 'essence'),
      expectedState: 'asking_car_type',
      description: 'Select fuel',
    },
    {
      input: input('car_type', 'sedan'),
      expectedState: 'asking_condition',
      description: 'Select type',
    },
    {
      input: input('condition', 'used'),
      expectedState: 'asking_budget',
      description: 'Select condition',
    },
    {
      input: input('budget', '90k'),
      expectedState: 'showing_cars',
      description: 'Results should include estimated total TND costs',
      validateResponse: (response) => {
        // Verify that import cars show cost estimation
        if (response.cars && response.cars.length > 0) {
          // Message should mention cost/price conversion
          const hasCostInfo = response.message.includes('TND') ||
                             response.message.includes('dinar') ||
                             response.message.includes('€');
          return {
            passed: hasCostInfo,
            message: hasCostInfo
              ? 'Cost info present'
              : 'Missing cost/TND information in response',
          };
        }
        return { passed: true, message: 'No cars to validate' };
      },
    },
  ],
};

// If direct calculator access becomes available:
export const directCalculatorFlow: FlowSpec = {
  id: 'direct-calculator',
  name: 'Direct Cost Calculator',
  languages: ['french', 'arabic', 'derja'],
  tags: ['calculator', 'direct'],
  steps: [
    // This flow would work if there was a direct menu option for calculator
    // Currently commenting out as it's not in the main menu
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Start with greeting',
    },
    // The remaining steps would test:
    // asking_calc_price → asking_calc_engine → asking_calc_fuel → showing_calculation
    // But since calculator isn't a main menu option, we skip this for now
  ],
};
