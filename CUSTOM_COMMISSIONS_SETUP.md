# Custom Commissions Setup Guide

## Overview
This feature allows you to create custom commission types beyond the default "Rush Tarp" and "Regular" commissions. Custom commissions are stored in Supabase and will appear in the Salary Counter for all employees.

## Database Migration

### For New Installations
If you're setting up the database for the first time, run the complete schema:
```sql
-- Run the entire supabase-schema.sql file in your Supabase SQL Editor
```

### For Existing Installations
If you already have a database running, you need to run the migration script to add custom commission support:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the migration file: `supabase-migration-custom-commissions.sql`

The migration adds:
- `custom_commissions` column to `settings` table (stores commission types)
- `custom_commission_counts` column to `time_records` table (stores counts per record)
- `custom_commissions_total` column to `time_records` table (stores total amount)

## How to Use

### Adding Custom Commission Types

1. **Login as Manager** (access code: 050123)
2. Navigate to **Settings** in the sidebar
3. Scroll to the **Commission Rates** section
4. Find **Custom Commission Types** subsection
5. Enter:
   - **Commission Name**: e.g., "Premium Service", "Express Delivery"
   - **Rate**: Amount per unit (e.g., 75.00)
6. Click **Add** button
7. The commission type is now saved and will appear in the Salary Counter

### Using Custom Commissions in Salary Counter

1. Go to **Salary Counter**
2. Select an employee
3. In the **Commissions** section, you'll see:
   - Rush Tarp (default)
   - Regular (default)
   - **Your custom commission types** (if any added)
4. Enter the count for each commission type
5. The total will automatically calculate

### Managing Custom Commissions

**Edit Rate:**
- Currently, you need to delete and re-add the commission with the new rate
- Future updates may include direct editing

**Delete Commission:**
- Click the red delete button (trash icon) next to the commission
- The commission will be removed from all future records
- Past records will retain their commission data

## Features

✅ **Number Input without Arrows**: All rate inputs are clean text-style inputs without spinner arrows
✅ **Real-time Sync**: Custom commissions save automatically to Supabase
✅ **Per-Employee Tracking**: Each payroll record stores individual commission counts
✅ **Earnings Breakdown**: Custom commissions appear in the detailed earnings breakdown
✅ **Role-Based Access**: Only Managers can add/delete custom commission types
✅ **Accountants Can Use**: Accountants can enter commission counts but cannot add/delete types

## Data Structure

### Settings Table
```json
{
  "customCommissions": [
    {
      "id": "1699234567890",
      "name": "Premium Service",
      "rate": 75
    }
  ]
}
```

### Time Records Table
```json
{
  "customCommissionCounts": {
    "1699234567890": 5
  },
  "customCommissionsTotal": 375.00
}
```

## Troubleshooting

**Custom commissions not appearing?**
- Ensure you've run the migration script
- Check browser console for errors
- Verify Supabase connection

**Can't add custom commission?**
- Ensure you're logged in as Manager
- Check that both name and rate are filled
- Rate must be greater than 0

**Old records don't show custom commissions?**
- This is expected - only new records will have custom commissions
- Old records will still display correctly with their original data

## Technical Notes

- Commission IDs are generated using `Date.now().toString()`
- All commission rates support decimal values (e.g., 25.50)
- JSONB fields are used for flexible storage in PostgreSQL
- Snake_case ↔ camelCase conversion is automatic

