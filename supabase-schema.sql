-- ============================================
-- SALARY MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== DROP EXISTING TABLES ====================
-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS day_off_records CASCADE;
DROP TABLE IF EXISTS cash_advance_records CASCADE;
DROP TABLE IF EXISTS time_records CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- ==================== EMPLOYEES TABLE ====================
CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_9_hours NUMERIC(10, 2) NOT NULL,
  hours_per_shift NUMERIC(5, 2) NOT NULL DEFAULT 9,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('first', 'second')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TIME RECORDS / PAYROLL TABLE ====================
CREATE TABLE time_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  pay_period TEXT NOT NULL,
  time_entries JSONB NOT NULL,
  rush_tarp_count INTEGER DEFAULT 0,
  regular_commission_count INTEGER DEFAULT 0,
  custom_commission_counts JSONB DEFAULT '{}'::jsonb,
  cash_advance NUMERIC(10, 2) DEFAULT 0,
  regular_pay NUMERIC(10, 2) NOT NULL,
  overtime_pay NUMERIC(10, 2) NOT NULL,
  gross_pay NUMERIC(10, 2) NOT NULL,
  rush_tarp_commission NUMERIC(10, 2) DEFAULT 0,
  regular_commission NUMERIC(10, 2) DEFAULT 0,
  custom_commissions_total NUMERIC(10, 2) DEFAULT 0,
  total_commissions NUMERIC(10, 2) DEFAULT 0,
  total_deductions NUMERIC(10, 2) DEFAULT 0,
  net_pay NUMERIC(10, 2) NOT NULL,
  total_hours NUMERIC(10, 2) NOT NULL,
  regular_hours NUMERIC(10, 2) NOT NULL,
  total_overtime_hours NUMERIC(10, 2) DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  late_deduction NUMERIC(10, 2) DEFAULT 0,
  processed BOOLEAN DEFAULT FALSE,
  processed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== CASH ADVANCE RECORDS TABLE ====================
CREATE TABLE cash_advance_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  balance NUMERIC(10, 2) NOT NULL,
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== DAY OFF RECORDS TABLE ====================
CREATE TABLE day_off_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  pay_period TEXT NOT NULL,
  hours_paid NUMERIC(5, 2) DEFAULT 9,
  is_qualified BOOLEAN DEFAULT TRUE,
  absence_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== SETTINGS TABLE ====================
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_hours_per_shift NUMERIC(5, 2) DEFAULT 9,
  rush_tarp_commission_rate NUMERIC(10, 2) DEFAULT 50,
  regular_commission_rate NUMERIC(10, 2) DEFAULT 20,
  late_deduction_rate NUMERIC(10, 2) DEFAULT 1,
  max_absences_for_day_off INTEGER DEFAULT 3,
  custom_commissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row_settings CHECK (id = 1)
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_time_records_employee ON time_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_records_date ON time_records(year, month);
CREATE INDEX IF NOT EXISTS idx_cash_advance_employee ON cash_advance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_cash_advance_date ON cash_advance_records(date);
CREATE INDEX IF NOT EXISTS idx_day_off_employee ON day_off_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_day_off_date ON day_off_records(date);
CREATE INDEX IF NOT EXISTS idx_day_off_period ON day_off_records(year, month, pay_period);

-- ==================== UPDATED_AT TRIGGERS ====================
-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_records_updated_at
    BEFORE UPDATE ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_advance_updated_at
    BEFORE UPDATE ON cash_advance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_off_updated_at
    BEFORE UPDATE ON day_off_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== INSERT DEFAULT SETTINGS ====================
INSERT INTO settings (id, default_hours_per_shift, rush_tarp_commission_rate, regular_commission_rate, late_deduction_rate, max_absences_for_day_off)
VALUES (1, 9, 50, 20, 1, 3)
ON CONFLICT (id) DO NOTHING;

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_advance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_off_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since this is not user-based)
-- You can modify these policies based on your security requirements

-- Employees policies
CREATE POLICY "Allow all operations on employees" ON employees
    FOR ALL USING (true) WITH CHECK (true);

-- Time records policies
CREATE POLICY "Allow all operations on time_records" ON time_records
    FOR ALL USING (true) WITH CHECK (true);

-- Cash advance records policies
CREATE POLICY "Allow all operations on cash_advance_records" ON cash_advance_records
    FOR ALL USING (true) WITH CHECK (true);

-- Day off records policies
CREATE POLICY "Allow all operations on day_off_records" ON day_off_records
    FOR ALL USING (true) WITH CHECK (true);

-- Settings policies
CREATE POLICY "Allow all operations on settings" ON settings
    FOR ALL USING (true) WITH CHECK (true);

-- ==================== SAMPLE DATA (YOUR EMPLOYEES) ====================
-- Insert your actual employees
-- You can modify the rate_per_9_hours and shift_type for each employee as needed

INSERT INTO employees (name, rate_per_9_hours, hours_per_shift, shift_type) VALUES
('NHADZ', 600, 9, 'first'),
('YUNUS', 600, 9, 'first'),
('MAE MAE', 600, 9, 'second'),
('APANG', 600, 9, 'first'),
('TASIM', 600, 9, 'second'),
('ABBY', 600, 9, 'first'),
('AYENG', 600, 9, 'second'),
('VONE', 600, 9, 'first'),
('HAYRE', 600, 9, 'second'),
('QHAMS', 600, 9, 'first'),
('KIM', 600, 9, 'second');

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

