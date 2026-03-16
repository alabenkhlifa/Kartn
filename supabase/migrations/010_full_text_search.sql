-- Add full-text search capabilities to knowledge_chunks
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS fts tsvector;

-- Populate tsvector column from content
UPDATE knowledge_chunks SET fts = to_tsvector('french', content);

-- Create trigger to auto-update fts on insert/update
CREATE OR REPLACE FUNCTION knowledge_chunks_fts_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts = to_tsvector('french', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_chunks_fts_update
  BEFORE INSERT OR UPDATE ON knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION knowledge_chunks_fts_trigger();

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_fts ON knowledge_chunks USING GIN (fts);

-- Hybrid search RPC: combines cosine similarity + text rank
CREATE OR REPLACE FUNCTION hybrid_match_knowledge(
  query_embedding vector(384),
  query_text text,
  match_count int DEFAULT 5,
  filter_topic text DEFAULT NULL,
  semantic_weight float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  content text,
  source text,
  section text,
  subsection text,
  topic text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH semantic AS (
    SELECT
      kc.id,
      kc.content,
      kc.source,
      kc.section,
      kc.subsection,
      kc.topic,
      1 - (kc.embedding <=> query_embedding) AS sem_score
    FROM knowledge_chunks kc
    WHERE (filter_topic IS NULL OR kc.topic = filter_topic)
    ORDER BY kc.embedding <=> query_embedding
    LIMIT match_count * 3
  ),
  keyword AS (
    SELECT
      kc.id,
      ts_rank(kc.fts, websearch_to_tsquery('french', query_text)) AS kw_score
    FROM knowledge_chunks kc
    WHERE kc.fts @@ websearch_to_tsquery('french', query_text)
      AND (filter_topic IS NULL OR kc.topic = filter_topic)
  )
  SELECT
    s.id,
    s.content,
    s.source,
    s.section,
    s.subsection,
    s.topic,
    (semantic_weight * s.sem_score + (1 - semantic_weight) * COALESCE(k.kw_score, 0))::float AS similarity
  FROM semantic s
  LEFT JOIN keyword k ON s.id = k.id
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
