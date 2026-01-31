/**
 * Integration tests for error handling in chat function
 *
 * Tests invalid inputs, missing fields, and HTTP method errors
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi } from '../../test-utils/api-client.ts';
import { assertChatState, assertStatus } from '../../test-utils/assertions.ts';

// ============================================================================
// Invalid Input at Each State
// ============================================================================

describe('Error Handling - Invalid Options Stay in State', () => {
  it('should stay in goal_selection for invalid option', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });

    const invalid = await chatApi.send({
      message: 'xyz',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(invalid, 'goal_selection');
  });

  it('should stay in goal_selection for out-of-range number', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });

    const invalid = await chatApi.send({
      message: '99',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(invalid, 'goal_selection');
  });

  it('should stay in asking_car_origin for invalid option', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });

    const invalid = await chatApi.send({
      message: 'invalid',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(invalid, 'asking_car_origin');
  });

  it('should stay in asking_residency for invalid option', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '2', conversation_id: greeting.conversation_id });

    const invalid = await chatApi.send({
      message: 'xyz123',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(invalid, 'asking_residency');
  });

  it('should stay in asking_budget for invalid budget', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '2', conversation_id: greeting.conversation_id });

    const invalid = await chatApi.send({
      message: 'not a budget',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(invalid, 'asking_budget');
  });

  it('should stay in asking_fuel_type for invalid option', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '2', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '80000', conversation_id: greeting.conversation_id });

    const invalid = await chatApi.send({
      message: 'xyz',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(invalid, 'asking_fuel_type');
  });

  it('should stay in asking_car_type for invalid option', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '2', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '80000', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });

    const invalid = await chatApi.send({
      message: 'invalid car type',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(invalid, 'asking_car_type');
  });
});

// ============================================================================
// HTTP Method Errors
// ============================================================================

describe('Error Handling - HTTP Methods', () => {
  it('should return 405 for GET request', async () => {
    const response = await chatApi.sendRaw(null, { method: 'GET' });
    assertStatus(response, 405);
  });

  it('should return 405 for PUT request', async () => {
    const response = await chatApi.sendRaw({ message: 'test' }, { method: 'PUT' });
    assertStatus(response, 405);
  });

  it('should return 405 for DELETE request', async () => {
    const response = await chatApi.sendRaw(null, { method: 'DELETE' });
    assertStatus(response, 405);
  });

  it('should return 405 for PATCH request', async () => {
    const response = await chatApi.sendRaw({ message: 'test' }, { method: 'PATCH' });
    assertStatus(response, 405);
  });

  it('should accept POST request', async () => {
    const response = await chatApi.sendRaw({ message: 'Bonjour' }, { method: 'POST' });
    assertStatus(response, 200);
  });

  it('should accept OPTIONS request (CORS preflight)', async () => {
    const response = await chatApi.sendRaw(null, { method: 'OPTIONS' });
    // OPTIONS should return 200 or 204 for CORS
    assert(
      response.status === 200 || response.status === 204,
      `Expected 200 or 204 for OPTIONS, got ${response.status}`
    );
  });
});

// ============================================================================
// Missing/Invalid Request Body
// ============================================================================

describe('Error Handling - Request Body Validation', () => {
  it('should return error for missing message field', async () => {
    const response = await chatApi.sendRaw({});

    assertStatus(response, 400);
    const body = await response.json();
    assert(body.error, 'Should have error message');
  });

  it('should return error for null message', async () => {
    const response = await chatApi.sendRaw({ message: null });

    assertStatus(response, 400);
    const body = await response.json();
    assert(body.error, 'Should have error message');
  });

  it('should return error for empty message', async () => {
    const response = await chatApi.sendRaw({ message: '' });

    // May return 400 or handle as invalid input
    const body = await response.json();
    assert(
      response.status === 400 || body.state === 'goal_selection',
      'Should handle empty message appropriately'
    );
  });

  it('should handle message with only whitespace', async () => {
    const response = await chatApi.send({ message: '   ' });

    // Should handle gracefully - either error or stay in current state
    assert(response.state !== undefined, 'Should return a valid state');
  });
});

// ============================================================================
// Invalid Conversation ID
// ============================================================================

describe('Error Handling - Invalid Conversation ID', () => {
  it('should create new conversation for invalid UUID', async () => {
    const response = await chatApi.send({
      message: 'Bonjour',
      conversation_id: 'invalid-uuid-format',
    });

    // Should create new conversation and return goal_selection
    assertChatState(response, 'goal_selection');
    assert(response.conversation_id, 'Should have conversation_id');
  });

  it('should create new conversation for non-existent UUID', async () => {
    const response = await chatApi.send({
      message: 'Bonjour',
      conversation_id: '00000000-0000-0000-0000-000000000000',
    });

    // Should create new conversation
    assertChatState(response, 'goal_selection');
    assert(response.conversation_id, 'Should have conversation_id');
  });

  it('should handle undefined conversation_id', async () => {
    const response = await chatApi.send({
      message: 'Bonjour',
    });

    // Should create new conversation
    assertChatState(response, 'goal_selection');
    assert(response.conversation_id, 'Should have conversation_id');
  });
});

// ============================================================================
// Special Characters and Unicode
// ============================================================================

describe('Error Handling - Special Characters', () => {
  it('should handle message with special characters', async () => {
    const response = await chatApi.send({
      message: 'Bonjour! @#$%^&*()',
    });

    // Should detect greeting despite special chars
    assertChatState(response, 'goal_selection');
  });

  it('should handle message with emoji', async () => {
    const response = await chatApi.send({
      message: 'Bonjour',
    });

    assertChatState(response, 'goal_selection');
  });

  it('should handle very long message', async () => {
    const longMessage = 'Bonjour ' + 'a'.repeat(10000);
    const response = await chatApi.send({
      message: longMessage,
    });

    // Should handle without crashing
    assert(response.state !== undefined, 'Should return a valid state');
  });

  it('should handle Arabic diacritics', async () => {
    const response = await chatApi.send({
      message: 'مَرْحَباً',
    });

    // Should detect as Arabic greeting
    assert(
      response.language === 'arabic' || response.language === 'derja',
      'Should detect Arabic language'
    );
  });

  it('should handle French accents', async () => {
    const response = await chatApi.send({
      message: 'procédure FCR étranger',
    });

    // Should handle accented characters
    assert(response.state !== undefined, 'Should return a valid state');
  });
});

// ============================================================================
// Retry After Invalid Input
// ============================================================================

describe('Error Handling - Retry After Invalid', () => {
  it('should accept valid input after invalid input', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });

    // Invalid input
    await chatApi.send({
      message: 'xyz',
      conversation_id: greeting.conversation_id,
    });

    // Valid input
    const valid = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(valid, 'asking_car_origin');
  });

  it('should accept valid input after multiple invalid inputs', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // Multiple invalid inputs
    await chatApi.send({ message: 'xyz', conversation_id: id });
    await chatApi.send({ message: '99', conversation_id: id });
    await chatApi.send({ message: 'abc', conversation_id: id });

    // Valid input should still work
    const valid = await chatApi.send({
      message: '1',
      conversation_id: id,
    });

    assertChatState(valid, 'asking_car_origin');
  });
});

// ============================================================================
// Concurrent Requests
// ============================================================================

describe('Error Handling - Concurrent Requests', () => {
  it('should handle concurrent requests to same conversation', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // Send multiple requests concurrently
    const responses = await Promise.all([
      chatApi.send({ message: '1', conversation_id: id }),
      chatApi.send({ message: '2', conversation_id: id }),
      chatApi.send({ message: '3', conversation_id: id }),
    ]);

    // All should complete without error
    for (const response of responses) {
      assert(response.state !== undefined, 'Should have valid state');
    }
  });
});

// ============================================================================
// Graceful Degradation
// ============================================================================

describe('Error Handling - Graceful Responses', () => {
  it('should return helpful message for invalid input', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });

    const invalid = await chatApi.send({
      message: 'xyz',
      conversation_id: greeting.conversation_id,
    });

    // Should still have a message (re-asking the question)
    assert(invalid.message.length > 0, 'Should return a message');
    assertChatState(invalid, 'goal_selection');
  });

  it('should maintain conversation state after error', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    // Now at asking_condition

    // Invalid input
    const invalid = await chatApi.send({
      message: 'invalid',
      conversation_id: greeting.conversation_id,
    });

    // Should still be at asking_condition
    assertChatState(invalid, 'asking_condition');

    // Valid input should work
    const valid = await chatApi.send({
      message: '2',
      conversation_id: greeting.conversation_id,
    });

    assertChatState(valid, 'asking_budget');
  });
});
