-- Migration: Ensure all required columns exist in schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS sport_type TEXT;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS odds JSONB;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE;

-- Update RLS policies for new columns
DROP POLICY IF EXISTS "Enable read access for all users" ON public.schedules;
CREATE POLICY "Enable read access for all users" 
ON public.schedules 
FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.schedules;
CREATE POLICY "Enable insert for authenticated users only" 
ON public.schedules 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.schedules;
CREATE POLICY "Enable update for authenticated users only" 
ON public.schedules 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);
