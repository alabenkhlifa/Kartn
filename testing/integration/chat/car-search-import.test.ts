/**
 * Integration tests for Import car search flows (TRE and FCR Famille)
 *
 * TRE Flow: Bonjour → 1 → 2 (abroad) → 2 (TRE) → fuel → car_type → condition → budget → showing_cars
 * FCR Famille Flow: Bonjour → 1 → 2 (abroad) → 1 (local) → fcr_famille → fuel → car_type → condition → budget → showing_cars
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import { chatApi, runConversationFlow } from '../../test-utils/api-client.ts';
import { assertChatState } from '../../test-utils/assertions.ts';

// ============================================================================
// TRE Flow (Tunisian Resident Abroad)
// ============================================================================

describe('Import Car Search - TRE Flow', () => {
  it('should complete full TRE flow', async () => {
    // Step 1: Greeting
    const greeting = await chatApi.send({ message: 'Bonjour' });
    assertChatState(greeting, 'goal_selection');

    // Step 2: Select find_car
    const findCar = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(findCar, 'asking_car_origin');

    // Step 3: Select abroad
    const abroad = await chatApi.send({
      message: '2',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(abroad, 'asking_residency');

    // Step 4: Select TRE (abroad residency)
    const residency = await chatApi.send({
      message: '2',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(residency, 'asking_fuel_type');

    // Step 5: Select fuel type
    const fuel = await chatApi.send({
      message: '1', // essence
      conversation_id: greeting.conversation_id,
    });
    assertChatState(fuel, 'asking_car_type');

    // Step 6: Select car type
    const carType = await chatApi.send({
      message: '1', // SUV
      conversation_id: greeting.conversation_id,
    });
    assertChatState(carType, 'asking_condition');

    // Step 7: Select condition
    const condition = await chatApi.send({
      message: '2', // used
      conversation_id: greeting.conversation_id,
    });
    assertChatState(condition, 'asking_budget');

    // Step 8: Set budget
    const budget = await chatApi.send({
      message: '100000',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(budget, 'showing_cars');
  });

  it('should recognize "tre" keyword for residency', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', // At asking_residency
    ]);

    const residency = await chatApi.send({
      message: 'tre',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(residency, 'asking_fuel_type');
  });

  it('should recognize "étranger" keyword for abroad origin', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', // At asking_car_origin
    ]);

    const origin = await chatApi.send({
      message: 'étranger',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(origin, 'asking_residency');
  });

  it('should recognize "import" keyword for abroad origin', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1',
    ]);

    const origin = await chatApi.send({
      message: 'import',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(origin, 'asking_residency');
  });
});

// ============================================================================
// FCR Famille Flow (Tunisian Resident in Tunisia)
// ============================================================================

describe('Import Car Search - FCR Famille Flow', () => {
  it('should complete full FCR Famille flow with "yes" response', async () => {
    // Step 1: Greeting
    const greeting = await chatApi.send({ message: 'Bonjour' });
    assertChatState(greeting, 'goal_selection');

    // Step 2: Select find_car
    const findCar = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(findCar, 'asking_car_origin');

    // Step 3: Select abroad
    const abroad = await chatApi.send({
      message: '2',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(abroad, 'asking_residency');

    // Step 4: Select local residency
    const residency = await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(residency, 'asking_fcr_famille');

    // Step 5: Answer FCR Famille question - Yes
    const fcrFamille = await chatApi.send({
      message: '1', // yes
      conversation_id: greeting.conversation_id,
    });
    assertChatState(fcrFamille, 'asking_fuel_type');

    // Step 6: Continue with fuel type
    const fuel = await chatApi.send({
      message: '2', // diesel
      conversation_id: greeting.conversation_id,
    });
    assertChatState(fuel, 'asking_car_type');

    // Step 7: Car type
    const carType = await chatApi.send({
      message: '2', // sedan
      conversation_id: greeting.conversation_id,
    });
    assertChatState(carType, 'asking_condition');

    // Step 8: Condition
    const condition = await chatApi.send({
      message: '3', // any
      conversation_id: greeting.conversation_id,
    });
    assertChatState(condition, 'asking_budget');

    // Step 9: Budget
    const budget = await chatApi.send({
      message: '120000',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(budget, 'showing_cars');
  });

  it('should complete FCR Famille flow with "no" response', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', '1', // At asking_fcr_famille
    ]);

    // Answer No to FCR Famille
    const fcrNo = await chatApi.send({
      message: '2', // no
      conversation_id: responses[0].conversation_id,
    });
    // Should still continue to fuel type selection
    assertChatState(fcrNo, 'asking_fuel_type');
  });

  it('should recognize "oui" for FCR Famille', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', '1',
    ]);

    const fcr = await chatApi.send({
      message: 'oui',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(fcr, 'asking_fuel_type');
  });

  it('should recognize "non" for FCR Famille', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', '1',
    ]);

    const fcr = await chatApi.send({
      message: 'non',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(fcr, 'asking_fuel_type');
  });
});

// ============================================================================
// Import Flow - All "Any" Options
// ============================================================================

describe('Import Car Search - All "Any" Options', () => {
  it('should complete TRE flow with all "any" selections', async () => {
    const responses = await runConversationFlow([
      'Bonjour',     // goal_selection
      '1',           // find_car → asking_car_origin
      '2',           // abroad → asking_residency
      '2',           // TRE → asking_fuel_type
      '6',           // any fuel → asking_car_type
      '4',           // any car type → asking_condition
      '3',           // any condition → asking_budget
      '150000',      // budget → showing_cars
    ]);

    const finalResponse = responses[responses.length - 1];
    assertChatState(finalResponse, 'showing_cars');
  });
});

// ============================================================================
// Import Flow - Arabic Keywords
// ============================================================================

describe('Import Car Search - Arabic Keywords', () => {
  it('should recognize Arabic "خارج" for abroad origin', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });
    await chatApi.send({
      message: '1',
      conversation_id: greeting.conversation_id,
    });

    const origin = await chatApi.send({
      message: 'خارج',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(origin, 'asking_residency');
  });

  it('should recognize Arabic "نعم" for FCR Famille yes', async () => {
    const greeting = await chatApi.send({ message: 'مرحبا' });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '2', conversation_id: greeting.conversation_id });
    await chatApi.send({ message: '1', conversation_id: greeting.conversation_id });

    const fcr = await chatApi.send({
      message: 'نعم',
      conversation_id: greeting.conversation_id,
    });
    assertChatState(fcr, 'asking_fuel_type');
  });
});

// ============================================================================
// Import Flow - Different Order than Tunisia
// ============================================================================

describe('Import Car Search - Order Verification', () => {
  it('should ask fuel_type BEFORE condition in import flow', async () => {
    // Import flow order: origin → residency → (fcr_famille) → fuel → car_type → condition → budget
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', '2', // TRE at asking_fuel_type
    ]);

    const fuelStep = responses[responses.length - 1];
    assertChatState(fuelStep, 'asking_fuel_type');

    // After fuel comes car_type (not condition like Tunisia)
    const carType = await chatApi.send({
      message: '1',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(carType, 'asking_car_type');

    // After car_type comes condition
    const condition = await chatApi.send({
      message: '1',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(condition, 'asking_condition');
  });

  it('Tunisia flow asks condition BEFORE fuel_type', async () => {
    // Tunisia flow order: origin → condition → budget → fuel → car_type
    const responses = await runConversationFlow([
      'Bonjour', '1', '1', // Tunisia at asking_condition
    ]);

    const conditionStep = responses[responses.length - 1];
    assertChatState(conditionStep, 'asking_condition');
  });
});

// ============================================================================
// Import Flow - Electric Cars
// ============================================================================

describe('Import Car Search - Electric Preference', () => {
  it('should complete flow with electric car preference', async () => {
    const responses = await runConversationFlow([
      'Bonjour',     // goal_selection
      '1',           // find_car
      '2',           // abroad
      '2',           // TRE
      '5',           // electric
      '3',           // compact
      '3',           // any condition
      '200000',      // higher budget for EVs
    ]);

    const finalResponse = responses[responses.length - 1];
    assertChatState(finalResponse, 'showing_cars');
  });

  it('should accept "électrique" keyword for electric fuel', async () => {
    const responses = await runConversationFlow([
      'Bonjour', '1', '2', '2',
    ]);

    const fuel = await chatApi.send({
      message: 'électrique',
      conversation_id: responses[0].conversation_id,
    });
    assertChatState(fuel, 'asking_car_type');
  });
});

// ============================================================================
// Import Flow - State Transitions
// ============================================================================

describe('Import Car Search - State Transitions', () => {
  it('should have correct state sequence for TRE', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    const states: string[] = [greeting.state!];

    const s1 = await chatApi.send({ message: '1', conversation_id: id });
    states.push(s1.state!);

    const s2 = await chatApi.send({ message: '2', conversation_id: id });
    states.push(s2.state!);

    const s3 = await chatApi.send({ message: '2', conversation_id: id });
    states.push(s3.state!);

    const s4 = await chatApi.send({ message: '1', conversation_id: id });
    states.push(s4.state!);

    const s5 = await chatApi.send({ message: '1', conversation_id: id });
    states.push(s5.state!);

    const s6 = await chatApi.send({ message: '2', conversation_id: id });
    states.push(s6.state!);

    const s7 = await chatApi.send({ message: '100000', conversation_id: id });
    states.push(s7.state!);

    assertEquals(states, [
      'goal_selection',
      'asking_car_origin',
      'asking_residency',
      'asking_fuel_type',
      'asking_car_type',
      'asking_condition',
      'asking_budget',
      'showing_cars',
    ]);
  });

  it('should have correct state sequence for FCR Famille', async () => {
    const greeting = await chatApi.send({ message: 'Bonjour' });
    const id = greeting.conversation_id!;

    const states: string[] = [greeting.state!];

    const s1 = await chatApi.send({ message: '1', conversation_id: id });
    states.push(s1.state!);

    const s2 = await chatApi.send({ message: '2', conversation_id: id });
    states.push(s2.state!);

    const s3 = await chatApi.send({ message: '1', conversation_id: id }); // local
    states.push(s3.state!);

    const s4 = await chatApi.send({ message: '1', conversation_id: id }); // FCR oui
    states.push(s4.state!);

    const s5 = await chatApi.send({ message: '1', conversation_id: id });
    states.push(s5.state!);

    const s6 = await chatApi.send({ message: '1', conversation_id: id });
    states.push(s6.state!);

    const s7 = await chatApi.send({ message: '2', conversation_id: id });
    states.push(s7.state!);

    const s8 = await chatApi.send({ message: '100000', conversation_id: id });
    states.push(s8.state!);

    assertEquals(states, [
      'goal_selection',
      'asking_car_origin',
      'asking_residency',
      'asking_fcr_famille',
      'asking_fuel_type',
      'asking_car_type',
      'asking_condition',
      'asking_budget',
      'showing_cars',
    ]);
  });
});
