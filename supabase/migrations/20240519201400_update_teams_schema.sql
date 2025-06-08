-- Drop existing foreign key constraints that reference the teams table
ALTER TABLE IF EXISTS players DROP CONSTRAINT IF EXISTS players_current_team_id_fkey;
ALTER TABLE IF EXISTS games DROP CONSTRAINT IF EXISTS games_home_team_id_fkey;
ALTER TABLE IF EXISTS games DROP CONSTRAINT IF EXISTS games_away_team_id_fkey;

-- Drop the existing teams table
DROP TABLE IF EXISTS teams CASCADE;

-- Create the new teams table with updated schema
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id INTEGER NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (city || ' ' || name) STORED,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  logo_url TEXT,
  venue_name VARCHAR(200),
  venue_city VARCHAR(100),
  venue_state VARCHAR(50),
  venue_capacity INTEGER,
  venue_surface VARCHAR(50),
  venue_address TEXT,
  venue_zip VARCHAR(20),
  venue_country VARCHAR(100),
  venue_latitude DECIMAL(10, 8),
  venue_longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  source_system VARCHAR(50) DEFAULT 'sportsdata.io',
  is_active BOOLEAN DEFAULT true,
  
  -- Add constraints
  UNIQUE(league_id, external_id),
  CONSTRAINT fk_league FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_teams_external_id ON teams(external_id);
CREATE INDEX idx_teams_abbreviation ON teams(abbreviation);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION update_teams_updated_at();

-- Add comments to the table and columns
COMMENT ON TABLE teams IS 'Sports teams with detailed information including venue details';
COMMENT ON COLUMN teams.external_id IS 'External ID from the data source';
COMMENT ON COLUMN teams.league_id IS 'Reference to the league this team belongs to';
COMMENT ON COLUMN teams.city IS 'Home city of the team';
COMMENT ON COLUMN teams.name IS 'Team name without location';
COMMENT ON COLUMN teams.full_name IS 'Generated full team name (city + name)';
COMMENT ON COLUMN teams.venue_name IS 'Name of the home venue/stadium';

-- Recreate foreign key constraints
ALTER TABLE players 
  ADD CONSTRAINT players_current_team_id_fkey 
  FOREIGN KEY (current_team_id) REFERENCES teams(id) 
  ON DELETE SET NULL;

ALTER TABLE games
  ADD CONSTRAINT games_home_team_id_fkey
  FOREIGN KEY (home_team_id) REFERENCES teams(id)
  ON DELETE CASCADE;

ALTER TABLE games
  ADD CONSTRAINT games_away_team_id_fkey
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
  ON DELETE CASCADE;
