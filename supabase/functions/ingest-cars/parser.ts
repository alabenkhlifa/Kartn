/**
 * Simple CSV parser that handles quoted fields and common edge cases
 */
export function parseCsv<T extends Record<string, string>>(csvContent: string): T[] {
  const lines = csvContent.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const records: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);

    if (values.length !== headers.length) {
      console.warn(`Line ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const record = {} as T;
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].trim();
      record[key as keyof T] = values[j] as T[keyof T];
    }
    records.push(record);
  }

  return records;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current.trim());

  return values;
}

/**
 * Parse integer from string, returning null if invalid
 */
export function parseIntOrNull(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const cleaned = value.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse decimal from string, returning null if invalid
 */
export function parseDecimalOrNull(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extract year from registration string (e.g., "01/2020" or "2020")
 */
export function extractYear(registration: string | undefined): number | null {
  if (!registration) return null;

  // Try MM/YYYY format
  const slashMatch = registration.match(/(\d{2})\/(\d{4})/);
  if (slashMatch) {
    return parseInt(slashMatch[2], 10);
  }

  // Try just YYYY
  const yearMatch = registration.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  return null;
}

/**
 * Extract mileage from string (e.g., "50,000 km" or "50000")
 */
export function extractMileage(mileage: string | undefined): number | null {
  if (!mileage) return null;
  const cleaned = mileage.replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extract engine CC from various formats
 */
export function extractEngineCc(value: string | undefined): number | null {
  if (!value) return null;

  // Try to find CC value (e.g., "1.6L", "1600cc", "1600")
  const literMatch = value.match(/(\d+\.?\d*)\s*[lL]/);
  if (literMatch) {
    return Math.round(parseFloat(literMatch[1]) * 1000);
  }

  const ccMatch = value.match(/(\d{3,4})\s*(?:cc)?/i);
  if (ccMatch) {
    return parseInt(ccMatch[1], 10);
  }

  return null;
}

/**
 * Extract power in CV/hp from string
 */
export function extractPower(power: string | undefined): { cvDin: number | null } {
  if (!power) return { cvDin: null };

  // Try HP/CV format (e.g., "150 hp", "150 CV")
  const hpMatch = power.match(/(\d+)\s*(?:hp|cv|ch|ps)/i);
  if (hpMatch) {
    return { cvDin: parseInt(hpMatch[1], 10) };
  }

  // Try kW format and convert (1 kW ≈ 1.36 CV)
  const kwMatch = power.match(/(\d+)\s*kw/i);
  if (kwMatch) {
    const kw = parseInt(kwMatch[1], 10);
    return { cvDin: Math.round(kw * 1.36) };
  }

  return { cvDin: null };
}
