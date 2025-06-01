import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyChemistryTable() {
  console.log('🔍 Verifying team_chemistry table...');
  
  try {
    // Check if the table exists by trying to query it
    const { data, error } = await supabase
      .from('team_chemistry')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log('❌ team_chemistry table does not exist');
        await createChemistryTable();
        return;
      }
      throw error;
    }
    
    console.log(`✅ team_chemistry table exists with ${data?.length || 0} records`);
    
    // Get record count
    const { count, error: countError } = await supabase
      .from('team_chemistry')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting records:', countError);
    } else {
      console.log(`📊 Total records: ${count}`);
      
      // Get sample data
      const { data: sampleData, error: sampleError } = await supabase
        .from('team_chemistry')
        .select('*')
        .limit(3);
      
      if (sampleError) {
        console.error('❌ Error fetching sample data:', sampleError);
      } else if (sampleData && sampleData.length > 0) {
        console.log('\nSample team chemistry data:');
        sampleData.forEach((row, index) => {
          console.log(`\n--- Team ${index + 1} ---`);
          console.log(`Team: ${row.team_name} (${row.team_abbreviation})`);
          console.log(`Score: ${row.score || row.overall_score}`);
          console.log('Elements:', JSON.stringify(row.elements, null, 2));
          console.log('Aspects:', JSON.stringify(row.aspects, null, 2));
          console.log(`Last Updated: ${row.updated_at || row.calculated_at}`);
        });
      } else {
        console.log('ℹ️ No team chemistry data found in the table');
      }
    }
    
  } catch (error) {
    console.error('❌ Error verifying team_chemistry table:', error);
  }
}

async function createChemistryTable() {
  console.log('🔄 Creating team_chemistry table...');
  
  try {
    // Create the table using SQL
    const { data, error } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.team_chemistry (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          team_id TEXT,
          team_name TEXT,
          team_abbreviation TEXT,
          score DECIMAL(5,2) NOT NULL,
          elements JSONB NOT NULL,
          aspects JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          last_updated TIMESTAMPTZ,
          calculated_at TIMESTAMPTZ
        );
        
        COMMENT ON TABLE public.team_chemistry IS 'Team chemistry scores and elemental analysis';
        
        -- Enable RLS
        ALTER TABLE public.team_chemistry ENABLE ROW LEVEL SECURITY;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_team_chemistry_team_id ON public.team_chemistry(team_id);
        CREATE INDEX IF NOT EXISTS idx_team_chemistry_abbreviation ON public.team_chemistry(team_abbreviation);
        
        -- Create a trigger to update the updated_at timestamp
        CREATE OR REPLACE FUNCTION update_team_chemistry_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS team_chemistry_updated_at ON public.team_chemistry;
        CREATE TRIGGER team_chemistry_updated_at
        BEFORE UPDATE ON public.team_chemistry
        FOR EACH ROW
        EXECUTE FUNCTION update_team_chemistry_updated_at();
      `
    });
    
    if (error) throw error;
    
    console.log('✅ Successfully created team_chemistry table');
    
    // Check if we need to enable the uuid-ossp extension
    try {
      const { error: extError } = await supabase.rpc('exec', {
        query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
      });
      
      if (extError) {
        console.log('ℹ️ Could not enable uuid-ossp extension. If you see errors about uuid_generate_v4, please enable this extension in your database.');
      }
    } catch (extError) {
      console.log('ℹ️ Could not enable uuid-ossp extension. If you see errors about uuid_generate_v4, please enable this extension in your database.');
    }
    
  } catch (error) {
    console.error('❌ Error creating team_chemistry table:', error);
    console.log('\n💡 You may need to run this SQL in your Supabase SQL editor:');
    console.log(`
      CREATE TABLE IF NOT EXISTS public.team_chemistry (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id TEXT,
        team_name TEXT,
        team_abbreviation TEXT,
        score DECIMAL(5,2) NOT NULL,
        elements JSONB NOT NULL,
        aspects JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_updated TIMESTAMPTZ,
        calculated_at TIMESTAMPTZ
      );
      
      -- Enable RLS
      ALTER TABLE public.team_chemistry ENABLE ROW LEVEL SECURITY;
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_team_chemistry_team_id ON public.team_chemistry(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_chemistry_abbreviation ON public.team_chemistry(team_abbreviation);
      
      -- Create a trigger to update the updated_at timestamp
      CREATE OR REPLACE FUNCTION update_team_chemistry_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS team_chemistry_updated_at ON public.team_chemistry;
      CREATE TRIGGER team_chemistry_updated_at
      BEFORE UPDATE ON public.team_chemistry
      FOR EACH ROW
      EXECUTE FUNCTION update_team_chemistry_updated_at();
      
      -- Enable uuid-ossp extension if not already enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
  }
}

// Run the verification
verifyChemistryTable();
