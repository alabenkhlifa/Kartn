export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
export const CHAT_ENDPOINT = `${SUPABASE_URL}/functions/v1/chat`;

export const CONVERSATION_ID_KEY = 'kartn_conversation_id';

export const EXCHANGE_RATE = {
  eur_to_tnd: 3.35,
  effective_rate: 3.35,
};

// Emoji mappings for suggestion buttons
export const OPTION_EMOJIS: Record<string, string> = {
  'trouver': '🚗',
  'voiture': '🚗',
  'car': '🚗',
  'calculer': '💰',
  'coût': '💰',
  'cost': '💰',
  'procédure': '📋',
  'procedure': '📋',
  'comprendre': '📋',
  'tunisie': '🇹🇳',
  'tunisia': '🇹🇳',
  'étranger': '✈️',
  'abroad': '✈️',
  'tre': '✈️',
  'essence': '⛽',
  'diesel': '⛽',
  'hybride': '🔋',
  'hybrid': '🔋',
  'électrique': '⚡',
  'electric': '⚡',
  'suv': '🚙',
  'berline': '🚗',
  'sedan': '🚗',
  'compact': '🚘',
  'neuve': '✨',
  'new': '✨',
  'occasion': '🔄',
  'used': '🔄',
  'oui': '✅',
  'yes': '✅',
  'non': '❌',
  'no': '❌',
  'famille': '👨‍👩‍👧',
  'family': '👨‍👩‍👧',
  '50k': '💵',
  '70k': '💵',
  '90k': '💵',
  '120k': '💰',
  '150k': '💰',
  '200k': '💎',
  '300k': '💎',
};

// Get emoji for an option text
export function getOptionEmoji(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [key, emoji] of Object.entries(OPTION_EMOJIS)) {
    if (lowerText.includes(key)) {
      return emoji;
    }
  }
  return '';
}
