import { updateConversation, getNextState } from '../state.ts';
import { getTemplate } from '../templates.ts';
import { parseYesNo, parseGoal, isGreeting, isReset } from '../parser.ts';
import { Language, ConversationState, Conversation } from '../types.ts';
import { HandlerContext, HandlerResult } from './types.ts';

/**
 * Configuration for a "showing" state with a transition question.
 * All 5 showing states (showing_calculation, showing_procedure_detail,
 * showing_comparison, showing_ev_info, showing_popular_models)
 * follow the identical pattern:
 *   1. Check parseYesNo() -> yes transitions to car search, no returns to menu
 *   2. Check parseGoal(message, true) -> redirect to new goal (strict mode)
 *   3. Check isGreeting()/isReset() -> reset to goal_selection
 *   4. Show retry message
 */
export interface ShowingHandlerConfig {
  /** State to transition to on "yes" */
  yesState: ConversationState;
  /** Fields to update on "yes" */
  yesUpdates: Partial<Omit<Conversation, 'id'>>;
  /** State to transition to on "no" */
  noState: ConversationState;
  /** Fields to update on "no" */
  noUpdates: Partial<Omit<Conversation, 'id'>>;
  /** Retry messages per language when input is unrecognized */
  retryMessages: Record<Language, string>;
  /** Fields to reset when navigating away (greeting/reset/new goal) */
  resetFields: Partial<Omit<Conversation, 'id'>>;
}

export function createShowingHandler(config: ShowingHandlerConfig) {
  return async (ctx: HandlerContext): Promise<HandlerResult> => {
    const { message, conversation, language, supabase } = ctx;

    // 1. Check yes/no response to the transition question
    //    This must come BEFORE parseGoal to avoid "1" being interpreted as find_car goal
    const ready = parseYesNo(message);
    if (ready === true) {
      await updateConversation(conversation.id, {
        state: config.yesState,
        ...config.yesUpdates,
      }, supabase);
      return {
        response: {
          message: getTemplate(config.yesState, language),
          intent: 'general_info',
          language,
          conversation_id: conversation.id,
          state: config.yesState,
        },
      };
    } else if (ready === false) {
      await updateConversation(conversation.id, {
        state: config.noState,
        ...config.noUpdates,
      }, supabase);
      return {
        response: {
          message: getTemplate(config.noState, language),
          intent: 'general_info',
          language,
          conversation_id: conversation.id,
          state: config.noState,
        },
      };
    }

    // 2. Check if user is trying to start a new search (goal-like message) — strict mode
    const newGoal = parseGoal(message, true);
    if (newGoal || isGreeting(message) || isReset(message)) {
      // Reset conversation and handle as new goal selection
      await updateConversation(conversation.id, {
        state: 'goal_selection',
        goal: null,
        ...config.resetFields,
      }, supabase);

      // If it's a specific goal, go directly to next state
      if (newGoal) {
        const nextStateForGoal = getNextState('goal_selection', { goal: newGoal });
        await updateConversation(conversation.id, { state: nextStateForGoal, goal: newGoal }, supabase);
        return {
          response: {
            message: getTemplate(nextStateForGoal, language),
            intent: 'general_info',
            language,
            conversation_id: conversation.id,
            state: nextStateForGoal,
          },
        };
      }

      // For greetings/resets, show goal selection
      return {
        response: {
          message: getTemplate('goal_selection', language),
          intent: 'general_info',
          language,
          conversation_id: conversation.id,
          state: 'goal_selection',
        },
      };
    }

    // 3. Re-show the transition question for unrecognized input
    return {
      response: {
        message: config.retryMessages[language],
        intent: ctx.classification.intent,
        language,
        conversation_id: conversation.id,
        state: conversation.state,
      },
    };
  };
}
