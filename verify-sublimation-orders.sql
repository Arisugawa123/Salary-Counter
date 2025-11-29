-- ============================================
-- VERIFY SUBLIMATION ORDERS TABLE STRUCTURE
-- Run this SQL in your Supabase SQL Editor
-- 
-- This script verifies that all necessary columns exist
-- for Sublimation orders to be saved correctly.
-- ============================================

-- Check if orders table exists and has all required columns
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
  col TEXT;
  required_columns TEXT[] := ARRAY[
    'id',
    'customer_id',
    'customer_name',
    'customer_contact',
    'order_type',
    'status',
    'total_amount',
    'amount_paid',
    'balance',
    'is_pahabol',
    'rush_order',
    'received_by',
    'order_data',
    'created_at',
    'updated_at'
  ];
BEGIN
  -- Check each required column
  FOREACH col IN ARRAY required_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  -- Report results
  IF array_length(missing_columns, 1) IS NULL THEN
    RAISE NOTICE '✓ All required columns exist in orders table';
  ELSE
    RAISE NOTICE '✗ Missing columns: %', array_to_string(missing_columns, ', ');
    RAISE NOTICE 'Please run the migration scripts to add missing columns';
  END IF;
END $$;

-- Verify orders table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check if there are any Sublimation orders
SELECT 
  COUNT(*) as total_sublimation_orders,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
FROM orders
WHERE order_type = 'Sublimation';

-- Show sample Sublimation order structure
SELECT 
  id,
  customer_name,
  customer_contact,
  order_type,
  status,
  total_amount,
  amount_paid,
  balance,
  rush_order,
  received_by,
  order_data->'cartItems' as cart_items,
  created_at
FROM orders
WHERE order_type = 'Sublimation'
ORDER BY created_at DESC
LIMIT 5;

