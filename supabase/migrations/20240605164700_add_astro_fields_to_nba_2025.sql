-- Add astrological influence and impact score columns to nba_player_season_stats_2025
ALTER TABLE nba_player_season_stats_2025
  ADD COLUMN IF NOT EXISTS astro_influence FLOAT,
  ADD COLUMN IF NOT EXISTS impact_score FLOAT,
  ADD COLUMN IF NOT EXISTS zodiac_sign TEXT,
  ADD COLUMN IF NOT EXISTS zodiac_element TEXT;

-- Add comments to explain the new columns
COMMENT ON COLUMN nba_player_season_stats_2025.astro_influence IS 'Astrological influence score based on player''s zodiac sign and element (0-100)';
COMMENT ON COLUMN nba_player_season_stats_2025.impact_score IS 'Calculated impact score based on player performance (0-100)';
COMMENT ON COLUMN nba_player_season_stats_2025.zodiac_sign IS 'Player''s zodiac sign based on birth date';
COMMENT ON COLUMN nba_player_season_stats_2025.zodiac_element IS 'Element associated with the zodiac sign (fire, earth, air, water)';

-- Create index for faster lookups by astro influence and impact score
CREATE INDEX IF NOT EXISTS idx_nba_player_season_2025_astro 
  ON nba_player_season_stats_2025(astro_influence, impact_score);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_nba_player_season_2025_modtime'
  ) THEN
    CREATE TRIGGER update_nba_player_season_2025_modtime
    BEFORE UPDATE ON nba_player_season_stats_2025
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;
