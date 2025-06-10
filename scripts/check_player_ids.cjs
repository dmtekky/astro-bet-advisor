const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPlayerIds() {
  try {
    console.log('Checking player ID mapping...\n');
    
    // 1. Check total players and how many have external IDs
    const { count: totalPlayers } = await supabase
      .from('nba_players')
      .select('*', { count: 'exact', head: true });
      
    const { count: withExternalId } = await supabase
      .from('nba_players')
      .select('*', { count: 'exact', head: true })
      .not('external_player_id', 'is', null);
      
    console.log(`Total players: ${totalPlayers}`);
    console.log(`Players with external_id: ${withExternalId} (${(withExternalId/totalPlayers*100).toFixed(1)}%)`);
    console.log(`Players without external_id: ${totalPlayers - withExternalId} (${((totalPlayers-withExternalId)/totalPlayers*100).toFixed(1)}%)`);
    
    // 2. Look at some sample players with and without external_ids
    console.log('\nSample players with external_ids:');
    const { data: withIds } = await supabase
      .from('nba_players')
      .select('id, external_player_id, first_name, last_name')
      .not('external_player_id', 'is', null)
      .limit(5);
    console.table(withIds);
    
    console.log('\nSample players without external_ids:');
    const { data: withoutIds } = await supabase
      .from('nba_players')
      .select('id, external_player_id, first_name, last_name')
      .is('external_player_id', null)
      .limit(5);
    console.table(withoutIds);
    
    // 3. Check if the id field might be the external_id
    console.log('\nChecking if id field matches external_player_id format...');
    const { data: samplePlayers } = await supabase
      .from('nba_players')
      .select('id, external_player_id, first_name, last_name')
      .limit(5);
      
    console.log('Sample player IDs:', samplePlayers.map(p => ({
      id: p.id,
      external_id: p.external_player_id,
      name: `${p.first_name} ${p.last_name}`
    })));
    
  } catch (error) {
    console.error('Error checking player IDs:', error);
  }
}

checkPlayerIds();
