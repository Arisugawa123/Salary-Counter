-- ============================================
-- CUSTOMERS AND ORDERS MANAGEMENT
-- Run this SQL in your Supabase SQL Editor
-- 
-- IMPORTANT: This migration creates the customers and orders tables
-- needed for the Tarpaulin order system. Make sure to run this
-- before using the order creation feature.
-- ============================================

-- Ensure the update_updated_at_column function exists
-- (This should already exist from the main schema, but we'll create it if needed)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== CUSTOMERS TABLE ====================
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_number TEXT,
  email TEXT,
  address TEXT,
  business_name TEXT,
  notes TEXT,
  total_balance NUMERIC(10, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_number)
);

-- ==================== ORDERS TABLE ====================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  order_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10, 2) DEFAULT 0,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  balance NUMERIC(10, 2) DEFAULT 0,
  is_pahabol BOOLEAN DEFAULT FALSE,
  order_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_pahabol column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'is_pahabol'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_pahabol BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_contact ON customers(contact_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_pahabol ON orders(is_pahabol);

-- ==================== UPDATED_AT TRIGGERS ====================
-- Drop triggers if they exist, then create them
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== FUNCTIONS ====================
-- Function to update customer totals when order is created/updated
CREATE OR REPLACE FUNCTION update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Only update if customer_id is not null
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET 
        total_balance = COALESCE((
          SELECT SUM(balance)
          FROM orders
          WHERE customer_id = NEW.customer_id
        ), 0),
        total_orders = (
          SELECT COUNT(*)
          FROM orders
          WHERE customer_id = NEW.customer_id
        ),
        updated_at = NOW()
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Only update if customer_id is not null
    IF OLD.customer_id IS NOT NULL THEN
      UPDATE customers
      SET 
        total_balance = COALESCE((
          SELECT SUM(balance)
          FROM orders
          WHERE customer_id = OLD.customer_id
        ), 0),
        total_orders = (
          SELECT COUNT(*)
          FROM orders
          WHERE customer_id = OLD.customer_id
        ),
        updated_at = NOW()
      WHERE id = OLD.customer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer totals
DROP TRIGGER IF EXISTS update_customer_totals_trigger ON orders;
CREATE TRIGGER update_customer_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_totals();

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;
CREATE POLICY "Allow all operations on orders" ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

