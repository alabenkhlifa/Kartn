/**
 * Integration tests for FCR Procedures flow (Goal Option 2)
 *
 * Tests FCR TRE and FCR Famille procedure information
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatState, assertMessageContains } from '../../test-utils/assertions.ts';

// ============================================================================
// Helper to get to procedure_info state
// ============================================================================

async function getProcedureInfoState(): Promise<string> {
  const responses = await runConversationFlow(['Bonjour', '2']);
  assertChatState(responses[1], 'procedure_info');
  return responses[0].conversation_id!;
}

// ============================================================================
// FCR TRE Procedure
// ============================================================================

describe('FCR Procedures - FCR TRE', () => {
  it('should transition to showing_procedure_detail when selecting FCR TRE (option 1)', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_procedure_detail');
  });

  it('should display FCR TRE procedure details', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Response should contain TRE-related information
    assert(
      response.message.toLowerCase().includes('tre') ||
      response.message.toLowerCase().includes('étranger') ||
      response.message.toLowerCase().includes('résid'),
      'Response should contain FCR TRE information'
    );
  });

  it('should recognize "tre" keyword', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: 'tre',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_procedure_detail');
  });

  it('should recognize "import" keyword for FCR TRE', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: 'import',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_procedure_detail');
  });
});

// ============================================================================
// FCR Famille Procedure
// ============================================================================

describe('FCR Procedures - FCR Famille', () => {
  it('should transition to showing_procedure_detail when selecting FCR Famille (option 2)', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_procedure_detail');
  });

  it('should display FCR Famille procedure details', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: '2',
      conversation_id: conversationId,
    });

    // Response should contain Famille-related information
    assert(
      response.message.toLowerCase().includes('famille') ||
      response.message.toLowerCase().includes('article 55') ||
      response.message.toLowerCase().includes('art 55'),
      'Response should contain FCR Famille information'
    );
  });

  it('should recognize "famille" keyword', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: 'famille',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_procedure_detail');
  });

  it('should recognize "article 55" keyword', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: 'article 55',
      conversation_id: conversationId,
    });

    assertChatState(response, 'showing_procedure_detail');
  });
});

// ============================================================================
// Transition from Procedure Detail
// ============================================================================

describe('FCR Procedures - Post-Procedure Transitions', () => {
  it('should transition to car search when user says "yes" after procedure', async () => {
    const conversationId = await getProcedureInfoState();

    // Select a procedure
    await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Say yes to start car search
    const response = await chatApi.send({
      message: '1', // or 'oui'
      conversation_id: conversationId,
    });

    // Should go to asking_car_origin (start of car search)
    assertChatState(response, 'asking_car_origin');
  });

  it('should transition to goal_selection when user says "no" after procedure', async () => {
    const conversationId = await getProcedureInfoState();

    // Select a procedure
    await chatApi.send({
      message: '1',
      conversation_id: conversationId,
    });

    // Say no to return to menu
    const response = await chatApi.send({
      message: '2', // or 'non'
      conversation_id: conversationId,
    });

    // Should go back to goal_selection
    assertChatState(response, 'goal_selection');
  });

  it('should recognize "oui" for yes transition', async () => {
    const conversationId = await getProcedureInfoState();
    await chatApi.send({ message: '1', conversation_id: conversationId });

    const response = await chatApi.send({
      message: 'oui',
      conversation_id: conversationId,
    });

    assertChatState(response, 'asking_car_origin');
  });

  it('should recognize "non" for no transition', async () => {
    const conversationId = await getProcedureInfoState();
    await chatApi.send({ message: '1', conversation_id: conversationId });

    const response = await chatApi.send({
      message: 'non',
      conversation_id: conversationId,
    });

    assertChatState(response, 'goal_selection');
  });
});

// ============================================================================
// Arabic Language Support
// ============================================================================

describe('FCR Procedures - Arabic Language', () => {
  it('should display procedure options in Arabic', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });

    const response = await chatApi.send({
      message: '2', // procedures
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'procedure_info');
    // Should contain Arabic text
    assert(
      /[\u0600-\u06FF]/.test(response.message),
      'Response should be in Arabic'
    );
  });

  it('should recognize Arabic "عائلة" for FCR Famille', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });
    await chatApi.send({ message: '2', conversation_id: greeting.conversation_id });

    const response = await chatApi.send({
      message: 'عائلة',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(response, 'showing_procedure_detail');
  });
});

// ============================================================================
// Invalid Input Handling
// ============================================================================

describe('FCR Procedures - Invalid Input', () => {
  it('should stay in procedure_info for invalid input', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: 'invalid xyz',
      conversation_id: conversationId,
    });

    assertChatState(response, 'procedure_info');
  });

  it('should re-present options after invalid input', async () => {
    const conversationId = await getProcedureInfoState();

    const response = await chatApi.send({
      message: '99',
      conversation_id: conversationId,
    });

    // Should still show procedure options
    assertChatState(response, 'procedure_info');
    assert(
      response.message.includes('1') && response.message.includes('2'),
      'Should re-present procedure options'
    );
  });
});
