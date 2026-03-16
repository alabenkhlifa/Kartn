import { updateConversation, getNextState } from '../state.ts';
import { getTemplate } from '../templates.ts';
import { isGreeting, isReset, parseGoal } from '../parser.ts';
import { generateResponse, getOffTopicResponse } from '../generator.ts';
import { retrieve } from '../retrieval.ts';
import { ChatResponse } from '../types.ts';
import { HandlerContext, HandlerResult } from './types.ts';

export async function handleShowingCars(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase, groqApiKey, huggingfaceKey } = ctx;

  // Check for greetings/resets to navigate out
  if (isGreeting(message) || isReset(message)) {
    await updateConversation(conversation.id, {
      state: 'goal_selection',
      goal: null,
      car_origin: null,
      residency: null,
      fcr_famille: false,
      fuel_preference: null,
      car_type_preference: null,
      condition_preference: null,
      budget_tnd: null,
    }, supabase);

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

  // Allow keyword-based goal switching (strict mode prevents numeric false positives)
  const newGoal = parseGoal(message, true);
  if (newGoal) {
    await updateConversation(conversation.id, {
      state: 'goal_selection',
      goal: null,
      car_origin: null,
      residency: null,
      fcr_famille: false,
      fuel_preference: null,
      car_type_preference: null,
      condition_preference: null,
      budget_tnd: null,
    }, supabase);
    const nextState = getNextState('goal_selection', { goal: newGoal });
    await updateConversation(conversation.id, { state: nextState, goal: newGoal }, supabase);
    return {
      response: {
        message: getTemplate(nextState, language),
        intent: 'general_info',
        language,
        conversation_id: conversation.id,
        state: nextState,
      },
    };
  }

  // For showing_cars, use the full LLM flow for follow-up questions
  if (classification.intent === 'off_topic') {
    return {
      response: {
        message: getOffTopicResponse(language),
        intent: 'off_topic',
        language,
        conversation_id: conversation.id,
        state: 'showing_cars',
      },
    };
  }

  // Retrieve context and generate response
  const context = await retrieve(
    message,
    classification.intent,
    classification.filters,
    supabase,
    huggingfaceKey
  );

  const { message: llmResponse, calculation, suggestions } = await generateResponse(
    message,
    classification,
    context,
    groqApiKey,
    ctx.messageHistory,
    supabase
  );

  const response: ChatResponse = {
    message: llmResponse,
    intent: classification.intent,
    language,
    conversation_id: conversation.id,
    state: 'showing_cars',
  };

  if (context.knowledge_chunks.length > 0) {
    response.sources = [...new Set(context.knowledge_chunks.map((c) => c.source))];
  }

  if (context.cars.length > 0) {
    response.cars = context.cars;
  }

  if (calculation) {
    response.calculation = calculation;
  }

  if (suggestions) {
    response.suggestions = suggestions;
  }

  return { response };
}
