-- This migration recreates the views and functions that depend on the baseball_stats table
-- It should be run after the 20250527_update_baseball_stats.sql migration

-- Recreate the player stats view with the new schema
CREATE OR REPLACE VIEW player_stats_view AS
SELECT 
  p.id as player_id,
  CONCAT(p.first_name, ' ', p.last_name) as player_name,
  t.abbreviation as team_abbreviation,
  p.primary_position as position,
  -- Exclude player_id from bs.* to avoid duplicate column
  bs.id as stats_id,
  bs.player_external_id,
  bs.jersey_number,
  bs.season,
  bs.team_id,
  bs.team_abbreviation as stats_team_abbreviation,
  bs.games_played,
  bs.at_bats,
  bs.runs,
  bs.hits,
  bs.doubles,
  bs.triples,
  bs.home_runs,
  bs.rbi,
  bs.stolen_bases,
  bs.caught_stealing,
  bs.walks,
  bs.strikeouts,
  bs.batting_avg,
  bs.on_base_pct,
  bs.slugging_pct,
  bs.ops,
  bs.wins,
  bs.losses,
  bs.era,
  bs.games_pitched,
  bs.games_started,
  bs.saves,
  bs.innings_pitched,
  bs.hits_allowed,
  bs.runs_allowed,
  bs.earned_runs,
  bs.home_runs_allowed,
  bs.walks_allowed,
  bs.strikeouts_pitched,
  bs.whip,
  bs.fielding_pct,
  bs.errors,
  bs.assists,
  bs.putouts,
  bs.created_at as stats_created_at,
  bs.updated_at as stats_updated_at,
  bs.last_synced_at
FROM players p
LEFT JOIN baseball_stats bs ON p.id = bs.player_id
LEFT JOIN teams t ON p.current_team_id = t.id;

-- Recreate the get_team_player_stats function with the new schema
CREATE OR REPLACE FUNCTION get_team_player_stats(team_name text, season_year integer)
RETURNS TABLE (
  player_id UUID,
  player_name text,
  "position" text,
  games_played integer,
  at_bats integer,
  runs integer,
  hits integer,
  home_runs integer,
  runs_batted_in integer,
  stolen_bases integer,
  batting_avg numeric(5,3),
  ops numeric(5,3),
  wins integer,
  losses integer,
  era numeric(5,2),
  strikeouts integer,
  saves integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as player_id,
    CONCAT(p.first_name, ' ', p.last_name) as player_name,
    p.primary_position as position,
    COALESCE(bs.games_played, 0) as games_played,
    COALESCE(bs.at_bats, 0) as at_bats,
    COALESCE(bs.runs, 0) as runs,
    COALESCE(bs.hits, 0) as hits,
    COALESCE(bs.home_runs, 0) as home_runs,
    COALESCE(bs.rbi, 0) as runs_batted_in,
    COALESCE(bs.stolen_bases, 0) as stolen_bases,
    COALESCE(bs.batting_avg, 0) as batting_avg,
    COALESCE(bs.ops, 0) as ops,
    COALESCE(bs.wins, 0) as wins,
    COALESCE(bs.losses, 0) as losses,
    COALESCE(bs.era, 0) as era,
    COALESCE(bs.strikeouts, 0) as strikeouts,
    COALESCE(bs.saves, 0) as saves
  FROM players p
  LEFT JOIN baseball_stats bs ON p.id = bs.player_id AND bs.season = season_year
  LEFT JOIN teams t ON p.current_team_id = t.id
  WHERE t.abbreviation = team_name
  ORDER BY p.primary_position, p.last_name, p.first_name;
END;
$$ LANGUAGE plpgsql;
