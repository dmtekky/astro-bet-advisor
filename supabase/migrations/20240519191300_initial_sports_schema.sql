-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leagues (NHL, NBA, MLB, etc.)
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  key VARCHAR(10) UNIQUE NOT NULL, -- 'nhl', 'nba', 'mlb'
  active BOOLEAN DEFAULT true,
  logo_url TEXT,
  season_start_month INTEGER,
  season_end_month INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id INTEGER UNIQUE NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  city VARCHAR(50) NOT NULL,
  name VARCHAR(50) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  logo_url TEXT,
  venue_name VARCHAR(100),
  venue_city VARCHAR(100),
  venue_state VARCHAR(50),
  venue_capacity INTEGER,
  venue_surface VARCHAR(50),
  venue_address TEXT,
  venue_zip VARCHAR(20),
  venue_country VARCHAR(50),
  venue_latitude DECIMAL(10, 8),
  venue_longitude DECIMAL(11, 8),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, external_id)
);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id INTEGER UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  full_name VARCHAR(100) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  birth_date DATE,
  birth_city VARCHAR(100),
  birth_country VARCHAR(100),
  nationality VARCHAR(3), -- ISO country code (3 characters for codes like USA, CAN, GBR)
  height INTEGER,  -- inches
  weight INTEGER,  -- lbs
  primary_position VARCHAR(10),
  primary_number INTEGER,
  bat_side CHAR(1),  -- L/R/S
  throw_hand CHAR(1), -- L/R
  headshot_url TEXT,
  current_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player Seasons (stats by season)
CREATE TABLE player_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  
  -- Common stats
  games_played INTEGER DEFAULT 0,
  games_started INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  
  -- League-specific stats (using JSONB for flexibility)
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  advanced_stats JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(player_id, team_id, season, league_id),
  CONSTRAINT valid_season CHECK (season BETWEEN 1900 AND 2100)
);

-- Games
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id INTEGER UNIQUE NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  season_type VARCHAR(20) NOT NULL, -- 'regular', 'playoffs', 'preseason', 'allstar'
  game_date TIMESTAMPTZ NOT NULL,
  game_time_utc TIMESTAMPTZ NOT NULL,
  game_time_local TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'scheduled', 'in_progress', 'final', 'postponed', 'canceled'
  period INTEGER,
  period_time_remaining VARCHAR(10),
  home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  home_score INTEGER,
  away_score INTEGER,
  home_odds DECIMAL(6, 2),
  away_odds DECIMAL(6, 2),
  over_under DECIMAL(6, 2),
  spread DECIMAL(6, 2),
  attendance INTEGER,
  duration_minutes INTEGER,
  broadcasters TEXT[],
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- Game Stats (player stats per game)
CREATE TABLE game_player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Common stats
  is_starter BOOLEAN DEFAULT false,
  position VARCHAR(10),
  jersey_number INTEGER,
  
  -- League-specific stats
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(game_id, player_id)
);

-- Game Odds (betting odds per game and sportsbook)
CREATE TABLE game_odds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sportsbook VARCHAR(100) NOT NULL,
  moneyline_home DECIMAL(7,2),
  moneyline_away DECIMAL(7,2),
  spread_home DECIMAL(7,2),
  spread_away DECIMAL(7,2),
  spread_points DECIMAL(7,2),
  over_under DECIMAL(7,2),
  over_odds DECIMAL(7,2),
  under_odds DECIMAL(7,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, sportsbook)
);

-- Team Standings (seasonal)
CREATE TABLE team_standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  
  -- Standings data
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  overtime_losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  points_percentage DECIMAL(5, 3) DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_differential INTEGER DEFAULT 0,
  home_record VARCHAR(20), -- 'W-L-OTL'
  away_record VARCHAR(20), -- 'W-L-OTL'
  division_rank INTEGER,
  conference_rank INTEGER,
  league_rank INTEGER,
  wild_card_rank INTEGER,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(team_id, season, league_id)
);

-- Player Injuries
CREATE TABLE player_injuries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  
  -- Injury details
  status VARCHAR(50), -- 'Out', 'Day To Day', 'IR', etc.
  injury_type VARCHAR(100),
  injury_detail TEXT,
  side VARCHAR(10), -- 'Left', 'Right', 'Both'
  return_date DATE,
  
  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_city ON teams(city);
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);

CREATE INDEX idx_players_name ON players((first_name || ' ' || last_name));
CREATE INDEX idx_players_team ON players(current_team_id);
CREATE INDEX idx_players_external ON players(external_id);

CREATE INDEX idx_player_seasons_player ON player_seasons(player_id);
CREATE INDEX idx_player_seasons_team ON player_seasons(team_id);
CREATE INDEX idx_player_seasons_league ON player_seasons(league_id);
CREATE INDEX idx_player_seasons_season ON player_seasons(season);
CREATE INDEX idx_player_seasons_stats_gin ON player_seasons USING GIN (stats);

CREATE INDEX idx_games_league ON games(league_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE INDEX idx_games_venue ON games(venue_id);
CREATE INDEX idx_games_status ON games(status);

CREATE INDEX idx_game_player_stats_game ON game_player_stats(game_id);
CREATE INDEX idx_game_player_stats_player ON game_player_stats(player_id);
CREATE INDEX idx_game_player_stats_team ON game_player_stats(team_id);

CREATE INDEX idx_team_standings_team ON team_standings(team_id);
CREATE INDEX idx_team_standings_league ON team_standings(league_id);
CREATE INDEX idx_team_standings_season ON team_standings(season);

CREATE INDEX idx_player_injuries_player ON player_injuries(player_id);
CREATE INDEX idx_player_injuries_team ON player_injuries(team_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON players
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_seasons_updated_at
BEFORE UPDATE ON player_seasons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON games
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_player_stats_updated_at
BEFORE UPDATE ON game_player_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_standings_updated_at
BEFORE UPDATE ON team_standings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_injuries_updated_at
BEFORE UPDATE ON player_injuries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add initial leagues
INSERT INTO leagues (external_id, name, key, active, season_start_month, season_end_month) VALUES
(1, 'National Hockey League', 'nhl', true, 10, 6),
(2, 'National Basketball Association', 'nba', true, 10, 6),
(3, 'Major League Baseball', 'mlb', true, 3, 11),
(4, 'National Football League', 'nfl', true, 9, 2),
(5, 'Major League Soccer', 'mls', true, 2, 12);

-- Create a view for active players with their current team
CREATE OR REPLACE VIEW active_players AS
SELECT 
    p.*,
    t.id AS current_team_id,
    t.name AS current_team_name,
    t.abbreviation AS team_abbreviation,
    t.primary_color AS team_primary_color,
    t.secondary_color AS team_secondary_color,
    t.logo_url AS team_logo_url,
    l.name AS league_name,
    l.key AS league_key
FROM players p
LEFT JOIN teams t ON p.current_team_id = t.id
LEFT JOIN leagues l ON t.league_id = l.id
WHERE p.current_team_id IS NOT NULL;

-- Create a view for today's games
CREATE OR REPLACE VIEW todays_games AS
SELECT 
    g.*,
    ht.name AS home_team_name,
    ht.abbreviation AS home_team_abbreviation,
    ht.logo_url AS home_team_logo,
    at.name AS away_team_name,
    at.abbreviation AS away_team_abbreviation,
    at.logo_url AS away_team_logo,
    v.name AS venue_name,
    v.city AS venue_city,
    v.state AS venue_state,
    l.name AS league_name,
    l.key AS league_key
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
LEFT JOIN teams v ON g.venue_id = v.id
JOIN leagues l ON g.league_id = l.id
WHERE DATE(g.game_date) = CURRENT_DATE
ORDER BY g.game_date;
