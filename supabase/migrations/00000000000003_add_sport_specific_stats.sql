-- Drop existing stats column from players table as we'll be using separate tables
ALTER TABLE players DROP COLUMN IF EXISTS stats;

-- Create enum for sport types
CREATE TYPE sport_type AS ENUM ('basketball', 'baseball', 'football', 'hockey', 'soccer', 'boxing', 'other');

-- Update players table with sport type
ALTER TABLE players ADD COLUMN IF NOT EXISTS sport_type sport_type;

-- Create basketball_stats table
CREATE TABLE IF NOT EXISTS basketball_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    games_played INTEGER,
    points_per_game NUMERIC(5,2),
    assists_per_game NUMERIC(5,2),
    rebounds_per_game NUMERIC(5,2),
    steals_per_game NUMERIC(5,2),
    blocks_per_game NUMERIC(5,2),
    field_goal_pct NUMERIC(5,3),
    three_point_pct NUMERIC(5,3),
    free_throw_pct NUMERIC(5,3),
    minutes_per_game NUMERIC(5,2),
    player_efficiency_rating NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- Create baseball_stats table
CREATE TABLE IF NOT EXISTS baseball_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    games_played INTEGER,
    at_bats INTEGER,
    runs INTEGER,
    hits INTEGER,
    doubles INTEGER,
    triples INTEGER,
    home_runs INTEGER,
    runs_batted_in INTEGER,
    stolen_bases INTEGER,
    batting_avg NUMERIC(5,3),
    on_base_pct NUMERIC(5,3),
    slugging_pct NUMERIC(5,3),
    ops NUMERIC(5,3),
    -- Pitching stats
    wins INTEGER,
    losses INTEGER,
    era NUMERIC(5,2),
    games_pitched INTEGER,
    innings_pitched NUMERIC(5,2),
    hits_allowed INTEGER,
    runs_allowed INTEGER,
    earned_runs INTEGER,
    walks INTEGER,
    strikeouts INTEGER,
    saves INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- Create football_stats table
CREATE TABLE IF NOT EXISTS football_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    games_played INTEGER,
    -- Passing
    pass_attempts INTEGER,
    pass_completions INTEGER,
    pass_yards INTEGER,
    pass_touchdowns INTEGER,
    interceptions INTEGER,
    passer_rating NUMERIC(5,1),
    -- Rushing
    rush_attempts INTEGER,
    rush_yards INTEGER,
    rush_touchdowns INTEGER,
    -- Receiving
    receptions INTEGER,
    receiving_yards INTEGER,
    receiving_touchdowns INTEGER,
    -- Defense
    tackles INTEGER,
    sacks NUMERIC(5,2),
    passes_defended INTEGER,
    interceptions_made INTEGER,
    forced_fumbles INTEGER,
    fumble_recoveries INTEGER,
    defensive_touchdowns INTEGER,
    -- Special Teams
    field_goals_made INTEGER,
    field_goals_attempted INTEGER,
    field_goal_pct NUMERIC(5,1),
    extra_points_made INTEGER,
    extra_points_attempted INTEGER,
    punting_yards INTEGER,
    punt_return_yards INTEGER,
    kickoff_return_yards INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- Create a generic stats table for other sports or custom stats
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    sport_type sport_type NOT NULL,
    stats JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season, sport_type)
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_basketball_stats_modtime
BEFORE UPDATE ON basketball_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_baseball_stats_modtime
BEFORE UPDATE ON baseball_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_football_stats_modtime
BEFORE UPDATE ON football_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_player_stats_modtime
BEFORE UPDATE ON player_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_basketball_stats_player_id ON basketball_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_basketball_stats_season ON basketball_stats(season);

CREATE INDEX IF NOT EXISTS idx_baseball_stats_player_id ON baseball_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_baseball_stats_season ON baseball_stats(season);

CREATE INDEX IF NOT EXISTS idx_football_stats_player_id ON football_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_football_stats_season ON football_stats(season);

CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_season ON player_stats(season);
CREATE INDEX IF NOT EXISTS idx_player_stats_sport_type ON player_stats(sport_type);

-- Update players table to include sport_type
COMMENT ON TABLE players IS 'Contains player information. The sport_type determines which stats table to use for detailed statistics.';

-- Add comments to explain the schema
COMMENT ON COLUMN players.sport_type IS 'The type of sport the player participates in, determines which stats table to use';

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE basketball_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseball_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE football_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (adjust according to your security requirements)
CREATE POLICY "Enable read access for all users" 
ON basketball_stats FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON baseball_stats FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON football_stats FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users" 
ON player_stats FOR SELECT 
USING (true);
