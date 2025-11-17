-- Create DTR (Daily Time Record) table for storing employee attendance
-- This table stores the daily attendance with AM IN, AM OUT, PM IN, PM OUT, OT IN, OT OUT

CREATE TABLE IF NOT EXISTS dtr_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  day_of_month INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  am_in TIME,
  am_out TIME,
  pm_in TIME,
  pm_out TIME,
  ot_in TIME,
  ot_out TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dtr_employee_id ON dtr_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_dtr_date ON dtr_records(date);
CREATE INDEX IF NOT EXISTS idx_dtr_month_year ON dtr_records(month, year);

-- Enable Row Level Security
ALTER TABLE dtr_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're not using user authentication)
CREATE POLICY "Allow all operations on dtr_records" ON dtr_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_dtr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_dtr_records_updated_at
  BEFORE UPDATE ON dtr_records
  FOR EACH ROW
  EXECUTE FUNCTION update_dtr_updated_at();

-- Add some comments for documentation
COMMENT ON TABLE dtr_records IS 'Stores employee Daily Time Record (DTR) with AM/PM/OT time entries';
COMMENT ON COLUMN dtr_records.employee_id IS 'Reference to the employees table';
COMMENT ON COLUMN dtr_records.date IS 'Full date of the record';
COMMENT ON COLUMN dtr_records.day_of_month IS 'Day of the month (1-31)';
COMMENT ON COLUMN dtr_records.am_in IS 'AM clock in time';
COMMENT ON COLUMN dtr_records.am_out IS 'AM clock out time';
COMMENT ON COLUMN dtr_records.pm_in IS 'PM clock in time';
COMMENT ON COLUMN dtr_records.pm_out IS 'PM clock out time';
COMMENT ON COLUMN dtr_records.ot_in IS 'OT (overtime) clock in time';
COMMENT ON COLUMN dtr_records.ot_out IS 'OT (overtime) clock out time';
