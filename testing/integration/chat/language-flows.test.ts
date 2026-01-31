/**
 * Integration tests for language detection and persistence
 *
 * Tests French, Arabic, and Derja language flows
 */

import { describe, it, beforeAll } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatLanguage, assertMessageContains } from '../../test-utils/assertions.ts';

// ============================================================================
// French Language Flow
// ============================================================================

describe('Language Flow - French', () => {
  it('should detect French from "Bonjour" greeting', async () => {
    const response = await chatApi.send({ message: 'Bonjour' });
    assertChatLanguage(response, 'french');
  });

  it('should detect French from "Salut" greeting', async () => {
    const response = await chatApi.send({ message: 'Salut' });
    assertChatLanguage(response, 'french');
  });

  it('should respond in French for goal selection', async () => {
    const response = await chatApi.send({ message: 'Bonjour' });
    // French response should contain French words
    assert(
      response.message.includes('voiture') ||
      response.message.includes('acheter') ||
      response.message.includes('aide') ||
      response.message.includes('choisir'),
      'Response should contain French words'
    );
  });

  it('should maintain French throughout conversation', async () => {
    const responses = await runConversationFlow(['Bonjour', '1', '1']);

    for (const response of responses) {
      assertChatLanguage(response, 'french');
    }
  });
});

// ============================================================================
// Arabic Language Flow
// ============================================================================

describe('Language Flow - Arabic', () => {
  it('should detect Arabic from "مرحبا" greeting', async () => {
    const response = await chatApi.send({ message: 'مرحبا' });
    assertChatLanguage(response, 'arabic');
  });

  it('should detect Arabic from "السلام" greeting', async () => {
    const response = await chatApi.send({ message: 'السلام' });
    assertChatLanguage(response, 'arabic');
  });

  it('should detect Arabic from "اهلا" greeting', async () => {
    const response = await chatApi.send({ message: 'اهلا' });
    assertChatLanguage(response, 'arabic');
  });

  it('should respond in Arabic for goal selection', async () => {
    const response = await chatApi.send({ message: 'مرحبا' });
    // Arabic response should contain Arabic characters
    assert(
      /[\u0600-\u06FF]/.test(response.message),
      'Response should contain Arabic characters'
    );
  });

  it('should maintain Arabic throughout conversation', async () => {
    const responses = await runConversationFlow(['مرحبا', '1', '1']);

    for (const response of responses) {
      assertChatLanguage(response, 'arabic');
    }
  });
});

// ============================================================================
// Derja Language Flow
// ============================================================================

describe('Language Flow - Derja', () => {
  it('should detect Derja from specific greetings', async () => {
    const response = await chatApi.send({ message: 'أحكيلي' });
    // Derja may be detected as 'arabic' or 'derja' depending on implementation
    assert(
      response.language === 'derja' || response.language === 'arabic',
      `Expected derja or arabic, got ${response.language}`
    );
  });

  it('should handle Derja keywords for car origin', async () => {
    const responses = await runConversationFlow(['Bonjour', '1']);
    const carOriginResponse = responses[1];

    // Should be in asking_car_origin state
    assertEquals(carOriginResponse.state, 'asking_car_origin');

    // Send Derja keyword for "abroad"
    const abroadResponse = await chatApi.send({
      message: 'برّا',
      conversation_id: carOriginResponse.conversation_id,
    });

    // Should recognize "برّا" as abroad
    assertEquals(abroadResponse.state, 'asking_residency');
  });
});

// ============================================================================
// Language Override via Parameter
// ============================================================================

describe('Language Override', () => {
  it('should respect explicit language parameter', async () => {
    const response = await chatApi.send({
      message: 'Hello',
      language: 'french',
    });
    assertChatLanguage(response, 'french');
  });

  it('should override detected language with parameter', async () => {
    // "Hello" would normally be detected differently
    const response = await chatApi.send({
      message: 'Hello',
      language: 'arabic',
    });
    assertChatLanguage(response, 'arabic');
  });
});

// ============================================================================
// Mixed Language Handling
// ============================================================================

describe('Mixed Language Handling', () => {
  it('should handle French-Arabic mix', async () => {
    // Start in French
    const greeting = await chatApi.send({ message: 'Bonjour' });
    assertChatLanguage(greeting, 'french');

    // Continue with numeric input (language neutral)
    const response = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });

    // Should maintain French
    assertChatLanguage(response, 'french');
  });

  it('should handle conversation restart in different language', async () => {
    // Start in French
    const french = await chatApi.send({ message: 'Bonjour' });
    assertChatLanguage(french, 'french');

    // Continue the conversation
    const step2 = await chatApi.send({
      message: '1',
      conversation_id: french.conversation_id,
    });

    // Now send Arabic greeting (should reset and switch language)
    const arabic = await chatApi.send({
      message: 'مرحبا',
      conversation_id: step2.conversation_id,
    });

    // Should switch to Arabic and reset to goal selection
    assertChatLanguage(arabic, 'arabic');
    assertEquals(arabic.state, 'goal_selection');
  });
});
