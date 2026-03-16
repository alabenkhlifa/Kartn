import { ConversationState } from '../types.ts';
import { getTemplate } from '../templates.ts';
import { StateHandler } from './types.ts';

import { handleGoalSelection } from './goal-selection.ts';
import {
  handleAskingCarOrigin,
  handleAskingResidency,
  handleAskingFcrFamille,
  handleAskingFuelType,
  handleAskingCarType,
  handleAskingCondition,
  handleAskingBudget,
} from './asking-states.ts';
import { handleShowingCars } from './showing-cars.ts';
import {
  handleShowingCalculation,
  handleShowingProcedureDetail,
  handleShowingComparison,
  handleShowingEvInfo,
  handleShowingPopularModels,
} from './showing-transition.ts';
import { handleProcedureInfo } from './procedure.ts';
import { handleEvTopicSelection } from './ev-info.ts';
import { handlePopularCarsSelection, handleAskingPopularEligibility } from './popular-cars.ts';
import { handleCarComparisonInput } from './comparison.ts';
import { handleAskingCalcPrice, handleAskingCalcEngine, handleAskingCalcFuel } from './calculator.ts';

const HANDLER_REGISTRY: Partial<Record<ConversationState, StateHandler>> = {
  goal_selection: handleGoalSelection,
  asking_car_origin: handleAskingCarOrigin,
  asking_residency: handleAskingResidency,
  asking_fcr_famille: handleAskingFcrFamille,
  asking_fuel_type: handleAskingFuelType,
  asking_car_type: handleAskingCarType,
  asking_condition: handleAskingCondition,
  asking_budget: handleAskingBudget,
  showing_cars: handleShowingCars,
  asking_calc_price: handleAskingCalcPrice,
  asking_calc_engine: handleAskingCalcEngine,
  asking_calc_fuel: handleAskingCalcFuel,
  showing_calculation: handleShowingCalculation,
  procedure_info: handleProcedureInfo,
  showing_procedure_detail: handleShowingProcedureDetail,
  car_comparison_input: handleCarComparisonInput,
  showing_comparison: handleShowingComparison,
  ev_topic_selection: handleEvTopicSelection,
  showing_ev_info: handleShowingEvInfo,
  popular_cars_selection: handlePopularCarsSelection,
  asking_popular_eligibility: handleAskingPopularEligibility,
  showing_popular_models: handleShowingPopularModels,
};

/**
 * Get the handler function for a given conversation state.
 * Falls back to a default handler that shows goal_selection.
 */
export function getHandler(state: ConversationState): StateHandler {
  const handler = HANDLER_REGISTRY[state];
  if (handler) return handler;

  // Default handler: show goal_selection template
  return async (ctx) => ({
    response: {
      message: getTemplate('goal_selection', ctx.language),
      intent: ctx.classification.intent,
      language: ctx.language,
      conversation_id: ctx.conversation.id,
      state: 'goal_selection',
    },
  });
}
