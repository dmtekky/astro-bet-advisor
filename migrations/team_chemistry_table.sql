-- Team Chemistry Table Migration
-- This table stores the calculated chemistry data for each team

-- Create the team_chemistry table
CREATE TABLE IF NOT EXISTS public.team_chemistry (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL,
  elemental_balance JSONB NOT NULL,
  aspect_harmony JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_team_chemistry_team_id ON public.team_chemistry(team_id);

-- Enable Row Level Security
ALTER TABLE public.team_chemistry ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Team chemistry is viewable by everyone" 
  ON public.team_chemistry FOR SELECT 
  USING (true);

CREATE POLICY "Team chemistry is updatable by service role" 
  ON public.team_chemistry FOR ALL 
  USING (auth.role() = 'service_role');

-- Create a stored procedure for the update script to use
CREATE OR REPLACE FUNCTION public.create_team_chemistry_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the team_chemistry table if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.team_chemistry (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    overall_score NUMERIC(5,2) NOT NULL,
    elemental_balance JSONB NOT NULL,
    aspect_harmony JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(team_id)
  );
  
  -- Add indexes
  CREATE INDEX IF NOT EXISTS idx_team_chemistry_team_id ON public.team_chemistry(team_id);
  
  -- Enable Row Level Security
  ALTER TABLE public.team_chemistry ENABLE ROW LEVEL SECURITY;
  
  -- Create policies for RLS
  DROP POLICY IF EXISTS "Team chemistry is viewable by everyone" ON public.team_chemistry;
  DROP POLICY IF EXISTS "Team chemistry is updatable by service role" ON public.team_chemistry;
  
  CREATE POLICY "Team chemistry is viewable by everyone" 
    ON public.team_chemistry FOR SELECT 
    USING (true);
  
  CREATE POLICY "Team chemistry is updatable by service role" 
    ON public.team_chemistry FOR ALL 
    USING (auth.role() = 'service_role');
END;
$$;
