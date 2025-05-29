-- Create a helper function to add columns if they don't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  table_name text,
  column_name text,
  column_type text
)
RETURNS void AS $$
DECLARE
  query text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  ) THEN
    query := format('ALTER TABLE %I ADD COLUMN %I %s', $1, $2, $3);
    EXECUTE query;
    RAISE NOTICE 'Added column % to table %', $2, $1;
  ELSE
    RAISE NOTICE 'Column % already exists in table %', $2, $1;
  END IF;
END;
$$ LANGUAGE plpgsql;
