-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    sport TEXT NOT NULL,
    team_id UUID,
    win_shares FLOAT,
    stats JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create astrological_data table
CREATE TABLE IF NOT EXISTS astrological_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    moon_phase TEXT,
    moon_sign TEXT,
    planetary_signs JSONB,
    transits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport TEXT NOT NULL,
    game_date DATE NOT NULL,
    odds JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_sport ON players(sport);
CREATE INDEX IF NOT EXISTS idx_players_birth_date ON players(birth_date);
CREATE INDEX IF NOT EXISTS idx_astrological_data_date ON astrological_data(date);
CREATE INDEX IF NOT EXISTS idx_schedules_game_date ON schedules(game_date);
