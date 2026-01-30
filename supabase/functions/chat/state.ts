import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Conversation, ConversationState, Goal, Language, CarOrigin, Residency, FuelPreference, CarTypePreference, ConditionPreference, CalcFuelType, ProcedureType } from './types.ts';

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
  }
): ConversationState {
  const { goal, carOrigin, residency, isTunisiaFlow, hasFcrFamille, hasFuelType, hasCarType, hasCondition, hasBudget, hasCalcPrice, hasCalcEngine, hasCalcFuel, hasProcedure, transitionToCars } = options || {};

  switch (currentState) {
    case 'goal_selection':
      if (goal === 'find_car') return 'asking_car_origin';
      if (goal === 'calculate_cost') return 'asking_calc_price';
      if (goal === 'procedure') return 'procedure_info';
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

    default:
      return 'goal_selection';
  }
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
  ].includes(state);
}
