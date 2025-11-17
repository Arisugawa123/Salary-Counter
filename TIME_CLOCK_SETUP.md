# Time Clock System Setup Guide

## Overview
The Time Clock System is a barcode-based employee attendance tracking system that integrates seamlessly with your existing IRONWOLF SHOP SYSTEM. Employees can clock in and out using their barcode scanners, and the system tracks all attendance records in real-time.

## Features
✅ **Barcode Scanner Integration** - Quick clock in/out with employee barcode
✅ **Real-time Tracking** - Live updates of who's currently working
✅ **Beautiful Dashboard** - Modern, animated UI with live statistics
✅ **Auto-refresh** - Updates every 30 seconds automatically
✅ **Duration Tracking** - Automatic calculation of work hours
✅ **Today's Summary** - View all completed shifts for the day
✅ **Error Handling** - Clear notifications for invalid scans or errors

## How to Access

### From Login Page
1. On the login screen, press **CTRL+A** on your keyboard
2. The Time Clock Dashboard will open immediately
3. Press **ESC** to return to the login page

## How to Use

### For Employees

#### Clock In
1. Access the Time Clock Dashboard (CTRL+A from login)
2. Scan your employee barcode
3. You'll see a success notification and your name will appear in the "Currently Working" section
4. Your work duration will be tracked automatically

#### Clock Out
1. Access the Time Clock Dashboard
2. Scan your employee barcode again
3. You'll be clocked out and your shift will appear in "Completed Today"
4. Total work duration will be calculated automatically

### What You Need
- **Employee Barcode**: Your unique access code from the system
  - This is the same access code used for employee login
  - Manager can provide your access code if you don't have it

## Database Setup

### Step 1: Run the Migration
Execute the SQL migration file in your Supabase SQL Editor:

```bash
# The file is: supabase-time-clock-migration.sql
```

Or copy and paste this SQL directly:

```sql
-- Create time_clock_records table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_clock_employee_id ON time_clock_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_date ON time_clock_records(date);

-- Enable RLS
ALTER TABLE time_clock_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on time_clock_records" ON time_clock_records
  FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Verify Table Creation
In Supabase:
1. Go to Table Editor
2. Look for `time_clock_records` table
3. Verify columns: id, employee_id, employee_name, clock_in, clock_out, date, created_at, updated_at

## Barcode Scanner Setup

### Compatible Scanners
Any USB or Bluetooth barcode scanner that simulates keyboard input will work. The scanner should:
- Send the barcode data as text
- Automatically press ENTER after scanning
- Support Code 39, Code 128, or QR codes

### Recommended Settings
- **Input Mode**: Keyboard Emulation
- **Suffix**: Carriage Return (Enter)
- **Prefix**: None
- **Code Types**: Enable Code 39, Code 128, QR

### Testing Your Scanner
1. Open Notepad or any text editor
2. Scan an employee barcode
3. The access code should appear and automatically move to new line
4. If this works, your scanner is configured correctly!

## Creating Employee Barcodes

### Option 1: Use Existing Access Codes
- Employee access codes are already in the system
- Simply print barcodes of these access codes
- Use a barcode generator website (many free options)
- Format: Code 39 or Code 128

### Option 2: Generate from Dashboard
Managers can view employee access codes from:
1. Login as Manager
2. Go to Settings → Employees
3. View/print access codes

### Barcode Generation Tools
Free online tools:
- https://barcode.tec-it.com/
- https://www.barcodesinc.com/generator/
- https://products.aspose.app/barcode/generate

Steps:
1. Select Code 128 or Code 39
2. Enter the employee's access code
3. Generate and download
4. Print on label paper or cardstock
5. Laminate for durability

## Display Setup Recommendations

### Hardware
- **Dedicated Monitor/Tablet**: Place near entrance
- **Resolution**: 1920x1080 or higher recommended
- **Touch Screen**: Optional, but enhances usability
- **Barcode Scanner**: USB connected to the display computer

### Software
- **Browser**: Chrome, Edge, or Firefox (latest version)
- **Kiosk Mode**: Run browser in fullscreen (F11)
- **Auto-Start**: Set browser to open on system boot

### Windows Kiosk Setup
1. Create a new Windows user for the kiosk
2. Set browser to open Time Clock page on startup
3. Press CTRL+A to open Time Clock Dashboard
4. Enable Windows auto-login for the kiosk user

### Preventing Accidental Exit
The system includes:
- ESC key to exit (intentional)
- No mouse required for normal operation
- Auto-focus on barcode input
- Visual feedback for all actions

## Security Features

### Access Control
- Only employees with valid access codes can clock in/out
- Invalid barcode scans show error messages
- No sensitive data displayed on clock screen

### Data Integrity
- Prevents double clock-ins
- Automatic clock-out required before next clock-in
- Timestamps stored in database
- Audit trail maintained

## Troubleshooting

### Scanner Not Working
1. Check USB/Bluetooth connection
2. Test scanner in text editor
3. Verify scanner sends ENTER after scan
4. Check scanner configuration mode

### Employee Not Found
1. Verify access code exists in employees table
2. Check spelling/format matches database
3. Ensure employee hasn't been deleted
4. Contact manager to verify access code

### Clock In/Out Not Saving
1. Check internet connection
2. Verify Supabase credentials are correct
3. Check browser console for errors (F12)
4. Ensure time_clock_records table exists

### Wrong Time Displayed
1. Check system time on the computer
2. Verify timezone settings
3. Supabase stores in UTC (automatic conversion)

## Advanced Features

### Viewing Time Clock Reports
Managers can query time clock data from Supabase:

```sql
-- Today's attendance
SELECT * FROM time_clock_records 
WHERE date = CURRENT_DATE 
ORDER BY clock_in DESC;

-- Employee's work history
SELECT * FROM time_clock_records 
WHERE employee_name = 'John Doe' 
ORDER BY date DESC;

-- Currently clocked in
SELECT * FROM time_clock_records 
WHERE clock_out IS NULL;
```

### Integration with Payroll
The time clock records can be integrated with the existing payroll system:
- Query time_clock_records for date range
- Calculate total hours per employee
- Export to CSV for processing

### Auto Clock-Out Feature
You can add an automated clock-out for employees who forget:

```sql
-- Auto clock-out at midnight for forgotten clock-outs
UPDATE time_clock_records 
SET clock_out = date + INTERVAL '1 day' - INTERVAL '1 second'
WHERE clock_out IS NULL 
AND date < CURRENT_DATE;
```

## Maintenance

### Daily Checks
- Verify scanner is working
- Check computer is powered on
- Ensure browser is on Time Clock screen

### Weekly Maintenance
- Clean barcode scanner lens
- Review any error logs
- Verify data is being saved

### Monthly Tasks
- Review attendance records
- Update employee access codes if needed
- Clean/organize printed barcodes

## Support

### Common Issues
See the Troubleshooting section above

### Getting Help
1. Check system logs in browser console (F12)
2. Review Supabase logs for database errors
3. Contact system administrator

## Best Practices

### For Employees
✅ Clock in immediately upon arrival
✅ Clock out before leaving
✅ Keep barcode card in good condition
✅ Report lost/damaged cards immediately

### For Managers
✅ Regularly review time clock records
✅ Ensure all employees have barcodes
✅ Test scanner weekly
✅ Keep backup scanner available
✅ Maintain printed barcode backups

### For IT/Admins
✅ Keep system updated
✅ Monitor database storage
✅ Backup data regularly
✅ Test disaster recovery plan
✅ Document any customizations

## Future Enhancements

Potential features that could be added:
- Break time tracking
- Overtime alerts
- Department/location tracking
- Photo capture on clock in
- Biometric integration
- Mobile app for remote clock in
- Geofencing for location verification
- Manager approval workflow
- Export to Excel/PDF reports
- Email notifications for missed clock-outs

## License & Credits

Part of the IRONWOLF SHOP SYSTEM v1.2.1
© 2024 All Rights Reserved

---

**Need Help?** Contact your system administrator or refer to the main README.md file.

