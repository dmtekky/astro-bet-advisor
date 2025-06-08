-- Team Chemistry Table Creation Script
-- Run this in the Supabase SQL editor

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create team_chemistry table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_chemistry (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  overall_score NUMERIC(5,2) NOT NULL,
  elemental_balance JSONB NOT NULL,
  aspect_harmony JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id)
);

-- Grant necessary permissions
ALTER TABLE public.team_chemistry ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to authenticated users
CREATE POLICY "Allow read access for all authenticated users"
  ON public.team_chemistry
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow insert/update for service role
CREATE POLICY "Allow service role to insert/update"
  ON public.team_chemistry
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE public.team_chemistry IS 'Stores team chemistry calculations based on player astrological data';

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.team_chemistry
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
