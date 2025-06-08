// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// Function to list players with pagination
async function listPlayers(limit = 5) {
  try {
    console.log(`Fetching first ${limit} players...`);
    
    const { data: players, error } = await supabase
      .from('baseball_players')
      .select('player_id, player_first_name, player_last_name, player_birth_date, astro_influence_score')
      .order('player_id', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching players:', error);
      return;
    }

    if (!players || players.length === 0) {
      console.log('No players found in the database.');
      return;
    }

    console.log('\n📊 Players in database:');
    console.log('ID  | First Name      | Last Name       | Birth Date  | Astro Score');
    console.log('----|-----------------|-----------------|-------------|------------');
    
    players.forEach(player => {
      console.log(
        `${String(player.player_id).padEnd(3)} | ${player.player_first_name.padEnd(15)} | ${player.player_last_name.padEnd(15)} | ${player.player_birth_date} | ${player.astro_influence_score || 'N/A'}`
      );
    });
    
  } catch (error) {
    console.error('❌ Error listing players:', error);
  }
}

// Run the function
listPlayers(10);
