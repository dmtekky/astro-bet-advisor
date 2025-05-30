import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Send notification to Discord
async function sendDiscordNotification(message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('DISCORD_WEBHOOK_URL not set, skipping notification');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
        username: 'Discord_Baseball_Update_Daily',
        avatar_url: 'https://your-logo-url.png',
      }),
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}
// Import the update function directly since we can't import from outside the project root in Vercel
// This will be replaced with the actual implementation
const updatePlayerData = async () => {
  try {
    const { execSync } = require('child_process');
    const result = execSync('node scripts/update-player-data.js', { encoding: 'utf-8' });
    console.log(result);
    return { success: true, updatedCount: 1 };
  } catch (error) {
    console.error('Error running update-player-data.js:', error);
    return { success: false, error: error.message };
  }
};

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const cronSecret = process.env.CRON_SECRET;

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = 'Missing Supabase environment variables';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

if (!cronSecret) {
  const errorMsg = 'Missing CRON_SECRET environment variable';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Calculate impact score based on player stats
function calculateImpactScore(player: any): number {
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
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Calculate astro influence score
function calculateAstroInfluenceScore(player: any): number {
  if (!player) return 0;
  
  // Base score from player stats
  let score = 0;
  
  // Batting stats (different weights for astro influence)
  if (player.stats_batting_hits) score += player.stats_batting_hits * 0.4;
  if (player.stats_batting_runs) score += player.stats_batting_runs * 0.6;
  if (player.stats_batting_homeruns) score += player.stats_batting_homeruns * 2.0;
  
  // Recent performance boost (based on games played)
  const recentGames = player.stats_games_played || 0;
  if (recentGames > 0) {
    score *= (1 + Math.min(recentGames / 20, 0.5));
  }
  
  // Random factor to simulate astrological influence (0.8 to 1.2)
  const randomFactor = 0.8 + Math.random() * 0.4;
  score *= randomFactor;
  
  // Normalize to 0-100 range with 2 decimal places
  score = Math.min(100, Math.max(0, score));
  return parseFloat(score.toFixed(2));
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for secret token in query parameter
  const { token } = req.query;
  
  if (token !== cronSecret) {
    console.error('Unauthorized request: Invalid or missing token');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing token' 
    });
  }

  try {
    // Step 1: Update player data from the external API
    console.log('Step 1: Updating player data from external API...');
    await sendDiscordNotification('🔄 Starting player data update...');
    
    const updateResult = await updatePlayerData();
    
    if (!updateResult.success) {
      const errorMsg = `❌ Failed to update player data: ${updateResult.error}`;
      await sendDiscordNotification(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`✅ Successfully updated ${updateResult.updatedCount} player records`);
    
    // Step 2: Calculate and update scores
    console.log('\nStep 2: Calculating and updating player scores...');
    await sendDiscordNotification('📊 Calculating player scores...');
    
    // Fetch all players in batches
    let allPlayers = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: players, error } = await supabase
        .from('baseball_players')
        .select('*')
        .order('player_id')
        .range(offset, offset + batchSize - 1);
        
      if (error) throw error;
      
      if (players && players.length > 0) {
        allPlayers = [...allPlayers, ...players];
        offset += batchSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`Processing ${allPlayers.length} players...`);
    
    // Process updates in batches
    const batchSizeProcess = 50;
    let updatedCount = 0;
    
    for (let i = 0; i < allPlayers.length; i += batchSizeProcess) {
      const batch = allPlayers.slice(i, i + batchSizeProcess);
      const updates = [];
      
      // Prepare batch updates
      for (const player of batch) {
        const impactScore = calculateImpactScore(player);
        const astroScore = calculateAstroInfluenceScore(player);
        
        // Only update if scores have changed or are not set
        if (player.impact_score !== impactScore || 
            player.astro_influence_score === null || 
            player.astro_influence_score === undefined) {
              
          updates.push({
            player_id: player.player_id,
            impact_score: impactScore,
            astro_influence_score: astroScore,
            updated_at: new Date().toISOString()
          });
        }
      }
      
      // Process batch updates
      if (updates.length > 0) {
        const { error } = await supabase
          .from('baseball_players')
          .upsert(updates, { onConflict: 'player_id' });
          
        if (error) {
          console.error('Error updating batch:', error);
        } else {
          updatedCount += updates.length;
          console.log(`Updated ${updates.length} players (${updatedCount} total)`);
        }
      }
    }
    
    const result = {
      success: true,
      playersProcessed: allPlayers.length,
      playersUpdated: updatedCount,
      timestamp: new Date().toISOString()
    };

    // Send success notification
    const successMsg = `✅ Player data update completed!\n` +
                     `• Players processed: ${result.playersProcessed}\n` +
                     `• Players updated: ${result.playersUpdated}`;
    await sendDiscordNotification(successMsg);

    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error updating scores:', error);
    const errorMsg = `❌ Error updating scores: ${error.message || 'Unknown error'}`;
    await sendDiscordNotification(errorMsg);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}
