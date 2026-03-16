/**
 * Popular Cars Flow Specification
 *
 * Flow: goal(popular_cars) → popular_cars_selection → (eligibility check OR models)
 */

import type { FlowSpec } from './types.ts';
import { input, GREETINGS } from './helpers.ts';

// Check eligibility flow
export const popularCarsEligibilityFlow: FlowSpec = {
  id: 'popular-cars-eligibility',
  name: 'Popular Cars: Eligibility Check',
  languages: ['french', 'arabic', 'derja'],
  tags: ['popular-cars', 'eligibility', 'core'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting shows goal selection',
    },
    {
      input: input('goal', 'popular_cars'),
      expectedState: 'popular_cars_selection',
      description: 'Select popular cars goal - shows selection options',
    },
    {
      input: input('popular_cars', 'eligibility'),
      expectedState: 'asking_popular_eligibility',
      description: 'Select eligibility check - shows salary level options',
      validateResponse: (response) => {
        // Should mention salary/income thresholds
        const hasEligibilityInfo = response.message.includes('5,283') ||
                                  response.message.includes('7,889') ||
                                  response.message.toLowerCase().includes('revenu') ||
                                  response.message.toLowerCase().includes('salaire') ||
                                  response.message.includes('دخل') ||
                                  response.message.includes('خلاص') ||
                                  response.message.includes('smig');
        return {
          passed: hasEligibilityInfo,
          message: hasEligibilityInfo
            ? 'Eligibility criteria info present'
            : 'Missing eligibility criteria information',
        };
      },
    },
    {
      input: input('salary_level', 'single_eligible'),
      expectedState: 'goal_selection',
      description: 'Select eligible salary - returns to menu with result',
    },
  ],
};

// Eligibility check - not eligible
export const popularCarsNotEligibleFlow: FlowSpec = {
  id: 'popular-cars-not-eligible',
  name: 'Popular Cars: Not Eligible',
  languages: ['french', 'arabic', 'derja'],
  tags: ['popular-cars', 'eligibility'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Start',
    },
    {
      input: input('goal', 'popular_cars'),
      expectedState: 'popular_cars_selection',
      description: 'Popular cars goal',
    },
    {
      input: input('popular_cars', 'eligibility'),
      expectedState: 'asking_popular_eligibility',
      description: 'Check eligibility',
    },
    {
      input: input('salary_level', 'not_eligible'),
      expectedState: 'goal_selection',
      description: 'Select not eligible - returns to menu',
    },
  ],
};

// View models flow
export const popularCarsModelsFlow: FlowSpec = {
  id: 'popular-cars-models',
  name: 'Popular Cars: View Models',
  languages: ['french', 'arabic', 'derja'],
  tags: ['popular-cars', 'models', 'core'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting shows goal selection',
    },
    {
      input: input('goal', 'popular_cars'),
      expectedState: 'popular_cars_selection',
      description: 'Select popular cars goal',
    },
    {
      input: input('popular_cars', 'models'),
      expectedState: 'showing_popular_models',
      description: 'Select view models - shows available subsidized cars',
      validateResponse: (response) => {
        // Should contain car brand/model information
        const hasCarInfo = response.message.toLowerCase().includes('fiat') ||
                          response.message.toLowerCase().includes('citroen') ||
                          response.message.toLowerCase().includes('wallys') ||
                          response.message.toLowerCase().includes('kia') ||
                          response.message.toLowerCase().includes('dacia') ||
                          response.message.toLowerCase().includes('modèle') ||
                          response.message.toLowerCase().includes('model') ||
                          response.message.includes('موديل');
        return {
          passed: hasCarInfo,
          message: hasCarInfo
            ? 'Popular car models info present'
            : 'Missing popular car models information',
        };
      },
    },
    {
      input: input('yes_no', 'no'),
      expectedState: 'goal_selection',
      description: 'Decline car search - return to menu',
    },
  ],
};

// Models flow that transitions to car search
export const popularCarsToSearchFlow: FlowSpec = {
  id: 'popular-cars-to-search',
  name: 'Popular Cars → Car Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['popular-cars', 'car-search', 'transition'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Start',
    },
    {
      input: input('goal', 'popular_cars'),
      expectedState: 'popular_cars_selection',
      description: 'Popular cars',
    },
    {
      input: input('popular_cars', 'models'),
      expectedState: 'showing_popular_models',
      description: 'View models',
    },
    {
      input: input('yes_no', 'yes'),
      expectedState: 'asking_car_origin',
      description: 'Accept car search - transitions to car wizard',
    },
  ],
};
