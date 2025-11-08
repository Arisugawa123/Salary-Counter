-- ============================================
-- MIGRATION: Add Custom Commissions Support
-- Run this SQL in your Supabase SQL Editor to update existing database
-- ============================================

-- Add custom_commissions column to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS custom_commissions JSONB DEFAULT '[]'::jsonb;

-- Add custom commission fields to time_records table
ALTER TABLE time_records 
ADD COLUMN IF NOT EXISTS custom_commission_counts JSONB DEFAULT '{}'::jsonb;

ALTER TABLE time_records 
ADD COLUMN IF NOT EXISTS custom_commissions_total NUMERIC(10, 2) DEFAULT 0;

-- Update comment for clarity
COMMENT ON COLUMN settings.custom_commissions IS 'Array of custom commission types with id, name, and rate';
COMMENT ON COLUMN time_records.custom_commission_counts IS 'Object mapping commission IDs to their counts';
COMMENT ON COLUMN time_records.custom_commissions_total IS 'Total amount from custom commissions';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

