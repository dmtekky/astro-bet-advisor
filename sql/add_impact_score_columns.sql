-- SQL script to add impact_score and astro_influence_score columns to baseball_players table
-- Run this in the Supabase SQL editor

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