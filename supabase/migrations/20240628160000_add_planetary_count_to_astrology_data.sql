-- Add planetary_count column to user_astrology_data table
ALTER TABLE public.user_astrology_data 
ADD COLUMN IF NOT EXISTS planetary_count JSONB;

-- Update existing rows with default empty object
UPDATE public.user_astrology_data 
SET planetary_count = '{}'::jsonb 
WHERE planetary_count IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.user_astrology_data.planetary_count 
IS 'Stores the count of planets in each zodiac sign as a JSONB object with sign names as keys and counts as values';

-- Update the RLS policy to include the new column
DROP POLICY IF EXISTS "Allow public access to user_astrology_data" ON public.user_astrology_data;
CREATE POLICY "Allow public access to user_astrology_data" ON public.user_astrology_data 
FOR ALL USING (true);
