-- Add access_code and barcode fields to employees table
-- access_code: For login authentication (secure)
-- barcode: For time clock scanning (printed on cards)
-- This migration is safe to run multiple times

DO $$ 
BEGIN
  -- Add access_code column if it doesn't exist (for login)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'access_code'
  ) THEN
    ALTER TABLE employees ADD COLUMN access_code TEXT;
  END IF;
  
  -- Add barcode column if it doesn't exist (for time clock)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE employees ADD COLUMN barcode TEXT;
  END IF;
END $$;

-- Drop existing constraints if they exist (to allow updates)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_access_code_unique'
  ) THEN
    ALTER TABLE employees DROP CONSTRAINT employees_access_code_unique;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_barcode_unique'
  ) THEN
    ALTER TABLE employees DROP CONSTRAINT employees_barcode_unique;
  END IF;
END $$;

-- Update ALL employees with generated codes
-- access_code: Format AC + 4 digits (e.g., AC0001, AC0002) - for login
-- barcode: Format 6 digits (e.g., 100001, 100002) - for time clock
UPDATE employees 
SET 
  access_code = 'AC' || LPAD(id::TEXT, 4, '0'),
  barcode = LPAD((id + 100000)::TEXT, 6, '0');

-- Make both fields NOT NULL
ALTER TABLE employees 
  ALTER COLUMN access_code SET NOT NULL,
  ALTER COLUMN barcode SET NOT NULL;

-- Add unique constraints
ALTER TABLE employees 
  ADD CONSTRAINT employees_access_code_unique UNIQUE (access_code),
  ADD CONSTRAINT employees_barcode_unique UNIQUE (barcode);

-- Drop old indexes if exist and create new ones
DROP INDEX IF EXISTS idx_employees_access_code;
DROP INDEX IF EXISTS idx_employees_barcode;
CREATE INDEX idx_employees_access_code ON employees(access_code);
CREATE INDEX idx_employees_barcode ON employees(barcode);

-- Add comments
COMMENT ON COLUMN employees.access_code IS 'Employee access code for login authentication (format: AC####)';
COMMENT ON COLUMN employees.barcode IS 'Employee barcode for time clock system (6-digit numeric)';

-- Display the updated employee codes
SELECT 
  id, 
  name, 
  access_code AS "Login Code", 
  barcode AS "Time Clock Barcode",
  shift_type 
FROM employees 
ORDER BY id;

