-- Add mysportsfeeds_id, impact_score, and astro_score to players table

ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS mysportsfeeds_id INTEGER UNIQUE,
ADD COLUMN IF NOT EXISTS impact_score NUMERIC(7,2),
ADD COLUMN IF NOT EXISTS astro_score NUMERIC(7,2);

COMMENT ON COLUMN public.players.mysportsfeeds_id IS 'Player ID from MySportsFeeds API, used for mapping.';
COMMENT ON COLUMN public.players.impact_score IS 'Calculated score representing overall player impact for their sport.';
COMMENT ON COLUMN public.players.astro_score IS 'Calculated score based on astrological factors relevant to the player.';

-- If you have a separate nba_players table, the commands would be:
-- ALTER TABLE public.nba_players
-- ADD COLUMN IF NOT EXISTS mysportsfeeds_id INTEGER UNIQUE,
-- ADD COLUMN IF NOT EXISTS impact_score NUMERIC(7,2),
-- ADD COLUMN IF NOT EXISTS astro_score NUMERIC(7,2);
-- 
-- COMMENT ON COLUMN public.nba_players.mysportsfeeds_id IS 'Player ID from MySportsFeeds API, used for mapping.';
-- COMMENT ON COLUMN public.nba_players.impact_score IS 'Calculated score representing overall player impact for NBA.';
-- COMMENT ON COLUMN public.nba_players.astro_score IS 'Calculated score based on astrological factors relevant to the NBA player.';

RAISE NOTICE 'Columns mysportsfeeds_id, impact_score, astro_score added to players table if they did not exist.';
