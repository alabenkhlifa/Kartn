/**
 * Integration tests for goal selection (all 6 paths)
 *
 * Tests all goal options from the main menu
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi } from '../../test-utils/api-client.ts';
import { assertChatState, assertHasOptions } from '../../test-utils/assertions.ts';

// ============================================================================
// Helper to get to goal selection state
// ============================================================================

async function startConversation(): Promise<{ conversationId: string }> {
  const response = await chatApi.send({ message: 'Bonjour' });
  assertEquals(response.state, 'goal_selection');
  return { conversationId: response.conversation_id! };
}

// ============================================================================
// Option 1: Find Car (Acheter une voiture)
// ============================================================================

describe('Goal Selection - Option 1: Find Car', () => {
  it('should transition to asking_car_origin when selecting option 1', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });

  it('should work with "acheter" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'acheter une voiture',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });

  it('should work with "cherche" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'Je cherche une voiture',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });

  it('should work with Arabic keyword "تشري"', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });

    const response = await chatApi.send({
      message: 'تشري',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'asking_car_origin');
  });
});

// ============================================================================
// Option 2: FCR Procedures
// ============================================================================

describe('Goal Selection - Option 2: FCR Procedures', () => {
  it('should transition to procedure_info when selecting option 2', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });

  it('should work with "procédure" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'procédure',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });

  it('should work with "fcr" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'fcr',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });

  it('should present FCR TRE and FCR Famille options', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Should mention both procedures
    assert(
      response.message.toLowerCase().includes('tre') ||
      response.message.toLowerCase().includes('famille') ||
      response.message.includes('1') && response.message.includes('2'),
      'Response should present FCR options'
    );
  });
});

// ============================================================================
// Option 3: Compare Cars
// ============================================================================

describe('Goal Selection - Option 3: Compare Cars', () => {
  it('should transition to car_comparison_input when selecting option 3', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '3',
      conversation_id: conversationId,
    });

    assertChatState(response, 'car_comparison_input');
  });

  it('should work with "comparer" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'comparer',
      conversation_id: conversationId,
    });

    assertChatState(response, 'car_comparison_input');
  });

  it('should work with "vs" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'vs',
      conversation_id: conversationId,
    });

    assertChatState(response, 'car_comparison_input');
  });

  it('should ask for comparison query', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '3',
      conversation_id: conversationId,
    });

    // Response should prompt for car comparison input
    assert(
      response.message.toLowerCase().includes('compar') ||
      response.message.toLowerCase().includes('voiture') ||
      response.message.toLowerCase().includes('modèle'),
      'Response should ask for comparison input'
    );
  });
});

// ============================================================================
// Option 4: EV Info
// ============================================================================

describe('Goal Selection - Option 4: EV Info', () => {
  it('should transition to ev_topic_selection when selecting option 4', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '4',
      conversation_id: conversationId,
    });

    assertChatState(response, 'ev_topic_selection');
  });

  it('should work with "électrique" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'électrique',
      conversation_id: conversationId,
    });

    assertChatState(response, 'ev_topic_selection');
  });

  it('should work with "ev" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'ev',
      conversation_id: conversationId,
    });

    assertChatState(response, 'ev_topic_selection');
  });

  it('should present EV topic options', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '4',
      conversation_id: conversationId,
    });

    // Response should present topic options (numbered list)
    assert(
      response.message.includes('1') && response.message.includes('2'),
      'Response should present numbered topic options'
    );
  });
});

// ============================================================================
// Option 5: Browse Offers
// ============================================================================

describe('Goal Selection - Option 5: Browse Offers', () => {
  it('should transition to asking_car_origin when selecting option 5 (same as find_car)', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '5',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });

  it('should work with "parcourir" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'parcourir',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });

  it('should work with "offres" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'offres',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });
});

// ============================================================================
// Option 6: Popular Cars (Voitures Populaires)
// ============================================================================

describe('Goal Selection - Option 6: Popular Cars', () => {
  it('should transition to popular_cars_selection when selecting option 6', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '6',
      conversation_id: conversationId,
    });

    assertChatState(response, 'popular_cars_selection');
  });

  it('should work with "populaire" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'populaire',
      conversation_id: conversationId,
    });

    assertChatState(response, 'popular_cars_selection');
  });

  it('should work with "subvention" keyword', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'subvention',
      conversation_id: conversationId,
    });

    assertChatState(response, 'popular_cars_selection');
  });

  it('should present eligibility check and models options', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '6',
      conversation_id: conversationId,
    });

    // Response should present options
    assert(
      response.message.includes('1') && response.message.includes('2'),
      'Response should present numbered options'
    );
  });
});

// ============================================================================
// Invalid Input Handling
// ============================================================================

describe('Goal Selection - Invalid Input', () => {
  it('should stay in goal_selection for invalid input', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: 'xyz invalid input',
      conversation_id: conversationId,
    });

    assertChatState(response, 'goal_selection');
  });

  it('should re-present options after invalid input', async () => {
    const { conversationId } = await startConversation();

    const response = await chatApi.send({
      message: '99',
      conversation_id: conversationId,
    });

    // Should still be in goal_selection and present options
    assertChatState(response, 'goal_selection');
    assert(
      response.message.includes('1') || response.options !== undefined,
      'Response should re-present options'
    );
  });
});
