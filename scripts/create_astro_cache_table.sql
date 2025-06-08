-- Create table for astrology data caching
CREATE TABLE IF NOT EXISTS astro_cache (
  date TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS astro_cache_date_idx ON astro_cache(date);

-- Add comment for documentation
COMMENT ON TABLE astro_cache IS 'Cache table for unified astrology API data, updated daily';
