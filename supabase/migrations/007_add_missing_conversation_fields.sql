-- Add missing columns for EV info, comparison, and car origin flows

-- EV info flow field
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS selected_ev_topic TEXT;

-- Comparison flow field
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS comparison_query TEXT;

-- Car origin field (should have been in original schema)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS car_origin TEXT;
