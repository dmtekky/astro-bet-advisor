-- Create soccer_stats table
CREATE TABLE IF NOT EXISTS soccer_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    games_played INTEGER,
    goals INTEGER,
    assists INTEGER,
    shots INTEGER,
    shots_on_target INTEGER,
    yellow_cards INTEGER,
    red_cards INTEGER,
    minutes_played INTEGER,
    passes_completed INTEGER,
    tackles INTEGER,
    clean_sheets INTEGER,
    saves INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, season)
);

-- Create boxing_stats table
CREATE TABLE IF NOT EXISTS boxing_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    bouts INTEGER,
    wins INTEGER,
    losses INTEGER,
    draws INTEGER,
    knockouts INTEGER,
    height_cm INTEGER,
    reach_cm INTEGER,
    stance TEXT,
    rounds_fought INTEGER,
    debut_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id)
);

-- Triggers for updated_at
CREATE TRIGGER update_soccer_stats_modtime
BEFORE UPDATE ON soccer_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_boxing_stats_modtime
BEFORE UPDATE ON boxing_stats
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_soccer_stats_player_id ON soccer_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_soccer_stats_season ON soccer_stats(season);
CREATE INDEX IF NOT EXISTS idx_boxing_stats_player_id ON boxing_stats(player_id);

-- RLS (Row Level Security) policies
ALTER TABLE soccer_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxing_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON soccer_stats FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON boxing_stats FOR SELECT USING (true);
