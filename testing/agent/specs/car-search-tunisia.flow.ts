/**
 * Tunisia Car Search Flow Specification
 *
 * Flow: goal → car_origin(tunisia) → condition → budget → fuel → car_type → showing_cars
 */

import type { FlowSpec } from './types.ts';
import { input, GREETINGS } from './helpers.ts';

export const carSearchTunisiaFlow: FlowSpec = {
  id: 'car-search-tunisia',
  name: 'Tunisia Car Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['car-search', 'tunisia', 'core'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting should show goal selection menu',
    },
    {
      input: input('goal', 'find_car'),
      expectedState: 'asking_car_origin',
      description: 'Select "Buy a car" goal',
    },
    {
      input: input('car_origin', 'tunisia'),
      expectedState: 'asking_condition',
      description: 'Select Tunisia origin - goes to condition',
    },
    {
      input: input('condition', 'used'),
      expectedState: 'asking_budget',
      description: 'Select used cars',
    },
    {
      input: input('budget', '90k'),
      expectedState: 'asking_fuel_type',
      description: 'Select 90k budget',
    },
    {
      input: input('fuel_type', 'essence'),
      expectedState: 'asking_car_type',
      description: 'Select essence fuel type',
    },
    {
      input: input('car_type', 'any'),
      expectedState: 'showing_cars',
      description: 'Select any car type - should show results',
    },
  ],
  carValidation: {
    origin: 'tunisia',
  },
};

// Alternative flow with "new" cars
export const carSearchTunisiaNewFlow: FlowSpec = {
  id: 'car-search-tunisia-new',
  name: 'Tunisia Car Search (New Cars)',
  languages: ['french', 'arabic', 'derja'],
  tags: ['car-search', 'tunisia'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting',
    },
    {
      input: input('goal', 'find_car'),
      expectedState: 'asking_car_origin',
      description: 'Select buy a car',
    },
    {
      input: input('car_origin', 'tunisia'),
      expectedState: 'asking_condition',
      description: 'Select Tunisia',
    },
    {
      input: input('condition', 'new'),
      expectedState: 'asking_budget',
      description: 'Select new cars',
    },
    {
      input: input('budget', '150k'),
      expectedState: 'asking_fuel_type',
      description: 'Select 150k budget',
    },
    {
      input: input('fuel_type', 'hybrid'),
      expectedState: 'asking_car_type',
      description: 'Select hybrid fuel',
    },
    {
      input: input('car_type', 'suv'),
      expectedState: 'showing_cars',
      description: 'Select SUV type',
    },
  ],
  carValidation: {
    origin: 'tunisia',
  },
};
