/**
 * Import TRE Car Search Flow Specification
 *
 * Flow: goal → car_origin(abroad) → residency(abroad/TRE) → fuel → car_type → condition → budget → showing_cars
 */

import type { FlowSpec } from './types.ts';
import { input, GREETINGS } from './helpers.ts';

export const carSearchImportTREFlow: FlowSpec = {
  id: 'car-search-import-tre',
  name: 'Import TRE Car Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['car-search', 'import', 'tre', 'core'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting shows goal selection',
    },
    {
      input: input('goal', 'find_car'),
      expectedState: 'asking_car_origin',
      description: 'Select buy a car',
    },
    {
      input: input('car_origin', 'abroad'),
      expectedState: 'asking_residency',
      description: 'Select abroad origin - asks residency',
    },
    {
      input: input('residency', 'abroad'),
      expectedState: 'asking_fuel_type',
      description: 'TRE residency - skips FCR famille, goes to fuel',
    },
    {
      input: input('fuel_type', 'diesel'),
      expectedState: 'asking_car_type',
      description: 'Select diesel fuel',
    },
    {
      input: input('car_type', 'sedan'),
      expectedState: 'asking_condition',
      description: 'Select sedan type',
    },
    {
      input: input('condition', 'used'),
      expectedState: 'asking_budget',
      description: 'Select used cars',
    },
    {
      input: input('budget', '120k'),
      expectedState: 'showing_cars',
      description: 'Select 120k budget - shows results',
    },
  ],
  carValidation: {
    origin: 'abroad',
    hasFcrInfo: true,
  },
};

// Alternative TRE flow with electric cars
export const carSearchImportTREElectricFlow: FlowSpec = {
  id: 'car-search-import-tre-electric',
  name: 'Import TRE Electric Car Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['car-search', 'import', 'tre', 'electric'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting',
    },
    {
      input: input('goal', 'find_car'),
      expectedState: 'asking_car_origin',
      description: 'Buy a car',
    },
    {
      input: input('car_origin', 'abroad'),
      expectedState: 'asking_residency',
      description: 'Abroad origin',
    },
    {
      input: input('residency', 'abroad'),
      expectedState: 'asking_fuel_type',
      description: 'TRE residency',
    },
    {
      input: input('fuel_type', 'electric'),
      expectedState: 'asking_car_type',
      description: 'Select electric',
    },
    {
      input: input('car_type', 'compact'),
      expectedState: 'asking_condition',
      description: 'Select compact',
    },
    {
      input: input('condition', 'new'),
      expectedState: 'asking_budget',
      description: 'Select new cars',
    },
    {
      input: input('budget', '200k'),
      expectedState: 'showing_cars',
      description: 'Select 200k budget',
    },
  ],
  carValidation: {
    origin: 'abroad',
    hasFcrInfo: true,
  },
};
