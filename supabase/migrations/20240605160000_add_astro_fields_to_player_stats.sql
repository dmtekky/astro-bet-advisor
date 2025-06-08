-- Add astro_influence and impact_score columns to nba_player_season_stats
ALTER TABLE nba_player_season_stats
ADD COLUMN IF NOT EXISTS astro_influence DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS impact_score DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS zodiac_sign TEXT,
ADD COLUMN IF NOT EXISTS zodiac_element TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN nba_player_season_stats.astro_influence IS 'Astrological influence score (0-100)';
COMMENT ON COLUMN nba_player_season_stats.impact_score IS 'Calculated impact score based on player performance';
COMMENT ON COLUMN nba_player_season_stats.zodiac_sign IS 'Player''s zodiac sign';
COMMENT ON COLUMN nba_player_season_stats.zodiac_element IS 'Element of the zodiac sign (fire, earth, air, water)';

-- Create index on the new columns for better query performance
CREATE INDEX IF NOT EXISTS idx_player_astro_influence ON nba_player_season_stats(astro_influence);
CREATE INDEX IF NOT EXISTS idx_player_impact_score ON nba_player_season_stats(impact_score);
CREATE INDEX IF NOT EXISTS idx_player_zodiac_sign ON nba_player_season_stats(zodiac_sign);

-- Update the updated_at trigger to include these new columns
-- This assumes you have a trigger that updates the updated_at column
-- If you don't have this trigger, you can ignore this part
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_nba_player_season_stats_updated_at') THEN
        DROP TRIGGER update_nba_player_season_stats_updated_at ON nba_player_season_stats;
        CREATE TRIGGER update_nba_player_season_stats_updated_at
        BEFORE UPDATE ON nba_player_season_stats
        FOR EACH ROW
        WHEN (
            OLD.* IS DISTINCT FROM NEW.* AND
            (
                OLD.astro_influence IS DISTINCT FROM NEW.astro_influence OR
                OLD.impact_score IS DISTINCT FROM NEW.impact_score OR
                OLD.zodiac_sign IS DISTINCT FROM NEW.zodiac_sign OR
                OLD.zodiac_element IS DISTINCT FROM NEW.zodiac_element
                -- Include other columns as needed
            )
        )
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
