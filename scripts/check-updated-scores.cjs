const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUpdatedScores() {
  try {
    console.log('Fetching recently updated players with their astro scores...\n');
    
    // Get players with recent updates
    const { data: players, error: playersError } = await supabase
      .from('nba_players')
      .select('id, first_name, last_name, astro_influence, updated_at')
      .not('astro_influence', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (playersError) throw playersError;

    console.log('=== Recently Updated Players ===');
    console.table(players.map(p => ({
      'ID': p.id,
      'Name': `${p.first_name} ${p.last_name}`,
      'Astro Score': p.astro_influence?.toFixed(2),
      'Last Updated': new Date(p.updated_at).toLocaleString()
    })));

    // Get some sample stats
    const { count } = await supabase
      .from('nba_players')
      .select('*', { count: 'exact', head: true })
      .not('astro_influence', 'is', null);

    console.log(`\n✅ Total players with astro scores: ${count}`);

    // Check if stats table has been updated
    console.log('\n=== Checking Player Season Stats ===');
    const { data: stats, error: statsError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('player_id, astro_influence, updated_at')
      .not('astro_influence', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (statsError) console.error('Error fetching stats:', statsError);
    
    if (stats && stats.length > 0) {
      console.log('\nRecently updated player season stats:');
      console.table(stats.map(s => ({
        'Player ID': s.player_id,
        'Astro Score': s.astro_influence?.toFixed(2),
        'Last Updated': new Date(s.updated_at).toLocaleString()
      })));
    } else {
      console.log('No updated player season stats found.');
    }

  } catch (error) {
    console.error('Error checking updated scores:', error);
  }
}

checkUpdatedScores();
