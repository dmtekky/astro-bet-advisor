-- Create baseball_teams table
CREATE TABLE IF NOT EXISTS baseball_teams (
    id INTEGER PRIMARY KEY,
    abbreviation VARCHAR(3) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id)
);

-- Create index on abbreviation for faster lookups
CREATE INDEX IF NOT EXISTS idx_baseball_teams_abbreviation ON baseball_teams(abbreviation);
