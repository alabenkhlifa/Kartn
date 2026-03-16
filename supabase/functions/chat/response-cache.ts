import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// TTL by intent type (hours)
const TTL_MAP: Record<string, number> = {
  general_info: 24,
  eligibility: 24,
  cost_calculation: 12,
  car_search: 1,
};

async function hashKey(text: string): Promise<string> {
  const normalized = text.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface CachedResponse {
  message: string;
  suggestions?: string[];
}

export async function getCachedResponse(
  query: string,
  intent: string,
  supabase: SupabaseClient
): Promise<CachedResponse | null> {
  try {
    const cacheKey = await hashKey(`${intent}:${query}`);

    const { data, error } = await supabase
      .from('response_cache')
      .select('response_message, suggestions')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Increment hit count (fire-and-forget)
    void supabase
      .from('response_cache')
      .update({ hit_count: (data as any).hit_count + 1 || 1 })
      .eq('cache_key', cacheKey);

    console.log(`Cache hit for intent=${intent}, key=${cacheKey.substring(0, 8)}`);
    return {
      message: data.response_message,
      suggestions: data.suggestions || undefined,
    };
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  query: string,
  intent: string,
  response: CachedResponse,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const cacheKey = await hashKey(`${intent}:${query}`);
    const ttlHours = TTL_MAP[intent] || 24;
    const expiresAt = new Date(Date.now() + ttlHours * 3600000).toISOString();

    await supabase.from('response_cache').upsert({
      cache_key: cacheKey,
      intent,
      response_message: response.message,
      suggestions: response.suggestions || null,
      ttl_hours: ttlHours,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });

    // Periodic cleanup (1 in 20 writes)
    if (Math.random() < 0.05) {
      void supabase.rpc('cleanup_expired_cache');
    }
  } catch (error) {
    console.error(JSON.stringify({ error: 'Cache write failed', detail: error instanceof Error ? error.message : String(error) }));
  }
}
