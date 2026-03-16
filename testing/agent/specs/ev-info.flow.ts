/**
 * EV Info Flow Specification
 *
 * Flow: goal(ev_info) → ev_topic_selection → showing_ev_info
 *
 * 4 topics:
 * 1. Hybrid vs EV differences
 * 2. New EV law in Tunisia
 * 3. Charging stations
 * 4. Solar panels for charging
 */

import type { FlowSpec, FlowStep } from './types.ts';
import { input, GREETINGS } from './helpers.ts';

// Base steps for all EV flows
const evBaseSteps: FlowStep[] = [
  {
    input: (ctx) => GREETINGS[ctx.language],
    expectedState: 'goal_selection',
    description: 'Greeting shows goal selection',
  },
  {
    input: input('goal', 'ev_info'),
    expectedState: 'ev_topic_selection',
    description: 'Select EV info goal - shows topic options',
  },
];

// Topic 1: Hybrid vs EV
export const evHybridVsEvFlow: FlowSpec = {
  id: 'ev-info-hybrid-vs-ev',
  name: 'EV Info: Hybrid vs Electric',
  languages: ['french', 'arabic', 'derja'],
  tags: ['ev-info', 'educational'],
  steps: [
    ...evBaseSteps,
    {
      input: input('ev_topic', 'hybrid_vs_ev'),
      expectedState: 'showing_ev_info',
      description: 'Select hybrid vs EV topic',
      validateResponse: (response) => {
        const hasHybridInfo = response.message.toLowerCase().includes('hybrid') ||
                            response.message.includes('هيبريد') ||
                            response.message.includes('هجين');
        const hasEvInfo = response.message.toLowerCase().includes('electric') ||
                         response.message.includes('électrique') ||
                         response.message.includes('كهربائ');
        return {
          passed: hasHybridInfo || hasEvInfo,
          message: (hasHybridInfo || hasEvInfo)
            ? 'Hybrid/EV comparison info present'
            : 'Missing hybrid vs EV comparison content',
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

// Topic 2: EV Law
export const evLawFlow: FlowSpec = {
  id: 'ev-info-law',
  name: 'EV Info: New EV Law',
  languages: ['french', 'arabic', 'derja'],
  tags: ['ev-info', 'educational', 'legal'],
  steps: [
    ...evBaseSteps,
    {
      input: input('ev_topic', 'ev_law'),
      expectedState: 'showing_ev_info',
      description: 'Select EV law topic',
      validateResponse: (response) => {
        const hasLawInfo = response.message.toLowerCase().includes('loi') ||
                          response.message.toLowerCase().includes('law') ||
                          response.message.includes('قانون') ||
                          response.message.includes('fiscal') ||
                          response.message.includes('exonération') ||
                          response.message.includes('إعفاء');
        return {
          passed: hasLawInfo,
          message: hasLawInfo
            ? 'EV law info present'
            : 'Missing EV law information',
        };
      },
    },
    {
      input: input('yes_no', 'no'),
      expectedState: 'goal_selection',
      description: 'Return to menu',
    },
  ],
};

// Topic 3: Charging Stations
export const evChargingStationsFlow: FlowSpec = {
  id: 'ev-info-charging',
  name: 'EV Info: Charging Stations',
  languages: ['french', 'arabic', 'derja'],
  tags: ['ev-info', 'educational', 'infrastructure'],
  steps: [
    ...evBaseSteps,
    {
      input: input('ev_topic', 'charging_stations'),
      expectedState: 'showing_ev_info',
      description: 'Select charging stations topic',
      validateResponse: (response) => {
        const hasChargingInfo = response.message.toLowerCase().includes('borne') ||
                               response.message.toLowerCase().includes('charge') ||
                               response.message.toLowerCase().includes('charging') ||
                               response.message.includes('شحن') ||
                               response.message.includes('محطات') ||
                               response.message.includes('steg');
        return {
          passed: hasChargingInfo,
          message: hasChargingInfo
            ? 'Charging stations info present'
            : 'Missing charging stations information',
        };
      },
    },
    {
      input: input('yes_no', 'no'),
      expectedState: 'goal_selection',
      description: 'Return to menu',
    },
  ],
};

// Topic 4: Solar Panels
export const evSolarPanelsFlow: FlowSpec = {
  id: 'ev-info-solar',
  name: 'EV Info: Solar Panels',
  languages: ['french', 'arabic', 'derja'],
  tags: ['ev-info', 'educational', 'solar'],
  steps: [
    ...evBaseSteps,
    {
      input: input('ev_topic', 'solar_panels'),
      expectedState: 'showing_ev_info',
      description: 'Select solar panels topic',
      validateResponse: (response) => {
        const hasSolarInfo = response.message.toLowerCase().includes('solar') ||
                            response.message.toLowerCase().includes('solaire') ||
                            response.message.toLowerCase().includes('panneau') ||
                            response.message.includes('شمس') ||
                            response.message.includes('پانو') ||
                            response.message.includes('ألواح');
        return {
          passed: hasSolarInfo,
          message: hasSolarInfo
            ? 'Solar panels info present'
            : 'Missing solar panels information',
        };
      },
    },
    {
      input: input('yes_no', 'no'),
      expectedState: 'goal_selection',
      description: 'Return to menu',
    },
  ],
};

// EV info flow that transitions to car search
export const evToCarSearchFlow: FlowSpec = {
  id: 'ev-info-to-car-search',
  name: 'EV Info → Electric Car Search',
  languages: ['french', 'arabic', 'derja'],
  tags: ['ev-info', 'car-search', 'transition'],
  steps: [
    ...evBaseSteps,
    {
      input: input('ev_topic', 'ev_law'),
      expectedState: 'showing_ev_info',
      description: 'View EV law info',
    },
    {
      input: input('yes_no', 'yes'),
      expectedState: 'asking_car_origin',
      description: 'Accept car search - transitions to car wizard',
    },
  ],
};
