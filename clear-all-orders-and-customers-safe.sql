-- ============================================
-- CLEAR ALL ORDERS AND CUSTOMERS (SAFE VERSION)
-- This version handles foreign key constraints
-- WARNING: This will permanently delete all data!
-- ============================================

-- Disable foreign key checks temporarily (PostgreSQL)
SET session_replication_role = 'replica';

-- Or for Supabase/PostgreSQL, you can use:
-- BEGIN;
-- SET CONSTRAINTS ALL DEFERRED;

-- Clear all orders first (since customers might be referenced)
DELETE FROM orders;

-- Clear all customers
DELETE FROM customers;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Alternative: If the above doesn't work, use CASCADE delete
-- This will delete orders and any related data automatically
-- DELETE FROM orders CASCADE;
-- DELETE FROM customers CASCADE;

-- Optional: Reset auto-increment sequences
-- Uncomment if you want to reset ID counters to start from 1

-- For orders table
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'orders_id_seq') THEN
--     ALTER SEQUENCE orders_id_seq RESTART WITH 1;
--   END IF;
-- END $$;

-- For customers table
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'customers_id_seq') THEN
--     ALTER SEQUENCE customers_id_seq RESTART WITH 1;
--   END IF;
-- END $$;

-- Verify deletion
SELECT 
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    (SELECT COUNT(*) FROM customers) as remaining_customers;

-- Show message
DO $$
BEGIN
    RAISE NOTICE 'All orders and customers have been deleted!';
END $$;

