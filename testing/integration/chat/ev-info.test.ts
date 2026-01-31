/**
 * Integration tests for EV Info flow (Goal Option 4)
 *
 * Tests all 4 EV topics and transitions to car search
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatState } from '../../test-utils/assertions.ts';

// ============================================================================
// Helper to get to ev_topic_selection state
// ============================================================================

async function getEVTopicState(): Promise<string> {
  const responses = await runConversationFlow(['Bonjour', '4']);
  assertChatState(responses[1], 'ev_topic_selection');
  return responses[0].conversation_id!;
}

// ============================================================================
// Topic 1: Hybrid vs EV
// ============================================================================

describe('EV Info - Topic 1: Hybrid vs EV', () => {
  it('should transition to showing_ev_info when selecting option 1', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should display hybrid vs EV comparison info', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Should contain relevant info about hybrids and EVs
    assert(
      response.message.toLowerCase().includes('hybrid') ||
      response.message.toLowerCase().includes('électrique') ||
      response.message.toLowerCase().includes('batterie'),
      'Response should contain hybrid/EV comparison info'
    );
  });

  it('should recognize "différence" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'différence',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should recognize "phev" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'phev',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });
});

// ============================================================================
// Topic 2: EV Law/Fiscal Benefits
// ============================================================================

describe('EV Info - Topic 2: EV Law', () => {
  it('should transition to showing_ev_info when selecting option 2', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should display EV law/fiscal information', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Should contain law/fiscal related info
    assert(
      response.message.toLowerCase().includes('loi') ||
      response.message.toLowerCase().includes('fiscal') ||
      response.message.toLowerCase().includes('taxe') ||
      response.message.toLowerCase().includes('avantage'),
      'Response should contain EV law info'
    );
  });

  it('should recognize "loi" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'loi',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should recognize "fiscal" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'fiscal',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });
});

// ============================================================================
// Topic 3: Charging Stations
// ============================================================================

describe('EV Info - Topic 3: Charging Stations', () => {
  it('should transition to showing_ev_info when selecting option 3', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '3',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should display charging station information', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '3',
      conversation_id: conversationId,
    });

    // Should contain charging related info
    assert(
      response.message.toLowerCase().includes('borne') ||
      response.message.toLowerCase().includes('charge') ||
      response.message.toLowerCase().includes('recharge') ||
      response.message.toLowerCase().includes('station'),
      'Response should contain charging station info'
    );
  });

  it('should recognize "borne" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'borne',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should recognize "recharge" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'recharge',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });
});

// ============================================================================
// Topic 4: Solar Panels
// ============================================================================

describe('EV Info - Topic 4: Solar Panels', () => {
  it('should transition to showing_ev_info when selecting option 4', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '4',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should display solar panel information', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '4',
      conversation_id: conversationId,
    });

    // Should contain solar panel related info
    assert(
      response.message.toLowerCase().includes('solaire') ||
      response.message.toLowerCase().includes('panneau') ||
      response.message.toLowerCase().includes('photovoltaïque') ||
      response.message.toLowerCase().includes('énergie'),
      'Response should contain solar panel info'
    );
  });

  it('should recognize "solaire" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'solaire',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });

  it('should recognize "panneau" keyword', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'panneau',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_ev_info');
  });
});

// ============================================================================
// Transition to Car Search
// ============================================================================

describe('EV Info - Transition to Car Search', () => {
  it('should transition to car search when user says "yes" after EV info', async () => {
    const conversationId = await getEVTopicState();

    // Select a topic
    await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Say yes to search for electric cars
    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Should start car search flow
    assertChatState(response, 'asking_car_origin');
  });

  it('should transition to goal_selection when user says "no" after EV info', async () => {
    const conversationId = await getEVTopicState();

    // Select a topic
    await chatApi.send({
      message: '1',
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

  it('should recognize "oui" for yes transition', async () => {
    const conversationId = await getEVTopicState();
    await chatApi.send({ message: '2', conversation_id: conversationId });

    const response = await chatApi.send({
      message: 'oui',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });
});

// ============================================================================
// Arabic Language Support
// ============================================================================

describe('EV Info - Arabic Language', () => {
  it('should display topic options in Arabic', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });

    const response = await chatApi.send({
      message: '4', // EV info
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'ev_topic_selection');
    assert(
      /[\u0600-\u06FF]/.test(response.message),
      'Response should be in Arabic'
    );
  });

  it('should recognize Arabic "شحن" for charging stations', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });
    await chatApi.send({ message: '4', conversation_id: greeting.conversation_id });

    const response = await chatApi.send({
      message: 'شحن',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'showing_ev_info');
  });
});

// ============================================================================
// Invalid Input Handling
// ============================================================================

describe('EV Info - Invalid Input', () => {
  it('should stay in ev_topic_selection for invalid input', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: 'invalid xyz',
      conversation_id: conversationId,
    });

    assertChatState(response, 'ev_topic_selection');
  });

  it('should stay in ev_topic_selection for out-of-range option', async () => {
    const conversationId = await getEVTopicState();

    const response = await chatApi.send({
      message: '99',
      conversation_id: conversationId,
    });

    assertChatState(response, 'ev_topic_selection');
  });
});
