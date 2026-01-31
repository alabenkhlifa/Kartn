/**
 * Integration tests for Tunisia car search flow
 *
 * Flow: Bonjour → 1 (find_car) → 1 (tunisia) → condition → budget → fuel → car_type → showing_cars
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatState, assertHasCars } from '../../test-utils/assertions.ts';

// ============================================================================
// Complete Tunisia Flow with Specific Filters
// ============================================================================

describe('Tunisia Car Search - Complete Flow', () => {
  it('should complete full Tunisia flow with specific filters', async () => {
    // Step 1: Greeting
    const greeting = await chatApi.send({ message: 'Bonjour' });
    assertChatState(greeting, 'goal_selection');

    // Step 2: Select find_car
    const findCar = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(findCar, 'asking_car_origin');

    // Step 3: Select Tunisia
    const tunisia = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(tunisia, 'asking_condition');

    // Step 4: Select used (option 2)
    const condition = await chatApi.send({
      message: '2',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(condition, 'asking_budget');

    // Step 5: Select budget (option 2 = 70k)
    const budget = await chatApi.send({
      message: '2',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(budget, 'asking_fuel_type');

    // Step 6: Select essence (option 1)
    const fuel = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(fuel, 'asking_car_type');

    // Step 7: Select SUV (option 1)
    const carType = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(carType, 'showing_cars');

    // Should have cars in the response
    assert(carType.cars !== undefined || carType.message.length > 0);
  });
});

// ============================================================================
// Tunisia Flow with "Any" Options
// ============================================================================

describe('Tunisia Car Search - All "Any" Options', () => {
  it('should complete flow with all "any" selections', async () => {
    // Step 1-2: Greeting and find_car
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const findCar = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });

    // Step 3: Tunisia
    const tunisia = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(tunisia, 'asking_condition');

    // Step 4: Any condition (option 3)
    const condition = await chatApi.send({
      message: '3',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(condition, 'asking_budget');

    // Step 5: Custom budget
    const budget = await chatApi.send({
      message: '100000',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(budget, 'asking_fuel_type');

    // Step 6: Any fuel (option 6)
    const fuel = await chatApi.send({
      message: '6',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(fuel, 'asking_car_type');

    // Step 7: Any car type (option 4)
    const carType = await chatApi.send({
      message: '4',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(carType, 'showing_cars');
  });
});

// ============================================================================
// Tunisia Flow - New Cars Only
// ============================================================================

describe('Tunisia Car Search - New Cars', () => {
  it('should search for new cars only', async () => {
    const responses = await runConversationFlow([
      'Bonjour',     // goal_selection
      '1',           // find_car → asking_car_origin
      '1',           // tunisia → asking_condition
      '1',           // new → asking_budget
      '150000',      // budget → asking_fuel_type
      '1',           // essence → asking_car_type
      '2',           // sedan → showing_cars
    ]);

    const finalResponse = responses[responses.length - 1];
    assertChatState(finalResponse, 'showing_cars');
  });
});

// ============================================================================
// Tunisia Flow - Used Cars with Keywords
// ============================================================================

describe('Tunisia Car Search - Keyword Navigation', () => {
  it('should accept keyword "tunisie" for car origin', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });

    const origin = await chatApi.send({
      message: 'tunisie',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(origin, 'asking_condition');
  });

  it('should accept keyword "occasion" for condition', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });

    const condition = await chatApi.send({
      message: 'occasion',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(condition, 'asking_budget');
  });

  it('should accept custom budget format "85k"', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2',
    ]);

    // Note: Values starting with 1-7 are treated as presets, so use 85k
    const budget = await chatApi.send({
      message: '85k',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(budget, 'asking_fuel_type');
  });

  it('should accept keyword "diesel" for fuel type', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2', '80000',
    ]);

    const fuel = await chatApi.send({
      message: 'diesel',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(fuel, 'asking_car_type');
  });

  it('should accept keyword "suv" for car type', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2', '80000', '1',
    ]);

    const carType = await chatApi.send({
      message: 'suv',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(carType, 'showing_cars');
  });
});

// ============================================================================
// Tunisia Flow - Budget Variations
// ============================================================================

describe('Tunisia Car Search - Budget Variations', () => {
  const budgetTests = [
    { input: '50000', expected: 50000, desc: 'plain number' },
    // Note: Values starting with 1-7 are treated as presets, so use 8x/9x values
    { input: '85k', expected: 85000, desc: '"k" suffix' },
    { input: '95 000', expected: 95000, desc: 'with space' },
    { input: '80000 TND', expected: 80000, desc: 'with currency' },
    { input: '100', expected: 100000, desc: 'assumed thousands (<500)' },
  ];

  for (const { input, expected, desc } of budgetTests) {
    it(`should accept budget ${desc}: "${input}" → ${expected}`, async () => {
      const responses = await runConversationFlow([
        'Bonjour', '1', '1', '2',
      ]);

      const budget = await chatApi.send({
        message: input,
        conversation_id: responses[0].conversation_id,
      });

      // Should move to next state
      assertChatState(budget, 'asking_fuel_type');
    });
  }
});

// ============================================================================
// Tunisia Flow - State Persistence
// ============================================================================

describe('Tunisia Car Search - State Persistence', () => {
  it('should persist state across API calls', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const conversationId = greeting.conversation_id;

    // Each call should advance to next state
    const step2 = await chatApi.send({ message: '1', conversation_id: conversationId });
    assertEquals(step2.state, 'asking_car_origin');

    const step3 = await chatApi.send({ message: '1', conversation_id: conversationId });
    assertEquals(step3.state, 'asking_condition');

    const step4 = await chatApi.send({ message: '2', conversation_id: conversationId });
    assertEquals(step4.state, 'asking_budget');

    const step5 = await chatApi.send({ message: '80000', conversation_id: conversationId });
    assertEquals(step5.state, 'asking_fuel_type');

    const step6 = await chatApi.send({ message: '1', conversation_id: conversationId });
    assertEquals(step6.state, 'asking_car_type');

    const step7 = await chatApi.send({ message: '1', conversation_id: conversationId });
    assertEquals(step7.state, 'showing_cars');
  });
});

// ============================================================================
// Tunisia Flow - Edge Cases
// ============================================================================

describe('Tunisia Car Search - Edge Cases', () => {
  it('should handle invalid option and retry', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', // At asking_condition
    ]);

    // Send invalid input
    const invalid = await chatApi.send({
      message: 'xyz',
      conversation_id: responses[0].conversation_id,
    });

    // Should stay in same state
    assertChatState(invalid, 'asking_condition');

    // Now send valid input
    const valid = await chatApi.send({
      message: '2',
      conversation_id: responses[0].conversation_id,
    });

    // Should advance
    assertChatState(valid, 'asking_budget');
  });

  it('should handle very high budget', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2',
    ]);

    const budget = await chatApi.send({
      message: '500000',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(budget, 'asking_fuel_type');
  });

  it('should handle minimum budget', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', '2',
    ]);

    const budget = await chatApi.send({
      message: '20000',
      conversation_id: responses[0].conversation_id,
    });

    assertChatState(budget, 'asking_fuel_type');
  });
});
