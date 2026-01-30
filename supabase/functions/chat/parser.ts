import { Goal, Residency, FuelPreference, CarTypePreference, ConditionPreference } from './types.ts';

/**
 * Parse goal selection from user input
 * Accepts: "1", "2", "3", or keywords
 */
export function parseGoal(input: string): Goal | null {
  const trimmed = input.trim().toLowerCase();

  // Numeric selection
  if (trimmed === '1' || trimmed.includes('trouver') || trimmed.includes('cherche') || trimmed.includes('voiture')) {
    return 'find_car';
  }
  if (trimmed === '2' || trimmed.includes('calcul') || trimmed.includes('coût') || trimmed.includes('prix')) {
    return 'calculate_cost';
  }
  if (trimmed === '3' || trimmed.includes('procédure') || trimmed.includes('comment') || trimmed.includes('étape')) {
    return 'procedure';
  }

  return null;
}

/**
 * Parse residency selection from user input
 * Accepts: "1", "2", or keywords
 */
export function parseResidency(input: string): Residency | null {
  const trimmed = input.trim().toLowerCase();

  // Numeric selection
  if (trimmed === '1' || trimmed.includes('tunisie') || trimmed.includes('local')) {
    return 'local';
  }
  if (trimmed === '2' || trimmed.includes('étranger') || trimmed.includes('tre') || trimmed.includes('abroad')) {
    return 'abroad';
  }

  return null;
}

/**
 * Parse budget from user input
 * Accepts: "1", "2", "3", "4", or numeric values like "70000", "70k", "70 000"
 */
export function parseBudget(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  // Preset selections
  if (trimmed === '1') return 50000;
  if (trimmed === '2') return 70000;
  if (trimmed === '3') return 90000;
  if (trimmed === '4') return 120000;

  // Parse numeric value
  // Remove spaces, handle "k" suffix
  const cleaned = trimmed
    .replace(/\s/g, '')
    .replace(/tnd/gi, '')
    .replace(/dt/gi, '')
    .trim();

  // Handle "70k" format
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1));
    if (!isNaN(num)) return num * 1000;
  }

  // Handle plain number
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 0) {
    // If less than 500, assume it's in thousands
    return num < 500 ? num * 1000 : num;
  }

  return null;
}

/**
 * Check if message is a greeting
 */
export function isGreeting(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  const greetings = [
    'bonjour', 'bonsoir', 'salut', 'hello', 'hi', 'hey',
    'مرحبا', 'السلام', 'اهلا', 'صباح', 'مساء',
    'salam', 'ahla', 'marhba'
  ];
  return greetings.some(g => trimmed.includes(g));
}

/**
 * Check if message is asking to start over
 */
export function isReset(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  const resets = ['recommencer', 'reset', 'début', 'start', 'nouveau', 'من جديد'];
  return resets.some(r => trimmed.includes(r));
}

/**
 * Parse FCR Famille selection from user input
 * Accepts: "1"/"oui"/"نعم"/"إيه" → true, "2"/"non"/"لا" → false
 */
export function parseFcrFamille(input: string): boolean | null {
  const trimmed = input.trim().toLowerCase();

  // Yes responses
  if (trimmed === '1' || trimmed === 'oui' || trimmed === 'نعم' || trimmed === 'إيه' || trimmed === 'yes') {
    return true;
  }

  // No responses
  if (trimmed === '2' || trimmed === 'non' || trimmed === 'لا' || trimmed === 'no') {
    return false;
  }

  return null;
}

/**
 * Parse fuel type preference from user input
 * Accepts: "1" → 'essence', "2" → 'diesel', "3" → 'hybrid', "4" → 'hybrid_rechargeable', "5" → 'electric', "6" → 'any'
 */
export function parseFuelType(input: string): FuelPreference | null {
  const trimmed = input.trim().toLowerCase();

  // Check for numbered options first
  if (trimmed === '1') return 'essence';
  if (trimmed === '2') return 'diesel';
  if (trimmed === '3') return 'hybrid';
  if (trimmed === '4') return 'hybrid_rechargeable';
  if (trimmed === '5') return 'electric';
  if (trimmed === '6') return 'any';

  // Keyword matching
  if (trimmed.includes('essence') || trimmed.includes('بنزين') || trimmed.includes('petrol') || trimmed.includes('gasoline')) {
    return 'essence';
  }
  if (trimmed.includes('diesel') || trimmed.includes('مازوط') || trimmed.includes('ديزل') || trimmed.includes('gasoil')) {
    return 'diesel';
  }
  // Check for PHEV/rechargeable hybrid before regular hybrid
  if (trimmed.includes('phev') || trimmed.includes('rechargeable') || trimmed.includes('يتشارج') || trimmed.includes('قابل للشحن') || trimmed.includes('plug')) {
    return 'hybrid_rechargeable';
  }
  if (trimmed.includes('hybrid') || trimmed.includes('hybride') || trimmed.includes('هيبريد') || trimmed.includes('هجين')) {
    return 'hybrid';
  }
  if (trimmed.includes('électrique') || trimmed.includes('electric') || trimmed.includes('كهربائي') || trimmed.includes('ev') || trimmed === 'bev') {
    return 'electric';
  }
  if (trimmed.includes('importe') || trimmed.includes('يهم') || trimmed.includes('any') || trimmed.includes('all') || trimmed.includes('tout')) {
    return 'any';
  }

  return null;
}

/**
 * Parse car type preference from user input
 * Accepts: "1" → 'suv', "2" → 'sedan', "3" → 'compact', "4" → 'any'
 */
export function parseCarType(input: string): CarTypePreference | null {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === '1' || trimmed.includes('suv') || trimmed.includes('4x4')) {
    return 'suv';
  }
  if (trimmed === '2' || trimmed.includes('berline') || trimmed.includes('sedan') || trimmed.includes('سيدان') || trimmed.includes('برلين')) {
    return 'sedan';
  }
  if (trimmed === '3' || trimmed.includes('compact') || trimmed.includes('مدمجة') || trimmed.includes('صغيرة')) {
    return 'compact';
  }
  if (trimmed === '4' || trimmed.includes('importe') || trimmed.includes('يهم') || trimmed.includes('any') || trimmed.includes('all')) {
    return 'any';
  }

  return null;
}

/**
 * Parse condition preference from user input
 * Accepts: "1" → 'new', "2" → 'used', "3" → 'any'
 */
export function parseCondition(input: string): ConditionPreference | null {
  const trimmed = input.trim().toLowerCase();

  // New
  if (trimmed === '1' || trimmed.includes('neuve') || trimmed.includes('new') || trimmed.includes('جديدة') || trimmed === 'neuf') {
    return 'new';
  }
  // Used
  if (trimmed === '2' || trimmed.includes('occasion') || trimmed.includes('used') || trimmed.includes('مستعملة') || trimmed.includes('occ')) {
    return 'used';
  }
  // Any
  if (trimmed === '3' || trimmed.includes('importe') || trimmed.includes('يهم') || trimmed.includes('any') || trimmed.includes('all') || trimmed.includes('both')) {
    return 'any';
  }

  return null;
}
