-- Quick fix to add is_pahabol column to existing orders table
-- Run this if you get an error that is_pahabol column doesn't exist

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

-- Add index for is_pahabol if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_pahabol ON orders(is_pahabol);

