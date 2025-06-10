const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugPlayerMapping() {
  try {
    console.log('Debugging player ID mapping between tables...\n');
    
    // 1. Check the structure of nba_players
    console.log('1. Checking nba_players table structure...');
    const { data: playerColumns, error: playerColError } = await supabase
      .from('nba_players')
      .select('*')
      .limit(1)
      .single();
      
    if (playerColError) throw playerColError;
    console.log('nba_players columns:', Object.keys(playerColumns));
    
    // 2. Check the structure of nba_player_season_stats_2025
    console.log('\n2. Checking nba_player_season_stats_2025 table structure...');
    const { data: statsColumns, error: statsColError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('*')
      .limit(1)
      .single();
      
    if (statsColError && statsColError.code !== 'PGRST116') {
      console.warn('Error checking stats table structure:', statsColError.message);
    } else if (statsColumns) {
      console.log('nba_player_season_stats_2025 columns:', Object.keys(statsColumns));
    } else {
      console.log('nba_player_season_stats_2025 is empty or not accessible');
    }
    
    // 3. Get sample of players with their external IDs
    console.log('\n3. Checking sample player mappings...');
    const { data: samplePlayers, error: sampleError } = await supabase
      .from('nba_players')
      .select('id, external_player_id, first_name, last_name')
      .not('external_player_id', 'is', null)
      .limit(5);
      
    if (sampleError) throw sampleError;
    
    console.log('\nSample Players with External IDs:');
    console.table(samplePlayers);
    
    // 4. Try to find these players in the stats table
    if (samplePlayers && samplePlayers.length > 0) {
      console.log('\n4. Looking up these players in nba_player_season_stats_2025...');
      
      for (const player of samplePlayers) {
        const { data: stats, error: lookupError } = await supabase
          .from('nba_player_season_stats_2025')
          .select('*')
          .eq('player_id', player.external_player_id)
          .maybeSingle();
          
        if (lookupError) {
          console.warn(`Error looking up player ${player.id} (${player.external_player_id}):`, lookupError.message);
        } else if (stats) {
          console.log(`✅ Found stats for ${player.first_name} ${player.last_name}:`, 
            `player_id: ${stats.player_id}, astro_influence: ${stats.astro_influence}`);
        } else {
          console.log(`❌ No stats found for ${player.first_name} ${player.last_name} (external_id: ${player.external_player_id})`);
        }
      }
    }
    
    // 5. Check for any existing astro scores in stats table
    console.log('\n5. Checking for existing astro scores in stats table...');
    const { data: existingScores, error: scoresError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('player_id, astro_influence, updated_at')
      .not('astro_influence', 'is', null)
      .limit(5);
      
    if (scoresError) {
      console.warn('Error checking existing scores:', scoresError.message);
    } else if (existingScores && existingScores.length > 0) {
      console.log('Existing astro scores in stats table:');
      console.table(existingScores);
    } else {
      console.log('No astro scores found in stats table');
    }
    
  } catch (error) {
    console.error('Debugging error:', error);
  }
}

debugPlayerMapping();
