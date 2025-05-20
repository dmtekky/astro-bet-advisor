import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlayerStats() {
  try {
    // Fetch the 10 most recently updated players with their stats
    const { data: players, error } = await supabase
      .from('players')
      .select('name, sport, stats, updated_at')
      .not('stats', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching players:', error);
      return;
    }

    if (!players || players.length === 0) {
      console.log('No players with stats found.');
      return;
    }

    console.log('\n=== Player Statistics ===\n');
    
    players.forEach((player, index) => {
      console.log(`\n${index + 1}. ${player.name} (${player.sport})`);
      console.log('Updated at:', player.updated_at);
      console.log('Stats:', JSON.stringify(player.stats, null, 2));
      console.log('---');
    });
    
    console.log('\n=== End of Results ===\n');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkPlayerStats();
