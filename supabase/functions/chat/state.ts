import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Conversation, ConversationState, Goal, Language, Residency, FuelPreference, CarTypePreference, ConditionPreference } from './types.ts';

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
        residency: data.residency as Residency | null,
        fcr_famille: data.fcr_famille ?? false,
        fuel_preference: data.fuel_preference as FuelPreference | null,
        car_type_preference: data.car_type_preference as CarTypePreference | null,
        condition_preference: data.condition_preference as ConditionPreference | null,
        budget_tnd: data.budget_tnd,
        language: (data.language || 'french') as Language,
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
    residency: null,
    fcr_famille: false,
    fuel_preference: null,
    car_type_preference: null,
    condition_preference: null,
    budget_tnd: null,
    language: 'french',
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
 */
export function getNextState(
  currentState: ConversationState,
  options?: {
    goal?: Goal;
    residency?: Residency;
    hasFcrFamille?: boolean;
    hasFuelType?: boolean;
    hasCarType?: boolean;
    hasCondition?: boolean;
    hasBudget?: boolean;
  }
): ConversationState {
  const { goal, residency, hasFcrFamille, hasFuelType, hasCarType, hasCondition, hasBudget } = options || {};

  switch (currentState) {
    case 'goal_selection':
      if (goal === 'find_car') return 'asking_residency';
      if (goal === 'calculate_cost') return 'cost_calculator';
      if (goal === 'procedure') return 'procedure_info';
      return 'goal_selection';

    case 'asking_residency':
      // Tunisia residents → ask about FCR Famille
      // TRE → skip to fuel type
      if (residency === 'local') return 'asking_fcr_famille';
      if (residency === 'abroad') return 'asking_fuel_type';
      return 'asking_residency';

    case 'asking_fcr_famille':
      if (hasFcrFamille !== undefined) return 'asking_fuel_type';
      return 'asking_fcr_famille';

    case 'asking_fuel_type':
      if (hasFuelType) return 'asking_car_type';
      return 'asking_fuel_type';

    case 'asking_car_type':
      if (hasCarType) return 'asking_condition';
      return 'asking_car_type';

    case 'asking_condition':
      if (hasCondition) return 'asking_budget';
      return 'asking_condition';

    case 'asking_budget':
      if (hasBudget) return 'showing_cars';
      return 'asking_budget';

    case 'showing_cars':
      return 'showing_cars';

    case 'cost_calculator':
      return 'cost_calculator';

    case 'procedure_info':
      return 'procedure_info';

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
    'asking_residency',
    'asking_fcr_famille',
    'asking_fuel_type',
    'asking_car_type',
    'asking_condition',
    'asking_budget',
  ].includes(state);
}
