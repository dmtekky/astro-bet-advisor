-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to execute raw SQL
CREATE OR REPLACE FUNCTION public.exec_sql(
  query text
) RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE query;
  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'status', 'error',
    'message', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Drop players table if it exists to avoid column conflicts
DROP TABLE IF EXISTS public.players CASCADE;

-- Create players table
CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    espn_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    sport VARCHAR(50) NOT NULL,
    team_id VARCHAR(64),
    position VARCHAR(50),
    jersey_number INTEGER,
    height VARCHAR(20),
    weight INTEGER,
    image_url TEXT,
    image_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop teams table if it exists to avoid column conflicts
DROP TABLE IF EXISTS public.teams CASCADE;

-- Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    espn_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    abbreviation VARCHAR(10),
    sport VARCHAR(50) NOT NULL,
    league VARCHAR(50) NOT NULL,
    logo_url TEXT,
    logo_path TEXT,
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add your migration SQL statements below this line

-- Drop existing schedules table if it exists
DROP TABLE IF EXISTS public.schedules;

-- Create new schedules table with all required columns
CREATE TABLE public.schedules (
    id TEXT PRIMARY KEY,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_team_id UUID NOT NULL,
    away_team_id UUID NOT NULL,
    game_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    odds JSONB,
    sport_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to refresh schema cache
CREATE OR REPLACE FUNCTION refresh_schema_cache()
RETURNS void
LANGUAGE sql
AS $$
SELECT pg_catalog.pg_reload_conf();
$$;

-- Drop stats tables if they exist
DROP TABLE IF EXISTS public.basketball_stats CASCADE;
DROP TABLE IF EXISTS public.baseball_stats CASCADE;
DROP TABLE IF EXISTS public.football_stats CASCADE;
DROP TABLE IF EXISTS public.soccer_stats CASCADE;
DROP TABLE IF EXISTS public.boxing_stats CASCADE;

-- Create basketball_stats table
CREATE TABLE public.basketball_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    points_per_game DECIMAL(5,2),
    assists_per_game DECIMAL(5,2),
    rebounds_per_game DECIMAL(5,2),
    steals_per_game DECIMAL(5,2),
    blocks_per_game DECIMAL(5,2),
    field_goal_percentage DECIMAL(5,2),
    three_point_percentage DECIMAL(5,2),
    free_throw_percentage DECIMAL(5,2),
    minutes_per_game DECIMAL(5,2),
    games_played INTEGER,
    games_started INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Create baseball_stats table
CREATE TABLE public.baseball_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    batting_average DECIMAL(5,3),
    home_runs INTEGER,
    runs_batted_in INTEGER,
    stolen_bases INTEGER,
    on_base_percentage DECIMAL(5,3),
    slugging_percentage DECIMAL(5,3),
    on_base_plus_slugging DECIMAL(5,3),
    wins INTEGER,
    losses INTEGER,
    earned_run_average DECIMAL(5,2),
    strikeouts INTEGER,
    saves INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Create football_stats table
CREATE TABLE public.football_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    passing_yards INTEGER,
    passing_touchdowns INTEGER,
    interceptions INTEGER,
    completion_percentage DECIMAL(5,2),
    quarterback_rating DECIMAL(5,2),
    rushing_yards INTEGER,
    rushing_touchdowns INTEGER,
    receiving_yards INTEGER,
    receiving_touchdowns INTEGER,
    receptions INTEGER,
    tackles INTEGER,
    sacks DECIMAL(5,2),
    interceptions_made INTEGER,
    fumbles_forced INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Create soccer_stats table
CREATE TABLE public.soccer_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    goals INTEGER,
    assists INTEGER,
    yellow_cards INTEGER,
    red_cards INTEGER,
    minutes_played INTEGER,
    clean_sheets INTEGER,
    goals_conceded INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Create boxing_stats table
CREATE TABLE public.boxing_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    bouts INTEGER,
    wins INTEGER,
    losses INTEGER,
    draws INTEGER,
    knockouts INTEGER,
    technical_knockouts INTEGER,
    rounds_boxed INTEGER,
    height_cm INTEGER,
    reach_cm INTEGER,
    stance VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Drop schedules table if it exists
DROP TABLE IF EXISTS public.schedules CASCADE;

-- Create schedules table
CREATE TABLE public.schedules (
    id BIGSERIAL PRIMARY KEY,
    espn_id VARCHAR(64) UNIQUE NOT NULL,
    sport VARCHAR(32) NOT NULL,
    home_team VARCHAR(64) NOT NULL,
    away_team VARCHAR(64) NOT NULL,
    game_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_espn_id ON public.players(espn_id);
CREATE INDEX IF NOT EXISTS idx_teams_espn_id ON public.teams(espn_id);
CREATE INDEX IF NOT EXISTS idx_schedules_sport_time ON public.schedules(sport, game_time);

-- Enable Row Level Security on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basketball_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baseball_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.football_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soccer_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boxing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access
CREATE POLICY "Enable read access for all users" ON public.players
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.teams
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.basketball_stats
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.baseball_stats
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.football_stats
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.soccer_stats
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.boxing_stats
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.schedules
    FOR SELECT USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_players_modtime
    BEFORE UPDATE ON public.players
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_teams_modtime
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_basketball_stats_modtime
    BEFORE UPDATE ON public.basketball_stats
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_baseball_stats_modtime
    BEFORE UPDATE ON public.baseball_stats
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_football_stats_modtime
    BEFORE UPDATE ON public.football_stats
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_soccer_stats_modtime
    BEFORE UPDATE ON public.soccer_stats
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_boxing_stats_modtime
    BEFORE UPDATE ON public.boxing_stats
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
