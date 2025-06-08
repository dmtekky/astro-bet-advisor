# Impact Score Bug Fix Guide

## Problem Summary
The impact score calculation is working correctly but has two main issues:
1. **Database Missing Columns**: The `baseball_players` table is missing the `impact_score` and `astro_influence_score` columns
2. **TeamPage Not Saving**: The `/teams` page calculates impact scores but doesn't save them to the database
3. **PlayerDetailPage Display**: The player-details page shows calculated values instead of database values

## Step 1: Add Missing Database Columns

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this SQL script:

```sql
-- Add impact_score column to baseball_players table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'baseball_players' 
        AND column_name = 'impact_score'
    ) THEN
        ALTER TABLE baseball_players ADD COLUMN impact_score NUMERIC(5, 2) DEFAULT NULL;
        RAISE NOTICE 'Added impact_score column to baseball_players table';
    ELSE
        RAISE NOTICE 'impact_score column already exists in baseball_players table';
    END IF;
END $$;

-- Add astro_influence_score column to baseball_players table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'baseball_players' 
        AND column_name = 'astro_influence_score'
    ) THEN
        ALTER TABLE baseball_players ADD COLUMN astro_influence_score NUMERIC(5, 2) DEFAULT NULL;
        RAISE NOTICE 'Added astro_influence_score column to baseball_players table';
    ELSE
        RAISE NOTICE 'astro_influence_score column already exists in baseball_players table';
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_baseball_players_impact_score ON baseball_players(impact_score);
CREATE INDEX IF NOT EXISTS idx_baseball_players_astro_influence_score ON baseball_players(astro_influence_score);

-- Ensure RLS is enabled and add necessary policies for baseball_players table
ALTER TABLE baseball_players ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'baseball_players' 
        AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users"
        ON baseball_players FOR SELECT
        TO authenticated, anon
        USING (true);
        RAISE NOTICE 'Created read policy for baseball_players table';
    ELSE
        RAISE NOTICE 'Read policy already exists for baseball_players table';
    END IF;
END $$;

-- Create policy for update access (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'baseball_players' 
        AND policyname = 'Enable update access for authenticated users'
    ) THEN
        CREATE POLICY "Enable update access for authenticated users"
        ON baseball_players FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
        RAISE NOTICE 'Created update policy for baseball_players table';
    ELSE
        RAISE NOTICE 'Update policy already exists for baseball_players table';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'baseball_players'
    AND column_name IN ('impact_score', 'astro_influence_score');
```

### Option B: Using Script
Run the prepared SQL file:
```bash
# The SQL script is already created at sql/add_impact_score_columns.sql
# Copy its contents to your Supabase SQL Editor
```

## Step 2: Update Type Definitions

The TypeScript types have already been updated in `src/types/database.types.ts` to include:
- `impact_score: number | null`
- `astro_influence_score: number | null`

## Step 3: Code Changes Made

### TeamPage.tsx Changes
- Added database update functionality to save calculated impact scores
- Now updates the database when impact scores are calculated and differ from stored values

### PlayerDetailPage.tsx Changes
- Fixed display to show database value (`player?.impact_score`) with fallback to calculated value
- This ensures the stored score is displayed rather than a newly calculated one

## Step 4: Verify the Fix

### Test the TeamPage
1. Navigate to `/teams/{teamId}`
2. Check browser console for log messages about updating impact scores
3. Verify players show consistent impact scores

### Test the PlayerDetailPage
1. Navigate to `/teams/{teamId}/player-details/{playerId}`
2. Check the "Performance Impact" section shows a stable score
3. The score should match what was calculated and saved on the teams page

### Verify Database Updates
1. In Supabase dashboard, go to Table Editor
2. Open the `baseball_players` table
3. Check that `impact_score` and `astro_influence_score` columns exist and have values

## Step 5: Troubleshooting

### If impact scores are still not saving:
1. Check browser console for any database errors
2. Verify the database columns were created successfully
3. Check that Supabase RLS policies allow updates to these columns

### If scores are still random/inconsistent:
1. Clear browser cache
2. Check that `player?.impact_score` is being used instead of `calculatedImpactScore` in display
3. Verify the database update logic in TeamPage is working

### If database connection fails:
1. Check environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
2. Verify Supabase project is active
3. Check RLS policies on the `baseball_players` table

### If you get "Permission denied" errors:
The SQL migration script includes RLS (Row Level Security) policies, but if you still get permission errors:
1. Go to Supabase Dashboard → Authentication → Policies
2. Check that the `baseball_players` table has these policies:
   - "Enable read access for all users" (for SELECT)
   - "Enable update access for authenticated users" (for UPDATE)
3. If missing, the SQL script will create them automatically

## Expected Outcome

After implementing these fixes:
1. ✅ Impact scores will be calculated on the `/teams` page and saved to the database
2. ✅ Player detail pages will display the saved database values consistently
3. ✅ No more random values - scores will be stable and based on actual player statistics
4. ✅ The Performance Analysis section will show meaningful, persistent impact scores

## Files Changed
- `src/types/database.types.ts` - Added missing column types
- `src/pages/TeamPage.tsx` - Added database update logic
- `src/pages/PlayerDetailPage.tsx` - Fixed display to use database values
- `sql/add_impact_score_columns.sql` - Created migration script