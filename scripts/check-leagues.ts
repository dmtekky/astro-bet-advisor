import { supabase } from '../src/lib/supabase.js'; // Added .js extension for ESM

async function checkLeagues() {
  try {
    console.log('Fetching leagues from the database...');
    
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select('id, name, key')
      .order('name');

    if (error) {
      console.error('Error fetching leagues:', error);
      return;
    }

    if (!leagues || leagues.length === 0) {
      console.log('No leagues found in the database.');
      return;
    }

    console.log('\nLeagues in database:');
    console.log('--------------------');
    console.log('ID'.padEnd(38), 'KEY'.padEnd(10), 'NAME');
    console.log('-'.repeat(80));
    
    leagues.forEach(league => {
      console.log(
        league.id.padEnd(38),
        (league.key || '').padEnd(10),
        league.name
      );
    });

    // Check against the current LEAGUE_ID_MAP
    console.log('\nCurrent LEAGUE_ID_MAP in LeaguePage.tsx:');
    console.log('--------------------------------------');
    console.log('MLB:', 'c4a0ea71-1ed0-4bc6-bd4c-26638950bcf5');
    console.log('NBA:', '0a42c07c-9e98-4f7f-8bbd-c2e28a132b9f');
    console.log('NFL:', '3c8666ed-434b-4c76-8265-7a644f6201f3');
    console.log('NHL:', '67e6f363-5c65-421e-9163-13dc2d3f8bee');

  } catch (err) {
    console.error('Unexpected error:', err);
  } finally {
    // Close the Supabase connection
    process.exit(0);
  }
}

checkLeagues();
