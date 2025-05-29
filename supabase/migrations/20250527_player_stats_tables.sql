-- Migration for API-Sports Player Stats Integration
-- Creates the necessary tables for player mapping and stats

-- First, create a function to create the player_api_mapping table if it doesn't exist
CREATE OR REPLACE FUNCTION create_player_mapping_table_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_api_mapping') THEN
    CREATE TABLE public.player_api_mapping (
      id SERIAL PRIMARY KEY,
      api_sports_player_id INTEGER NOT NULL UNIQUE,
      db_player_id INTEGER NOT NULL,
      api_sports_team_id INTEGER NOT NULL,
      db_team_id INTEGER NOT NULL,
      match_score NUMERIC(4,3) NOT NULL,
      api_player_name TEXT NOT NULL,
      db_player_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_updated TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes for faster lookups
    CREATE INDEX idx_player_api_mapping_api_id ON public.player_api_mapping(api_sports_player_id);
    CREATE INDEX idx_player_api_mapping_db_id ON public.player_api_mapping(db_player_id);
    CREATE INDEX idx_player_api_mapping_api_team_id ON public.player_api_mapping(api_sports_team_id);
    CREATE INDEX idx_player_api_mapping_db_team_id ON public.player_api_mapping(db_team_id);
    
    RAISE NOTICE 'Created player_api_mapping table';
  ELSE
    RAISE NOTICE 'player_api_mapping table already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create player_stats table if it doesn't exist
CREATE OR REPLACE FUNCTION create_player_stats_table_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_stats') THEN
    CREATE TABLE public.player_stats (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL,
      api_sports_player_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      position TEXT,
      
      -- Game stats
      games_played INTEGER DEFAULT 0,
      games_started INTEGER DEFAULT 0,
      
      -- Batting stats
      at_bats INTEGER DEFAULT 0,
      hits INTEGER DEFAULT 0,
      runs INTEGER DEFAULT 0,
      home_runs INTEGER DEFAULT 0,
      rbi INTEGER DEFAULT 0,
      stolen_bases INTEGER DEFAULT 0,
      batting_average NUMERIC(5,3) DEFAULT 0,
      on_base_percentage NUMERIC(5,3) DEFAULT 0,
      slugging_percentage NUMERIC(5,3) DEFAULT 0,
      ops NUMERIC(5,3) DEFAULT 0,
      doubles INTEGER DEFAULT 0,
      triples INTEGER DEFAULT 0,
      walks INTEGER DEFAULT 0,
      strikeouts INTEGER DEFAULT 0,
      
      -- Pitching stats
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      era NUMERIC(6,2) DEFAULT 0,
      games_pitched INTEGER DEFAULT 0,
      games_started_pitching INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      innings_pitched NUMERIC(6,1) DEFAULT 0,
      hits_allowed INTEGER DEFAULT 0,
      runs_allowed INTEGER DEFAULT 0,
      earned_runs INTEGER DEFAULT 0,
      home_runs_allowed INTEGER DEFAULT 0,
      walks_allowed INTEGER DEFAULT 0,
      strikeouts_pitched INTEGER DEFAULT 0,
      whip NUMERIC(5,3) DEFAULT 0,
      
      -- Fielding stats
      fielding_position TEXT,
      putouts INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0,
      fielding_percentage NUMERIC(5,3) DEFAULT 0,
      
      -- Raw JSON data for future reference
      raw_hitting_stats JSONB,
      raw_pitching_stats JSONB,
      raw_fielding_stats JSONB,
      
      -- Timestamps
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Constraints
      UNIQUE(player_id, season)
    );
    
    -- Create indexes for faster lookups
    CREATE INDEX IF NOT EXISTS idx_player_mapping_player_id ON player_api_mapping(player_id);
    CREATE INDEX IF NOT EXISTS idx_player_mapping_api_id ON player_api_mapping(api_sports_player_id);
    
    RAISE NOTICE 'Created player_api_mapping table';
  ELSE
    RAISE NOTICE 'player_api_mapping table already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easier querying of player stats with player info
CREATE OR REPLACE VIEW player_stats_view AS
SELECT 
  p.id as player_id,
  p.name as player_name,
  p.team as team_name,
  p.position as position,
  bs.*
FROM players p
LEFT JOIN baseball_stats bs ON p.id = bs.player_id;

-- Create a function to get player stats by team
CREATE OR REPLACE FUNCTION get_team_player_stats(team_name text, season_year integer)
RETURNS TABLE (
  player_id UUID,
  player_name text,
  position text,
  games_played integer,
  at_bats integer,
  runs integer,
  hits integer,
  home_runs integer,
  runs_batted_in integer,
  stolen_bases integer,
  batting_avg numeric(5,3),
  ops numeric(5,3),
  wins integer,
  losses integer,
  era numeric(5,2),
  strikeouts integer,
  saves integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as player_id,
    p.name as player_name,
    p.position,
    COALESCE(bs.games_played, 0) as games_played,
    COALESCE(bs.at_bats, 0) as at_bats,
    COALESCE(bs.runs, 0) as runs,
    COALESCE(bs.hits, 0) as hits,
    COALESCE(bs.home_runs, 0) as home_runs,
    COALESCE(bs.runs_batted_in, 0) as runs_batted_in,
    COALESCE(bs.stolen_bases, 0) as stolen_bases,
    COALESCE(bs.batting_avg, 0) as batting_avg,
    COALESCE(bs.ops, 0) as ops,
    COALESCE(bs.wins, 0) as wins,
    COALESCE(bs.losses, 0) as losses,
    COALESCE(bs.era, 0) as era,
    COALESCE(bs.strikeouts, 0) as strikeouts,
    COALESCE(bs.saves, 0) as saves
  FROM players p
  LEFT JOIN baseball_stats bs ON p.id = bs.player_id AND bs.season = season_year
  WHERE p.team = team_name
  ORDER BY p.position, p.name;
END;
$$ LANGUAGE plpgsql;
