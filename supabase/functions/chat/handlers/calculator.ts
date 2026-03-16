import { updateConversation } from '../state.ts';
import { getTemplate, formatCalculationResult } from '../templates.ts';
import { parsePrice, parseEngineCC, parseCalcFuelType } from '../parser.ts';
import { compareFCRRegimes } from '../calculator.ts';
import { HandlerContext, HandlerResult } from './types.ts';

export async function handleAskingCalcPrice(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const price = parsePrice(message);
  if (price) {
    const newState = 'asking_calc_engine';
    await updateConversation(conversation.id, {
      state: newState,
      calc_price_eur: price
    }, supabase);
    return {
      response: {
        message: getTemplate('asking_calc_engine', language),
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  return {
    response: {
      message: getTemplate('asking_calc_price', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingCalcEngine(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const engine = parseEngineCC(message);
  if (engine) {
    const newState = 'asking_calc_fuel';
    await updateConversation(conversation.id, {
      state: newState,
      calc_engine_cc: engine
    }, supabase);
    return {
      response: {
        message: getTemplate('asking_calc_fuel', language),
        intent: classification.intent,
        language,
        conversation_id: conversation.id,
        state: newState,
      },
    };
  }

  return {
    response: {
      message: getTemplate('asking_calc_engine', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingCalcFuel(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  const fuel = parseCalcFuelType(message);
  if (fuel) {
    const newState = 'showing_calculation';
    await updateConversation(conversation.id, {
      state: newState,
      calc_fuel_type: fuel
    }, supabase);

    // Perform calculation - compare all FCR regimes
    const calculation = compareFCRRegimes({
      price_eur: conversation.calc_price_eur || undefined,
      engine_cc: conversation.calc_engine_cc || undefined,
      fuel_type: fuel as 'essence' | 'diesel' | 'electric',
    });

    // Format with "Ready to find a car?" question
    const responseMessage = formatCalculationResult(calculation, language);

    return {
      response: {
        message: responseMessage,
        intent: 'cost_calculation',
        language,
        conversation_id: conversation.id,
        calculation,
        state: 'showing_calculation',
      },
    };
  }

  return {
    response: {
      message: getTemplate('asking_calc_fuel', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}
