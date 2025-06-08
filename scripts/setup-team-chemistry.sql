-- Drop the team_chemistry table if it exists
DROP TABLE IF EXISTS public.team_chemistry;

-- Create the team_chemistry table with all necessary columns
CREATE TABLE public.team_chemistry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL,
    team_name TEXT NOT NULL,
    team_abbreviation TEXT NOT NULL,
    score INTEGER NOT NULL,
    elements JSONB NOT NULL,
    aspects JSONB NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_team
        FOREIGN KEY(team_id) 
        REFERENCES teams(id)
        ON DELETE CASCADE
);

-- Create a unique index on team_id to support upsert
CREATE UNIQUE INDEX idx_team_chemistry_team_id ON public.team_chemistry(team_id);

-- Add a comment to the table
COMMENT ON TABLE public.team_chemistry IS 'Stores team chemistry scores and related astrological data';

-- Grant necessary permissions
GRANT ALL ON TABLE public.team_chemistry TO postgres;
GRANT ALL ON TABLE public.team_chemistry TO authenticated;
GRANT ALL ON TABLE public.team_chemistry TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE public.team_chemistry ENABLE ROW LEVEL SECURITY;
