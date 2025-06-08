import { createClient } from '@supabase/supabase-js';
import { calculateAstroInfluenceScore } from './src/lib/standardAstroScore.ts';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAstroScores() {
  try {
    console.log('Fetching players from baseball_players table...');
    
    // Fetch players with birth dates
    const { data: players, error } = await supabase
      .from('baseball_players')
      .select('*')
      .not('birth_date', 'is', null)
      .limit(5); // Test with 5 players first

    if (error) throw error;
    if (!players || players.length === 0) {
      console.error('No players found with birth dates');
      return;
    }

    console.log(`\nCalculating astro scores for ${players.length} players...\n`);
    
    // Calculate scores for each player
    for (const player of players) {
      try {
        const score = await calculateAstroInfluenceScore(player);
        console.log(`Player: ${player.name_first} ${player.name_last || ''}`.trim());
        console.log(`  - Birth Date: ${player.birth_date}`);
        console.log(`  - Position: ${player.position || 'N/A'}`);
        console.log(`  - Astro Score: ${score.toFixed(2)}/100\n`);
      } catch (playerError) {
        console.error(`Error calculating score for player ${player.id}:`, playerError);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('Test completed');
  }
}

// Run the test
testAstroScores();
