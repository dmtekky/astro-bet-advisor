-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS betting_odds CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS astrological_data CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    sport TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create astrological_data table
CREATE TABLE astrological_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    moon_phase TEXT,
    moon_sign TEXT,
    planetary_signs JSONB,
    transits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    sport TEXT NOT NULL,
    team_id UUID REFERENCES teams(id),
    win_shares FLOAT,
    stats JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport TEXT NOT NULL,
    game_date DATE NOT NULL,
    home_team UUID REFERENCES teams(id),
    away_team UUID REFERENCES teams(id),
    commence_time TIMESTAMP WITH TIME ZONE,
    venue TEXT,
    bookmakers JSONB,
    odds JSONB,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create betting_odds table
CREATE TABLE betting_odds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    team_id UUID REFERENCES players(id) ON DELETE CASCADE,
    bookmaker TEXT NOT NULL,
    odds INTEGER NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_players_sport ON players(sport);
CREATE INDEX idx_players_birth_date ON players(birth_date);
CREATE INDEX idx_astrological_data_date ON astrological_data(date);
CREATE INDEX idx_schedules_game_date ON schedules(game_date);
CREATE INDEX idx_schedules_sport ON schedules(sport);
CREATE INDEX idx_betting_odds_game_id ON betting_odds(game_id);
CREATE INDEX idx_betting_odds_team_id ON betting_odds(team_id);

-- Insert sample teams
INSERT INTO teams (name, abbreviation, sport) VALUES
('Lakers', 'LAL', 'nba'),
('Warriors', 'GSW', 'nba'),
('Celtics', 'BOS', 'nba'),
('Bucks', 'MIL', 'nba');

-- Insert sample players with proper team references
WITH team_ids AS (
    SELECT id, name FROM teams
)
INSERT INTO players (name, birth_date, sport, team_id, win_shares, stats, created_at, updated_at)
SELECT 
    p.name, 
    p.birth_date::date, 
    'nba', 
    t.id, 
    p.win_shares, 
    p.stats::jsonb, 
    NOW(), 
    NOW()
FROM (
    VALUES 
        ('LeBron James', '1984-12-30', 25.5, '{"ppg": 28.9, "rpg": 8.2, "apg": 7.1}'),
        ('Stephen Curry', '1988-03-14', 22.3, '{"ppg": 31.2, "rpg": 5.8, "apg": 6.3, "tpg": 5.1}'),
        ('Jayson Tatum', '1998-03-03', 20.5, '{"ppg": 29.7, "rpg": 8.6, "apg": 4.7}'),
        ('Giannis Antetokounmpo', '1994-12-06', 24.1, '{"ppg": 32.1, "rpg": 12.5, "apg": 5.8}')
) AS p(name, birth_date, win_shares, stats)
JOIN team_ids t ON 
    (p.name = 'LeBron James' AND t.name = 'Lakers') OR
    (p.name = 'Stephen Curry' AND t.name = 'Warriors') OR
    (p.name = 'Jayson Tatum' AND t.name = 'Celtics') OR
    (p.name = 'Giannis Antetokounmpo' AND t.name = 'Bucks');

-- Insert sample astrological data
INSERT INTO astrological_data (date, moon_phase, moon_sign, planetary_signs, transits, created_at, updated_at)
VALUES (
    '2025-05-16', 
    'Waxing Gibbous', 
    'Aries', 
    '{"sun": "Gemini", "moon": "Aries", "mercury": "Gemini", "venus": "Cancer", "mars": "Pisces"}'::jsonb,
    '{"mercury": {"sign": "Gemini", "aspects": [{"planet": "venus", "aspect": "trine"}, {"planet": "neptune", "aspect": "square"}]},
     "venus": {"sign": "Cancer", "aspects": [{"planet": "mars", "aspect": "trine"}]},
     "mars": {"sign": "Pisces", "aspects": [{"planet": "jupiter", "aspect": "opposition"}]}}'::jsonb,
    NOW(), 
    NOW()
);

-- Insert sample schedule with proper team references
WITH team_ids AS (
    SELECT id, name FROM teams
)
INSERT INTO schedules (sport, game_date, home_team, away_team, commence_time, venue, bookmakers, odds, status, created_at, updated_at)
SELECT 
    'nba',
    '2025-05-16'::date,
    (SELECT id FROM team_ids WHERE name = 'Lakers'),
    (SELECT id FROM team_ids WHERE name = 'Warriors'),
    NOW() + INTERVAL '2 hours',
    'Crypto.com Arena',
    '[{"key": "draftkings", "title": "DraftKings"}]'::jsonb,
    '{"h2h": [{"name": "Lakers", "price": 150}, {"name": "Warriors", "price": -130}]}'::jsonb,
    'SCHEDULED',
    NOW(),
    NOW();

-- Insert sample betting odds with proper references
WITH game_info AS (
    SELECT s.id as game_id, p.id as player_id
    FROM schedules s
    JOIN players p ON true
    WHERE (p.name = 'LeBron James' AND s.home_team = (SELECT id FROM teams WHERE name = 'Lakers'))
       OR (p.name = 'Stephen Curry' AND s.away_team = (SELECT id FROM teams WHERE name = 'Warriors'))
    LIMIT 2
)
INSERT INTO betting_odds (game_id, team_id, bookmaker, odds, type, created_at, updated_at)
SELECT 
    game_id,
    player_id,
    'DraftKings',
    CASE 
        WHEN player_id = (SELECT id FROM players WHERE name = 'LeBron James') THEN 150
        WHEN player_id = (SELECT id FROM players WHERE name = 'Stephen Curry') THEN -130
    END,
    'h2h',
    NOW(),
    NOW()
FROM game_info;
