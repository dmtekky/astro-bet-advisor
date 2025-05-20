-- Function to get table columns
CREATE OR REPLACE FUNCTION get_columns(table_name text)
RETURNS TABLE (column_name text, data_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM 
    information_schema.columns c
  WHERE 
    c.table_name = $1
    AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add odds column if it doesn't exist
CREATE OR REPLACE FUNCTION add_odds_column()
RETURNS void AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'schedules' 
      AND column_name = 'odds'
  ) THEN
    -- Add the column
    EXECUTE 'ALTER TABLE public.schedules ADD COLUMN odds JSONB';
    
    -- Update RLS policies
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON public.schedules';
    EXECUTE 'CREATE POLICY "Enable read access for all users" ON public.schedules FOR SELECT TO public USING (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.schedules';
    EXECUTE 'CREATE POLICY "Enable insert for authenticated users only" ON public.schedules FOR INSERT TO authenticated WITH CHECK (true)';
    
    EXECUTE 'DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.schedules';
    EXECUTE 'CREATE POLICY "Enable update for authenticated users only" ON public.schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
    
    RAISE NOTICE 'Added odds column to schedules table';
  ELSE
    RAISE NOTICE 'Odds column already exists in schedules table';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
