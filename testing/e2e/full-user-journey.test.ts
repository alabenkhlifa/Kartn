/**
 * End-to-end tests for complete user journeys
 *
 * Tests full flows from greeting to car recommendations
 */

import { describe, it } from '../deps.ts';
import { assertEquals, assert } from '../deps.ts';
import { chatApi, recommendApi, runConversationFlow } from '../test-utils/api-client.ts';
import { assertChatState, assertSortedByScore } from '../test-utils/assertions.ts';

// ============================================================================
// Complete Tunisia Car Search Journey
// ============================================================================

describe('E2E - Tunisia Car Search Journey', () => {
  it('should complete full Tunisia flow: greeting → car results', async () => {
    // 1. Start with greeting
    const greeting = await chatApi.send({ message: 'Bonjour' });
    assertChatState(greeting, 'goal_selection');
    assert(greeting.conversation_id, 'Should have conversation ID');
    const id = greeting.conversation_id!;

    // 2. Select "Find a car"
    const findCar = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(findCar, 'asking_car_origin');

    // 3. Select Tunisia origin
    const tunisia = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(tunisia, 'asking_condition');

    // 4. Select used condition
    const condition = await chatApi.send({ message: '2', conversation_id: id });
    assertChatState(condition, 'asking_budget');

    // 5. Set budget
    const budget = await chatApi.send({ message: '80000', conversation_id: id });
    assertChatState(budget, 'asking_fuel_type');

    // 6. Select essence fuel
    const fuel = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(fuel, 'asking_car_type');

    // 7. Select SUV
    const carType = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(carType, 'showing_cars');

    // Final response should have car results or message about cars
    assert(
      carType.cars !== undefined || carType.message.length > 50,
      'Should have car results or detailed message'
    );
  });
});

// ============================================================================
// Complete TRE Import Journey
// ============================================================================

describe('E2E - TRE Import Journey', () => {
  it('should complete full TRE flow: greeting → car results', async () => {
    const responses = await runConversationFlow([
      'Bonjour',     // goal_selection
      '1',           // find_car → asking_car_origin
      '2',           // abroad → asking_residency
      '2',           // TRE → asking_fuel_type
      '2',           // diesel → asking_car_type
      '1',           // SUV → asking_condition
      '2',           // used → asking_budget
      '100000',      // budget → showing_cars
    ]);

    // Verify state progression
    assertEquals(responses[0].state, 'goal_selection');
    assertEquals(responses[1].state, 'asking_car_origin');
    assertEquals(responses[2].state, 'asking_residency');
    assertEquals(responses[3].state, 'asking_fuel_type');
    assertEquals(responses[4].state, 'asking_car_type');
    assertEquals(responses[5].state, 'asking_condition');
    assertEquals(responses[6].state, 'asking_budget');
    assertEquals(responses[7].state, 'showing_cars');

    // Final response should have results
    const finalResponse = responses[responses.length - 1];
    assert(
      finalResponse.cars !== undefined || finalResponse.message.length > 50,
      'Should have car results'
    );
  });
});

// ============================================================================
// Complete FCR Famille Journey
// ============================================================================

describe('E2E - FCR Famille Journey', () => {
  it('should complete full FCR Famille flow', async () => {
    const responses = await runConversationFlow([
      'Bonjour',     // goal_selection
      '1',           // find_car → asking_car_origin
      '2',           // abroad → asking_residency
      '1',           // local → asking_fcr_famille
      '1',           // yes FCR → asking_fuel_type
      '6',           // any fuel → asking_car_type
      '4',           // any car type → asking_condition
      '3',           // any condition → asking_budget
      '120000',      // budget → showing_cars
    ]);

    // Verify FCR Famille was included in flow
    assertEquals(responses[3].state, 'asking_fcr_famille');

    // Final state should be showing_cars
    assertEquals(responses[8].state, 'showing_cars');
  });
});

// ============================================================================
// Arabic Language Journey
// ============================================================================

describe('E2E - Arabic Language Journey', () => {
  it('should complete full journey in Arabic', async () => {
    // Start in Arabic
    const greeting = await chatApi.send({ message: 'مرحبا' });
    assertEquals(greeting.language, 'arabic');
    assertChatState(greeting, 'goal_selection');

    const id = greeting.conversation_id!;

    // Continue with numeric selections
    const findCar = await chatApi.send({ message: '1', conversation_id: id });
    assertEquals(findCar.language, 'arabic');
    assertChatState(findCar, 'asking_car_origin');

    // Select Tunisia
    const tunisia = await chatApi.send({ message: 'تونس', conversation_id: id });
    assertEquals(tunisia.language, 'arabic');
    assertChatState(tunisia, 'asking_condition');

    // All responses should be in Arabic
    assert(
      /[\u0600-\u06FF]/.test(greeting.message) &&
      /[\u0600-\u06FF]/.test(findCar.message) &&
      /[\u0600-\u06FF]/.test(tunisia.message),
      'All responses should contain Arabic text'
    );
  });
});

// ============================================================================
// FCR Procedure Information Journey
// ============================================================================

describe('E2E - FCR Procedure Journey', () => {
  it('should complete procedure info → car search journey', async () => {
    // 1. Start with greeting
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // 2. Select procedures
    const procedures = await chatApi.send({ message: '2', conversation_id: id });
    assertChatState(procedures, 'procedure_info');

    // 3. Select FCR TRE
    const fcrTre = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(fcrTre, 'showing_procedure_detail');

    // Response should contain procedure info
    assert(
      fcrTre.message.toLowerCase().includes('tre') ||
      fcrTre.message.toLowerCase().includes('étranger') ||
      fcrTre.message.length > 100,
      'Should contain FCR TRE procedure information'
    );

    // 4. Say yes to start car search
    const startSearch = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(startSearch, 'asking_car_origin');

    // 5. Continue with car search
    const abroad = await chatApi.send({ message: '2', conversation_id: id });
    assertChatState(abroad, 'asking_residency');
  });
});

// ============================================================================
// EV Information → Car Search Journey
// ============================================================================

describe('E2E - EV Info → Car Search Journey', () => {
  it('should complete EV info → electric car search journey', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // Select EV info
    const evInfo = await chatApi.send({ message: '4', conversation_id: id });
    assertChatState(evInfo, 'ev_topic_selection');

    // Select hybrid vs EV topic
    const topic = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(topic, 'showing_ev_info');

    // Say yes to search for EVs
    const startSearch = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(startSearch, 'asking_car_origin');

    // Continue with electric preference
    await chatApi.send({ message: '2', conversation_id: id }); // abroad
    await chatApi.send({ message: '2', conversation_id: id }); // TRE

    // At this point user would likely select electric
    const fuel = await chatApi.send({ message: '5', conversation_id: id }); // electric
    assertChatState(fuel, 'asking_car_type');
  });
});

// ============================================================================
// Popular Cars Eligibility Journey
// ============================================================================

describe('E2E - Popular Cars Journey', () => {
  it('should complete popular cars eligibility check journey', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // Select popular cars
    const popular = await chatApi.send({ message: '6', conversation_id: id });
    assertChatState(popular, 'popular_cars_selection');

    // Check eligibility
    const eligibility = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(eligibility, 'asking_popular_eligibility');

    // Say eligible (salary < 1500)
    const result = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(result, 'goal_selection');

    // Response should indicate eligibility
    assert(
      result.message.toLowerCase().includes('éligible') ||
      result.message.toLowerCase().includes('populaire') ||
      result.message.length > 50,
      'Should indicate eligibility result'
    );
  });

  it('should complete popular cars models → search journey', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // Select popular cars
    await chatApi.send({ message: '6', conversation_id: id });

    // View models
    const models = await chatApi.send({ message: '2', conversation_id: id });
    assertChatState(models, 'showing_popular_models');

    // Say yes to search
    const search = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(search, 'asking_car_origin');
  });
});

// ============================================================================
// Reset and Restart Journey
// ============================================================================

describe('E2E - Reset and Restart Journey', () => {
  it('should allow user to reset mid-flow and start new journey', async () => {
    // Start first journey
    const responses1 = await runConversationFlow([
      'Bonjour', '1', '1', '2', // Tunisia flow, at asking_budget
    ]);
    const id = responses1[0].conversation_id!;
    assertChatState(responses1[3], 'asking_budget');

    // Reset with greeting
    const reset = await chatApi.send({ message: 'Bonjour', conversation_id: id });
    assertChatState(reset, 'goal_selection');

    // Start new journey (procedures)
    const procedures = await chatApi.send({ message: '2', conversation_id: id });
    assertChatState(procedures, 'procedure_info');

    // Continue procedure journey
    const fcrFamille = await chatApi.send({ message: '2', conversation_id: id });
    assertChatState(fcrFamille, 'showing_procedure_detail');
  });
});

// ============================================================================
// Recommend API Integration
// ============================================================================

describe('E2E - Recommend API Direct', () => {
  it('should get car recommendations with scoring and ranking', async () => {
    const response = await recommendApi.post({
      filters: {
        fuel_type: 'essence',
        condition: 'used',
        body_type: 'suv',
        budget_tnd: 100000,
      },
      limit: 5,
      include_cost_breakdown: true,
    });

    // Verify structure
    assert(response.total >= 0, 'Should have total');
    assertEquals(response.limit, 5);
    assertEquals(response.offset, 0);

    // Verify recommendations
    if (response.recommendations.length > 0) {
      assertSortedByScore(response.recommendations);

      for (const rec of response.recommendations) {
        assert(rec.rank > 0, 'Should have rank');
        assert(rec.score > 0, 'Should have score');
        assert(rec.estimated_total_tnd > 0, 'Should have estimated_total_tnd');
        assert(rec.score_breakdown !== undefined, 'Should have score_breakdown');
        assert(rec.recommendation_strength !== undefined, 'Should have recommendation_strength');
      }
    }
  });
});

// ============================================================================
// Error Recovery Journey
// ============================================================================

describe('E2E - Error Recovery Journey', () => {
  it('should recover from invalid inputs and complete journey', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    // Invalid option
    const invalid1 = await chatApi.send({ message: 'xyz', conversation_id: id });
    assertChatState(invalid1, 'goal_selection');

    // Valid option
    const valid1 = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(valid1, 'asking_car_origin');

    // Invalid option
    const invalid2 = await chatApi.send({ message: 'abc', conversation_id: id });
    assertChatState(invalid2, 'asking_car_origin');

    // Valid option
    const valid2 = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(valid2, 'asking_condition');

    // Continue to completion
    await chatApi.send({ message: '2', conversation_id: id });
    await chatApi.send({ message: '80000', conversation_id: id });
    await chatApi.send({ message: '1', conversation_id: id });

    const final = await chatApi.send({ message: '1', conversation_id: id });
    assertChatState(final, 'showing_cars');
  });
});

// ============================================================================
// Multi-Language Journey
// ============================================================================

describe('E2E - Multi-Language Journey', () => {
  it('should handle language switch mid-journey', async () => {
    // Start in French
    const french = await chatApi.send({ message: 'Bonjour' });
    assertEquals(french.language, 'french');

    const id = french.conversation_id!;

    // Continue in French
    const step2 = await chatApi.send({ message: '1', conversation_id: id });
    assertEquals(step2.language, 'french');

    // Switch to Arabic with greeting
    const arabic = await chatApi.send({ message: 'مرحبا', conversation_id: id });
    assertEquals(arabic.language, 'arabic');
    assertChatState(arabic, 'goal_selection');

    // Continue in Arabic
    const arabicStep2 = await chatApi.send({ message: '1', conversation_id: id });
    assertEquals(arabicStep2.language, 'arabic');
    assertChatState(arabicStep2, 'asking_car_origin');
  });
});

// ============================================================================
// Complete Browse Offers Journey
// ============================================================================

describe('E2E - Browse Offers Journey', () => {
  it('should complete browse offers flow (same as find_car)', async () => {
    const responses = await runConversationFlow([
      'Bonjour',     // goal_selection
      '5',           // browse_offers → asking_car_origin (same as find_car)
      '1',           // tunisia → asking_condition
      '3',           // any condition → asking_budget
      '100000',      // budget → asking_fuel_type
      '6',           // any fuel → asking_car_type
      '4',           // any car type → showing_cars
    ]);

    // Verify flow matches find_car
    assertEquals(responses[1].state, 'asking_car_origin');
    assertEquals(responses[6].state, 'showing_cars');
  });
});
