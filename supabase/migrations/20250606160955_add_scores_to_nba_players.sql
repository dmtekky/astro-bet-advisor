ALTER TABLE public.nba_players
ADD COLUMN impact_score NUMERIC(5,1) NULL,
ADD COLUMN astro_influence NUMERIC(5,1) NULL;

COMMENT ON COLUMN public.nba_players.impact_score IS 'Player impact score, typically from the latest season.';
COMMENT ON COLUMN public.nba_players.astro_influence IS 'Player astrological influence score, typically from the latest season.';
