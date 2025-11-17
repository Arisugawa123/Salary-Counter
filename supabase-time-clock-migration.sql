-- Create time_clock_records table for tracking employee clock in/out times

CREATE TABLE IF NOT EXISTS time_clock_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_clock_employee_id ON time_clock_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_date ON time_clock_records(date);
CREATE INDEX IF NOT EXISTS idx_time_clock_clock_in ON time_clock_records(clock_in);

-- Enable Row Level Security
ALTER TABLE time_clock_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're not using user authentication)
CREATE POLICY "Allow all operations on time_clock_records" ON time_clock_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_clock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_time_clock_records_updated_at
  BEFORE UPDATE ON time_clock_records
  FOR EACH ROW
  EXECUTE FUNCTION update_time_clock_updated_at();

-- Add some comments for documentation
COMMENT ON TABLE time_clock_records IS 'Stores employee clock in and clock out times for attendance tracking';
COMMENT ON COLUMN time_clock_records.employee_id IS 'Reference to the employees table';
COMMENT ON COLUMN time_clock_records.employee_name IS 'Cached employee name for faster queries';
COMMENT ON COLUMN time_clock_records.clock_in IS 'Timestamp when employee clocked in';
COMMENT ON COLUMN time_clock_records.clock_out IS 'Timestamp when employee clocked out (NULL if still clocked in)';
COMMENT ON COLUMN time_clock_records.date IS 'Date of the clock in for easier date-based queries';

