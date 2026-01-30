-- Conversation state tracking for wizard flow
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL DEFAULT 'goal_selection',
  goal TEXT,
  residency TEXT,
  fcr_famille BOOLEAN DEFAULT FALSE,
  fuel_preference TEXT,
  car_type_preference TEXT,
  condition_preference TEXT,
  budget_tnd DECIMAL,
  language TEXT DEFAULT 'french',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_conversations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_timestamp();
