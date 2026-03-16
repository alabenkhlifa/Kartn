/**
 * Procedure Info Flow Specification
 *
 * Flow: goal(procedure) → procedure_info → showing_procedure_detail
 */

import type { FlowSpec } from './types.ts';
import { input, GREETINGS } from './helpers.ts';

export const procedureFCRTREFlow: FlowSpec = {
  id: 'procedure-fcr-tre',
  name: 'FCR TRE Procedure Info',
  languages: ['french', 'arabic', 'derja'],
  tags: ['procedure', 'fcr-tre', 'core'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting shows goal selection',
    },
    {
      input: input('goal', 'procedure'),
      expectedState: 'procedure_info',
      description: 'Select procedure goal - shows procedure options',
    },
    {
      input: input('procedure', 'fcr_tre'),
      expectedState: 'showing_procedure_detail',
      description: 'Select FCR TRE - shows detailed procedure info',
      validateResponse: (response) => {
        // Should contain TRE-specific information
        const hasTREInfo = response.message.toLowerCase().includes('tre') ||
                         response.message.includes('étranger') ||
                         response.message.includes('الخارج') ||
                         response.message.includes('برّا');
        return {
          passed: hasTREInfo,
          message: hasTREInfo
            ? 'FCR TRE info present'
            : 'Missing FCR TRE specific information',
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

export const procedureFCRFamilleFlow: FlowSpec = {
  id: 'procedure-fcr-famille',
  name: 'FCR Famille Procedure Info',
  languages: ['french', 'arabic', 'derja'],
  tags: ['procedure', 'fcr-famille', 'core'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Greeting shows goal selection',
    },
    {
      input: input('goal', 'procedure'),
      expectedState: 'procedure_info',
      description: 'Select procedure goal',
    },
    {
      input: input('procedure', 'fcr_famille'),
      expectedState: 'showing_procedure_detail',
      description: 'Select FCR Famille - shows Article 55 info',
      validateResponse: (response) => {
        // Should contain Famille-specific information
        const hasFamilleInfo = response.message.toLowerCase().includes('famille') ||
                              response.message.includes('article 55') ||
                              response.message.includes('فصل 55') ||
                              response.message.includes('عائلة') ||
                              response.message.includes('عايلة');
        return {
          passed: hasFamilleInfo,
          message: hasFamilleInfo
            ? 'FCR Famille info present'
            : 'Missing FCR Famille/Article 55 specific information',
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

// Procedure flow that transitions to car search
export const procedureToCarSearchFlow: FlowSpec = {
  id: 'procedure-to-car-search',
  name: 'Procedure Info → Car Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['procedure', 'car-search', 'transition'],
  steps: [
    {
      input: (ctx) => GREETINGS[ctx.language],
      expectedState: 'goal_selection',
      description: 'Start',
    },
    {
      input: input('goal', 'procedure'),
      expectedState: 'procedure_info',
      description: 'Procedure goal',
    },
    {
      input: input('procedure', 'fcr_tre'),
      expectedState: 'showing_procedure_detail',
      description: 'FCR TRE info',
    },
    {
      input: input('yes_no', 'yes'),
      expectedState: 'asking_car_origin',
      description: 'Accept car search - transitions to car wizard',
    },
  ],
};
