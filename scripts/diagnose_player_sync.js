import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables');
  console.error('Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePlayerSync() {
  console.log('Starting player sync diagnosis...\n');
  
  // 1. Check nba_players table
  console.log('=== Checking nba_players table ===');
  const { data: players, error: playersError } = await supabase
    .from('nba_players')
    .select('id, first_name, last_name, birth_date, birth_country, birth_state, birth_city, external_player_id, team_id, astro_influence')
    .not('birth_date', 'is', null)
    .not('external_player_id', 'is', null)
    .limit(5);

  if (playersError) {
    console.error('Error fetching players:', playersError);
    return;
  }
  console.log(`Found ${players.length} players with birth dates`);
  console.log('Sample players:', JSON.stringify(players, null, 2));

  // 2. Check nba_player_season_stats_2025 table
  console.log('\n=== Checking nba_player_season_stats_2025 table ===');
  const { data: stats, error: statsError } = await supabase
    .from('nba_player_season_stats_2025')
    .select('*')
    .limit(5);

  if (statsError) {
    console.error('Error fetching stats:', statsError);
    return;
  }
  console.log(`Found ${stats.length} player stats`);
  
  if (stats.length > 0) {
    console.log('Available columns in stats:', Object.keys(stats[0]));
    console.log('Sample stat with msf_player_id:', stats[0].msf_player_id);
  }

  // 3. Check for matching players
  if (players.length > 0 && stats.length > 0) {
    console.log('\n=== Checking for matching players ===');
    const playerIds = players.map(p => p.external_player_id);
    const statPlayerIds = stats.map(s => s.msf_player_id);
    
    console.log(`Player IDs in nba_players: ${playerIds.length > 0 ? playerIds.join(', ') : 'None'}`);
    console.log(`Player IDs in stats: ${statPlayerIds.length > 0 ? statPlayerIds.join(', ') : 'None'}`);
    
    const matchingIds = playerIds.filter(id => statPlayerIds.includes(id));
    console.log(`\nFound ${matchingIds.length} matching player IDs between tables`);
    
    if (matchingIds.length > 0) {
      console.log('First 5 matching IDs:', matchingIds.slice(0, 5));
      
      // Show sample matching data
      const samplePlayerId = matchingIds[0];
      const player = players.find(p => p.external_player_id === samplePlayerId);
      const stat = stats.find(s => s.msf_player_id === samplePlayerId);
      
      console.log('\nSample matching player data:');
      console.log('Player:', player);
      console.log('Stats:', stat);
    }
  }

  // 4. Check current astro scores
  console.log('\n=== Checking current astro scores ===');
  const { data: astroScores, error: astroError } = await supabase
    .from('nba_players')
    .select('id, first_name, last_name, astro_influence')
    .not('astro_influence', 'is', null)
    .limit(5);

  if (astroError) {
    console.error('Error fetching astro scores:', astroError);
  } else {
    console.log(`Found ${astroScores.length} players with astro scores`);
    if (astroScores.length > 0) {
      console.log('Sample astro scores:', JSON.stringify(astroScores, null, 2));
    }
  }
}

diagnosePlayerSync().catch(console.error);
