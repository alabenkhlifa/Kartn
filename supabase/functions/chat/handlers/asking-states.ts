import { updateConversation, getNextState, getPreviousState } from '../state.ts';
import { getTemplate, formatScoredCarResults } from '../templates.ts';
import { parseCarOrigin, parseResidency, parseFcrFamille, parseFuelType, parseCarType, parseCondition, parseBudget, parseBack } from '../parser.ts';
import { retrieve } from '../retrieval.ts';
import { rankCars, getTopRecommendations } from '../scoring.ts';
import { CarSearchFilters } from '../types.ts';
import { HandlerContext, HandlerResult } from './types.ts';

async function handleBackNavigation(ctx: HandlerContext): Promise<HandlerResult | null> {
  const { message, conversation, language, classification, supabase } = ctx;
  if (!parseBack(message)) return null;

  const prev = getPreviousState(conversation.state, conversation);
  if (!prev) return null;

  const updates: Record<string, unknown> = { state: prev.state };
  if (prev.clearField) {
    updates[prev.clearField] = prev.clearField === 'fcr_famille' ? false : null;
  }
  await updateConversation(conversation.id, updates as Partial<Omit<typeof conversation, 'id'>>, supabase);
  return {
    response: {
      message: getTemplate(prev.state, language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: prev.state,
    },
  };
}

export async function handleAskingCarOrigin(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  // Check for back navigation
  const backResult = await handleBackNavigation(ctx);
  if (backResult) return backResult;

  const carOrigin = parseCarOrigin(message);
  if (carOrigin) {
    const newState = getNextState('asking_car_origin', { carOrigin });
    await updateConversation(conversation.id, { state: newState, car_origin: carOrigin }, supabase);
    conversation.car_origin = carOrigin;
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

  return {
    response: {
      message: getTemplate('asking_car_origin', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingResidency(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  // Check for back navigation
  const backResult = await handleBackNavigation(ctx);
  if (backResult) return backResult;

  const residency = parseResidency(message);
  if (residency) {
    const newState = getNextState('asking_residency', { residency });
    await updateConversation(conversation.id, { state: newState, residency }, supabase);
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

  return {
    response: {
      message: getTemplate('asking_residency', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingFcrFamille(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  // Check for back navigation
  const backResult = await handleBackNavigation(ctx);
  if (backResult) return backResult;

  const fcrFamille = parseFcrFamille(message);
  if (fcrFamille !== null) {
    const newState = getNextState('asking_fcr_famille', { hasFcrFamille: true });
    await updateConversation(conversation.id, { state: newState, fcr_famille: fcrFamille }, supabase);
    conversation.fcr_famille = fcrFamille;
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

  return {
    response: {
      message: getTemplate('asking_fcr_famille', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingFuelType(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  // Check for back navigation
  const backResult = await handleBackNavigation(ctx);
  if (backResult) return backResult;

  const fuelType = parseFuelType(message);
  if (fuelType) {
    const newState = getNextState('asking_fuel_type', { hasFuelType: true });
    await updateConversation(conversation.id, { state: newState, fuel_preference: fuelType }, supabase);
    conversation.fuel_preference = fuelType;
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

  return {
    response: {
      message: getTemplate('asking_fuel_type', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingCarType(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase, huggingfaceKey } = ctx;

  // Check for back navigation
  const backResult = await handleBackNavigation(ctx);
  if (backResult) return backResult;

  const carType = parseCarType(message);
  if (carType) {
    const isTunisiaFlow = conversation.car_origin === 'tunisia';
    const newState = getNextState('asking_car_type', { hasCarType: true, isTunisiaFlow });
    await updateConversation(conversation.id, { state: newState, car_type_preference: carType }, supabase);
    conversation.car_type_preference = carType;

    // For Tunisia flow, we go directly to showing_cars
    if (newState === 'showing_cars') {
      // Build search filters for Tunisia flow
      const searchFilters: CarSearchFilters = {
        budget_max: conversation.budget_tnd || undefined,
        country: 'TN', // Local market only
      };

      // Apply fuel type preference
      if (conversation.fuel_preference && conversation.fuel_preference !== 'any') {
        searchFilters.fuel_type = conversation.fuel_preference as 'essence' | 'diesel' | 'electric' | 'hybrid' | 'hybrid_rechargeable';
      }

      // Apply car type preference
      if (carType !== 'any') {
        const carTypeToBodyType: Record<string, string> = {
          suv: 'suv',
          sedan: 'berline',
          compact: 'citadine',
        };
        searchFilters.body_type = (carTypeToBodyType[carType] || carType) as 'suv' | 'berline' | 'citadine' | 'break' | 'monospace' | 'compact';
      }

      // Apply condition preference
      if (conversation.condition_preference && conversation.condition_preference !== 'any') {
        searchFilters.condition = conversation.condition_preference as 'new' | 'used';
      }

      // Search for cars
      const context = await retrieve(
        `voiture budget ${conversation.budget_tnd} TND`,
        'car_search',
        searchFilters,
        supabase,
        huggingfaceKey
      );

      // Score and rank the cars
      const rankedCars = rankCars(context.cars, conversation);
      const topRecommendations = getTopRecommendations(rankedCars, 5);

      const responseMessage = formatScoredCarResults(topRecommendations, language);

      return {
        response: {
          message: responseMessage,
          intent: 'car_search',
          language,
          conversation_id: conversation.id,
          cars: topRecommendations,
          state: 'showing_cars',
        },
      };
    }

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

  return {
    response: {
      message: getTemplate('asking_car_type', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingCondition(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase } = ctx;

  // Check for back navigation
  const backResult = await handleBackNavigation(ctx);
  if (backResult) return backResult;

  const condition = parseCondition(message);
  if (condition) {
    const newState = getNextState('asking_condition', { hasCondition: true });
    await updateConversation(conversation.id, { state: newState, condition_preference: condition }, supabase);
    conversation.condition_preference = condition;
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

  return {
    response: {
      message: getTemplate('asking_condition', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}

export async function handleAskingBudget(ctx: HandlerContext): Promise<HandlerResult> {
  const { message, conversation, language, classification, supabase, huggingfaceKey } = ctx;

  // Check for back navigation
  const backResult = await handleBackNavigation(ctx);
  if (backResult) return backResult;

  const budget = parseBudget(message);
  if (budget) {
    const isTunisiaFlow = conversation.car_origin === 'tunisia';
    const newState = getNextState('asking_budget', { hasBudget: true, isTunisiaFlow });
    await updateConversation(conversation.id, { state: newState, budget_tnd: budget }, supabase);
    conversation.budget_tnd = budget;

    // Tunisia flow: budget -> fuel_type (continue wizard)
    if (isTunisiaFlow) {
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

    // Import flow: budget -> showing_cars (search and show results)
    // Build search filters based on conversation state
    const searchFilters: CarSearchFilters = {
      budget_max: budget,
    };

    // Apply FCR eligibility filters (import flow only)
    if (conversation.residency === 'abroad') {
      // TRE: FCR TRE eligible cars
      searchFilters.fcr_tre_only = true;
    } else if (conversation.residency === 'local' && conversation.fcr_famille) {
      // Tunisia resident with TRE family: FCR Famille eligible cars
      searchFilters.fcr_famille_only = true;
    }

    // Apply fuel type preference
    if (conversation.fuel_preference && conversation.fuel_preference !== 'any') {
      searchFilters.fuel_type = conversation.fuel_preference as 'essence' | 'diesel' | 'electric' | 'hybrid' | 'hybrid_rechargeable';
    }

    // Apply car type preference
    if (conversation.car_type_preference && conversation.car_type_preference !== 'any') {
      // Map our car type preferences to body types
      const carTypeToBodyType: Record<string, string> = {
        suv: 'suv',
        sedan: 'berline',
        compact: 'citadine',
      };
      searchFilters.body_type = (carTypeToBodyType[conversation.car_type_preference] || conversation.car_type_preference) as 'suv' | 'berline' | 'citadine' | 'break' | 'monospace' | 'compact';
    }

    // Apply condition preference (new vs used)
    if (conversation.condition_preference && conversation.condition_preference !== 'any') {
      searchFilters.condition = conversation.condition_preference as 'new' | 'used';
    }

    // Search for cars (returns unranked candidates)
    const context = await retrieve(
      `voiture budget ${budget} TND`,
      'car_search',
      searchFilters,
      supabase,
      huggingfaceKey
    );

    // Score and rank the cars based on multiple criteria
    const rankedCars = rankCars(context.cars, conversation);

    // Get top recommendations with diversity
    const topRecommendations = getTopRecommendations(rankedCars, 5);

    const responseMessage = formatScoredCarResults(topRecommendations, language);

    return {
      response: {
        message: responseMessage,
        intent: 'car_search',
        language,
        conversation_id: conversation.id,
        cars: topRecommendations,
        state: 'showing_cars',
      },
    };
  }

  return {
    response: {
      message: getTemplate('asking_budget', language),
      intent: classification.intent,
      language,
      conversation_id: conversation.id,
      state: conversation.state,
    },
  };
}
