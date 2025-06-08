const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addImpactScoreColumns() {
  console.log('Adding impact score columns to baseball_players table...');
  
  const sql = `
    -- Add impact_score column to baseball_players table if it doesn't exist
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'baseball_players' 
            AND column_name = 'impact_score'
        ) THEN
            ALTER TABLE baseball_players ADD COLUMN impact_score NUMERIC(5, 2) DEFAULT NULL;
            RAISE NOTICE 'Added impact_score column to baseball_players table';
        ELSE
            RAISE NOTICE 'impact_score column already exists in baseball_players table';
        END IF;
    END $$;

    -- Add astro_influence_score column to baseball_players table if it doesn't exist
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'baseball_players' 
            AND column_name = 'astro_influence_score'
        ) THEN
            ALTER TABLE baseball_players ADD COLUMN astro_influence_score NUMERIC(5, 2) DEFAULT NULL;
            RAISE NOTICE 'Added astro_influence_score column to baseball_players table';
        ELSE
            RAISE NOTICE 'astro_influence_score column already exists in baseball_players table';
        END IF;
    END $$;

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_baseball_players_impact_score ON baseball_players(impact_score);
    CREATE INDEX IF NOT EXISTS idx_baseball_players_astro_influence_score ON baseball_players(astro_influence_score);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return false;
    }
    
    console.log('Successfully added impact score columns');
    
    // Verify the columns were added
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'baseball_players')
      .in('column_name', ['impact_score', 'astro_influence_score']);
      
    if (verifyError) {
      console.error('Error verifying columns:', verifyError);
    } else {
      console.log('Verified columns:', columns);
    }
    
    return true;
  } catch (err) {
    console.error('Exception adding columns:', err);
    return false;
  }
}

// Run the script
addImpactScoreColumns()
  .then((success) => {
    if (success) {
      console.log('Migration completed successfully');
      process.exit(0);
    } else {
      console.log('Migration failed');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });