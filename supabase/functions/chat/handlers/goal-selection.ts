import { updateConversation, getNextState, getFirstUnansweredState } from '../state.ts';
import { getTemplate } from '../templates.ts';
import { parseGoal } from '../parser.ts';
import { FuelPreference, CarTypePreference, ConditionPreference } from '../types.ts';
import { HandlerContext, HandlerResult } from './types.ts';

export async function handleGoalSelection(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const goal = parseGoal(message);
  if (goal) {
    if (goal === 'find_car' || goal === 'browse_offers') {
      // Pre-populate filters from classification if available
      const filters = classification.filters;
      const updates: Record<string, unknown> = { goal };

      if (filters) {
        // Map extracted filters to conversation fields
        if (filters.fuel_type) {
          const fuelMap: Record<string, string> = {
            essence: 'essence',
            diesel: 'diesel',
            electric: 'electric',
            hybrid: 'hybrid',
            hybrid_rechargeable: 'hybrid_rechargeable',
          };
          if (fuelMap[filters.fuel_type]) {
            updates.fuel_preference = fuelMap[filters.fuel_type];
            conversation.fuel_preference = fuelMap[filters.fuel_type] as FuelPreference;
          }
        }
        if (filters.budget_max) {
          updates.budget_tnd = filters.budget_max;
          conversation.budget_tnd = filters.budget_max;
        }
        if (filters.body_type) {
          const bodyMap: Record<string, string> = {
            suv: 'suv',
            berline: 'sedan',
            citadine: 'compact',
          };
          if (bodyMap[filters.body_type]) {
            updates.car_type_preference = bodyMap[filters.body_type];
            conversation.car_type_preference = bodyMap[filters.body_type] as CarTypePreference;
          }
        }
        if (filters.condition) {
          updates.condition_preference = filters.condition === 'new' ? 'new' : 'used';
          conversation.condition_preference = (filters.condition === 'new' ? 'new' : 'used') as ConditionPreference;
        }
      }

      // Find the first unanswered state
      const nextState = getFirstUnansweredState(conversation);
      updates.state = nextState;

      await updateConversation(conversation.id, updates as Partial<Omit<typeof conversation, 'id'>>, supabase);

      return {
        response: {
          message: getTemplate(nextState, language),
          intent: classification.intent,
          language,
          conversation_id: conversation.id,
          state: nextState,
        },
      };
    }

    const newState = getNextState('goal_selection', { goal });
    await updateConversation(conversation.id, { state: newState, goal }, supabase);
    return {
      response: {
        message: getTemplate(newState, language),
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  // Didn't understand, show options again
  return {
    response: {
      message: getTemplate('goal_selection', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}
