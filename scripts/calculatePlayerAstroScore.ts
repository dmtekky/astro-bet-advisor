import { createClient } from '@supabase/supabase-js';
import { generatePlayerAstroData } from '../src/lib/playerAstroService';
import dotenv from 'dotenv';

// Load environment variables from .env.temp file
dotenv.config({ path: '.env.temp' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in your .env file');
  console.error('Example:');
  console.error('VITE_SUPABASE_URL=your_supabase_url_here');
  console.error('VITE_SUPABASE_KEY=your_supabase_key_here');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the BaseballPlayer interface based on the database schema
interface BaseballPlayer {
  player_id: string;
  player_first_name: string;
  player_last_name: string;
  player_birth_date: string;
  player_birth_city: string | null;
  player_birth_country: string | null;
  // Add other fields as needed
  [key: string]: any; // Allow additional fields
}

/**
 * Fetches a player by their player_id from the baseball_players table.
 * @param playerId - The player_id to search for.
 * @returns BaseballPlayer object or null if not found or error.
 */
async function getPlayerById(playerId: string): Promise<BaseballPlayer | null> {
  console.log(`Fetching player with ID: ${playerId}`);
  
  const { data: playerData, error } = await supabase
    .from('baseball_players')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (error || !playerData) {
    console.error(`Error fetching player with ID ${playerId}:`, error?.message || 'Player not found');
    return null;
  }

  return playerData as BaseballPlayer;
}

/**
 * Calculates astrological influence score based on player's birth data.
 * @param player - The player object containing birth date and location.
 * @returns A number between 0 and 100 representing the astrological influence score.
 */
function calculateAstroInfluenceScore(player: BaseballPlayer): number {
  if (!player.player_birth_date) {
    console.error('Player is missing birth date');
    return 0;
  }

  try {
    // Generate astrological data for the player
    const astroData = generatePlayerAstroData(
      player.player_birth_date,
      {
        city: player.player_birth_city || undefined,
        country: player.player_birth_country || undefined
      }
    );

    // Calculate score based on astrological factors
    // This is a simple example - you can adjust the weights as needed
    let score = 0;

    // 1. Elemental Balance (40% weight)
    const elementalScore = (
      astroData.elements.fire.percentage * 0.25 +
      astroData.elements.earth.percentage * 0.25 +
      astroData.elements.air.percentage * 0.25 +
      astroData.elements.water.percentage * 0.25
    ) * 0.4;

    // 2. Modal Balance (30% weight)
    const modalScore = (
      astroData.modalities.cardinal.percentage * 0.33 +
      astroData.modalities.fixed.percentage * 0.33 +
      astroData.modalities.mutable.percentage * 0.34
    ) * 0.3;

    // 3. Dominant Planets (20% weight)
    const dominantPlanetScore = (astroData.dominantPlanets.length / 10) * 0.2;

    // 4. Moon Phase (10% weight)
    const moonPhaseScore = astroData.moonPhase.illumination * 0.1;

    // Sum all components
    score = (elementalScore + modalScore + dominantPlanetScore + moonPhaseScore) * 100;

    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, parseFloat(score.toFixed(2))));
  } catch (error) {
    console.error('Error calculating astrological score:', error);
    return 0;
  }
}

// Function to log the structure of the first player for debugging
async function logFirstPlayerStructure() {
  console.log('Fetching first player to check structure...');
  
  const { data: players, error } = await supabase
    .from('baseball_players')
    .select('*')
    .limit(1);
    
  if (error || !players || players.length === 0) {
    console.error('Error fetching players:', error?.message || 'No players found');
    return;
  }
  
  console.log('First player structure:', JSON.stringify(players[0], null, 2));
  console.log('Available fields:', Object.keys(players[0]).join(', '));
}

// Main function to run the script
async function main() {
  // First, log the structure of the first player for debugging
  await logFirstPlayerStructure();
  
  const playerId = '14745'; // The player ID to calculate score for
  
  console.log(`\nCalculating astrological influence score for player ID: ${playerId}`);
  
  // Fetch player data
  const player = await getPlayerById(playerId);
  
  if (!player) {
    console.error(`Player with ID ${playerId} not found`);
    process.exit(1);
  }
  
  console.log(`Player: ${player.player_first_name} ${player.player_last_name}`);
  console.log(`Birth Date: ${player.player_birth_date}`);
  console.log(`Birth Location: ${player.player_birth_city || 'N/A'}, ${player.player_birth_country || 'N/A'}`);
  
  // Calculate astrological influence score
  const score = calculateAstroInfluenceScore(player);
  
  console.log(`\nAstrological Influence Score: ${score.toFixed(2)}/100`);
  
  // Generate and display detailed astrological data
  const astroData = generatePlayerAstroData(
    player.player_birth_date,
    {
      city: player.player_birth_city || undefined,
      country: player.player_birth_country || undefined
    }
  );
  
  console.log('\nAstrological Profile:');
  console.log(`- Sun Sign: ${astroData.sunSign}`);
  console.log(`- Moon Sign: ${astroData.moonSign}`);
  console.log(`- Ascendant: ${astroData.ascendant}`);
  console.log('\nElemental Balance:');
  console.log(`- Fire: ${astroData.elements.fire.percentage.toFixed(2)}%`);
  console.log(`- Earth: ${astroData.elements.earth.percentage.toFixed(2)}%`);
  console.log(`- Air: ${astroData.elements.air.percentage.toFixed(2)}%`);
  console.log(`- Water: ${astroData.elements.water.percentage.toFixed(2)}%`);
  console.log('\nDominant Planets:');
  console.log(astroData.dominantPlanets.join(', '));
  console.log(`\nMoon Phase: ${astroData.moonPhase.name} (${(astroData.moonPhase.illumination * 100).toFixed(2)}% illuminated)`);
  console.log(`Astro Weather: ${astroData.astroWeather}`);
}

// Run the script
main().catch(console.error);
