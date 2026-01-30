import { ParsedOption } from '@/types';
import { getOptionEmoji } from './constants';

/**
 * Parse numbered options from bot message
 * Supports formats like:
 * - "1. Option A"
 * - "1. Option A  2. Option B"
 * - "1. 50k TND  2. 70k TND  3. 90k TND"
 */
export function parseNumberedOptions(message: string): ParsedOption[] {
  const options: ParsedOption[] = [];

  // Split message into lines
  const lines = message.split('\n');

  for (const line of lines) {
    // Pattern: number followed by period, then capture text until next "number." pattern or end
    // Uses lookahead to properly handle options containing numbers (like "50k TND")
    const regex = /(\d+)\.\s*(.+?)(?=\s+\d+\.|$)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const number = parseInt(match[1], 10);
      const text = match[2].trim();

      // Skip if text is too long (likely part of explanation, not an option)
      if (text.length > 60) continue;

      // Skip if text contains URLs or special characters
      if (text.includes('http') || text.includes('@')) continue;

      // Skip empty or whitespace-only text
      if (!text || text.length === 0) continue;

      const emoji = getOptionEmoji(text);

      options.push({
        number,
        text,
        emoji,
      });
    }
  }

  return options;
}

/**
 * Extract the main message content without numbered options
 */
export function extractMainMessage(message: string): string {
  const lines = message.split('\n');
  const mainLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line starts with a number followed by period
    const isOption = /^\d+\.\s/.test(trimmed);

    // Check if line contains inline options (e.g., "1. A  2. B  3. C")
    const hasInlineOptions = /\d+\.\s*\S+\s+\d+\.\s*\S+/.test(trimmed);

    if (!isOption && !hasInlineOptions && trimmed) {
      mainLines.push(trimmed);
    }
  }

  return mainLines.join('\n');
}

/**
 * Check if a message contains car results (looking for specific patterns)
 */
export function hasCarResults(message: string): boolean {
  // Look for car result patterns like "💰" with "TND" or "€"
  return message.includes('💰') && (message.includes('TND') || message.includes('€'));
}

/**
 * Format price with locale
 */
export function formatPrice(price: number, currency: 'EUR' | 'TND' = 'TND'): string {
  const formatted = price.toLocaleString('fr-FR');
  return currency === 'EUR' ? `${formatted}€` : `${formatted} TND`;
}

/**
 * Format mileage
 */
export function formatMileage(km: number | null): string {
  if (!km) return 'Neuf';
  return `${Math.round(km / 1000)}k km`;
}
