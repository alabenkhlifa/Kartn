-- Add car_origin field to conversations table for the new branching flow
-- car_origin: 'tunisia' (local market) or 'abroad' (import)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS car_origin TEXT;
