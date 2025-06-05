-- Create nba_player_season_stats table
CREATE TABLE IF NOT EXISTS public.nba_player_season_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL REFERENCES public.nba_players(id) ON DELETE CASCADE,
    season VARCHAR(9) NOT NULL,
    team_id VARCHAR(3),
    games_played INTEGER DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    three_point_made INTEGER DEFAULT 0,
    three_point_attempted INTEGER DEFAULT 0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    offensive_rebounds INTEGER DEFAULT 0,
    defensive_rebounds INTEGER DEFAULT 0,
    personal_fouls INTEGER DEFAULT 0,
    plus_minus INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    field_goal_pct DECIMAL(5,1) DEFAULT 0.0,
    three_point_pct DECIMAL(5,1) DEFAULT 0.0,
    free_throw_pct DECIMAL(5,1) DEFAULT 0.0,
    raw_stats JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT nba_player_season_stats_player_id_season_key UNIQUE (player_id, season)
);

-- Add comments
COMMENT ON TABLE public.nba_player_season_stats IS 'Season statistics for NBA players';
COMMENT ON COLUMN public.nba_player_season_stats.player_id IS 'Reference to the player in nba_players table';
COMMENT ON COLUMN public.nba_player_season_stats.season IS 'NBA season in format YYYY-YYYY';
COMMENT ON COLUMN public.nba_player_season_stats.team_id IS 'Team abbreviation';
COMMENT ON COLUMN public.nba_player_season_stats.raw_stats IS 'Raw JSON data from the API for reference';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_player_id ON public.nba_player_season_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_season ON public.nba_player_season_stats(season);
CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_team_id ON public.nba_player_season_stats(team_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nba_player_season_stats_updated_at
BEFORE UPDATE ON public.nba_player_season_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
