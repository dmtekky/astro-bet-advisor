-- Add astro influence and impact score columns to nba_player_season_stats
ALTER TABLE nba_player_season_stats
  ADD COLUMN IF NOT EXISTS astro_influence FLOAT,
  ADD COLUMN IF NOT EXISTS impact_score FLOAT,
  ADD COLUMN IF NOT EXISTS zodiac_sign TEXT,
  ADD COLUMN IF NOT EXISTS element TEXT,
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_astro 
  ON nba_player_season_stats(astro_influence, impact_score);

-- Add comment to explain the new columns
COMMENT ON COLUMN nba_player_season_stats.astro_influence IS 'Astrological influence score based on player''s zodiac sign and element';
COMMENT ON COLUMN nba_player_season_stats.impact_score IS 'Overall impact score combining stats and astro influence';
COMMENT ON COLUMN nba_player_season_stats.zodiac_sign IS 'Player''s zodiac sign based on birth date';
COMMENT ON COLUMN nba_player_season_stats.element IS 'Element associated with the zodiac sign (fire, earth, air, water)';
COMMENT ON COLUMN nba_player_season_stats.last_updated IS 'Timestamp when the record was last updated';
