# Supabase Setup Guide for Salary Management System

This guide will walk you through setting up Supabase for your Salary Management System.

## Step 1: Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up/login
3. Click "New Project"
4. Fill in the project details:
   - **Project Name**: Salary Management System
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project" and wait for it to initialize (1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 3: Create Environment Variables File

1. In your project root directory (same level as `package.json`), create a file named `.env`
2. Add the following content (replace with your actual values):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## Step 4: Create Database Tables

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase-schema.sql` file from your project
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned" message

## Step 5: Verify Tables Were Created

1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ `employees`
   - ✅ `time_records`
   - ✅ `cash_advance_records`
   - ✅ `settings`

## Step 6: Test the Connection

1. Stop your development server if it's running (Ctrl + C)
2. Start it again:
   ```bash
   npm run dev
   ```
3. Open your browser to the local dev URL
4. Check the browser console - you should NOT see any Supabase connection errors
5. Try adding an employee - it should save to the database!

## Step 7: View Your Data

You can view and edit your data directly in Supabase:
1. Go to **Table Editor** in your Supabase dashboard
2. Click on any table to view/edit records
3. You can manually add, edit, or delete records here

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env` file exists in your project root
- Restart your development server after creating `.env`
- Check that the file name is exactly `.env` (not `.env.txt`)

### Error: "relation does not exist"
- The tables weren't created properly
- Go back to Step 4 and run the SQL schema again
- Make sure you clicked "Run" after pasting the SQL

### Data not persisting after refresh
- Check browser console for errors
- Verify your Supabase URL and key in `.env` are correct
- Make sure Row Level Security policies were created (they're in the schema)

### Can't connect to Supabase
- Check your internet connection
- Verify your Supabase project is active (not paused)
- Check if your Supabase credentials are correct

## Additional Tips

### Backup Your Data
1. Go to **Database** → **Backups** in Supabase
2. Enable daily backups (recommended)

### Monitor Usage
1. Go to **Project Settings** → **Usage**
2. Keep an eye on your database size and API requests
3. Free tier includes:
   - 500 MB database space
   - 2 GB bandwidth
   - 50,000 monthly active users

### Sample Data (Optional)
If you want to start with sample employees:
1. Uncomment the sample data section at the bottom of `supabase-schema.sql`
2. Run it in the SQL Editor

## Next Steps

Once Supabase is set up, all your data will automatically persist:
- ✅ Employees are saved to the database
- ✅ Payroll records are saved
- ✅ Cash advance records are saved
- ✅ Settings are saved
- ✅ Data syncs across browser tabs and devices
- ✅ Data persists after browser refresh

Enjoy your fully functional, database-backed Salary Management System! 🎉

