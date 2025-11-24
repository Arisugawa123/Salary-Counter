-- Reset all employee access codes to 12345
-- This will drop the unique constraint first, then update all access codes

-- Step 1: Drop the unique constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_access_code_unique'
  ) THEN
    ALTER TABLE employees DROP CONSTRAINT employees_access_code_unique;
  END IF;
END $$;

-- Step 2: Update all employees to have access code "12345"
UPDATE employees 
SET access_code = '12345';

-- Step 3: Verify the update
SELECT 
  id, 
  name, 
  access_code AS "Access Code"
FROM employees 
ORDER BY id;

