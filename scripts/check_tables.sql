-- Check what tables exist in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check structure of nba_players table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nba_players';

-- Check structure of nba_player_season_stats table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nba_player_season_stats';

-- Check if there's any data in nba_players
SELECT COUNT(*) as player_count FROM nba_players;

-- Check if there's any data in nba_player_season_stats
SELECT COUNT(*) as stats_count FROM nba_player_season_stats;
