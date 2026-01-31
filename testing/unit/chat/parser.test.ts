/**
 * Unit tests for chat parser functions
 *
 * Tests all 16+ parser functions from supabase/functions/chat/parser.ts
 */

import { describe, it } from '../../deps.ts';
import { assertEquals, assert } from '../../deps.ts';
import {
  goalInputs,
  carOriginInputs,
  residencyInputs,
  budgetInputs,
  fuelTypeInputs,
  carTypeInputs,
  conditionInputs,
  fcrFamilleInputs,
  priceInputs,
  engineCCInputs,
  calcFuelTypeInputs,
  yesNoInputs,
  procedureInputs,
  evTopicInputs,
  popularCarsSelectionInputs,
  salaryLevelInputs,
  greetingInputs,
  resetInputs,
  invalidInputs,
} from '../../test-utils/fixtures.ts';

// Import the actual parser functions
import {
  parseGoal,
  parseCarOrigin,
  parseResidency,
  parseBudget,
  parseFuelType,
  parseCarType,
  parseCondition,
  parseFcrFamille,
  parsePrice,
  parseEngineCC,
  parseCalcFuelType,
  parseYesNo,
  parseProcedure,
  parseEVTopic,
  parsePopularCarsSelection,
  parseSalaryLevel,
  isGreeting,
  isReset,
} from '../../../supabase/functions/chat/parser.ts';

// ============================================================================
// parseGoal tests
// ============================================================================

describe('parseGoal', () => {
  describe('find_car (option 1)', () => {
    for (const input of goalInputs.find_car) {
      it(`should parse "${input}" as find_car`, () => {
        assertEquals(parseGoal(input), 'find_car');
      });
    }
  });

  describe('procedure (option 2)', () => {
    for (const input of goalInputs.procedure) {
      it(`should parse "${input}" as procedure`, () => {
        assertEquals(parseGoal(input), 'procedure');
      });
    }
  });

  describe('compare_cars (option 3)', () => {
    for (const input of goalInputs.compare_cars) {
      it(`should parse "${input}" as compare_cars`, () => {
        assertEquals(parseGoal(input), 'compare_cars');
      });
    }
  });

  describe('ev_info (option 4)', () => {
    for (const input of goalInputs.ev_info) {
      it(`should parse "${input}" as ev_info`, () => {
        assertEquals(parseGoal(input), 'ev_info');
      });
    }
  });

  describe('browse_offers (option 5)', () => {
    for (const input of goalInputs.browse_offers) {
      it(`should parse "${input}" as browse_offers`, () => {
        assertEquals(parseGoal(input), 'browse_offers');
      });
    }
  });

  describe('popular_cars (option 6)', () => {
    for (const input of goalInputs.popular_cars) {
      it(`should parse "${input}" as popular_cars`, () => {
        assertEquals(parseGoal(input), 'popular_cars');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseGoal(input), null);
      });
    }
  });
});

// ============================================================================
// parseCarOrigin tests
// ============================================================================

describe('parseCarOrigin', () => {
  describe('tunisia (option 1)', () => {
    for (const input of carOriginInputs.tunisia) {
      it(`should parse "${input}" as tunisia`, () => {
        assertEquals(parseCarOrigin(input), 'tunisia');
      });
    }
  });

  describe('abroad (option 2)', () => {
    for (const input of carOriginInputs.abroad) {
      it(`should parse "${input}" as abroad`, () => {
        assertEquals(parseCarOrigin(input), 'abroad');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseCarOrigin(input), null);
      });
    }
  });
});

// ============================================================================
// parseResidency tests
// ============================================================================

describe('parseResidency', () => {
  describe('local (option 1)', () => {
    for (const input of residencyInputs.local) {
      it(`should parse "${input}" as local`, () => {
        assertEquals(parseResidency(input), 'local');
      });
    }
  });

  describe('abroad (option 2)', () => {
    for (const input of residencyInputs.abroad) {
      it(`should parse "${input}" as abroad`, () => {
        assertEquals(parseResidency(input), 'abroad');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseResidency(input), null);
      });
    }
  });
});

// ============================================================================
// parseBudget tests
// ============================================================================

describe('parseBudget', () => {
  describe('preset options (1-7)', () => {
    for (const { input, expected } of budgetInputs.presets) {
      it(`should parse "${input}" as ${expected}`, () => {
        assertEquals(parseBudget(input), expected);
      });
    }
  });

  describe('custom values', () => {
    for (const { input, expected } of budgetInputs.custom) {
      it(`should parse "${input}" as ${expected}`, () => {
        assertEquals(parseBudget(input), expected);
      });
    }
  });

  describe('edge cases', () => {
    it('should handle whitespace', () => {
      // Note: Values starting with 1-7 are treated as presets, so use 80000
      assertEquals(parseBudget('  80000  '), 80000);
    });

    it('should return null for non-numeric input', () => {
      assertEquals(parseBudget('abc'), null);
    });

    it('should return null for negative numbers', () => {
      assertEquals(parseBudget('-50000'), null);
    });

    it('should return null for zero', () => {
      assertEquals(parseBudget('0'), null);
    });
  });
});

// ============================================================================
// parseFuelType tests
// ============================================================================

describe('parseFuelType', () => {
  describe('essence (option 1)', () => {
    for (const input of fuelTypeInputs.essence) {
      it(`should parse "${input}" as essence`, () => {
        assertEquals(parseFuelType(input), 'essence');
      });
    }
  });

  describe('diesel (option 2)', () => {
    for (const input of fuelTypeInputs.diesel) {
      it(`should parse "${input}" as diesel`, () => {
        assertEquals(parseFuelType(input), 'diesel');
      });
    }
  });

  describe('hybrid (option 3)', () => {
    for (const input of fuelTypeInputs.hybrid) {
      it(`should parse "${input}" as hybrid`, () => {
        assertEquals(parseFuelType(input), 'hybrid');
      });
    }
  });

  describe('hybrid_rechargeable (option 4)', () => {
    for (const input of fuelTypeInputs.hybrid_rechargeable) {
      it(`should parse "${input}" as hybrid_rechargeable`, () => {
        assertEquals(parseFuelType(input), 'hybrid_rechargeable');
      });
    }
  });

  describe('electric (option 5)', () => {
    for (const input of fuelTypeInputs.electric) {
      it(`should parse "${input}" as electric`, () => {
        assertEquals(parseFuelType(input), 'electric');
      });
    }
  });

  describe('any (option 6)', () => {
    for (const input of fuelTypeInputs.any) {
      it(`should parse "${input}" as any`, () => {
        assertEquals(parseFuelType(input), 'any');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseFuelType(input), null);
      });
    }
  });
});

// ============================================================================
// parseCarType tests
// ============================================================================

describe('parseCarType', () => {
  describe('suv (option 1)', () => {
    for (const input of carTypeInputs.suv) {
      it(`should parse "${input}" as suv`, () => {
        assertEquals(parseCarType(input), 'suv');
      });
    }
  });

  describe('sedan (option 2)', () => {
    for (const input of carTypeInputs.sedan) {
      it(`should parse "${input}" as sedan`, () => {
        assertEquals(parseCarType(input), 'sedan');
      });
    }
  });

  describe('compact (option 3)', () => {
    for (const input of carTypeInputs.compact) {
      it(`should parse "${input}" as compact`, () => {
        assertEquals(parseCarType(input), 'compact');
      });
    }
  });

  describe('any (option 4)', () => {
    for (const input of carTypeInputs.any) {
      it(`should parse "${input}" as any`, () => {
        assertEquals(parseCarType(input), 'any');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseCarType(input), null);
      });
    }
  });
});

// ============================================================================
// parseCondition tests
// ============================================================================

describe('parseCondition', () => {
  describe('new (option 1)', () => {
    for (const input of conditionInputs.new) {
      it(`should parse "${input}" as new`, () => {
        assertEquals(parseCondition(input), 'new');
      });
    }
  });

  describe('used (option 2)', () => {
    for (const input of conditionInputs.used) {
      it(`should parse "${input}" as used`, () => {
        assertEquals(parseCondition(input), 'used');
      });
    }
  });

  describe('any (option 3)', () => {
    for (const input of conditionInputs.any) {
      it(`should parse "${input}" as any`, () => {
        assertEquals(parseCondition(input), 'any');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseCondition(input), null);
      });
    }
  });
});

// ============================================================================
// parseFcrFamille tests
// ============================================================================

describe('parseFcrFamille', () => {
  describe('yes responses', () => {
    for (const input of fcrFamilleInputs.yes) {
      it(`should parse "${input}" as true`, () => {
        assertEquals(parseFcrFamille(input), true);
      });
    }
  });

  describe('no responses', () => {
    for (const input of fcrFamilleInputs.no) {
      it(`should parse "${input}" as false`, () => {
        assertEquals(parseFcrFamille(input), false);
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseFcrFamille(input), null);
      });
    }
  });
});

// ============================================================================
// parsePrice tests
// ============================================================================

describe('parsePrice', () => {
  describe('valid price formats', () => {
    for (const { input, expected } of priceInputs) {
      it(`should parse "${input}" as ${expected}`, () => {
        assertEquals(parsePrice(input), expected);
      });
    }
  });

  describe('edge cases', () => {
    it('should handle whitespace', () => {
      assertEquals(parsePrice('  15000  '), 15000);
    });

    it('should return null for non-numeric input', () => {
      assertEquals(parsePrice('abc'), null);
    });

    it('should return null for negative numbers', () => {
      assertEquals(parsePrice('-5000'), null);
    });
  });
});

// ============================================================================
// parseEngineCC tests
// ============================================================================

describe('parseEngineCC', () => {
  describe('small engine <= 1600cc (option 1)', () => {
    for (const input of engineCCInputs.small) {
      it(`should parse "${input}" as 1400 (representative)`, () => {
        assertEquals(parseEngineCC(input), 1400);
      });
    }
  });

  describe('medium engine 1601-2000cc (option 2)', () => {
    for (const input of engineCCInputs.medium) {
      it(`should parse "${input}" as 1800 (representative)`, () => {
        assertEquals(parseEngineCC(input), 1800);
      });
    }
  });

  describe('large engine > 2000cc (option 3)', () => {
    for (const input of engineCCInputs.large) {
      it(`should parse "${input}" as 2200 (representative)`, () => {
        assertEquals(parseEngineCC(input), 2200);
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseEngineCC(input), null);
      });
    }
  });
});

// ============================================================================
// parseCalcFuelType tests
// ============================================================================

describe('parseCalcFuelType', () => {
  describe('essence (option 1)', () => {
    for (const input of calcFuelTypeInputs.essence) {
      it(`should parse "${input}" as essence`, () => {
        assertEquals(parseCalcFuelType(input), 'essence');
      });
    }
  });

  describe('diesel (option 2)', () => {
    for (const input of calcFuelTypeInputs.diesel) {
      it(`should parse "${input}" as diesel`, () => {
        assertEquals(parseCalcFuelType(input), 'diesel');
      });
    }
  });

  describe('electric (option 3)', () => {
    for (const input of calcFuelTypeInputs.electric) {
      it(`should parse "${input}" as electric`, () => {
        assertEquals(parseCalcFuelType(input), 'electric');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseCalcFuelType(input), null);
      });
    }
  });
});

// ============================================================================
// parseYesNo tests
// ============================================================================

describe('parseYesNo', () => {
  describe('yes responses', () => {
    for (const input of yesNoInputs.yes) {
      it(`should parse "${input}" as true`, () => {
        assertEquals(parseYesNo(input), true);
      });
    }
  });

  describe('no responses', () => {
    for (const input of yesNoInputs.no) {
      it(`should parse "${input}" as false`, () => {
        assertEquals(parseYesNo(input), false);
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseYesNo(input), null);
      });
    }
  });
});

// ============================================================================
// parseProcedure tests
// ============================================================================

describe('parseProcedure', () => {
  describe('fcr_tre (option 1)', () => {
    for (const input of procedureInputs.fcr_tre) {
      it(`should parse "${input}" as fcr_tre`, () => {
        assertEquals(parseProcedure(input), 'fcr_tre');
      });
    }
  });

  describe('fcr_famille (option 2)', () => {
    for (const input of procedureInputs.fcr_famille) {
      it(`should parse "${input}" as fcr_famille`, () => {
        assertEquals(parseProcedure(input), 'fcr_famille');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseProcedure(input), null);
      });
    }
  });
});

// ============================================================================
// parseEVTopic tests
// ============================================================================

describe('parseEVTopic', () => {
  describe('hybrid_vs_ev (option 1)', () => {
    for (const input of evTopicInputs.hybrid_vs_ev) {
      it(`should parse "${input}" as hybrid_vs_ev`, () => {
        assertEquals(parseEVTopic(input), 'hybrid_vs_ev');
      });
    }
  });

  describe('ev_law (option 2)', () => {
    for (const input of evTopicInputs.ev_law) {
      it(`should parse "${input}" as ev_law`, () => {
        assertEquals(parseEVTopic(input), 'ev_law');
      });
    }
  });

  describe('charging_stations (option 3)', () => {
    for (const input of evTopicInputs.charging_stations) {
      it(`should parse "${input}" as charging_stations`, () => {
        assertEquals(parseEVTopic(input), 'charging_stations');
      });
    }
  });

  describe('solar_panels (option 4)', () => {
    for (const input of evTopicInputs.solar_panels) {
      it(`should parse "${input}" as solar_panels`, () => {
        assertEquals(parseEVTopic(input), 'solar_panels');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseEVTopic(input), null);
      });
    }
  });
});

// ============================================================================
// parsePopularCarsSelection tests
// ============================================================================

describe('parsePopularCarsSelection', () => {
  describe('eligibility (option 1)', () => {
    for (const input of popularCarsSelectionInputs.eligibility) {
      it(`should parse "${input}" as eligibility`, () => {
        assertEquals(parsePopularCarsSelection(input), 'eligibility');
      });
    }
  });

  describe('models (option 2)', () => {
    for (const input of popularCarsSelectionInputs.models) {
      it(`should parse "${input}" as models`, () => {
        assertEquals(parsePopularCarsSelection(input), 'models');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parsePopularCarsSelection(input), null);
      });
    }
  });
});

// ============================================================================
// parseSalaryLevel tests
// ============================================================================

describe('parseSalaryLevel', () => {
  describe('eligible (option 1 - under 1500 TND)', () => {
    for (const input of salaryLevelInputs.eligible) {
      it(`should parse "${input}" as eligible`, () => {
        assertEquals(parseSalaryLevel(input), 'eligible');
      });
    }
  });

  describe('not_eligible (option 2 - over 1500 TND)', () => {
    for (const input of salaryLevelInputs.not_eligible) {
      it(`should parse "${input}" as not_eligible`, () => {
        assertEquals(parseSalaryLevel(input), 'not_eligible');
      });
    }
  });

  describe('invalid inputs', () => {
    for (const input of invalidInputs) {
      it(`should return null for "${input}"`, () => {
        assertEquals(parseSalaryLevel(input), null);
      });
    }
  });
});

// ============================================================================
// isGreeting tests
// ============================================================================

describe('isGreeting', () => {
  describe('valid greetings', () => {
    for (const input of greetingInputs) {
      it(`should recognize "${input}" as greeting`, () => {
        assertEquals(isGreeting(input), true);
      });
    }
  });

  describe('non-greetings', () => {
    const nonGreetings = ['acheter', 'voiture', '1', 'budget', 'merci'];
    for (const input of nonGreetings) {
      it(`should not recognize "${input}" as greeting`, () => {
        assertEquals(isGreeting(input), false);
      });
    }
  });

  describe('greetings within text', () => {
    it('should recognize greeting in longer text', () => {
      assertEquals(isGreeting('Bonjour, je cherche une voiture'), true);
    });
  });
});

// ============================================================================
// isReset tests
// ============================================================================

describe('isReset', () => {
  describe('valid reset commands', () => {
    for (const input of resetInputs) {
      it(`should recognize "${input}" as reset`, () => {
        assertEquals(isReset(input), true);
      });
    }
  });

  describe('non-reset commands', () => {
    const nonResets = ['acheter', 'voiture', '1', 'bonjour', 'merci'];
    for (const input of nonResets) {
      it(`should not recognize "${input}" as reset`, () => {
        assertEquals(isReset(input), false);
      });
    }
  });

  describe('reset within text', () => {
    it('should recognize reset in longer text', () => {
      assertEquals(isReset('je veux recommencer'), true);
    });
  });
});

// ============================================================================
// Edge cases and special scenarios
// ============================================================================

describe('Parser edge cases', () => {
  describe('case insensitivity', () => {
    it('should handle uppercase input', () => {
      assertEquals(parseGoal('ACHETER'), 'find_car');
      assertEquals(parseFuelType('DIESEL'), 'diesel');
    });

    it('should handle mixed case input', () => {
      assertEquals(parseCarOrigin('Tunisie'), 'tunisia');
      assertEquals(parseCondition('Neuve'), 'new');
    });
  });

  describe('whitespace handling', () => {
    it('should trim leading/trailing whitespace', () => {
      assertEquals(parseGoal('  1  '), 'find_car');
      // Note: Values starting with 1-7 are treated as presets, so use 80000
      assertEquals(parseBudget('  80000  '), 80000);
    });
  });

  describe('numeric option extraction', () => {
    it('should extract first character for numeric options', () => {
      // "1 (Acheter)" should parse first char as '1'
      assertEquals(parseGoal('1 (Acheter)'), 'find_car');
      assertEquals(parseFuelType('2 - diesel'), 'diesel');
    });
  });
});
