-- Remove the unique constraint on espn_id if it exists
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_espn_id_key;

-- Drop the espn_id and sport columns
ALTER TABLE schedules 
  DROP COLUMN IF EXISTS espn_id,
  DROP COLUMN IF EXISTS sport;

-- Recreate the index on game_time
DROP INDEX IF EXISTS idx_schedules_game_time;
CREATE INDEX IF NOT EXISTS idx_schedules_game_time ON schedules(game_time);