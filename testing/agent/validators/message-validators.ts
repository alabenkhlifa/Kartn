/**
 * Reusable message validators
 */

import type { ChatResponse, ValidationResult, Language } from '../types.ts';

/**
 * Validate that message contains expected text
 */
export function containsText(
  expectedText: string | string[],
  options: { caseSensitive?: boolean } = {}
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const texts = Array.isArray(expectedText) ? expectedText : [expectedText];
    const message = options.caseSensitive
      ? response.message
      : response.message.toLowerCase();

    for (const text of texts) {
      const searchText = options.caseSensitive ? text : text.toLowerCase();
      if (message.includes(searchText)) {
        return { passed: true, message: `Found "${text}" in response` };
      }
    }

    return {
      passed: false,
      message: `Expected message to contain one of: ${texts.join(', ')}`,
      details: { actualMessage: response.message.slice(0, 200) },
    };
  };
}

/**
 * Validate that message has numbered options
 */
export function hasNumberedOptions(
  minOptions = 1
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    // Count numbered options (1. 2. 3. etc)
    const optionPattern = /^\d+\./gm;
    const matches = response.message.match(optionPattern) || [];

    if (matches.length >= minOptions) {
      return {
        passed: true,
        message: `Found ${matches.length} numbered options`,
      };
    }

    return {
      passed: false,
      message: `Expected at least ${minOptions} numbered options, found ${matches.length}`,
    };
  };
}

/**
 * Validate response language matches
 */
export function matchesLanguage(
  expectedLanguage: Language
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    if (response.language === expectedLanguage) {
      return { passed: true, message: `Language matches: ${expectedLanguage}` };
    }

    return {
      passed: false,
      message: `Expected language '${expectedLanguage}', got '${response.language}'`,
    };
  };
}

/**
 * Validate message contains price/cost information
 */
export function hasPriceInfo(): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const pricePatterns = [
      /\d+[\s,.]?\d*\s*(€|EUR|TND|دينار)/i,
      /prix|price|سعر|سوم/i,
      /coût|cost|تكلفة|كلفة/i,
    ];

    for (const pattern of pricePatterns) {
      if (pattern.test(response.message)) {
        return { passed: true, message: 'Price information found' };
      }
    }

    return {
      passed: false,
      message: 'No price information found in response',
    };
  };
}

/**
 * Validate message mentions FCR/import regime
 */
export function hasFCRInfo(): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const fcrPatterns = [
      /fcr/i,
      /tre/i,
      /famille|عائلة|عايلة/i,
      /article\s*55|فصل\s*55/i,
      /import|استيراد|توريد/i,
    ];

    for (const pattern of fcrPatterns) {
      if (pattern.test(response.message)) {
        return { passed: true, message: 'FCR information found' };
      }
    }

    return {
      passed: false,
      message: 'No FCR information found in response',
    };
  };
}

/**
 * Validate message has transition question
 */
export function hasTransitionQuestion(): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const transitionPatterns = [
      /voulez-vous|تحب/i,
      /oui|non|نعم|لا|إيه/i,
      /1\.|2\./,
      /retour|رجوع/i,
    ];

    let matchCount = 0;
    for (const pattern of transitionPatterns) {
      if (pattern.test(response.message)) {
        matchCount++;
      }
    }

    if (matchCount >= 2) {
      return { passed: true, message: 'Transition question found' };
    }

    return {
      passed: false,
      message: 'No transition question (yes/no options) found',
    };
  };
}

/**
 * Combine multiple validators with AND logic
 */
export function all(
  ...validators: ((response: ChatResponse) => ValidationResult)[]
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    for (const validator of validators) {
      const result = validator(response);
      if (!result.passed) {
        return result;
      }
    }
    return { passed: true, message: 'All validations passed' };
  };
}

/**
 * Combine multiple validators with OR logic
 */
export function any(
  ...validators: ((response: ChatResponse) => ValidationResult)[]
): (response: ChatResponse) => ValidationResult {
  return (response) => {
    const failures: string[] = [];

    for (const validator of validators) {
      const result = validator(response);
      if (result.passed) {
        return result;
      }
      failures.push(result.message);
    }

    return {
      passed: false,
      message: `None of the validations passed: ${failures.join('; ')}`,
    };
  };
}
