-- Add turnovers_per_game and personal_fouls_per_game to basketball_stats table

ALTER TABLE public.basketball_stats
ADD COLUMN IF NOT EXISTS turnovers_per_game NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS personal_fouls_per_game NUMERIC(5,2) DEFAULT 0;

COMMENT ON COLUMN public.basketball_stats.turnovers_per_game IS 'Turnovers per game.';
COMMENT ON COLUMN public.basketball_stats.personal_fouls_per_game IS 'Personal fouls per game.';

RAISE NOTICE 'Columns turnovers_per_game, personal_fouls_per_game added to basketball_stats table if they did not exist.';
