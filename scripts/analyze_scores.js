import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY,
  { auth: { persistSession: false } }
);

async function analyzeScores() {
  try {
    // Fetch all players with their scores
    const { data: players, error } = await supabase
      .from('nba_player_season_stats_2025')
      .select('player_name, games_played, impact_score')
      .order('impact_score', { ascending: false });
    
    if (error) throw error;
    
    // Calculate distribution
    const distribution = {
      '100': 0,
      '90-99': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '50-59': 0,
      '0-49': 0
    };
    
    let totalScore = 0;
    let count = 0;
    
    // Calculate stats
    players.forEach(player => {
      const score = player.impact_score;
      totalScore += score;
      count++;
      
      if (score === 100) distribution['100']++;
      else if (score >= 90) distribution['90-99']++;
      else if (score >= 80) distribution['80-89']++;
      else if (score >= 70) distribution['70-79']++;
      else if (score >= 60) distribution['60-69']++;
      else if (score >= 50) distribution['50-59']++;
      else distribution['0-49']++;
    });
    
    const averageScore = Math.round((totalScore / count) * 100) / 100;
    
    // Display results
    console.log('\n=== Score Distribution ===');
    Object.entries(distribution).forEach(([range, count]) => {
      const percentage = ((count / players.length) * 100).toFixed(1);
      console.log(`${range.padStart(5)}: ${count.toString().padStart(3)} players (${percentage}%)`);
    });
    
    console.log(`\nAverage Score: ${averageScore}`);
    
    // Show top 10 players
    console.log('\n=== Top 10 Players ===');
    players.slice(0, 10).forEach((player, index) => {
      console.log(`${index + 1}. ${player.player_name.padEnd(20)}: ${player.impact_score} (${player.games_played} games)`);
    });
    
    // Show bottom 10 players
    console.log('\n=== Bottom 10 Players ===');
    players.slice(-10).forEach((player, index) => {
      console.log(`${players.length - 9 + index}. ${player.player_name.padEnd(20)}: ${player.impact_score} (${player.games_played} games)`);
    });
    
  } catch (error) {
    console.error('Error analyzing scores:', error);
  }
}

analyzeScores().then(() => process.exit(0));
