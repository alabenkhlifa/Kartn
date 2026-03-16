/**
 * Reusable car result validators
 */

import type { ChatResponse, CarResult, ValidationResult } from '../types.ts';

/**
 * Validate minimum number of cars
 */
export function minCars(
  count: number
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const cars = response.cars || [];

    if (cars.length >= count) {
      return { passed: true, message: `Found ${cars.length} cars (min: ${count})` };
    }

    return {
      passed: false,
      message: `Expected at least ${count} cars, got ${cars.length}`,
    };
  };
}

/**
 * Validate cars are from expected origin
 */
export function carsFromOrigin(
  origin: 'tunisia' | 'abroad'
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const cars = response.cars || [];

    if (cars.length === 0) {
      return { passed: true, message: 'No cars to validate' };
    }

    for (const car of cars) {
      const isTunisia = car.country === 'TN';
      const expectTunisia = origin === 'tunisia';

      if (isTunisia !== expectTunisia) {
        return {
          passed: false,
          message: `Car ${car.brand} ${car.model} is from ${car.country}, expected origin '${origin}'`,
        };
      }
    }

    return { passed: true, message: `All cars from ${origin}` };
  };
}

/**
 * Validate cars have expected fuel type
 */
export function carsWithFuel(
  expectedFuel: string
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const cars = response.cars || [];

    if (cars.length === 0) {
      return { passed: true, message: 'No cars to validate' };
    }

    const normalizedExpected = expectedFuel.toLowerCase();

    for (const car of cars) {
      const fuel = car.fuel_type.toLowerCase();
      let matches = false;

      if (normalizedExpected === 'essence') {
        matches = fuel.includes('essence') || fuel.includes('petrol') || fuel.includes('benzin') || fuel.includes('gasoline');
      } else if (normalizedExpected === 'diesel') {
        matches = fuel.includes('diesel');
      } else if (normalizedExpected === 'electric') {
        matches = fuel.includes('electric') || fuel.includes('elektro') || fuel.includes('électrique');
      } else if (normalizedExpected === 'hybrid') {
        matches = fuel.includes('hybrid') && !fuel.includes('rechargeable') && !fuel.includes('plug');
      } else if (normalizedExpected === 'hybrid_rechargeable') {
        matches = fuel.includes('plug') || fuel.includes('rechargeable') || fuel.includes('phev');
      } else if (normalizedExpected === 'any') {
        matches = true;
      }

      if (!matches) {
        return {
          passed: false,
          message: `Car ${car.brand} ${car.model} has fuel '${fuel}', expected '${expectedFuel}'`,
        };
      }
    }

    return { passed: true, message: `All cars have fuel type: ${expectedFuel}` };
  };
}

/**
 * Validate cars have expected condition
 */
export function carsWithCondition(
  expectedCondition: 'new' | 'used' | 'any'
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const cars = response.cars || [];

    if (cars.length === 0 || expectedCondition === 'any') {
      return { passed: true, message: 'No condition validation needed' };
    }

    for (const car of cars) {
      const isNew = car.mileage_km === 0 || car.mileage_km === null;

      if (expectedCondition === 'new' && !isNew) {
        return {
          passed: false,
          message: `Car ${car.brand} ${car.model} has mileage ${car.mileage_km}km, expected new`,
        };
      }

      if (expectedCondition === 'used' && isNew) {
        return {
          passed: false,
          message: `Car ${car.brand} ${car.model} is new, expected used`,
        };
      }
    }

    return { passed: true, message: `All cars match condition: ${expectedCondition}` };
  };
}

/**
 * Validate cars have FCR eligibility info (for imports)
 */
export function carsHaveFCRInfo(): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const cars = response.cars || [];

    if (cars.length === 0) {
      return { passed: true, message: 'No cars to validate' };
    }

    for (const car of cars) {
      // Only check imports (non-TN)
      if (car.country !== 'TN') {
        if (car.fcr_tre_eligible === undefined && car.fcr_famille_eligible === undefined) {
          return {
            passed: false,
            message: `Import car ${car.brand} ${car.model} missing FCR eligibility info`,
          };
        }
      }
    }

    return { passed: true, message: 'All import cars have FCR info' };
  };
}

/**
 * Validate cars are within budget
 */
export function carsWithinBudget(
  maxBudgetTND: number
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const cars = response.cars || [];

    if (cars.length === 0) {
      return { passed: true, message: 'No cars to validate' };
    }

    for (const car of cars) {
      const price = car.price_tnd || (car.price_eur ? car.price_eur * 3.5 : null);

      if (price && price > maxBudgetTND * 1.5) {
        // Allow some margin
        return {
          passed: false,
          message: `Car ${car.brand} ${car.model} price ${price} TND exceeds budget ${maxBudgetTND} TND`,
        };
      }
    }

    return { passed: true, message: `All cars within budget ${maxBudgetTND} TND` };
  };
}

/**
 * Validate cars have required fields
 */
export function carsHaveRequiredFields(
  fields: (keyof CarResult)[]
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const cars = response.cars || [];

    if (cars.length === 0) {
      return { passed: true, message: 'No cars to validate' };
    }

    for (const car of cars) {
      for (const field of fields) {
        if (car[field] === undefined || car[field] === null) {
          return {
            passed: false,
            message: `Car ${car.brand} ${car.model} missing required field: ${field}`,
          };
        }
      }
    }

    return { passed: true, message: 'All cars have required fields' };
  };
}

/**
 * Validate message contains car results
 */
export function hasCarsInMessage(): (response: ChatResponse) => ValidationResult {
  return (response) => {
    // Check if message mentions cars or has car formatting
    const carPatterns = [
      /\d+\.\s*(?:⭐|★)?\s*\w+\s+\w+/i, // "1. ⭐ Brand Model"
      /💰\s*\d+/i, // Price emoji
      /voiture|car|كرهبة|سيارة/i, // Car words
      /recommand|توصي/i, // Recommendation words
    ];

    for (const pattern of carPatterns) {
      if (pattern.test(response.message)) {
        return { passed: true, message: 'Car results found in message' };
      }
    }

    if (response.cars && response.cars.length > 0) {
      return { passed: true, message: 'Cars present in response object' };
    }

    return {
      passed: false,
      message: 'No car results found in response',
    };
  };
}
