/**
 * Integration tests for Popular Cars flow (Goal Option 6)
 *
 * Tests eligibility check and models listing for voitures populaires
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatState } from '../../test-utils/assertions.ts';

// ============================================================================
// Helper to get to popular_cars_selection state
// ============================================================================

async function getPopularCarsState(): Promise<string> {
  const responses = await runConversationFlow(['Bonjour', '6']);
  assertChatState(responses[1], 'popular_cars_selection');
  return responses[0].conversation_id!;
}

// ============================================================================
// Option 1: Eligibility Check
// ============================================================================

describe('Popular Cars - Eligibility Check', () => {
  it('should transition to asking_popular_eligibility when selecting option 1', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_popular_eligibility');
  });

  it('should recognize "éligib" keyword', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: 'éligible',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_popular_eligibility');
  });

  it('should recognize "vérif" keyword', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: 'vérifier',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_popular_eligibility');
  });
});

// ============================================================================
// Eligibility Results
// ============================================================================

describe('Popular Cars - Eligibility Results', () => {
  it('should show eligible result for salary < 1500 TND (option 1)', async () => {
    const conversationId = await getPopularCarsState();

    // Go to eligibility check
    await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Select eligible salary (< 1500 TND)
    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Should transition back to goal_selection and show eligible result
    assertChatState(response, 'goal_selection');
    // Response should indicate eligibility
    assert(
      response.message.toLowerCase().includes('éligible') ||
      response.message.toLowerCase().includes('eligible') ||
      response.message.toLowerCase().includes('populaire'),
      'Response should indicate eligibility status'
    );
  });

  it('should show not eligible result for salary > 1500 TND (option 2)', async () => {
    const conversationId = await getPopularCarsState();

    // Go to eligibility check
    await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Select not eligible salary (> 1500 TND)
    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Should transition back to goal_selection
    assertChatState(response, 'goal_selection');
  });
});

// ============================================================================
// Option 2: See Models
// ============================================================================

describe('Popular Cars - See Models', () => {
  it('should transition to showing_popular_models when selecting option 2', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_popular_models');
  });

  it('should recognize "modèle" keyword', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: 'modèles',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_popular_models');
  });

  it('should recognize "voir" keyword', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: 'voir',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_popular_models');
  });

  it('should display list of popular car models', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Response should contain car model information
    assert(
      response.message.length > 100 ||
      response.cars !== undefined,
      'Response should contain car models information'
    );
  });
});

// ============================================================================
// Transition from Models View
// ============================================================================

describe('Popular Cars - Post-Models Transitions', () => {
  it('should transition to car search when user says "yes" after models', async () => {
    const conversationId = await getPopularCarsState();

    // View models
    await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Say yes to search for popular cars
    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Should start car search flow
    assertChatState(response, 'asking_car_origin');
  });

  it('should transition to goal_selection when user says "no" after models', async () => {
    const conversationId = await getPopularCarsState();

    // View models
    await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Say no
    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Should go back to menu
    assertChatState(response, 'goal_selection');
  });
});

// ============================================================================
// Arabic Language Support
// ============================================================================

describe('Popular Cars - Arabic Language', () => {
  it('should display options in Arabic', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });

    const response = await chatApi.send({
      message: '6', // popular cars
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'popular_cars_selection');
    assert(
      /[\u0600-\u06FF]/.test(response.message),
      'Response should be in Arabic'
    );
  });

  it('should recognize Arabic "أهلي" for eligibility', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });
    await chatApi.send({ message: '6', conversation_id: greeting.conversation_id });

    const response = await chatApi.send({
      message: 'أهلي',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'asking_popular_eligibility');
  });

  it('should recognize Arabic "شوف" for see models', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });
    await chatApi.send({ message: '6', conversation_id: greeting.conversation_id });

    const response = await chatApi.send({
      message: 'شوف',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'showing_popular_models');
  });
});

// ============================================================================
// Full Flow Tests
// ============================================================================

describe('Popular Cars - Full Flows', () => {
  it('should complete eligibility check → eligible flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour',  // goal_selection
      '6',        // popular_cars → popular_cars_selection
      '1',        // eligibility → asking_popular_eligibility
      '1',        // eligible → goal_selection
    ]);

    assertChatState(responses[3], 'goal_selection');
  });

  it('should complete eligibility check → not eligible flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour',
      '6',
      '1',
      '2',  // not eligible
    ]);

    assertChatState(responses[3], 'goal_selection');
  });

  it('should complete see models → search flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour',
      '6',
      '2',  // see models → showing_popular_models
      '1',  // yes to search → asking_car_origin
    ]);

    assertChatState(responses[3], 'asking_car_origin');
  });

  it('should complete see models → menu flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour',
      '6',
      '2',
      '2',  // no → goal_selection
    ]);

    assertChatState(responses[3], 'goal_selection');
  });
});

// ============================================================================
// Invalid Input Handling
// ============================================================================

describe('Popular Cars - Invalid Input', () => {
  it('should stay in popular_cars_selection for invalid input', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: 'invalid xyz',
      conversation_id: conversationId,
    });

    assertChatState(response, 'popular_cars_selection');
  });

  it('should stay in popular_cars_selection for out-of-range option', async () => {
    const conversationId = await getPopularCarsState();

    const response = await chatApi.send({
      message: '99',
      conversation_id: conversationId,
    });

    assertChatState(response, 'popular_cars_selection');
  });
});
