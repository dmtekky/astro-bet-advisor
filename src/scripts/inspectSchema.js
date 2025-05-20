import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/Users/dmtekk/Desktop/FMO1/astro-bet-advisor/.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY,
  {
    auth: { persistSession: false }
  }
);

async function inspectSchema() {
  try {
    // Get table info using pg_catalog
    console.log('Fetching tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) throw tablesError;

    console.log('Available tables:');
    console.table(tables.map(t => ({ table: t.tablename })));

    // Check teams table columns
    console.log('\nTeams table columns:');
    const { data: columns, error: columnsError } = await supabase.rpc('get_columns_for_table', {
      table_name: 'teams'
    });

    if (columnsError) throw columnsError;
    console.table(columns);

    // Check team_aliases table columns if it exists
    console.log('\nTeam aliases table columns:');
    const { data: aliasColumns, error: aliasError } = await supabase.rpc('get_columns_for_table', {
      table_name: 'team_aliases'
    });

    if (aliasError) {
      console.log('Team aliases table does not exist or error:', aliasError.message);
    } else {
      console.table(aliasColumns);
    }

    // Check if we can query the teams table directly
    console.log('\nFirst team in the database:');
    const { data: firstTeam, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (teamError) {
      console.error('Error querying teams table:', teamError);
    } else if (firstTeam && firstTeam.length > 0) {
      console.log('Sample team data:', firstTeam[0]);
    } else {
      console.log('No teams found in the database');
    }

  } catch (error) {
    console.error('Error inspecting schema:', error);
  } finally {
    process.exit(0);
  }
}

inspectSchema();
