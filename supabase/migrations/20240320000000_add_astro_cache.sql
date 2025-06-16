-- Create astro_cache table
CREATE TABLE IF NOT EXISTS astro_cache (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    sidereal BOOLEAN NOT NULL DEFAULT false,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_astro_cache_date ON astro_cache(date);
CREATE INDEX IF NOT EXISTS idx_astro_cache_sidereal ON astro_cache(sidereal);
CREATE INDEX IF NOT EXISTS idx_astro_cache_created_at ON astro_cache(created_at);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_astro_cache_unique ON astro_cache(date, sidereal);

-- Add RLS policies
ALTER TABLE astro_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all users" ON astro_cache
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow insert/update only to service role
CREATE POLICY "Allow insert/update to service role" ON astro_cache
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_astro_cache_updated_at
    BEFORE UPDATE ON astro_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 