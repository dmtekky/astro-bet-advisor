import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or key in environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(
      path.join(__dirname, '../supabase/add_team_stats_columns.sql'), 
      'utf-8'
    );
    
    console.log('Applying migration...');
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

applyMigration();
