-- Migration: Remove espn_id and sport columns from schedules table

-- First, drop any constraints that might reference these columns
-- (No constraints to drop in this case)

-- Drop the columns
ALTER TABLE schedules 
  DROP COLUMN IF EXISTS espn_id,
  DROP COLUMN IF EXISTS sport;

-- Recreate indexes if needed (without the sport column)
DROP INDEX IF EXISTS idx_schedules_sport_time;
CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(game_time);

-- Update any views or functions that might reference these columns
-- (None found in the current schema)
