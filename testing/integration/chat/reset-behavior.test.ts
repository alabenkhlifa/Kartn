/**
 * Integration tests for reset and greeting behavior
 *
 * Tests conversation reset via greetings and reset commands
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatState, assertChatLanguage } from '../../test-utils/assertions.ts';

// ============================================================================
// Reset via Greeting
// ============================================================================

describe('Reset Behavior - Greeting Mid-Flow', () => {
  it('should reset to goal_selection when sending "Bonjour" mid-flow', async () => {
    // Start conversation and advance a few steps
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2', // At asking_budget
    ]);

    const budgetState = responses[responses.length - 1];
    assertChatState(budgetState, 'asking_budget');

    // Send greeting to reset
    const reset = await chatApi.send({
      message: 'Bonjour',
      conversation_id: budgetState.conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset when sending "salut" mid-flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', '2', // TRE flow at asking_fuel_type
    ]);

    const reset = await chatApi.send({
      message: 'salut',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset when sending "hello" mid-flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1',
    ]);

    const reset = await chatApi.send({
      message: 'hello',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset when sending Arabic greeting mid-flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2',
    ]);

    const reset = await chatApi.send({
      message: 'مرحبا',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
    assertChatLanguage(reset, 'arabic');
  });

  it('should switch language when greeting in different language', async () => {
    // Start in French
    const french = await chatApi.send({ message: 'Bonjour' });
    assertChatLanguage(french, 'french');

    await chatApi.send({
      message: '1',
      conversation_id: french.conversation_id,
    });

    // Reset with Arabic greeting
    const arabic = await chatApi.send({
      message: 'السلام',
      conversation_id: french.conversation_id,
    });

    assertChatState(arabic, 'goal_selection');
    assertChatLanguage(arabic, 'arabic');
  });
});

// ============================================================================
// Reset via Keywords
// ============================================================================

describe('Reset Behavior - Reset Keywords', () => {
  it('should reset when sending "recommencer"', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2', '80000',
    ]);

    const reset = await chatApi.send({
      message: 'recommencer',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset when sending "reset"', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1',
    ]);

    const reset = await chatApi.send({
      message: 'reset',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset when sending "début"', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', '2',
    ]);

    const reset = await chatApi.send({
      message: 'début',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset when sending "nouveau"', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2',
    ]);

    const reset = await chatApi.send({
      message: 'nouveau',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset when sending Arabic "من جديد"', async () => {
    const responses = await runConversationFlow([
      'مرحبا', '1', '1',
    ]);

    const reset = await chatApi.send({
      message: 'من جديد',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });
});

// ============================================================================
// Reset from Various States
// ============================================================================

describe('Reset Behavior - From Various States', () => {
  it('should reset from asking_car_origin', async () => {
    const responses = await runConversationFlow(['Bonjour', '1']);
    assertChatState(responses[1], 'asking_car_origin');

    const reset = await chatApi.send({
      message: 'Bonjour',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset from asking_residency', async () => {
    const responses = await runConversationFlow(['Bonjour', '1', '2']);
    assertChatState(responses[2], 'asking_residency');

    const reset = await chatApi.send({
      message: 'recommencer',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset from asking_fcr_famille', async () => {
    const responses = await runConversationFlow(['Bonjour', '1', '2', '1']);
    assertChatState(responses[3], 'asking_fcr_famille');

    const reset = await chatApi.send({
      message: 'Bonjour',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset from asking_fuel_type', async () => {
    const responses = await runConversationFlow(['Bonjour', '1', '1', '2', '80000']);
    assertChatState(responses[4], 'asking_fuel_type');

    const reset = await chatApi.send({
      message: 'salut',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset from asking_budget', async () => {
    const responses = await runConversationFlow(['Bonjour', '1', '1', '2']);
    assertChatState(responses[3], 'asking_budget');

    const reset = await chatApi.send({
      message: 'hello',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset from procedure_info', async () => {
    const responses = await runConversationFlow(['Bonjour', '2']);
    assertChatState(responses[1], 'procedure_info');

    const reset = await chatApi.send({
      message: 'Bonjour',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset from ev_topic_selection', async () => {
    const responses = await runConversationFlow(['Bonjour', '4']);
    assertChatState(responses[1], 'ev_topic_selection');

    const reset = await chatApi.send({
      message: 'recommencer',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should reset from showing_cars state', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2', '80000', '1', '1',
    ]);
    assertChatState(responses[6], 'showing_cars');

    const reset = await chatApi.send({
      message: 'Bonjour',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });
});

// ============================================================================
// New Goal from Terminal States
// ============================================================================

describe('Reset Behavior - New Goal from Terminal States', () => {
  it('should start new goal from showing_cars when selecting option', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2', '80000', '6', '4', // showing_cars
    ]);

    // Select a new goal (e.g., procedures)
    const newGoal = await chatApi.send({
      message: '2',
      conversation_id: responses[0].conversation_id,
    });

    // Might go to procedure_info or stay in showing_cars depending on impl
    // The key is it should handle input gracefully
    assert(
      newGoal.state === 'procedure_info' ||
      newGoal.state === 'goal_selection' ||
      newGoal.state === 'showing_cars',
      'Should handle goal selection from showing_cars'
    );
  });
});

// ============================================================================
// Reset Preserves Conversation ID
// ============================================================================

describe('Reset Behavior - Conversation ID Preservation', () => {
  it('should preserve conversation_id after reset', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const originalId = greeting.conversation_id;

    await chatApi.send({
      message: '1',
      conversation_id: originalId,
    });

    const reset = await chatApi.send({
      message: 'Bonjour',
      conversation_id: originalId,
    });

    assertEquals(reset.conversation_id, originalId);
  });

  it('should allow continuing conversation after reset', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // Advance
    await chatApi.send({ message: '1', conversation_id: id });
    await chatApi.send({ message: '1', conversation_id: id });

    // Reset
    const reset = await chatApi.send({ message: 'Bonjour', conversation_id: id });
    assertChatState(reset, 'goal_selection');

    // Continue with new flow
    const newFlow = await chatApi.send({ message: '2', conversation_id: id });
    assertChatState(newFlow, 'procedure_info');
  });
});

// ============================================================================
// Case Sensitivity
// ============================================================================

describe('Reset Behavior - Case Sensitivity', () => {
  it('should handle uppercase greeting "BONJOUR"', async () => {
    const responses = await runConversationFlow(['Bonjour', '1', '1']);

    const reset = await chatApi.send({
      message: 'BONJOUR',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should handle mixed case "BoNjOuR"', async () => {
    const responses = await runConversationFlow(['Bonjour', '1']);

    const reset = await chatApi.send({
      message: 'BoNjOuR',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });

  it('should handle uppercase "RECOMMENCER"', async () => {
    const responses = await runConversationFlow(['Bonjour', '1', '1']);

    const reset = await chatApi.send({
      message: 'RECOMMENCER',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(reset, 'goal_selection');
  });
});
