/**
 * Custom assertion helpers for Kartn tests
 */

import { assert, assertEquals, assertMatch } from '../deps.ts';
import type { ChatResponse, CarRecommendation, ScoreBreakdown } from './api-client.ts';

/**
 * Assert that a chat response is in the expected state
 */
export function assertChatState(response: ChatResponse, expectedState: string, message?: string): void {
  assertEquals(
    response.state,
    expectedState,
    message || `Expected state '${expectedState}', got '${response.state}'`
  );
}

/**
 * Assert that a chat response is in the expected language
 */
export function assertChatLanguage(
  response: ChatResponse,
  expectedLanguage: 'french' | 'arabic' | 'derja',
  message?: string
): void {
  assertEquals(
    response.language,
    expectedLanguage,
    message || `Expected language '${expectedLanguage}', got '${response.language}'`
  );
}

/**
 * Assert that a chat response contains certain text (case-insensitive)
 */
export function assertMessageContains(response: ChatResponse, text: string, message?: string): void {
  assert(
    response.message.toLowerCase().includes(text.toLowerCase()),
    message || `Expected message to contain '${text}', got: ${response.message.slice(0, 100)}...`
  );
}

/**
 * Assert that a chat response has options
 */
export function assertHasOptions(response: ChatResponse, minCount = 1, message?: string): void {
  assert(
    response.options && response.options.length >= minCount,
    message || `Expected at least ${minCount} options, got ${response.options?.length || 0}`
  );
}

/**
 * Assert that a chat response has cars
 */
export function assertHasCars(response: ChatResponse, minCount = 1, message?: string): void {
  assert(
    response.cars && response.cars.length >= minCount,
    message || `Expected at least ${minCount} cars, got ${response.cars?.length || 0}`
  );
}

/**
 * Assert that recommendations are sorted by score (descending)
 */
export function assertSortedByScore(recommendations: CarRecommendation[], message?: string): void {
  for (let i = 1; i < recommendations.length; i++) {
    assert(
      recommendations[i - 1].score >= recommendations[i].score,
      message || `Recommendations not sorted: score ${recommendations[i - 1].score} should be >= ${recommendations[i].score} at index ${i}`
    );
  }
}

/**
 * Assert that ranks are sequential starting from 1
 */
export function assertSequentialRanks(recommendations: CarRecommendation[], message?: string): void {
  recommendations.forEach((rec, index) => {
    assertEquals(
      rec.rank,
      index + 1,
      message || `Expected rank ${index + 1}, got ${rec.rank}`
    );
  });
}

/**
 * Assert that score breakdown sums to total score
 */
export function assertScoreBreakdownSumsCorrectly(
  breakdown: ScoreBreakdown,
  totalScore: number,
  tolerance = 0.5,
  message?: string
): void {
  const sum =
    breakdown.price_fit +
    breakdown.age +
    breakdown.mileage +
    breakdown.reliability +
    breakdown.parts_availability +
    breakdown.fuel_efficiency +
    breakdown.preference_match +
    breakdown.practicality;

  assert(
    Math.abs(sum - totalScore) <= tolerance,
    message || `Score breakdown sum (${sum}) doesn't match total score (${totalScore})`
  );
}

/**
 * Assert recommendation strength matches score thresholds
 */
export function assertRecommendationStrength(
  score: number,
  strength: 'excellent' | 'good' | 'fair' | 'poor',
  message?: string
): void {
  let expectedStrength: 'excellent' | 'good' | 'fair' | 'poor';

  if (score >= 75) {
    expectedStrength = 'excellent';
  } else if (score >= 60) {
    expectedStrength = 'good';
  } else if (score >= 45) {
    expectedStrength = 'fair';
  } else {
    expectedStrength = 'poor';
  }

  assertEquals(
    strength,
    expectedStrength,
    message || `Score ${score} should have strength '${expectedStrength}', got '${strength}'`
  );
}

/**
 * Assert diversity constraint (max 2 of same brand+model)
 */
export function assertDiversityConstraint(
  recommendations: CarRecommendation[],
  maxSameModel = 2,
  message?: string
): void {
  const modelCounts = new Map<string, number>();

  for (const rec of recommendations) {
    const key = `${rec.car.brand.toLowerCase()}-${rec.car.model.toLowerCase()}`;
    const count = (modelCounts.get(key) || 0) + 1;
    modelCounts.set(key, count);

    assert(
      count <= maxSameModel,
      message || `Model '${key}' appears ${count} times, max allowed is ${maxSameModel}`
    );
  }
}

/**
 * Assert that all cars match a specific filter
 */
export function assertAllCarsMatchFuel(
  recommendations: CarRecommendation[],
  expectedFuel: string,
  message?: string
): void {
  for (const rec of recommendations) {
    const fuel = rec.car.fuel_type.toLowerCase();
    const normalizedExpected = expectedFuel.toLowerCase();

    // Handle normalization
    let matches = false;
    if (normalizedExpected === 'essence') {
      matches = fuel.includes('essence') || fuel.includes('petrol') || fuel.includes('benzin') || fuel.includes('gasoline');
    } else if (normalizedExpected === 'diesel') {
      matches = fuel.includes('diesel');
    } else if (normalizedExpected === 'electric') {
      matches = fuel.includes('electric') || fuel.includes('elektro');
    } else if (normalizedExpected === 'hybrid') {
      matches = fuel.includes('hybrid') && !fuel.includes('rechargeable') && !fuel.includes('plug');
    } else if (normalizedExpected === 'hybrid_rechargeable') {
      matches = fuel.includes('plug') || fuel.includes('rechargeable') || fuel.includes('phev');
    }

    assert(
      matches,
      message || `Car ${rec.car.brand} ${rec.car.model} has fuel '${fuel}', expected '${expectedFuel}'`
    );
  }
}

/**
 * Assert that all cars are from a specific origin
 */
export function assertAllCarsFromOrigin(
  recommendations: CarRecommendation[],
  origin: 'tunisia' | 'abroad',
  message?: string
): void {
  for (const rec of recommendations) {
    const isTunisia = rec.car.country === 'TN';
    const expectTunisia = origin === 'tunisia';

    assertEquals(
      isTunisia,
      expectTunisia,
      message || `Car ${rec.car.brand} ${rec.car.model} is from ${rec.car.country}, expected origin '${origin}'`
    );
  }
}

/**
 * Assert that FCR eligibility info is present for imports only
 */
export function assertFcrEligibilityPresence(recommendations: CarRecommendation[], message?: string): void {
  for (const rec of recommendations) {
    const isImport = rec.car.country !== 'TN';

    if (isImport) {
      assert(
        rec.fcr_eligible !== undefined,
        message || `Import car ${rec.car.brand} ${rec.car.model} should have fcr_eligible info`
      );
    }
  }
}

/**
 * Assert that a value is within a range
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): void {
  assert(
    value >= min && value <= max,
    message || `Expected ${value} to be in range [${min}, ${max}]`
  );
}

/**
 * Assert HTTP status code
 */
export function assertStatus(response: Response, expectedStatus: number, message?: string): void {
  assertEquals(
    response.status,
    expectedStatus,
    message || `Expected status ${expectedStatus}, got ${response.status}`
  );
}
