-- Cache for query embeddings to avoid redundant HuggingFace API calls
CREATE TABLE IF NOT EXISTS query_embeddings_cache (
  query_hash TEXT PRIMARY KEY,
  embedding VECTOR(384) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evict stale entries older than 7 days
CREATE OR REPLACE FUNCTION evict_stale_embeddings()
RETURNS void AS $$
BEGIN
  DELETE FROM query_embeddings_cache WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
