# DTR (Daily Time Record) Setup Guide

## Overview
The Time Clock System now automatically records employee attendance in a DTR (Daily Time Record) table. When employees clock in or out, the system automatically populates the appropriate column based on the time of day.

## Database Setup

### 1. Run the DTR Migration
Execute the SQL migration file in your Supabase SQL Editor:

```sql
-- File: supabase-dtr-migration.sql
```

This creates the `dtr_records` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| employee_id | BIGINT | Reference to employees table |
| employee_name | TEXT | Cached employee name |
| date | DATE | Full date of the record |
| day_of_month | INTEGER | Day of month (1-31) |
| month | INTEGER | Month (1-12) |
| year | INTEGER | Year |
| am_in | TIME | AM clock in time |
| am_out | TIME | AM clock out time |
| pm_in | TIME | PM clock in time |
| pm_out | TIME | PM clock out time |
| ot_in | TIME | OT (overtime) clock in time |
| ot_out | TIME | OT (overtime) clock out time |

## How It Works

### Automatic Time Recording
When an employee clocks in or out, the system:

1. **Determines the appropriate column** based on the current time:
   - 7:30 AM - 12:00 PM → Records in `am_in`
   - 12:00 PM - 1:00 PM → Records in `am_out`
   - 1:00 PM - 7:00 PM → Records in `pm_in`
   - 7:00 PM - 12:00 AM → Records in `ot_in`
   - 12:00 AM - 7:30 AM → Records in `ot_out`

2. **Creates or updates the DTR record** for that employee and date

3. **Stores the time** in 24-hour format (HH:MM)

### Example Scenario
**Date:** January 16, 2025  
**Employee:** John Doe  
**Time:** 7:41 AM

When John scans his barcode at 7:41 AM:
- System creates a record in `time_clock_records` (for detailed logging)
- System creates/updates a record in `dtr_records`:
  - date: 2025-01-16
  - day_of_month: 16
  - am_in: 07:41
  - All other time fields: NULL

### Manual Override
If an employee needs to clock out early (e.g., clocking "PM OUT" during "PM IN" time):

1. Click the appropriate button (e.g., PM OUT)
2. The system highlights that button for 20 seconds
3. The time is recorded in the corresponding DTR column
4. A countdown indicator shows when it will revert to automatic mode

## Querying DTR Records

### Get DTR for a specific employee and month
```sql
SELECT * FROM dtr_records
WHERE employee_id = 1
  AND month = 1
  AND year = 2025
ORDER BY day_of_month;
```

### Get DTR for a specific date range
```sql
SELECT * FROM dtr_records
WHERE date BETWEEN '2025-01-01' AND '2025-01-15'
ORDER BY employee_name, date;
```

### Get DTR with employee details
```sql
SELECT 
  e.name,
  d.date,
  d.am_in,
  d.am_out,
  d.pm_in,
  d.pm_out,
  d.ot_in,
  d.ot_out
FROM dtr_records d
JOIN employees e ON d.employee_id = e.id
WHERE d.month = 1 AND d.year = 2025
ORDER BY e.name, d.day_of_month;
```

## Benefits

1. **Structured Data**: Each time entry is stored in its own column for easy querying
2. **Unique Records**: One record per employee per day (enforced by database constraint)
3. **Automatic Population**: No manual entry needed - times are recorded automatically
4. **Time-Based Logic**: System intelligently determines which column to use
5. **Manual Override**: Flexibility to handle shift changes or early departures

## Integration with Payroll

The DTR records can be used to:
- Generate attendance reports
- Calculate total hours worked
- Track overtime hours
- Identify late arrivals or early departures
- Generate payroll summaries

## Maintenance

### Backup DTR Data
Regularly backup your DTR records:
```sql
COPY dtr_records TO '/path/to/backup/dtr_backup.csv' WITH CSV HEADER;
```

### Archive Old Records
For performance, consider archiving records older than 6 months:
```sql
-- Create archive table
CREATE TABLE dtr_records_archive (LIKE dtr_records INCLUDING ALL);

-- Move old records
INSERT INTO dtr_records_archive
SELECT * FROM dtr_records
WHERE date < CURRENT_DATE - INTERVAL '6 months';

-- Delete archived records
DELETE FROM dtr_records
WHERE date < CURRENT_DATE - INTERVAL '6 months';
```

## Troubleshooting

### DTR record not created
- Check if the `dtr_records` table exists
- Verify Row Level Security policies are configured correctly
- Check browser console for error messages

### Wrong time recorded
- Verify system time is correct
- Check the manual override indicator (if active)
- Ensure time zones are configured properly

### Duplicate entries
The database has a UNIQUE constraint on (employee_id, date), so duplicates should not occur. If you see errors, it means a record already exists for that date.

## Future Enhancements

Potential improvements to consider:
- Visual DTR viewer in the dashboard
- Export DTR to Excel/PDF
- Email daily/weekly DTR summaries
- Integration with biometric devices
- Mobile app for viewing DTR
