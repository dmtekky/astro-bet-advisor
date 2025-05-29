-- SQL script to add missing columns to Supabase tables
-- Run this in the Supabase SQL editor

-- Add api_last_updated column to teams table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'teams' 
        AND column_name = 'api_last_updated'
    ) THEN
        ALTER TABLE teams ADD COLUMN api_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added api_last_updated column to teams table';
    ELSE
        RAISE NOTICE 'api_last_updated column already exists in teams table';
    END IF;
END $$;

-- Add api_last_updated column to venues table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'venues' 
        AND column_name = 'api_last_updated'
    ) THEN
        ALTER TABLE venues ADD COLUMN api_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added api_last_updated column to venues table';
    ELSE
        RAISE NOTICE 'api_last_updated column already exists in venues table';
    END IF;
END $$;

-- Add api_last_updated column to games table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'games' 
        AND column_name = 'api_last_updated'
    ) THEN
        ALTER TABLE games ADD COLUMN api_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added api_last_updated column to games table';
    ELSE
        RAISE NOTICE 'api_last_updated column already exists in games table';
    END IF;
END $$;

-- Add api_last_updated column to players table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'api_last_updated'
    ) THEN
        ALTER TABLE players ADD COLUMN api_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added api_last_updated column to players table';
    ELSE
        RAISE NOTICE 'api_last_updated column already exists in players table';
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
    table_name IN ('teams', 'venues', 'games', 'players')
    AND column_name = 'api_last_updated';
