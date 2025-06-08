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

async function checkTeamsTable() {
  try {
    console.log('Checking teams table...');
    
    // Try to get the first row from teams table
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching from teams table:', error);
      return;
    }

    if (teams && teams.length > 0) {
      console.log('Sample team row:');
      console.log(JSON.stringify(teams[0], null, 2));
    } else {
      console.log('No teams found in the database');
    }

    // Try to get table structure by attempting to insert a test row
    console.log('\nTesting table structure...');
    const testTeam = {
      name: 'Test Team ' + Date.now(),
      sport: 'basketball',
      league: 'NBA',
      abbreviation: 'TTT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertedTeam, error: insertError } = await supabase
      .from('teams')
      .insert([testTeam])
      .select();

    if (insertError) {
      console.error('Error inserting test team:', insertError);
    } else {
      console.log('Successfully inserted test team:', insertedTeam);
      
      // Clean up
      if (insertedTeam && insertedTeam[0]?.id) {
        await supabase
          .from('teams')
          .delete()
          .eq('id', insertedTeam[0].id);
      }
    }

  } catch (error) {
    console.error('Error checking teams table:', error);
  } finally {
    process.exit(0);
  }
}

checkTeamsTable();
