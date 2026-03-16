import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_REQUESTS_PER_MINUTE = 30;
const WINDOW_SIZE_MS = 60000; // 1 minute

export async function checkRateLimit(
  key: string,
  supabase: SupabaseClient
): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
  const windowStart = new Date(Date.now() - WINDOW_SIZE_MS).toISOString();

  // Count requests in current window
  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .gte('window_start', windowStart);

  if (error) {
    // On error, allow the request (fail open)
    console.error(JSON.stringify({ error: 'Rate limit check failed', detail: error.message }));
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE };
  }

  const currentCount = count || 0;

  if (currentCount >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: WINDOW_SIZE_MS,
    };
  }

  // Record this request
  await supabase.from('rate_limits').insert({
    key,
    window_start: new Date().toISOString(),
  });

  // Periodic cleanup (1 in 10 requests)
  if (Math.random() < 0.1) {
    void supabase.rpc('cleanup_rate_limits');
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_MINUTE - currentCount - 1,
  };
}
