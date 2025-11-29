-- Add rush_order column to orders table
-- Run this SQL in your Supabase SQL Editor
-- 
-- IMPORTANT: This adds a separate rush_order column
-- Rush order and pahabol are two different things:
-- - is_pahabol: Pahabol orders (specific type of rush order)
-- - rush_order: General rush/priority orders

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

-- Add index for rush_order if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_rush_order ON orders(rush_order);

-- Add comment to clarify the difference
COMMENT ON COLUMN orders.rush_order IS 'General rush/priority order flag (separate from is_pahabol)';
COMMENT ON COLUMN orders.is_pahabol IS 'Pahabol order flag (specific type of rush order)';

