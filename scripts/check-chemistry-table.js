import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('🔍 Checking team_chemistry table...');
  
  try {
    // Check if the table exists by trying to select from it
    const { data, error } = await supabase
      .from('team_chemistry')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing team_chemistry table:', error);
      
      // Check if the error is because the table doesn't exist
      if (error.code === '42P01') { // Table doesn't exist
        console.log('ℹ️ team_chemistry table does not exist. Creating it now...');
        await createTable();
        return;
      }
      return;
    }
    
    // If we got here, the table exists
    console.log('✅ team_chemistry table exists');
    
    // Count the records
    const { count, error: countError } = await supabase
      .from('team_chemistry')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting records:', countError);
    } else {
      console.log(`📊 Found ${count} records in team_chemistry table`);
    }
    
    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('team_chemistry')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('\nSample team_chemistry data:');
      sampleData.forEach((row, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        console.log(`Team: ${row.team_name} (${row.team_abbreviation})`);
        console.log(`Score: ${row.score || row.overall_score || 'N/A'}`);
        console.log(`Elements:`, row.elements || 'N/A');
        console.log(`Aspects:`, row.aspects || 'N/A');
        console.log(`Last updated: ${row.calculated_at || row.last_updated || 'N/A'}`);
      });
    } else {
      console.log('ℹ️ No data found in team_chemistry table');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function createTable() {
  try {
    console.log('Creating team_chemistry table...');
    
    // Create the table using the SQL from the create_team_chemistry_table.sql file
    const { data, error } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.team_chemistry (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          team_id TEXT,
          team_name TEXT,
          team_abbreviation TEXT,
          score DECIMAL(5,2) NOT NULL DEFAULT 50,
          overall_score DECIMAL(5,2) GENERATED ALWAYS AS (COALESCE(score, 50)) STORED,
          elements JSONB NOT NULL DEFAULT '{"fire": 25, "earth": 25, "air": 25, "water": 25, "balance": 50}'::jsonb,
          aspects JSONB NOT NULL DEFAULT '{"harmonyScore": 50, "challengeScore": 20, "netHarmony": 50}'::jsonb,
          calculated_at TIMESTAMPTZ DEFAULT NOW(),
          last_updated TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        );
        
        -- Enable RLS
        ALTER TABLE public.team_chemistry ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Enable read access for all users" 
        ON public.team_chemistry 
        FOR SELECT 
        USING (true);
        
        CREATE POLICY "Enable insert for authenticated users only"
        ON public.team_chemistry
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Enable update for authenticated users only"
        ON public.team_chemistry
        FOR UPDATE
        USING (auth.role() = 'authenticated');
        
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_team_chemistry_team_id 
        ON public.team_chemistry(team_id);
      `
    });
    
    if (error) throw error;
    
    console.log('✅ Successfully created team_chemistry table');
    
    // After creating the table, run the update script
    console.log('\n🔄 Running update-player-scores.js to generate chemistry data...');
    
    // We'll run the update script in a child process
    const { execSync } = require('child_process');
    try {
      const output = execSync('node scripts/update-player-scores.js', { stdio: 'inherit' });
      console.log('✅ Successfully updated player scores and team chemistry');
    } catch (execError) {
      console.error('❌ Error running update-player-scores.js:', execError);
    }
    
  } catch (error) {
    console.error('❌ Error creating team_chemistry table:', error);
  }
}

// Run the check
checkTable();
