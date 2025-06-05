-- SQL to create a new NBA player stats table for 2025
CREATE TABLE IF NOT EXISTS public.nba_player_season_stats_2025 (
  id SERIAL PRIMARY KEY,
  player_id UUID,
  first_name TEXT,
  last_name TEXT,
  team_abbreviation TEXT,
  team_id UUID,
  season VARCHAR(10) DEFAULT '2024-25',
  games_played INTEGER DEFAULT 0,
  games_started INTEGER DEFAULT 0,
  minutes_played NUMERIC DEFAULT 0,
  points NUMERIC DEFAULT 0,
  total_rebounds NUMERIC DEFAULT 0,
  offensive_rebounds NUMERIC DEFAULT 0,
  defensive_rebounds NUMERIC DEFAULT 0,
  assists NUMERIC DEFAULT 0,
  steals NUMERIC DEFAULT 0,
  blocks NUMERIC DEFAULT 0,
  turnovers NUMERIC DEFAULT 0,
  field_goals_made NUMERIC DEFAULT 0,
  field_goals_attempted NUMERIC DEFAULT 0,
  field_goal_pct NUMERIC DEFAULT 0,
  three_point_made NUMERIC DEFAULT 0,
  three_point_attempted NUMERIC DEFAULT 0, 
  three_point_pct NUMERIC DEFAULT 0,
  free_throws_made NUMERIC DEFAULT 0,
  free_throws_attempted NUMERIC DEFAULT 0,
  free_throw_pct NUMERIC DEFAULT 0,
  personal_fouls NUMERIC DEFAULT 0,
  plus_minus NUMERIC DEFAULT 0,
  raw_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(player_id, season)
);

CREATE INDEX IF NOT EXISTS idx_nba_player_stats_2025_player_id ON nba_player_season_stats_2025(player_id);
CREATE INDEX IF NOT EXISTS idx_nba_player_stats_2025_team_id ON nba_player_season_stats_2025(team_id);
