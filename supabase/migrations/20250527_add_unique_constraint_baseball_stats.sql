-- Add a unique constraint on player_external_id, season, and team_abbreviation
ALTER TABLE baseball_stats
ADD CONSTRAINT unique_player_season_team 
UNIQUE (player_external_id, season, team_abbreviation);

-- Drop the old unique constraint if it exists
ALTER TABLE baseball_stats
DROP CONSTRAINT IF EXISTS baseball_stats_player_id_season_team_id_key;

-- Create a new index for better query performance
CREATE INDEX IF NOT EXISTS idx_baseball_stats_player_season_team 
ON baseball_stats (player_external_id, season, team_abbreviation);
