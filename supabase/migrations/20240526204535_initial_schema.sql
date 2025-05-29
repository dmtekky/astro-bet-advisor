-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leagues Table
CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sport_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- League Mappings Table
CREATE TABLE IF NOT EXISTS public.league_mappings (
    external_id TEXT NOT NULL,
    internal_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (external_id)
);

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team Mappings Table
CREATE TABLE IF NOT EXISTS public.team_mappings (
    external_id TEXT NOT NULL,
    internal_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (external_id)
);

-- Venues Table
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT,
    capacity INTEGER,
    surface TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Venue Mappings Table
CREATE TABLE IF NOT EXISTS public.venue_mappings (
    external_id TEXT NOT NULL,
    internal_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (external_id)
);

-- Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    season INTEGER,
    season_type TEXT,
    game_date TIMESTAMPTZ,
    game_time_utc TIMESTAMPTZ,
    game_time_local TIMESTAMPTZ,
    status TEXT,
    home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    home_team_score INTEGER,
    away_team_score INTEGER,
    attendance INTEGER,
    home_team TEXT,
    away_team TEXT,
    league_name TEXT,
    notes TEXT,
    alternate_name TEXT,
    api_last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Players Table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    birth_date DATE,
    birth_place TEXT,
    height_cm INTEGER,
    weight_kg INTEGER,
    position TEXT,
    jersey_number INTEGER,
    is_active BOOLEAN DEFAULT true,
    api_last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Player Mappings Table
CREATE TABLE IF NOT EXISTS public.player_mappings (
    external_id TEXT NOT NULL,
    internal_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (external_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_league_id ON public.games(league_id);
CREATE INDEX IF NOT EXISTS idx_games_home_team_id ON public.games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_games_away_team_id ON public.games(away_team_id);
CREATE INDEX IF NOT EXISTS idx_games_venue_id ON public.games(venue_id);
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON public.teams(league_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);

-- Add comments for better documentation
COMMENT ON TABLE public.leagues IS 'Stores information about sports leagues';
COMMENT ON TABLE public.teams IS 'Stores information about sports teams';
COMMENT ON TABLE public.venues IS 'Stores information about sports venues';
COMMENT ON TABLE public.games IS 'Stores information about games/matches';
COMMENT ON TABLE public.players IS 'Stores information about players';

-- Add comments for mapping tables
COMMENT ON TABLE public.league_mappings IS 'Maps external league IDs to internal UUIDs';
COMMENT ON TABLE public.team_mappings IS 'Maps external team IDs to internal UUIDs';
COMMENT ON TABLE public.venue_mappings IS 'Maps external venue IDs to internal UUIDs';
COMMENT ON TABLE public.player_mappings IS 'Maps external player IDs to internal UUIDs';

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

-- Create triggers to update updated_at automatically
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('leagues', 'teams', 'venues', 'games', 'players', 
                         'league_mappings', 'team_mappings', 'venue_mappings', 'player_mappings')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_modtime ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%s_modtime
                        BEFORE UPDATE ON %I
                        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', 
                      t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
