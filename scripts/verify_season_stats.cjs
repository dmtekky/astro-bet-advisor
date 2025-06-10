const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifySeasonStats() {
  try {
    console.log('Verifying season stats updates...\n');
    
    // 1. Get a sample of recently updated players
    console.log('1. Getting recently updated players...');
    const { data: recentPlayers, error: playersError } = await supabase
      .from('nba_players')
      .select('id, external_player_id, first_name, last_name, astro_influence, updated_at')
      .not('astro_influence', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (playersError) throw playersError;
    
    console.log('\nRecently updated players:');
    console.table(recentPlayers.map(p => ({
      'ID': p.id,
      'External ID': p.external_player_id,
      'Name': `${p.first_name} ${p.last_name}`,
      'Astro Score': p.astro_influence?.toFixed(2),
      'Last Updated': new Date(p.updated_at).toLocaleString()
    })));

    // 2. Check their presence in season stats
    console.log('\n2. Checking season stats for these players...');
    for (const player of recentPlayers) {
      console.log(`\nChecking player: ${player.first_name} ${player.last_name} (ID: ${player.id})`);
      
      // Try to find in season stats using both ID fields
      const { data: stats, error: statsError } = await supabase
        .from('nba_player_season_stats_2025')
        .select('*')
        .or(`msf_player_id.eq.${player.external_player_id},player_id.eq.${player.external_player_id}`)
        .maybeSingle();
      
      if (statsError) {
        console.warn('  Error:', statsError.message);
      } else if (stats) {
        console.log('  Found in season stats:');
        console.log('  - Player ID:', stats.player_id);
        console.log('  - MSF Player ID:', stats.msf_player_id);
        console.log('  - Astro Influence:', stats.astro_influence);
        console.log('  - Last Updated:', stats.updated_at);
      } else {
        console.log('  Not found in season stats');
      }
    }

    // 3. Check for any successful updates in season stats
    console.log('\n3. Checking for any successful updates in season stats...');
    const { data: updatedStats, error: updatedStatsError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('player_id, msf_player_id, player_name, astro_influence, updated_at')
      .not('astro_influence', 'is', null)
      .not('astro_influence', 'eq', 50) // Filter out default 50s
      .order('updated_at', { ascending: false })
      .limit(5);

    if (updatedStatsError) throw updatedStatsError;
    
    if (updatedStats && updatedStats.length > 0) {
      console.log('\nSuccessfully updated season stats:');
      console.table(updatedStats.map(s => ({
        'Player': s.player_name,
        'Player ID': s.player_id,
        'MSF ID': s.msf_player_id,
        'Astro Score': s.astro_influence?.toFixed(2),
        'Updated': new Date(s.updated_at).toLocaleString()
      })));
    } else {
      console.log('\nNo non-default astro scores found in season stats');
    }

  } catch (error) {
    console.error('Verification error:', error);
  }
}

verifySeasonStats();
