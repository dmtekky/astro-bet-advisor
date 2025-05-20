-- Add wins, losses, and win_pct columns to teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_pct NUMERIC(5,3) GENERATED ALWAYS AS (
  CASE 
    WHEN (wins + losses) > 0 THEN ROUND(wins::numeric / (wins + losses)::numeric, 3)
    ELSE 0 
  END
) STORED;
