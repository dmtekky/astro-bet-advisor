-- Add schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.schedules (
  id BIGSERIAL PRIMARY KEY,
  espn_id VARCHAR(64) UNIQUE NOT NULL,
  sport VARCHAR(32) NOT NULL,
  home_team VARCHAR(64) NOT NULL,
  away_team VARCHAR(64) NOT NULL,
  game_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(32),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_sport_time ON public.schedules(sport, game_time);

-- Enable Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public read access" ON public.schedules
  FOR SELECT USING (true);

-- Create policy for authenticated users to insert/update
CREATE POLICY "Allow authenticated insert" ON public.schedules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON public.schedules
  FOR UPDATE USING (auth.role() = 'authenticated');
