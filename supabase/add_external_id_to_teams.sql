-- Minimal migration to add external_id column to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS external_id TEXT;
