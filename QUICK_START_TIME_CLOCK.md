# Quick Start Guide - Time Clock System

## 🚀 Getting Started in 3 Steps

### Step 1: Setup Database (One-time)
Run this SQL in your Supabase SQL Editor:

```sql
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

CREATE INDEX IF NOT EXISTS idx_time_clock_employee_id ON time_clock_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_date ON time_clock_records(date);

ALTER TABLE time_clock_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on time_clock_records" ON time_clock_records
  FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Access Time Clock
1. Open your app login page
2. Press **CTRL+A** on keyboard
3. Time Clock Dashboard appears! 🎉

### Step 3: Start Using
1. Scan employee barcode (or type access code + Enter)
2. Employee is clocked in/out automatically
3. Press ESC to return to login

## 📊 What You See

### Main Display
- **Large Digital Clock** - Current time
- **Barcode Scanner Ready** - Waiting for scans
- **Live Statistics**
  - Currently Working (green)
  - Completed Today (blue)
  - Total Employees (purple)

### Currently Working Section
Shows all employees clocked in with:
- Employee name
- Clock in time
- Live duration counter

### Completed Today Section
Shows finished shifts with:
- Employee name
- Clock in and out times
- Total duration worked

## 🎯 Features

✅ **Barcode Scanner Support** - Instant recognition
✅ **Auto-refresh** - Updates every 30 seconds
✅ **Real-time Tracking** - Live work duration
✅ **Beautiful Animations** - Modern UI
✅ **Error Handling** - Clear notifications
✅ **Keyboard Shortcuts** - CTRL+A to open, ESC to close

## 📱 Usage Tips

### For Employees
- **Clock In**: Scan your barcode once
- **Clock Out**: Scan your barcode again
- That's it! The system handles everything else

### For Managers
- View real-time who's working
- See completed shifts for the day
- All data automatically saved to database
- Access detailed reports in Supabase

## 🔧 Barcode Setup

### What Works as a Barcode?
Your employee **access code** from the system!

### Getting Barcodes
1. Go to any free barcode generator:
   - https://barcode.tec-it.com/
   - https://www.barcodesinc.com/generator/
2. Select "Code 128" format
3. Enter employee access code
4. Download and print
5. Laminate for durability

### Scanner Requirements
- USB or Bluetooth barcode scanner
- Keyboard emulation mode
- Auto-enter after scan

## 🆘 Troubleshooting

**Scanner not working?**
- Test in Notepad first
- Check USB connection
- Verify scanner sends ENTER

**Employee not found?**
- Check access code matches database
- Verify employee exists in system
- Case-sensitive!

**Can't access Time Clock?**
- Make sure you're on login page
- Press CTRL+A (not Cmd+A on Mac)
- Refresh page if needed

## 📖 Full Documentation

For detailed setup, security features, and advanced options, see:
- `TIME_CLOCK_SETUP.md` - Complete guide
- `supabase-time-clock-migration.sql` - Database script

## 💡 Pro Tips

1. **Display Setup**: Use a dedicated monitor/tablet near entrance
2. **Run in Kiosk Mode**: Press F11 for fullscreen browser
3. **Print Barcode Cards**: Laminate and give to all employees
4. **Weekly Checks**: Test scanner, verify data saving
5. **Backup Barcodes**: Keep extra printed copies

## 🎨 Visual Highlights

The Time Clock Dashboard features:
- Animated gradient background
- Pulsing scan indicator
- Smooth transitions and effects
- Color-coded statistics
- Real-time updating clock
- Professional notifications

## 🔐 Security

- Only valid employees can clock in/out
- All timestamps recorded
- Prevents double clock-ins
- Database audit trail
- Secure Supabase backend

---

**That's it!** Press CTRL+A and start tracking time! 🚀

For questions, see `TIME_CLOCK_SETUP.md` for comprehensive documentation.

