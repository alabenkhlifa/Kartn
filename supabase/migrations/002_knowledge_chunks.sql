-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge chunks table for RAG retrieval
CREATE TABLE knowledge_chunks (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,              -- Chunk text with section context prepended
  source TEXT NOT NULL,               -- Source filename (e.g., 'fcr-renouvelable.md')
  section TEXT,                       -- H2 header
  subsection TEXT,                    -- H3 header
  topic TEXT NOT NULL,                -- Category for filtering (fcr_eligibility, tax_calculation, etc.)
  chunk_index INTEGER NOT NULL,       -- Position within document
  embedding VECTOR(384),              -- HuggingFace MiniLM embeddings
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_knowledge_chunks_topic ON knowledge_chunks(topic);
CREATE INDEX idx_knowledge_chunks_source ON knowledge_chunks(source);

-- IVFFlat index for similarity search (optimized for ~200 chunks)
-- Using lists = sqrt(n) where n is expected row count
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 15);

-- Function to match knowledge chunks by similarity
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_topic TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  source TEXT,
  section TEXT,
  subsection TEXT,
  topic TEXT,
  chunk_index INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.source,
    kc.section,
    kc.subsection,
    kc.topic,
    kc.chunk_index,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    (filter_topic IS NULL OR kc.topic = filter_topic)
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
