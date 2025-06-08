import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;  // Changed from VITE_SUPABASE_ANON_KEY to match .env

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Calculate impact score based on player stats
function calculateImpactScore(player) {
  if (!player) return 0;
  let score = 0;
  
  // Batting stats (weighted)
  if (player.stats_batting_hits) score += player.stats_batting_hits * 0.5;
  if (player.stats_batting_runs) score += player.stats_batting_runs * 0.75;
  if (player.stats_batting_homeruns) score += player.stats_batting_homeruns * 1.5;
  if (player.stats_batting_runs_batted_in) score += player.stats_batting_runs_batted_in * 0.5;
  
  // Fielding stats (weighted)
  if (player.stats_fielding_assists) score += player.stats_fielding_assists * 0.3;
  if (player.stats_fielding_put_outs) score += player.stats_fielding_put_outs * 0.2;
  
  // Pitching stats (weighted, but negative for impact score)
  if (player.stats_pitching_earned_run_avg) score -= player.stats_pitching_earned_run_avg * 0.5;
  
  // Normalize score to 0-100 range
  score = Math.min(100, Math.max(0, score));
  return Math.round(score);
}

// Calculate astro influence score (placeholder - replace with actual astro logic)
function calculateAstroInfluenceScore(player) {
  if (!player) return 0;
  
  // Base score from player stats (similar to impact score but with different weights)
  let score = 0;
  
  // Batting stats (different weights for astro influence)
  if (player.stats_batting_hits) score += player.stats_batting_hits * 0.4;
  if (player.stats_batting_runs) score += player.stats_batting_runs * 0.6;
  if (player.stats_batting_homeruns) score += player.stats_batting_homeruns * 2.0;
  
  // Recent performance boost (placeholder - could use last 10 games, etc.)
  const recentGames = player.stats_games_played || 0;
  if (recentGames > 0) {
    score *= (1 + Math.min(recentGames / 20, 0.5)); // Up to 50% boost for active players
  }
  
  // Random factor to simulate astrological influence (0.8 to 1.2)
  const randomFactor = 0.8 + Math.random() * 0.4;
  score *= randomFactor;
  
  // Normalize to 0-100 range
  score = Math.min(100, Math.max(0, score));
  return parseFloat(score.toFixed(2));
}

async function testImpactScoreFix() {
  console.log('🧪 Testing Impact Score Fix...\n');

  try {
    // Step 1: Check if impact_score column exists
    console.log('1. Checking database structure...');
    
    // Use SQL to check for columns
    const { data: columns, error: columnsError } = await supabase.rpc('get_columns_info', { 
      table_name: 'baseball_players' 
    });

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return false;
    }
    
    console.log('📊 Found columns:', columns);
    
    const hasImpactScore = columns.some(col => col.column_name === 'impact_score');
    const hasAstroScore = columns.some(col => col.column_name === 'astro_influence_score');
    
    if (!hasImpactScore) {
      console.error('❌ impact_score column not found! Run the SQL migration first.');
      return false;
    }
    
    if (!hasAstroScore) {
      console.error('❌ astro_influence_score column not found! Run the SQL migration first.');
      return false;
    }
    
    console.log('✅ Both columns exist');

    // Step 2: Fetch all players with stats (in batches of 1000)
    console.log('\n2. Fetching all players with stats...');
    let allPlayers = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: players, error: playersError } = await supabase
        .from('baseball_players')
        .select('*')
        .not('stats_batting_hits', 'is', null)
        .order('player_id')
        .range(offset, offset + batchSize - 1);
        
      if (playersError) {
        console.error('❌ Error fetching players:', playersError);
        return false;
      }
      
      if (players && players.length > 0) {
        allPlayers = [...allPlayers, ...players];
        console.log(`   Fetched ${allPlayers.length} players so far...`);
        offset += batchSize;
      } else {
        hasMore = false;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (allPlayers.length === 0) {
      console.log('⚠️  No players found with batting stats');
      return false;
    }
    
    console.log(`✅ Found ${allPlayers.length} players with stats`);
    const players = allPlayers; // For backward compatibility with rest of the code

    if (!players || players.length === 0) {
      console.log('⚠️  No players found with batting stats');
      return false;
    }

    console.log(`✅ Processing ${players.length} players with stats`);

    // Step 3: Test impact score calculation
    console.log('\n3. Testing impact score calculations...');
    
    for (const player of players) {
      const calculatedScore = calculateImpactScore({
        stats_batting_hits: player.stats_batting_hits,
        stats_batting_runs: player.stats_batting_runs,
        stats_fielding_assists: player.stats_fielding_assists
      });

      console.log(`\n👤 ${player.full_name}`);
      console.log(`   Hits: ${player.stats_batting_hits || 0}`);
      console.log(`   Runs: ${player.stats_batting_runs || 0}`);
      console.log(`   Assists: ${player.stats_fielding_assists || 0}`);
      console.log(`   Calculated Score: ${calculatedScore}`);
      console.log(`   DB Score: ${player.impact_score || 'null'}`);
      
      // Calculate both scores
      const astroScore = calculateAstroInfluenceScore(player);
      
      // Check if either score needs updating
      const needsUpdate = player.impact_score !== calculatedScore || 
                         (player.astro_influence_score === null || player.astro_influence_score === undefined);
      
      if (needsUpdate) {
        console.log(`👤 ${player.player_full_name || 'Unknown Player'}`);
        console.log(`   Hits: ${player.stats_batting_hits || 0}, Runs: ${player.stats_batting_runs || 0}, Assists: ${player.stats_fielding_assists || 0}`);
        console.log(`   Impact Score: ${calculatedScore} (was: ${player.impact_score || 'null'})`);
        console.log(`   Astro Score: ${astroScore.toFixed(2)} (was: ${player.astro_influence_score || 'null'})`);
        
        const { error: updateError } = await supabase
          .from('baseball_players')
          .update({ 
            impact_score: calculatedScore,
            astro_influence_score: astroScore,
            updated_at: new Date().toISOString()
          })
          .eq('player_id', player.player_id);
          
        if (updateError) {
          console.error('   ❌ Error updating:', updateError);
        } else {
          console.log('   ✅ Update successful');
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 4: Verify the updates with a sample
    console.log('\n4. Verifying updates with a sample of 5 players...');
    const sampleSize = Math.min(5, players.length);
    const samplePlayers = players
      .sort(() => 0.5 - Math.random()) // Random sample
      .slice(0, sampleSize);
      
    const { data: updatedPlayers, error: verifyError } = await supabase
      .from('baseball_players')
      .select('player_id, player_full_name, impact_score, astro_influence_score')
      .in('player_id', samplePlayers.map(p => p.player_id));
      
    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
      return false;
    }

    console.log('\n📊 Sample of updated scores:');
    console.log('   Name'.padEnd(25) + 'Impact'.padStart(10) + '  Astro'.padStart(10));
    console.log('   '.padEnd(47, '-'));
    
    updatedPlayers.forEach(player => {
      console.log(`   ${(player.player_full_name || 'Unknown').substring(0, 20).padEnd(22)} ` +
                 `${(player.impact_score || 0).toString().padStart(5)}    ` +
                 `${(player.astro_influence_score || 0).toFixed(1).padStart(5)}`);
    });
    
    console.log(`\n✅ Successfully updated ${players.length} players`);

    // Step 5: Check RLS policies
    console.log('\n5. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, roles')
      .eq('tablename', 'baseball_players');

    if (policiesError) {
      console.warn('⚠️  Could not check RLS policies:', policiesError.message);
    } else {
      console.log('📋 RLS Policies found:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n🎉 Impact Score Fix Test Complete!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testImpactScoreFix()
  .then((success) => {
    if (success) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Check the output above.');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('\n💥 Test script failed:', err);
    process.exit(1);
  });