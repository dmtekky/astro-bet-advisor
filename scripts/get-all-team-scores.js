import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key is not defined. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllTeamScores() {
  console.log('\nFetching all team chemistry scores...');

  try {
    const { data: chemistryData, error } = await supabase
      .from('team_chemistry') // Query the correct table
      .select(`
        score, 
        teams ( name, abbreviation ) 
      `)
      .order('score', { ascending: false }); // Order by the correct score column

    if (error) {
      console.error('Error fetching team scores:', error.message);
      return;
    }

    if (error) {
      console.error('Error fetching team scores:', error.message);
      // Log the full error object if it might contain more details
      if (error.details) console.error('Details:', error.details);
      if (error.hint) console.error('Hint:', error.hint);
      return;
    }

    if (!chemistryData || chemistryData.length === 0) {
      console.log('No team chemistry data found.');
      return;
    }

    console.log('\n--- All Team Chemistry Scores (Sorted) ---');
    chemistryData.forEach(item => {
      const score = item.score !== null && item.score !== undefined ? item.score : 'N/A';
      const teamName = item.teams ? item.teams.name : 'Unknown Team';
      const teamAbbr = item.teams ? item.teams.abbreviation : 'N/A';
      console.log(`${teamName} (${teamAbbr}): ${score}/100`);
    });
    console.log(`\nTotal teams processed: ${chemistryData.length}`);

  } catch (err) {
    console.error('An unexpected error occurred:', err.message);
  }
}

(async () => {
  await getAllTeamScores();
})();
