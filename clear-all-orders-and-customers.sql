-- ============================================
-- CLEAR ALL ORDERS AND CUSTOMERS
-- WARNING: This will permanently delete all data!
-- ============================================

-- Clear all orders
DELETE FROM orders;

-- Clear all customers
DELETE FROM customers;

-- Optional: Reset auto-increment sequences (if using serial/identity columns)
-- Uncomment the following lines if you want to reset the ID counters

-- Reset orders sequence (adjust table name and column name as needed)
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;

-- Reset customers sequence (adjust table name and column name as needed)
-- ALTER SEQUENCE customers_id_seq RESTART WITH 1;

-- Verify deletion
SELECT 
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    (SELECT COUNT(*) FROM customers) as remaining_customers;

