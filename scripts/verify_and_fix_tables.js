import { createClient } from '@supabase/supabase-js';
// Supabase credentials (hardcoded)
const supabaseUrl = 'https://awoxkynorbspcrrggbca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI2NDMzNCwiZXhwIjoyMDYyODQwMzM0fQ.cdBzpp7ASlwN8PSxvGSUn9Wbx9lqDBsTIC5U-psel8w';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables');
  console.log('Make sure .env file exists with PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableIfNotExists() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS nba_player_season_stats (
      id BIGSERIAL PRIMARY KEY,
      player_id BIGINT NOT NULL REFERENCES nba_players(id) ON DELETE CASCADE,
      season VARCHAR(9) NOT NULL,
      team_id VARCHAR(3),
      games_played INTEGER DEFAULT 0,
      minutes INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      rebounds INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      steals INTEGER DEFAULT 0,
      blocks INTEGER DEFAULT 0,
      turnovers INTEGER DEFAULT 0,
      field_goals_made INTEGER DEFAULT 0,
      field_goals_attempted INTEGER DEFAULT 0,
      three_point_made INTEGER DEFAULT 0,
      three_point_attempted INTEGER DEFAULT 0,
      free_throws_made INTEGER DEFAULT 0,
      free_throws_attempted INTEGER DEFAULT 0,
      offensive_rebounds INTEGER DEFAULT 0,
      defensive_rebounds INTEGER DEFAULT 0,
      personal_fouls INTEGER DEFAULT 0,
      plus_minus INTEGER DEFAULT 0,
      games_started INTEGER DEFAULT 0,
      field_goal_pct DECIMAL(5,1) DEFAULT 0.0,
      three_point_pct DECIMAL(5,1) DEFAULT 0.0,
      free_throw_pct DECIMAL(5,1) DEFAULT 0.0,
      raw_stats JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT nba_player_season_stats_player_id_season_key UNIQUE (player_id, season)
    );
    
    CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_player_id ON nba_player_season_stats(player_id);
    CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_season ON nba_player_season_stats(season);
    CREATE INDEX IF NOT EXISTS idx_nba_player_season_stats_team_id ON nba_player_season_stats(team_id);
  `;

  try {
    console.log('Creating table nba_player_season_stats if it does not exist...');
    const { data, error } = await supabase.rpc('exec_sql', { query: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      return false;
    }
    
    console.log('Table nba_player_season_stats is ready');
    return true;
  } catch (error) {
    console.error('Exception creating table:', error);
    return false;
  }
}

async function verifyTableStructure() {
  try {
    console.log('Verifying table structure...');
    
    // Check if the table exists
    const { data: tableExists, error: tableError } = await supabase
      .rpc('table_exists', { table_name: 'nba_player_season_stats' });
      
    if (tableError) throw tableError;
    
    if (!tableExists) {
      console.log('Table does not exist. Creating it now...');
      return await createTableIfNotExists();
    }
    
    console.log('Table exists. Checking columns...');
    
    // Check if the field_goal_pct column exists
    const { data: columnCheck, error: columnError } = await supabase
      .rpc('column_exists', { 
        table_name: 'nba_player_season_stats', 
        column_name: 'field_goal_pct' 
      });
      
    if (columnError) throw columnError;
    
    if (!columnCheck) {
      console.log('Adding missing column field_goal_pct...');
      const { error: alterError } = await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE nba_player_season_stats ADD COLUMN IF NOT EXISTS field_goal_pct DECIMAL(5,1) DEFAULT 0.0;'
      });
      
      if (alterError) throw alterError;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying table structure:', error);
    return false;
  }
}

// Create the necessary database functions if they don't exist
async function setupDatabaseFunctions() {
  console.log('Setting up helper database functions (assuming exec_sql already exists)...');
  const helperFunctionsSQL = `
    CREATE OR REPLACE FUNCTION public.table_exists(p_schema_name TEXT, p_table_name TEXT)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1
        FROM   information_schema.tables
        WHERE  table_schema = p_schema_name
        AND    table_name = p_table_name
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE OR REPLACE FUNCTION public.column_exists(p_schema_name TEXT, p_table_name TEXT, p_column_name TEXT)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE column_schema = p_schema_name
          AND table_name = p_table_name
          AND column_name = p_column_name
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE OR REPLACE FUNCTION public.add_column_if_not_exists(p_schema_name TEXT, p_table_name TEXT, p_column_name TEXT, p_column_type TEXT)
    RETURNS VOID AS $$
    BEGIN
      IF NOT public.column_exists(p_schema_name, p_table_name, p_column_name) THEN
        EXECUTE format('ALTER TABLE %I.%I ADD COLUMN %I %s', p_schema_name, p_table_name, p_column_name, p_column_type);
      END IF;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  // Use exec_sql to create/update the other helper functions
  const { error: setupError } = await supabase.rpc('exec_sql', { sql_statement: helperFunctionsSQL });
  if (setupError) {
    console.error('Error setting up helper database functions using exec_sql:', setupError);
    console.error('Please ensure public.exec_sql(sql_statement TEXT) function is defined in your Supabase project.');
    throw new Error('Failed to set up helper database functions');
  }
  console.log('Helper database functions set up successfully.');

  // Attempt to reload schema for PostgREST
  console.log('Attempting to reload Supabase schema cache...');
  const { error: reloadError } = await supabase.rpc('exec_sql', { sql_statement: "NOTIFY pgrst, 'reload schema';" });
  if (reloadError) {
    console.warn('Failed to trigger schema reload notification (this might be fine if not supported or if exec_sql lacks permissions for NOTIFY):', reloadError.message);
  } else {
    console.log('Schema reload notification sent. Waiting a bit for it to take effect...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
  }
  return true;
}

async function main() {
  try {
    console.log('Starting database verification...');
    
    // First, set up the necessary database functions
    const functionsReady = await setupDatabaseFunctions();
    if (!functionsReady) {
      throw new Error('Failed to set up database functions');
    }
    
    // Then verify and fix the table structure
    const tableReady = await verifyTableStructure();
    if (!tableReady) {
      throw new Error('Failed to verify table structure');
    }
    
    console.log('\n✅ Database verification completed successfully!');
    console.log('You can now run the stats sync script.');
  } catch (error) {
    console.error('❌ Error during database verification:', error);
    process.exit(1);
  }
}

main();
