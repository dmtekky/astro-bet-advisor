// Script to add missing columns to Supabase tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: `${__dirname}/.env` });

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set in your .env file');
  process.exit(1);
}

// Initialize Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to execute raw SQL
async function executeSQL(sql) {
  try {
    console.log('Executing SQL:', sql);
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error executing SQL:', error);
    return { success: false, error };
  }
}

// Function to check if a column exists
async function columnExists(table, column) {
  const sql = `
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = '${table}' 
    AND column_name = '${column}'
  `;
  
  const { success, data } = await executeSQL(sql);
  return success && data && data.length > 0;
}

// Function to add a column if it doesn't exist
async function addColumnIfNotExists(table, column, type) {
  console.log(`Checking if column '${column}' exists in '${table}' table...`);
  
  const exists = await columnExists(table, column);
  
  if (exists) {
    console.log(`Column '${column}' already exists in '${table}' table`);
    return true;
  }
  
  // If we get here, the column doesn't exist, so add it
  console.log(`Adding column '${column}' to '${table}' table...`);
  const sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
  const { success, error } = await executeSQL(sql);
  
  if (!success) {
    console.error(`Error adding column '${column}' to '${table}':`, error);
    return false;
  }
  
  console.log(`Successfully added column '${column}' to '${table}' table`);
  return true;
}

// Main function
async function main() {
  console.log('Starting database schema update...');
  
  try {
    // Define the columns to add
    const tables = [
      { name: 'teams', columns: ['api_last_updated'] },
      { name: 'venues', columns: ['api_last_updated'] },
      { name: 'games', columns: ['api_last_updated'] },
      { name: 'players', columns: ['api_last_updated'] }
    ];
    
    // Add the columns to each table
    for (const table of tables) {
      for (const column of table.columns) {
        const success = await addColumnIfNotExists(
          table.name, 
          column, 
          'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        );
        
        if (!success) {
          console.error(`Failed to add column '${column}' to table '${table.name}'. Exiting...`);
          process.exit(1);
        }
      }
    }
    
    console.log('✅ Database schema update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});
