-- Update nba_player_season_stats table with additional fields
ALTER TABLE nba_player_season_stats
  -- Add player details if they don't exist
  ADD COLUMN IF NOT EXISTS player_name TEXT,
  ADD COLUMN IF NOT EXISTS team TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT,
  
  -- Add per-game stats
  ADD COLUMN IF NOT EXISTS games_played INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minutes_per_game FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_per_game FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rebounds_per_game FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assists_per_game FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS steals_per_game FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocks_per_game FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS field_goal_pct FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS three_point_pct FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_throw_pct FLOAT DEFAULT 0,
  
  -- Update existing columns to match script
  RENAME COLUMN element TO zodiac_element;

-- Update comments for clarity
COMMENT ON COLUMN nba_player_season_stats.player_name IS 'Player''s full name';
COMMENT ON COLUMN nba_player_season_stats.team IS 'Team abbreviation';
COMMENT ON COLUMN nba_player_season_stats.position IS 'Player position';
COMMENT ON COLUMN nba_player_season_stats.games_played IS 'Number of games played';
COMMENT ON COLUMN nba_player_season_stats.minutes_per_game IS 'Average minutes per game';
COMMENT ON COLUMN nba_player_season_stats.points_per_game IS 'Average points per game';
COMMENT ON COLUMN nba_player_season_stats.rebounds_per_game IS 'Average rebounds per game';
COMMENT ON COLUMN nba_player_season_stats.assists_per_game IS 'Average assists per game';
COMMENT ON COLUMN nba_player_season_stats.steals_per_game IS 'Average steals per game';
COMMENT ON COLUMN nba_player_season_stats.blocks_per_game IS 'Average blocks per game';
COMMENT ON COLUMN nba_player_season_stats.field_goal_pct IS 'Field goal percentage';
COMMENT ON COLUMN nba_player_season_stats.three_point_pct IS 'Three-point percentage';
COMMENT ON COLUMN nba_player_season_stats.free_throw_pct IS 'Free throw percentage';

-- Create index for faster lookups by player and team
CREATE INDEX IF NOT EXISTS idx_nba_player_season_player_team 
  ON nba_player_season_stats(player_id, team);

-- Create index for stats-based queries
CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_performance 
  ON nba_player_season_stats(
    points_per_game DESC, 
    rebounds_per_game DESC, 
    assists_per_game DESC
  );

-- Update the last_updated column to auto-update on row modification
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.last_updated = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_nba_player_season_stats_modtime'
  ) THEN
    CREATE TRIGGER update_nba_player_season_stats_modtime
    BEFORE UPDATE ON nba_player_season_stats
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;
