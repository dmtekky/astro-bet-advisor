-- Add missing columns to nba_players table
ALTER TABLE nba_players 
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS contract_year INTEGER,
ADD COLUMN IF NOT EXISTS alternate_positions TEXT[],
ADD COLUMN IF NOT EXISTS current_injury JSONB,
ADD COLUMN IF NOT EXISTS shoots_hand CHAR(1),
ADD COLUMN IF NOT EXISTS social_media_accounts JSONB,
ADD COLUMN IF NOT EXISTS draft_pick_team_id INTEGER,
ADD COLUMN IF NOT EXISTS draft_pick_team_abbr VARCHAR(10),
ADD COLUMN IF NOT EXISTS draft_round_pick INTEGER,
ADD COLUMN IF NOT EXISTS draft_overall_pick INTEGER,
ADD COLUMN IF NOT EXISTS external_mappings JSONB;

-- Add an index on external_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_nba_players_external_id ON nba_players(external_id);

-- Verify the schema
\d nba_players;
