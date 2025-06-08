import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('🚀 Executing SQL from:', filePath);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
    } else {
      console.log('✅ SQL executed successfully');
      console.log('Result:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get the SQL file path from command line arguments
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Please provide a path to an SQL file');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), sqlFile);
runSqlFile(filePath);
