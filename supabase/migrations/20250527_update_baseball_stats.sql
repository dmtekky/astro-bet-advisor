-- Drop existing views and functions that depend on baseball_stats
DROP VIEW IF EXISTS player_stats_view CASCADE;
DROP FUNCTION IF EXISTS get_team_player_stats(text, integer) CASCADE;

-- Drop existing table and related objects
DROP TRIGGER IF EXISTS update_baseball_stats_modtime ON baseball_stats;
DROP INDEX IF EXISTS idx_baseball_stats_player_id;
DROP INDEX IF EXISTS idx_baseball_stats_season;
DROP POLICY IF EXISTS "Enable read access for all users" ON baseball_stats;
DROP TABLE IF EXISTS baseball_stats CASCADE;

-- Create new baseball_stats table with structure for MySportsFeeds API data
CREATE TABLE baseball_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    
    -- Player identification
    player_external_id VARCHAR(100),
    jersey_number VARCHAR(10),
    primary_position VARCHAR(10),
    
    -- Season information
    season INTEGER NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    team_abbreviation VARCHAR(10),
    
    -- Batting stats
    games_played INTEGER DEFAULT 0,
    at_bats INTEGER DEFAULT 0,
    runs INTEGER DEFAULT 0,
    hits INTEGER DEFAULT 0,
    doubles INTEGER DEFAULT 0,
    triples INTEGER DEFAULT 0,
    home_runs INTEGER DEFAULT 0,
    rbi INTEGER DEFAULT 0,
    stolen_bases INTEGER DEFAULT 0,
    caught_stealing INTEGER DEFAULT 0,
    walks INTEGER DEFAULT 0,
    strikeouts INTEGER DEFAULT 0,
    batting_avg NUMERIC(5, 3),
    on_base_pct NUMERIC(6, 3),
    slugging_pct NUMERIC(6, 3),
    ops NUMERIC(6, 3),
    
    -- Pitching stats (for pitchers)
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    era NUMERIC(5, 2),
    games_pitched INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    innings_pitched NUMERIC(6, 2),
    hits_allowed INTEGER DEFAULT 0,
    runs_allowed INTEGER DEFAULT 0,
    earned_runs INTEGER DEFAULT 0,
    home_runs_allowed INTEGER DEFAULT 0,
    walks_allowed INTEGER DEFAULT 0,
    strikeouts_pitched INTEGER DEFAULT 0,
    whip NUMERIC(5, 2),
    
    -- Fielding stats
    fielding_pct NUMERIC(5, 3),
    errors INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    putouts INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(player_id, season, team_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_baseball_stats_player_id ON baseball_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_baseball_stats_season ON baseball_stats(season);
CREATE INDEX IF NOT EXISTS idx_baseball_stats_team_id ON baseball_stats(team_id);
CREATE INDEX IF NOT EXISTS idx_baseball_stats_player_external_id ON baseball_stats(player_external_id);

-- Update updated_at on row update
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_baseball_stats_modtime
BEFORE UPDATE ON baseball_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE baseball_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Enable read access for all users"
ON baseball_stats FOR SELECT
TO authenticated, anon
USING (true);

-- Create policy to allow insert/update/delete for authenticated users
CREATE POLICY "Enable full access for authenticated users"
ON baseball_stats FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a function to update player stats from JSONB data
CREATE OR REPLACE FUNCTION upsert_baseball_stats(
    p_player_id UUID,
    p_player_external_id VARCHAR,
    p_season INTEGER,
    p_team_id UUID,
    p_team_abbreviation VARCHAR,
    p_stats JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO baseball_stats (
        player_id,
        player_external_id,
        season,
        team_id,
        team_abbreviation,
        jersey_number,
        primary_position,
        games_played,
        at_bats,
        runs,
        hits,
        doubles,
        triples,
        home_runs,
        rbi,
        stolen_bases,
        caught_stealing,
        walks,
        strikeouts,
        batting_avg,
        on_base_pct,
        slugging_pct,
        ops,
        wins,
        losses,
        era,
        games_pitched,
        games_started,
        saves,
        innings_pitched,
        hits_allowed,
        runs_allowed,
        earned_runs,
        home_runs_allowed,
        walks_allowed,
        strikeouts_pitched,
        whip,
        fielding_pct,
        errors,
        assists,
        putouts,
        last_synced_at
    )
    VALUES (
        p_player_id,
        p_player_external_id,
        p_season,
        p_team_id,
        p_team_abbreviation,
        (p_stats->>'jerseyNumber')::VARCHAR,
        (p_stats->>'primaryPosition')::VARCHAR,
        COALESCE((p_stats->'gamesPlayed'->>'#text')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'atBats')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'runs')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'hits')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'secondBaseHits')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'thirdBaseHits')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'homeruns')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'runsBattedIn')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'stolenBases')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'caughtBaseSteals')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'batterWalks')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'batterStrikeouts')::INTEGER, 0),
        COALESCE((p_stats->'batting'->>'battingAvg')::NUMERIC, 0)::NUMERIC(5,3),
        COALESCE((p_stats->'batting'->>'batterOnBasePct')::NUMERIC, 0)::NUMERIC(6,3),
        COALESCE((p_stats->'batting'->>'batterSluggingPct')::NUMERIC, 0)::NUMERIC(6,3),
        COALESCE((p_stats->'batting'->>'batterOnBasePlusSluggingPct')::NUMERIC, 0)::NUMERIC(6,3),
        COALESCE((p_stats->'pitching'->>'wins')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'losses')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'earnedRunAvg')::NUMERIC, 0)::NUMERIC(5,2),
        COALESCE((p_stats->'pitching'->>'gamesPitched')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'gamesStarted')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'saves')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'inningsPitched')::NUMERIC, 0)::NUMERIC(6,2),
        COALESCE((p_stats->'pitching'->>'hitsAllowed')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'runsAllowed')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'earnedRunsAllowed')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'homerunsAllowed')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'pitcherWalks')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'pitcherStrikeouts')::INTEGER, 0),
        COALESCE((p_stats->'pitching'->>'walksAndHitsPerInningPitched')::NUMERIC, 0)::NUMERIC(5,2),
        COALESCE((p_stats->'fielding'->>'fieldingPct')::NUMERIC, 0)::NUMERIC(5,3),
        COALESCE((p_stats->'fielding'->>'errors')::INTEGER, 0),
        COALESCE((p_stats->'fielding'->>'assists')::INTEGER, 0),
        COALESCE((p_stats->'fielding'->>'putouts')::INTEGER, 0),
        NOW()
    )
    ON CONFLICT (player_id, season, team_id) 
    DO UPDATE SET
        jersey_number = EXCLUDED.jersey_number,
        primary_position = EXCLUDED.primary_position,
        games_played = EXCLUDED.games_played,
        at_bats = EXCLUDED.at_bats,
        runs = EXCLUDED.runs,
        hits = EXCLUDED.hits,
        doubles = EXCLUDED.doubles,
        triples = EXCLUDED.triples,
        home_runs = EXCLUDED.home_runs,
        rbi = EXCLUDED.rbi,
        stolen_bases = EXCLUDED.stolen_bases,
        caught_stealing = EXCLUDED.caught_stealing,
        walks = EXCLUDED.walks,
        strikeouts = EXCLUDED.strikeouts,
        batting_avg = EXCLUDED.batting_avg,
        on_base_pct = EXCLUDED.on_base_pct,
        slugging_pct = EXCLUDED.slugging_pct,
        ops = EXCLUDED.ops,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        era = EXCLUDED.era,
        games_pitched = EXCLUDED.games_pitched,
        games_started = EXCLUDED.games_started,
        saves = EXCLUDED.saves,
        innings_pitched = EXCLUDED.innings_pitched,
        hits_allowed = EXCLUDED.hits_allowed,
        runs_allowed = EXCLUDED.runs_allowed,
        earned_runs = EXCLUDED.earned_runs,
        home_runs_allowed = EXCLUDED.home_runs_allowed,
        walks_allowed = EXCLUDED.walks_allowed,
        strikeouts_pitched = EXCLUDED.strikeouts_pitched,
        whip = EXCLUDED.whip,
        fielding_pct = EXCLUDED.fielding_pct,
        errors = EXCLUDED.errors,
        assists = EXCLUDED.assists,
        putouts = EXCLUDED.putouts,
        last_synced_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
