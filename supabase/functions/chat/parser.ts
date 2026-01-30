import { Goal, CarOrigin, Residency, FuelPreference, CarTypePreference, ConditionPreference, CalcFuelType, ProcedureType } from './types.ts';

/**
 * Parse goal selection from user input
 * Accepts: "1", "2", "3", or keywords
 */
export function parseGoal(input: string): Goal | null {
  const trimmed = input.trim().toLowerCase();
  const firstChar = trimmed.charAt(0);

  // Numeric selection
  if (firstChar === '1' || trimmed.includes('trouver') || trimmed.includes('cherche') || trimmed.includes('voiture')) {
    return 'find_car';
  }
  if (firstChar === '2' || trimmed.includes('calcul') || trimmed.includes('coût') || trimmed.includes('prix')) {
    return 'calculate_cost';
  }
  if (firstChar === '3' || trimmed.includes('procédure') || trimmed.includes('comment') || trimmed.includes('étape')) {
    return 'procedure';
  }

  return null;
}

/**
 * Parse car origin selection from user input
 * Accepts: "1", "2", or keywords
 * 1 = Tunisia (local market), 2 = Abroad (import)
 */
export function parseCarOrigin(input: string): CarOrigin | null {
  const trimmed = input.trim().toLowerCase();
  const firstChar = trimmed.charAt(0);

  // Tunisia / local market
  if (firstChar === '1' || trimmed.includes('tunisie') || trimmed.includes('تونس') || trimmed.includes('محلي') || trimmed.includes('local')) {
    return 'tunisia';
  }
  // Abroad / import
  if (firstChar === '2' || trimmed.includes('étranger') || trimmed.includes('خارج') || trimmed.includes('استيراد') || trimmed.includes('import') || trimmed.includes('برّا') || trimmed.includes('برا')) {
    return 'abroad';
  }

  return null;
}

/**
 * Parse residency selection from user input
 * Accepts: "1", "2", or keywords
 */
export function parseResidency(input: string): Residency | null {
  const trimmed = input.trim().toLowerCase();
  const firstChar = trimmed.charAt(0);

  // Numeric selection
  if (firstChar === '1' || trimmed.includes('tunisie') || trimmed.includes('local')) {
    return 'local';
  }
  if (firstChar === '2' || trimmed.includes('étranger') || trimmed.includes('tre') || trimmed.includes('abroad')) {
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
  const firstChar = trimmed.charAt(0);

  // Preset selections
  if (firstChar === '1') return 50000;
  if (firstChar === '2') return 70000;
  if (firstChar === '3') return 90000;
  if (firstChar === '4') return 120000;

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
  const firstChar = trimmed.charAt(0);

  // Yes responses
  if (firstChar === '1' || trimmed === 'oui' || trimmed === 'نعم' || trimmed === 'إيه' || trimmed === 'yes') {
    return true;
  }

  // No responses
  if (firstChar === '2' || trimmed === 'non' || trimmed === 'لا' || trimmed === 'no') {
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
  const firstChar = trimmed.charAt(0);

  // Check for numbered options first
  if (firstChar === '1') return 'essence';
  if (firstChar === '2') return 'diesel';
  if (firstChar === '3') return 'hybrid';
  if (firstChar === '4') return 'hybrid_rechargeable';
  if (firstChar === '5') return 'electric';
  if (firstChar === '6') return 'any';

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

  // Extract first character for numeric options (handles "1 (suv)", "1.", "option 1" etc.)
  const firstChar = trimmed.charAt(0);

  if (firstChar === '1' || trimmed.includes('suv') || trimmed.includes('4x4')) {
    return 'suv';
  }
  if (firstChar === '2' || trimmed.includes('berline') || trimmed.includes('sedan') || trimmed.includes('سيدان') || trimmed.includes('برلين')) {
    return 'sedan';
  }
  if (firstChar === '3' || trimmed.includes('compact') || trimmed.includes('مدمجة') || trimmed.includes('صغيرة')) {
    return 'compact';
  }
  if (firstChar === '4' || trimmed.includes('importe') || trimmed.includes('يهم') || trimmed.includes('any') || trimmed.includes('all')) {
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
  const firstChar = trimmed.charAt(0);

  // New
  if (firstChar === '1' || trimmed.includes('neuve') || trimmed.includes('new') || trimmed.includes('جديدة') || trimmed === 'neuf') {
    return 'new';
  }
  // Used
  if (firstChar === '2' || trimmed.includes('occasion') || trimmed.includes('used') || trimmed.includes('مستعملة') || trimmed.includes('occ')) {
    return 'used';
  }
  // Any
  if (firstChar === '3' || trimmed.includes('importe') || trimmed.includes('يهم') || trimmed.includes('any') || trimmed.includes('all') || trimmed.includes('both')) {
    return 'any';
  }

  return null;
}

/**
 * Parse price from user input (handles "15000", "15000€", "15 000", etc.)
 */
export function parsePrice(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  // Remove currency symbols and common suffixes
  const cleaned = trimmed
    .replace(/€|eur|euro|euros/gi, '')
    .replace(/\s/g, '')
    .trim();

  // Handle "k" suffix (e.g., "15k" → 15000)
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1));
    if (!isNaN(num) && num > 0) return num * 1000;
  }

  // Parse as plain number
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 0) {
    // If less than 500, assume it's in thousands
    return num < 500 ? num * 1000 : num;
  }

  return null;
}

/**
 * Parse engine CC selection (1=≤1600, 2=1601-2000, 3=>2000)
 * Returns representative CC value for calculation
 */
export function parseEngineCC(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  const firstChar = trimmed.charAt(0);

  // Numeric selection
  if (firstChar === '1') return 1400; // Representative value for ≤1600
  if (firstChar === '2') return 1800; // Representative value for 1601-2000
  if (firstChar === '3') return 2200; // Representative value for >2000

  // Keyword matching
  if (trimmed.includes('1600') || trimmed.includes('petit') || trimmed.includes('صغير')) {
    return 1400;
  }
  if (trimmed.includes('2000') || trimmed.includes('moyen') || trimmed.includes('متوسط')) {
    return 1800;
  }
  if (trimmed.includes('gros') || trimmed.includes('grand') || trimmed.includes('كبير')) {
    return 2200;
  }

  return null;
}

/**
 * Parse simple fuel type for calculator (1=essence, 2=diesel, 3=electric)
 */
export function parseCalcFuelType(input: string): CalcFuelType | null {
  const trimmed = input.trim().toLowerCase();
  const firstChar = trimmed.charAt(0);

  // Numeric selection
  if (firstChar === '1') return 'essence';
  if (firstChar === '2') return 'diesel';
  if (firstChar === '3') return 'electric';

  // Keyword matching
  if (trimmed.includes('essence') || trimmed.includes('بنزين') || trimmed.includes('petrol')) {
    return 'essence';
  }
  if (trimmed.includes('diesel') || trimmed.includes('مازوط') || trimmed.includes('ديزل') || trimmed.includes('gasoil')) {
    return 'diesel';
  }
  if (trimmed.includes('électrique') || trimmed.includes('electric') || trimmed.includes('كهربائي') || trimmed.includes('ev')) {
    return 'electric';
  }

  return null;
}

/**
 * Parse yes/no response (1/oui/نعم=true, 2/non/لا=false)
 */
export function parseYesNo(input: string): boolean | null {
  const trimmed = input.trim().toLowerCase();
  const firstChar = trimmed.charAt(0);

  // Yes responses
  if (firstChar === '1' || trimmed === 'oui' || trimmed === 'نعم' || trimmed === 'إيه' || trimmed === 'yes' || trimmed === 'ok' || trimmed === 'd\'accord') {
    return true;
  }

  // No responses
  if (firstChar === '2' || trimmed === 'non' || trimmed === 'لا' || trimmed === 'no' || trimmed.includes('menu') || trimmed.includes('retour') || trimmed.includes('رجوع')) {
    return false;
  }

  return null;
}

/**
 * Parse procedure selection (1=fcr_tre, 2=fcr_famille, 3=achat_local)
 * Handles both numbers and text
 */
export function parseProcedure(input: string): ProcedureType | null {
  const trimmed = input.trim().toLowerCase();
  const firstChar = trimmed.charAt(0);

  // Numeric selection
  if (firstChar === '1') return 'fcr_tre';
  if (firstChar === '2') return 'fcr_famille';
  if (firstChar === '3') return 'achat_local';

  // Keyword matching - FCR TRE
  if (trimmed.includes('fcr tre') || trimmed.includes('tre') || trimmed.includes('توريد') || trimmed.includes('import') || trimmed.includes('étranger') || trimmed.includes('خارج')) {
    return 'fcr_tre';
  }

  // Keyword matching - FCR Famille
  if (trimmed.includes('fcr famille') || trimmed.includes('famille') || trimmed.includes('عائلة') || trimmed.includes('عايلة') || trimmed.includes('article 55') || trimmed.includes('art 55') || trimmed.includes('فصل 55')) {
    return 'fcr_famille';
  }

  // Keyword matching - Achat local
  if (trimmed.includes('local') || trimmed.includes('tunisie') || trimmed.includes('محلي') || trimmed.includes('تونس') || trimmed.includes('achat')) {
    return 'achat_local';
  }

  return null;
}
