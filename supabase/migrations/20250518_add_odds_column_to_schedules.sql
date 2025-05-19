-- Add odds JSONB column to schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS odds JSONB;

-- Update RLS policy to allow read access to odds column
DROP POLICY IF EXISTS "Enable read access for all users" ON public.schedules;
CREATE POLICY "Enable read access for all users" 
ON public.schedules 
FOR SELECT 
TO public 
USING (true);

-- Update RLS policy to allow insert/update for authenticated users
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.schedules;
CREATE POLICY "Enable insert for authenticated users only" 
ON public.schedules 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Update RLS policy to allow update for authenticated users
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.schedules;
CREATE POLICY "Enable update for authenticated users only" 
ON public.schedules 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);
