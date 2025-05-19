-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT,
    sport TEXT NOT NULL,
    game_date DATE NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    commence_time TIMESTAMP WITH TIME ZONE,
    venue TEXT,
    bookmakers JSONB,
    odds JSONB,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for external_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_schedules_external_id ON schedules(external_id);

-- Create indexes for schedules
CREATE INDEX IF NOT EXISTS idx_schedules_sport ON schedules(sport);
CREATE INDEX IF NOT EXISTS idx_schedules_game_date ON schedules(game_date);
CREATE INDEX IF NOT EXISTS idx_schedules_commence_time ON schedules(commence_time);

-- Create betting_odds table
CREATE TABLE IF NOT EXISTS betting_odds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    team_id UUID REFERENCES players(id) ON DELETE CASCADE,
    bookmaker TEXT NOT NULL,
    odds INTEGER NOT NULL,
    type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for betting_odds
CREATE INDEX IF NOT EXISTS idx_betting_odds_game_id ON betting_odds(game_id);
CREATE INDEX IF NOT EXISTS idx_betting_odds_team_id ON betting_odds(team_id);
CREATE INDEX IF NOT EXISTS idx_betting_odds_timestamp ON betting_odds(timestamp);

-- Create RLS policies for schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to schedules"
    ON schedules FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access"
    ON schedules FOR ALL
    TO service_role
    USING (true);

-- Create RLS policies for betting_odds
ALTER TABLE betting_odds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to betting odds"
    ON betting_odds FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role full access"
    ON betting_odds FOR ALL
    TO service_role
    USING (true);

-- Add RLS policies to existing tables if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'players' 
        AND policyname = 'Public read access to players'
    ) THEN
        ALTER TABLE players ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Public read access to players"
            ON players FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'astrological_data' 
        AND policyname = 'Public read access to astrological data'
    ) THEN
        ALTER TABLE astrological_data ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Public read access to astrological data"
            ON astrological_data FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Add service role policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'players' 
        AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
            ON players FOR ALL
            TO service_role
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'astrological_data' 
        AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access"
            ON astrological_data FOR ALL
            TO service_role
            USING (true);
    END IF;
END $$;
