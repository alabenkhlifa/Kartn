-- Track feedback per knowledge chunk to boost/penalize retrieval
CREATE TABLE IF NOT EXISTS chunk_feedback_scores (
  chunk_id TEXT NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  positive_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  feedback_score NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chunk_id)
);

CREATE INDEX idx_chunk_feedback_chunk ON chunk_feedback_scores (chunk_id);

-- Function to aggregate feedback and update chunk scores
-- Links feedback -> messages -> conversations -> retrieved chunks
CREATE OR REPLACE FUNCTION update_chunk_feedback_scores()
RETURNS void AS $$
BEGIN
  -- Reset and recalculate from scratch
  -- In practice, we'd do incremental updates, but this is simpler for now
  INSERT INTO chunk_feedback_scores (chunk_id, positive_count, negative_count, feedback_score, last_updated)
  SELECT
    kc.id as chunk_id,
    COALESCE(SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END), 0) as positive_count,
    COALESCE(SUM(CASE WHEN f.rating = -1 THEN 1 ELSE 0 END), 0) as negative_count,
    COALESCE(
      (SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END)::NUMERIC -
       SUM(CASE WHEN f.rating = -1 THEN 1 ELSE 0 END)::NUMERIC) /
      GREATEST(COUNT(f.id), 1)::NUMERIC,
      0
    ) as feedback_score,
    NOW() as last_updated
  FROM knowledge_chunks kc
  LEFT JOIN feedback f ON f.message_id IN (
    SELECT m.id FROM messages m
    WHERE m.role = 'assistant'
  )
  GROUP BY kc.id
  ON CONFLICT (chunk_id) DO UPDATE SET
    positive_count = EXCLUDED.positive_count,
    negative_count = EXCLUDED.negative_count,
    feedback_score = EXCLUDED.feedback_score,
    last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;
