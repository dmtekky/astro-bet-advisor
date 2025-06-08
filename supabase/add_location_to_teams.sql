-- Minimal migration to add location column to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS location TEXT;
