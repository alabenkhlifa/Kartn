/**
 * Import FCR Famille Car Search Flow Specification
 *
 * Flow: goal → car_origin(abroad) → residency(local) → fcr_famille(yes) → fuel → car_type → condition → budget → showing_cars
 */

import type { FlowSpec } from './types.ts';
import { input, GREETINGS } from './helpers.ts';

export const carSearchImportFCRFlow: FlowSpec = {
  id: 'car-search-import-fcr-famille',
  name: 'Import FCR Famille Car Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['car-search', 'import', 'fcr-famille', 'core'],
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
      description: 'Select abroad origin',
    },
    {
      input: input('residency', 'local'),
      expectedState: 'asking_fcr_famille',
      description: 'Local residency - asks about FCR famille',
    },
    {
      input: input('fcr_famille', 'yes'),
      expectedState: 'asking_fuel_type',
      description: 'Has TRE family member - goes to fuel',
    },
    {
      input: input('fuel_type', 'essence'),
      expectedState: 'asking_car_type',
      description: 'Select essence fuel',
    },
    {
      input: input('car_type', 'compact'),
      expectedState: 'asking_condition',
      description: 'Select compact type',
    },
    {
      input: input('condition', 'used'),
      expectedState: 'asking_budget',
      description: 'Select used cars',
    },
    {
      input: input('budget', '70k'),
      expectedState: 'showing_cars',
      description: 'Select 70k budget - shows results',
    },
  ],
  carValidation: {
    origin: 'abroad',
    hasFcrInfo: true,
  },
};

// FCR Famille flow with NO TRE family member (should still work)
export const carSearchImportNoFCRFlow: FlowSpec = {
  id: 'car-search-import-no-fcr',
  name: 'Import Without FCR Famille',
  languages: ['french', 'arabic', 'derja'],
  tags: ['car-search', 'import'],
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
      input: input('residency', 'local'),
      expectedState: 'asking_fcr_famille',
      description: 'Local residency',
    },
    {
      input: input('fcr_famille', 'no'),
      expectedState: 'asking_fuel_type',
      description: 'No TRE family - still continues to fuel',
    },
    {
      input: input('fuel_type', 'diesel'),
      expectedState: 'asking_car_type',
      description: 'Select diesel',
    },
    {
      input: input('car_type', 'suv'),
      expectedState: 'asking_condition',
      description: 'Select SUV',
    },
    {
      input: input('condition', 'any'),
      expectedState: 'asking_budget',
      description: 'Select any condition',
    },
    {
      input: input('budget', '150k'),
      expectedState: 'showing_cars',
      description: 'Select 150k budget',
    },
  ],
  carValidation: {
    origin: 'abroad',
    hasFcrInfo: true,
  },
};
