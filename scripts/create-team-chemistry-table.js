#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTeamChemistryTable() {
  console.log('Creating team_chemistry table...');
  
  try {
    // Execute raw SQL to create the table
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.team_chemistry (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
          overall_score NUMERIC(5,2) NOT NULL,
          elemental_balance JSONB NOT NULL,
          aspect_harmony JSONB NOT NULL,
          calculated_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(team_id)
        );
      `
    });
    
    if (error) {
      console.error('❌ Error creating team_chemistry table:', error);
      
      // Try with direct SQL query if RPC approach fails
      console.log('Trying alternative approach...');
      const { error: sqlError } = await supabase.from('_exec_sql').select('*').eq('query', `
        CREATE TABLE IF NOT EXISTS public.team_chemistry (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
          overall_score NUMERIC(5,2) NOT NULL,
          elemental_balance JSONB NOT NULL,
          aspect_harmony JSONB NOT NULL,
          calculated_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(team_id)
        );
      `);
      
      if (sqlError) {
        console.error('❌ Alternative approach failed:', sqlError);
        return false;
      }
    }
    
    console.log('✅ Team chemistry table created or already exists');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

createTeamChemistryTable()
  .then(success => {
    console.log(success ? '✅ Table creation successful' : '❌ Table creation failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
