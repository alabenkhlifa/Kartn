CREATE TABLE IF NOT EXISTS response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  intent TEXT NOT NULL,
  response_message TEXT NOT NULL,
  suggestions TEXT[], -- stored as array
  ttl_hours INTEGER NOT NULL DEFAULT 24,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_response_cache_key ON response_cache (cache_key);
CREATE INDEX idx_response_cache_expires ON response_cache (expires_at);

-- Cleanup expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM response_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
