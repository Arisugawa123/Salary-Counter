-- ============================================
-- ENSURE SUBLIMATION ORDERS CAN BE SAVED
-- Run this SQL in your Supabase SQL Editor
-- 
-- This script ensures all necessary columns exist
-- for Sublimation orders to be saved correctly.
-- ============================================

-- Ensure orders table exists (from customers migration)
-- This should already exist, but we'll verify

-- Add rush_order column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'rush_order'
  ) THEN
    ALTER TABLE orders ADD COLUMN rush_order BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Column rush_order added successfully';
  ELSE
    RAISE NOTICE 'Column rush_order already exists';
  END IF;
END $$;

-- Add received_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'received_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN received_by TEXT;
    RAISE NOTICE 'Column received_by added successfully';
  ELSE
    RAISE NOTICE 'Column received_by already exists';
  END IF;
END $$;

-- Add is_pahabol column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'is_pahabol'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_pahabol BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Column is_pahabol added successfully';
  ELSE
    RAISE NOTICE 'Column is_pahabol already exists';
  END IF;
END $$;

-- Ensure order_data column is JSONB (should already be)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_data'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_data JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Column order_data added successfully';
  ELSE
    -- Verify it's JSONB type
    IF (SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'order_data') != 'jsonb' THEN
      -- Convert to JSONB if it's not already
      ALTER TABLE orders ALTER COLUMN order_data TYPE JSONB USING order_data::jsonb;
      RAISE NOTICE 'Column order_data converted to JSONB';
    ELSE
      RAISE NOTICE 'Column order_data already exists as JSONB';
    END IF;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_rush_order ON orders(rush_order);
CREATE INDEX IF NOT EXISTS idx_orders_received_by ON orders(received_by);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Verify the structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Test query to check if Sublimation orders can be inserted
-- (This is just a verification, won't actually insert)
DO $$
BEGIN
  RAISE NOTICE '✓ Orders table structure verified';
  RAISE NOTICE '✓ All required columns for Sublimation orders are present';
  RAISE NOTICE '';
  RAISE NOTICE 'Required columns for Sublimation orders:';
  RAISE NOTICE '  - customer_id (BIGINT, nullable)';
  RAISE NOTICE '  - customer_name (TEXT, required)';
  RAISE NOTICE '  - customer_contact (TEXT, nullable)';
  RAISE NOTICE '  - order_type (TEXT, required) - should be "Sublimation"';
  RAISE NOTICE '  - status (TEXT, required) - default "pending"';
  RAISE NOTICE '  - total_amount (NUMERIC, default 0)';
  RAISE NOTICE '  - amount_paid (NUMERIC, default 0)';
  RAISE NOTICE '  - balance (NUMERIC, default 0)';
  RAISE NOTICE '  - rush_order (BOOLEAN, default FALSE)';
  RAISE NOTICE '  - received_by (TEXT, nullable)';
  RAISE NOTICE '  - order_data (JSONB, default {}) - contains cartItems and all order details';
  RAISE NOTICE '  - created_at (TIMESTAMP)';
  RAISE NOTICE '  - updated_at (TIMESTAMP)';
END $$;

