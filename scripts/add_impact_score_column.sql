-- Add impact_score column to nba_player_season_stats table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_name = 'nba_player_season_stats' 
        AND column_name = 'impact_score'
    ) THEN
        ALTER TABLE nba_player_season_stats 
        ADD COLUMN impact_score INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN nba_player_season_stats.impact_score IS 'Player impact score calculated from various statistics, scaled 0-100';
        
        RAISE NOTICE 'Added impact_score column to nba_player_season_stats table';
    ELSE
        RAISE NOTICE 'impact_score column already exists in nba_player_season_stats table';
    END IF;
END $$;
