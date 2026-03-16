import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Conversation, ConversationState, Goal, Language, CarOrigin, Residency, FuelPreference, CarTypePreference, ConditionPreference, CalcFuelType, ProcedureType, EVTopic } from './types.ts';

/**
 * Get or create a conversation
 */
export async function getOrCreateConversation(
  conversationId: string | undefined,
  supabase: SupabaseClient
): Promise<Conversation> {
  if (conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!error && data) {
      // Check for stale conversation (>30min old in asking_* state)
      const updatedAt = new Date(data.updated_at);
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const isStale = updatedAt < thirtyMinAgo && (data.state as string).startsWith('asking_');

      if (isStale) {
        // Reset stale conversation
        await supabase
          .from('conversations')
          .update({ state: 'goal_selection', goal: null, car_origin: null, residency: null, fcr_famille: false, fuel_preference: null, car_type_preference: null, condition_preference: null, budget_tnd: null })
          .eq('id', data.id);

        return {
          id: data.id,
          state: 'goal_selection' as ConversationState,
          goal: null,
          car_origin: null,
          residency: null,
          fcr_famille: false,
          fuel_preference: null,
          car_type_preference: null,
          condition_preference: null,
          budget_tnd: null,
          language: (data.language || 'french') as Language,
          calc_price_eur: null,
          calc_engine_cc: null,
          calc_fuel_type: null as CalcFuelType | null,
          selected_procedure: null as ProcedureType | null,
          selected_ev_topic: null as EVTopic | null,
          comparison_query: null,
        };
      }

      return {
        id: data.id,
        state: data.state as ConversationState,
        goal: data.goal as Goal | null,
        car_origin: data.car_origin as CarOrigin | null,
        residency: data.residency as Residency | null,
        fcr_famille: data.fcr_famille ?? false,
        fuel_preference: data.fuel_preference as FuelPreference | null,
        car_type_preference: data.car_type_preference as CarTypePreference | null,
        condition_preference: data.condition_preference as ConditionPreference | null,
        budget_tnd: data.budget_tnd,
        language: (data.language || 'french') as Language,
        calc_price_eur: data.calc_price_eur ?? null,
        calc_engine_cc: data.calc_engine_cc ?? null,
        calc_fuel_type: data.calc_fuel_type as CalcFuelType | null,
        selected_procedure: data.selected_procedure as ProcedureType | null,
        selected_ev_topic: data.selected_ev_topic as EVTopic | null,
        comparison_query: data.comparison_query ?? null,
      };
    }
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({ state: 'goal_selection' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return {
    id: data.id,
    state: 'goal_selection',
    goal: null,
    car_origin: null,
    residency: null,
    fcr_famille: false,
    fuel_preference: null,
    car_type_preference: null,
    condition_preference: null,
    budget_tnd: null,
    language: 'french',
    calc_price_eur: null,
    calc_engine_cc: null,
    calc_fuel_type: null,
    selected_procedure: null,
    selected_ev_topic: null,
    comparison_query: null,
  };
}

/**
 * Update conversation state
 */
export async function updateConversation(
  conversationId: string,
  updates: Partial<Omit<Conversation, 'id'>>,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId);

  if (error) {
    console.error('Failed to update conversation:', error);
  }
}

/**
 * State transition logic
 *
 * Two flows based on car origin:
 *
 * Tunisia flow: car_origin → condition → budget → fuel → car_type → cars
 * Import flow: car_origin → residency → fcr_famille (if local) → fuel → car_type → condition → budget → cars
 *
 * New flows:
 * Compare cars: car_comparison_input → showing_comparison
 * EV info: ev_topic_selection → showing_ev_info
 * Browse offers: same as find_car flow
 * Popular cars: popular_cars_selection → (eligibility check OR models)
 */
export function getNextState(
  currentState: ConversationState,
  options?: {
    goal?: Goal;
    carOrigin?: CarOrigin;
    residency?: Residency;
    isTunisiaFlow?: boolean;
    hasFcrFamille?: boolean;
    hasFuelType?: boolean;
    hasCarType?: boolean;
    hasCondition?: boolean;
    hasBudget?: boolean;
    hasCalcPrice?: boolean;
    hasCalcEngine?: boolean;
    hasCalcFuel?: boolean;
    hasProcedure?: boolean;
    transitionToCars?: boolean;
    hasComparisonQuery?: boolean;
    hasEVTopic?: boolean;
    popularSelection?: 'eligibility' | 'models';
  }
): ConversationState {
  const { goal, carOrigin, residency, isTunisiaFlow, hasFcrFamille, hasFuelType, hasCarType, hasCondition, hasBudget, hasCalcPrice, hasCalcEngine, hasCalcFuel, hasProcedure, transitionToCars, hasComparisonQuery, hasEVTopic, popularSelection } = options || {};

  switch (currentState) {
    case 'goal_selection':
      if (goal === 'find_car') return 'asking_car_origin';
      if (goal === 'procedure') return 'procedure_info';
      if (goal === 'compare_cars') return 'car_comparison_input';
      if (goal === 'ev_info') return 'ev_topic_selection';
      if (goal === 'browse_offers') return 'asking_car_origin'; // Same wizard as find_car
      if (goal === 'popular_cars') return 'popular_cars_selection';
      return 'goal_selection';

    case 'asking_car_origin':
      // Tunisia origin → condition (shorter local flow)
      // Abroad origin → residency (import flow)
      if (carOrigin === 'tunisia') return 'asking_condition';
      if (carOrigin === 'abroad') return 'asking_residency';
      return 'asking_car_origin';

    case 'asking_residency':
      // Import flow only
      // Tunisia residents → ask about FCR Famille
      // TRE → skip to fuel type
      if (residency === 'local') return 'asking_fcr_famille';
      if (residency === 'abroad') return 'asking_fuel_type';
      return 'asking_residency';

    case 'asking_fcr_famille':
      // Import flow only
      if (hasFcrFamille !== undefined) return 'asking_fuel_type';
      return 'asking_fcr_famille';

    case 'asking_fuel_type':
      // Both flows: fuel_type → car_type
      if (hasFuelType) return 'asking_car_type';
      return 'asking_fuel_type';

    case 'asking_car_type':
      // Tunisia flow: car_type → showing_cars (we already have condition & budget)
      // Import flow: car_type → condition → budget → showing_cars
      if (hasCarType) {
        if (isTunisiaFlow) return 'showing_cars';
        return 'asking_condition';
      }
      return 'asking_car_type';

    case 'asking_condition':
      // Tunisia flow: condition → budget → fuel → car_type → cars
      // Import flow: condition → budget → cars
      if (hasCondition) return 'asking_budget';
      return 'asking_condition';

    case 'asking_budget':
      // Tunisia flow: budget → fuel_type
      // Import flow: budget → showing_cars
      if (hasBudget) {
        if (isTunisiaFlow) return 'asking_fuel_type';
        return 'showing_cars';
      }
      return 'asking_budget';

    case 'showing_cars':
      return 'showing_cars';

    // Cost calculator flow
    case 'asking_calc_price':
      if (hasCalcPrice) return 'asking_calc_engine';
      return 'asking_calc_price';

    case 'asking_calc_engine':
      if (hasCalcEngine) return 'asking_calc_fuel';
      return 'asking_calc_engine';

    case 'asking_calc_fuel':
      if (hasCalcFuel) return 'showing_calculation';
      return 'asking_calc_fuel';

    case 'showing_calculation':
      if (transitionToCars) return 'asking_car_origin';
      return 'goal_selection';

    // Procedure info flow
    case 'procedure_info':
      if (hasProcedure) return 'showing_procedure_detail';
      return 'procedure_info';

    case 'showing_procedure_detail':
      if (transitionToCars) return 'asking_car_origin';
      return 'goal_selection';

    // Compare cars flow
    case 'car_comparison_input':
      if (hasComparisonQuery) return 'showing_comparison';
      return 'car_comparison_input';

    case 'showing_comparison':
      if (transitionToCars) return 'asking_car_origin';
      return 'goal_selection';

    // EV info flow
    case 'ev_topic_selection':
      if (hasEVTopic) return 'showing_ev_info';
      return 'ev_topic_selection';

    case 'showing_ev_info':
      if (transitionToCars) return 'asking_car_origin';
      return 'goal_selection';

    // Browse offers flow uses same states as find_car
    case 'browse_origin_selection':
      if (carOrigin === 'tunisia') return 'asking_condition';
      if (carOrigin === 'abroad') return 'asking_residency';
      return 'browse_origin_selection';

    // Popular cars flow
    case 'popular_cars_selection':
      if (popularSelection === 'eligibility') return 'asking_popular_eligibility';
      if (popularSelection === 'models') return 'showing_popular_models';
      return 'popular_cars_selection';

    case 'asking_popular_eligibility':
      return 'goal_selection'; // After showing eligibility result

    case 'showing_popular_models':
      if (transitionToCars) return 'asking_car_origin';
      return 'goal_selection';

    default:
      return 'goal_selection';
  }
}

/**
 * Get the previous state for backtracking.
 * Returns the previous state and the field to clear.
 */
export function getPreviousState(
  currentState: ConversationState,
  conversation: { car_origin?: string | null; goal?: string | null }
): { state: ConversationState; clearField: string | null } | null {
  const isTunisiaFlow = conversation.car_origin === 'tunisia';

  switch (currentState) {
    case 'asking_car_origin':
      return { state: 'goal_selection', clearField: 'car_origin' };

    case 'asking_residency':
      return { state: 'asking_car_origin', clearField: 'residency' };

    case 'asking_fcr_famille':
      return { state: 'asking_residency', clearField: 'fcr_famille' };

    case 'asking_fuel_type':
      if (isTunisiaFlow) {
        return { state: 'asking_budget', clearField: 'fuel_preference' };
      }
      // Import flow: fuel comes after residency or fcr_famille
      return { state: 'asking_residency', clearField: 'fuel_preference' };

    case 'asking_car_type':
      return { state: 'asking_fuel_type', clearField: 'car_type_preference' };

    case 'asking_condition':
      if (isTunisiaFlow) {
        return { state: 'asking_car_origin', clearField: 'condition_preference' };
      }
      return { state: 'asking_car_type', clearField: 'condition_preference' };

    case 'asking_budget':
      if (isTunisiaFlow) {
        return { state: 'asking_condition', clearField: 'budget_tnd' };
      }
      return { state: 'asking_condition', clearField: 'budget_tnd' };

    // Calculator flow
    case 'asking_calc_price':
      return { state: 'goal_selection', clearField: 'calc_price_eur' };
    case 'asking_calc_engine':
      return { state: 'asking_calc_price', clearField: 'calc_engine_cc' };
    case 'asking_calc_fuel':
      return { state: 'asking_calc_engine', clearField: 'calc_fuel_type' };

    default:
      return null;
  }
}

/**
 * Get the first unanswered state in the wizard flow.
 * Used when filters are pre-populated from natural language input.
 */
export function getFirstUnansweredState(
  conversation: Conversation
): ConversationState {
  const isTunisiaFlow = conversation.car_origin === 'tunisia';
  const isImportFlow = conversation.car_origin === 'abroad';

  // Check car origin
  if (!conversation.car_origin) return 'asking_car_origin';

  if (isTunisiaFlow) {
    // Tunisia flow: car_origin → condition → budget → fuel → car_type → cars
    if (!conversation.condition_preference) return 'asking_condition';
    if (!conversation.budget_tnd) return 'asking_budget';
    if (!conversation.fuel_preference) return 'asking_fuel_type';
    if (!conversation.car_type_preference) return 'asking_car_type';
    return 'showing_cars';
  }

  if (isImportFlow) {
    // Import flow: car_origin → residency → fcr_famille (if local) → fuel → car_type → condition → budget → cars
    if (!conversation.residency) return 'asking_residency';
    if (conversation.residency === 'local' && !conversation.fcr_famille) return 'asking_fcr_famille';
    if (!conversation.fuel_preference) return 'asking_fuel_type';
    if (!conversation.car_type_preference) return 'asking_car_type';
    if (!conversation.condition_preference) return 'asking_condition';
    if (!conversation.budget_tnd) return 'asking_budget';
    return 'showing_cars';
  }

  return 'asking_car_origin';
}

/**
 * Check if a state needs a question (template response)
 */
export function needsQuestion(state: ConversationState): boolean {
  return [
    'goal_selection',
    'asking_car_origin',
    'asking_residency',
    'asking_fcr_famille',
    'asking_fuel_type',
    'asking_car_type',
    'asking_condition',
    'asking_budget',
    'asking_calc_price',
    'asking_calc_engine',
    'asking_calc_fuel',
    'procedure_info',
    'car_comparison_input',
    'ev_topic_selection',
    'browse_origin_selection',
    'popular_cars_selection',
    'asking_popular_eligibility',
  ].includes(state);
}
