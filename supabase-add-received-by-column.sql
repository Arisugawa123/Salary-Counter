-- ============================================
-- ADD RECEIVED_BY COLUMN TO ORDERS TABLE
-- Run this SQL in your Supabase SQL Editor
-- 
-- This migration adds a 'received_by' column to track
-- which employee created/received the order.
-- ============================================

-- Add received_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'received_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN received_by TEXT;
  END IF;
END $$;

-- Create index for received_by column
CREATE INDEX IF NOT EXISTS idx_orders_received_by ON orders(received_by);


