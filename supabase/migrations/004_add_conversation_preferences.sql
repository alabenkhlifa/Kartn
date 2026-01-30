-- Add new columns for wizard preferences
-- These columns support the enhanced car search flow

-- FCR Famille: TRUE if Tunisia resident has TRE family member
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fcr_famille BOOLEAN DEFAULT FALSE;

-- Fuel preference: 'essence' / 'diesel' / 'hybrid' / 'hybrid_rechargeable' / 'electric' / 'any'
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS fuel_preference TEXT;

-- Car type preference: 'suv' / 'sedan' / 'compact' / 'any'
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS car_type_preference TEXT;

-- Condition preference: 'new' / 'used' / 'any'
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS condition_preference TEXT;
