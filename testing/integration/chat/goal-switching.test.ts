/**
 * Integration tests for goal switching from showing states
 *
 * Tests that users can switch goals via keywords from showing states
 * (showing_cars, showing_ev_info, showing_comparison, showing_popular_models)
 * without numeric false positives.
 */

import { describe, it } from '../../deps.ts';
import { assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatState } from '../../test-utils/assertions.ts';

// ============================================================================
// Helper to reach showing_cars state (Tunisia flow)
// ============================================================================

async function getShowingCarsState(): Promise<string> {
  const responses = await runConversationFlow([
    'Bonjour',  // goal_selection
    '1',        // find_car → asking_car_origin
    '1',        // tunisia → asking_condition
    '2',        // used → asking_budget
    '80000',    // budget → asking_fuel_type
    '1',        // essence → asking_car_type
    '1',        // sedan → showing_cars
  ]);
  assertChatState(responses[6], 'showing_cars');
  return responses[0].conversation_id!;
}

// ============================================================================
// Helper to reach showing_ev_info state
// ============================================================================

async function getShowingEvInfoState(): Promise<string> {
  const responses = await runConversationFlow([
    'Bonjour',  // goal_selection
    '4',        // ev_info → ev_topic_selection
    '1',        // topic 1 → showing_ev_info
  ]);
  assertChatState(responses[2], 'showing_ev_info');
  return responses[0].conversation_id!;
}

// ============================================================================
// Helper to reach showing_popular_models state
// ============================================================================

async function getShowingPopularModelsState(): Promise<string> {
  const responses = await runConversationFlow([
    'Bonjour',  // goal_selection
    '6',        // popular_cars → popular_cars_selection
    '2',        // see models → showing_popular_models
  ]);
  assertChatState(responses[2], 'showing_popular_models');
  return responses[0].conversation_id!;
}

// ============================================================================
// Bug 1: showing_cars goal switching via keywords
// ============================================================================

describe('Goal Switching - From showing_cars', () => {
  it('should switch to procedure_info when typing "procédure"', async () => {
    const conversationId = await getShowingCarsState();

    const response = await chatApi.send({
      message: 'procédure',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });

  it('should switch to car_comparison_input when typing "comparer"', async () => {
    const conversationId = await getShowingCarsState();

    const response = await chatApi.send({
      message: 'comparer',
      conversation_id: conversationId,
    });

    assertChatState(response, 'car_comparison_input');
  });

  it('should switch to ev_topic_selection when typing "électrique"', async () => {
    const conversationId = await getShowingCarsState();

    const response = await chatApi.send({
      message: 'électrique',
      conversation_id: conversationId,
    });

    assertChatState(response, 'ev_topic_selection');
  });

  it('should NOT switch goal when typing a number like "2"', async () => {
    const conversationId = await getShowingCarsState();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Should stay in showing_cars (LLM follow-up), NOT reset to a different goal
    assertChatState(response, 'showing_cars');
  });

  it('should NOT switch goal when typing "1"', async () => {
    const conversationId = await getShowingCarsState();

    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_cars');
  });

  it('should still reset via greeting', async () => {
    const conversationId = await getShowingCarsState();

    const response = await chatApi.send({
      message: 'Bonjour',
      conversation_id: conversationId,
    });

    assertChatState(response, 'goal_selection');
  });

  it('should switch to procedure via Arabic keyword "إجراءات"', async () => {
    const conversationId = await getShowingCarsState();

    const response = await chatApi.send({
      message: 'إجراءات',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });
});

// ============================================================================
// Goal switching from showing_ev_info
// ============================================================================

describe('Goal Switching - From showing_ev_info', () => {
  it('should switch to procedure_info when typing "procédure"', async () => {
    const conversationId = await getShowingEvInfoState();

    const response = await chatApi.send({
      message: 'procédure',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });

  it('should switch to car_comparison_input when typing "comparer"', async () => {
    const conversationId = await getShowingEvInfoState();

    const response = await chatApi.send({
      message: 'comparer',
      conversation_id: conversationId,
    });

    assertChatState(response, 'car_comparison_input');
  });

  it('should switch to asking_car_origin when typing "acheter"', async () => {
    const conversationId = await getShowingEvInfoState();

    const response = await chatApi.send({
      message: 'acheter',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });
});

// ============================================================================
// Goal switching from showing_popular_models
// ============================================================================

describe('Goal Switching - From showing_popular_models', () => {
  it('should switch to procedure_info when typing "procédure"', async () => {
    const conversationId = await getShowingPopularModelsState();

    const response = await chatApi.send({
      message: 'procédure',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });

  it('should switch to ev_topic_selection when typing "électrique"', async () => {
    const conversationId = await getShowingPopularModelsState();

    const response = await chatApi.send({
      message: 'électrique',
      conversation_id: conversationId,
    });

    assertChatState(response, 'ev_topic_selection');
  });
});
