-- Create cached_odds table to store API responses
CREATE TABLE IF NOT EXISTS public.cached_odds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport TEXT NOT NULL,
  data JSONB NOT NULL,
  last_update TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS cached_odds_sport_idx ON public.cached_odds(sport);
CREATE INDEX IF NOT EXISTS cached_odds_last_update_idx ON public.cached_odds(last_update);

-- Add RLS policies
ALTER TABLE public.cached_odds ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access for all authenticated users"
  ON public.cached_odds
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow insert and update for authenticated users
CREATE POLICY "Allow insert for authenticated users"
  ON public.cached_odds
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON public.cached_odds
  FOR UPDATE
  TO authenticated
  USING (true);
