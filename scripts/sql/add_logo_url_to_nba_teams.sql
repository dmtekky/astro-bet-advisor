-- Add logo_url column to nba_teams table if it doesn't exist
ALTER TABLE nba_teams ADD COLUMN IF NOT EXISTS logo_url text;
