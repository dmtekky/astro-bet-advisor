-- Query to check the columns in nba_player_season_stats
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'nba_player_season_stats'
ORDER BY ordinal_position;
