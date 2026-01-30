-- Add columns for cost calculator and procedure info flows

-- Cost calculator fields
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS calc_price_eur NUMERIC;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS calc_engine_cc INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS calc_fuel_type TEXT;

-- Procedure flow field
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS selected_procedure TEXT;
