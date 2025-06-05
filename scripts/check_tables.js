import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    // Get all tables in the public schema
    const { data: tables, error } = await supabase
      .rpc('get_tables');
    
    if (error) throw error;
    
    console.log('Tables in database:');
    for (const table of tables) {
      console.log(`\nTable: ${table.table_name}`);
      
      // Get columns for this table
      const { data: columns, error: colError } = await supabase
        .rpc('get_columns', { table_name: table.table_name });
      
      if (colError) throw colError;
      
      console.log('Columns:');
      console.table(columns);
    }
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

// Create the necessary PostgreSQL functions
async function setupDatabaseFunctions() {
  const functionsSQL = `
    -- Function to get all tables in the public schema
    CREATE OR REPLACE FUNCTION get_tables()
    RETURNS TABLE (table_name text) AS $$
    BEGIN
      RETURN QUERY
      SELECT tablename::text 
      FROM pg_tables 
      WHERE schemaname = 'public';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to get columns for a specific table
    CREATE OR REPLACE FUNCTION get_columns(table_name text)
    RETURNS TABLE (column_name text, data_type text, is_nullable text) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        a.attname::text as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
        CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END as is_nullable
      FROM 
        pg_catalog.pg_attribute a
        JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
        JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
      WHERE 
        n.nspname = 'public'
        AND c.relname = table_name
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;


  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: functionsSQL });
    if (error) throw error;
    console.log('Database functions created successfully');
    return true;
  } catch (error) {
    console.error('Error creating database functions:', error);
    return false;
  }
}

// Run the setup and list tables
async function main() {
  console.log('Setting up database functions...');
  const success = await setupDatabaseFunctions();
  if (success) {
    console.log('\nListing all tables...');
    await listTables();
  }
}

main().catch(console.error);
