import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure dotenv loads from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Supabase client with environment variables
console.log('Initializing Supabase client...');
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? 'Found' : 'Missing');
console.log('Supabase Key:', process.env.VITE_SUPABASE_KEY ? 'Found' : 'Missing');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_KEY) {
  console.error('❌ Supabase URL or Key is missing. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

async function backfillNbaPlayerScores() {
  console.log('Starting backfill of NBA player scores...');

  try {
    // 1. Fetch all players from nba_players
    console.log('Fetching all players from nba_players...');
    const { data: players, error: playersError } = await supabase
      .from('nba_players')
      .select('id, external_player_id, first_name, last_name')
      .not('external_player_id', 'is', null);

    if (playersError) {
      console.error('❌ Error fetching players from nba_players:', playersError.message);
      return;
    }

    if (!players || players.length === 0) {
      console.log('❌ No players found in nba_players table.');
      return;
    }

    console.log(`✅ Found ${players.length} players in nba_players.`);
    console.log('Sample players:', players.slice(0, 3).map(p => `${p.first_name} ${p.last_name} (ID: ${p.id}, Ext: ${p.external_player_id})`).join(', '));

    // 2. Fetch all relevant stats from nba_player_season_stats_2025
    console.log('\nFetching all stats from nba_player_season_stats_2025...');
    const { data: stats, error: statsError } = await supabase
      .from('nba_player_season_stats_2025')
      .select('msf_player_id, impact_score, astro_influence, player_name')
      .not('msf_player_id', 'is', null);

    if (statsError) {
      console.error('❌ Error fetching stats from nba_player_season_stats_2025:', statsError.message);
      return;
    }

    if (!stats || stats.length === 0) {
      console.log('❌ No stats found in nba_player_season_stats_2025.');
      return;
    }

    console.log(`✅ Found ${stats.length} stat records in nba_player_season_stats_2025.`);
    console.log('Sample stats:', stats.slice(0, 3));

    // Create a map of msf_player_id to scores for efficient lookup
    const statsMap = new Map();
    
    stats.forEach(stat => {
      if (stat.msf_player_id) {
        statsMap.set(stat.msf_player_id.toString(), {
          impact_score: stat.impact_score,
          astro_influence: stat.astro_influence
        });
      }
    });

    console.log(`\nSample player stats from nba_player_season_stats_2025:`, 
      stats.slice(0, 3).map(s => ({
        name: s.player_name,
        msf_id: s.msf_player_id,
        impact: s.impact_score,
        astro: s.astro_influence
      }))
    );
    
    console.log(`First few external_player_ids from nba_players:`, 
      players.slice(0, 3).map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        ext_id: p.external_player_id
      }))
    );

    // 3. Update nba_players with the fetched scores
    let updatedCount = 0;
    let notFoundCount = 0;

    console.log('\nUpdating nba_players table with scores...');
    for (const player of players) {
      if (!player.external_player_id) {
        console.warn(`Player with internal ID ${player.id} has no external_player_id. Skipping.`);
        continue;
      }
      
      // Use msf_player_id to match with external_player_id
      const playerStats = statsMap.get(player.external_player_id.toString());

      if (playerStats) {
        try {
          const { error: updateError } = await supabase
            .from('nba_players')
            .update({
              impact_score: playerStats.impact_score,
              astro_influence: playerStats.astro_influence,
              updated_at: new Date().toISOString()
            })
            .eq('id', player.id);

          if (updateError) {
            console.error(`❌ Error updating player ${player.external_player_id} (${player.first_name} ${player.last_name}):`, updateError.message);
          } else {
            updatedCount++;
            if (updatedCount % 10 === 0) {
              console.log(`Updated ${updatedCount} players...`);
            }
          }
        } catch (updateError) {
          console.error(`❌ Error updating player ${player.external_player_id} (${player.first_name} ${player.last_name}):`, updateError.message);
        }
      } else {
        notFoundCount++;
        if (notFoundCount <= 5) { // Only log first few not found for brevity
          console.log(`ℹ️  No stats found for ${player.first_name} ${player.last_name} (ID: ${player.id}, Ext: ${player.external_player_id})`);
        } else if (notFoundCount === 6) {
          console.log('... and more players without stats (not showing all to avoid log spam)');
        }
      }
    }

    console.log('----------------------------------------');
    console.log('Backfill process completed.');
    console.log(`${updatedCount} players updated with scores.`);
    console.log(`${notFoundCount} players had no matching stats in nba_player_season_stats_2025 (scores remain null).`);
    console.log('----------------------------------------');

  } catch (error) {
    console.error('An unexpected error occurred during the backfill process:', error.message);
  }
}

backfillNbaPlayerScores();
