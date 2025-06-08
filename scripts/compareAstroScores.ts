import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { generatePlayerAstroData } from '../src/lib/playerAstroService';

// Load environment variables from .env file
const envPath = new URL('../.env', import.meta.url).pathname;
const tempEnvPath = new URL('../.env.temp', import.meta.url).pathname;

// Create a temporary .env file with the same content as .env
if (fs.existsSync(envPath)) {
  fs.writeFileSync(tempEnvPath, fs.readFileSync(envPath, 'utf8'));
  dotenv.config({ path: tempEnvPath });
  // Clean up the temporary file
  fs.unlinkSync(tempEnvPath);
}

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface BaseballPlayer {
  id: number;
  player_name: string;
  player_birth_date: string | null;
  player_birth_city: string | null;
  player_birth_country: string | null;
  [key: string]: any;
}

// Function to calculate astro influence score
function calculateAstroInfluenceScore(player: BaseballPlayer): number {
  if (!player.player_birth_date) {
    console.error('Player is missing birth date');
    return 0;
  }

  try {
    const astroData = generatePlayerAstroData(
      player.player_birth_date,
      {
        city: player.player_birth_city || undefined,
        country: player.player_birth_country || undefined
      }
    );

    // Calculate elemental balance (30% of total)
    // Equal weights for all elements (0.25 each)
    const elementPercents = [
      astroData.elements.fire.percentage,
      astroData.elements.earth.percentage,
      astroData.elements.air.percentage,
      astroData.elements.water.percentage
    ];
    
    // Calculate base score with equal weights
    const elementalBaseScore = elementPercents.reduce((sum, p) => sum + (p * 0.25), 0);
    
    // Check for imbalances (more than 55% in one element)
    const maxElement = Math.max(...elementPercents);
    const minElement = Math.min(...elementPercents);
    
    // Penalty for having too much of one element
    const elementImbalancePenalty = maxElement > 55 ? Math.pow((maxElement - 55) * 0.03, 1.5) * 100 : 0;
    
    // Penalty for having 0% in any element
    const missingElementPenalty = minElement === 0 ? 10 : 0;
    
    // Apply penalties
    const elementalScore = Math.max(0, elementalBaseScore - elementImbalancePenalty - missingElementPenalty) * 0.27;

    // Calculate modal balance (36% of total)
    const modalPercents = [
      astroData.modalities.cardinal.percentage,
      astroData.modalities.fixed.percentage,
      astroData.modalities.mutable.percentage
    ];
    
    // Calculate base score with balanced weights
    const modalBaseScore = 
      (astroData.modalities.cardinal.percentage * 0.35 +     // More balanced
       astroData.modalities.fixed.percentage * 0.35 +       // Equal weight
       astroData.modalities.mutable.percentage * 0.3);      // Slightly less
    
    // Add penalty for modal imbalance (more than 60% in one modality)
    const maxModal = Math.max(...modalPercents);
    const minModal = Math.min(...modalPercents);
    
    // Steeper penalty for modal imbalance
    const modalImbalancePenalty = maxModal > 60 ? Math.pow((maxModal - 60) * 0.04, 1.5) * 100 : 0;
    
    // Penalty for having 0% in any modality
    const missingModalPenalty = minModal === 0 ? 5 : 0;
    
    const modalScore = Math.max(0, modalBaseScore - modalImbalancePenalty - missingModalPenalty) * 0.36;

    // Calculate dominant planet score (18% of total)
    // Need at least 3 planets for a good score, 4+ for perfect
    const dominantPlanetCount = astroData.dominantPlanets.length;
    let dominantPlanetScore = 0;
    
    if (dominantPlanetCount >= 4) {
      dominantPlanetScore = 1.0;  // Full points for 4+ planets
    } else if (dominantPlanetCount === 3) {
      dominantPlanetScore = 0.75; // 75% for 3 planets
    } else if (dominantPlanetCount === 2) {
      dominantPlanetScore = 0.5;  // 50% for 2 planets
    } else if (dominantPlanetCount === 1) {
      dominantPlanetScore = 0.25; // 25% for 1 planet
    }
    
    dominantPlanetScore *= 0.18; // Scale to 18% of total score

    // Calculate moon phase score (9% of total)
    // Full moon (0.5) is best, new moon (0/1) is worst
    // Very steep falloff from full moon
    const moonPhaseDistance = Math.abs(0.5 - astroData.moonPhase.illumination);
    // Use a cubic function for steeper falloff
    const moonPhaseScore = Math.pow(1 - Math.pow(moonPhaseDistance * 2, 1.8), 2) * 0.09;

    // Calculate aspects score (10% of total)
    // +4 for trine/sextile, +2 for conjunction, 0 otherwise
    let aspectsScoreRaw = 0;
    if (Array.isArray(astroData.aspects)) {
      for (const a of astroData.aspects) {
        if (a.type === 'trine' || a.type === 'sextile') aspectsScoreRaw += 4;
        else if (a.type === 'conjunction') aspectsScoreRaw += 2;
      }
    }
    const aspectsScore = (aspectsScoreRaw / 12) * 0.10; // Max possible is 12

    // Calculate final score (0-100)
    let score = (elementalScore + modalScore + dominantPlanetScore + moonPhaseScore + aspectsScore) * 100;
    
    // Clamp between 0-100
    score = Math.min(100, Math.max(0, parseFloat(score.toFixed(2))));
    
    return score;
  } catch (error) {
    console.error('Error calculating astrological score:', error);
    return 0;
  }
}

// Function to get player data and calculate score
async function getPlayerAstroScore(playerId: number) {
  try {
    console.log(`Fetching data for player ID: ${playerId}...`);
    
    const { data: player, error } = await supabase
      .from('baseball_players')
      .select('*')
      .eq('player_id', playerId)
      .single();

    if (error) {
      console.error('Error fetching player:', error);
      return null;
    }

    if (!player) {
      console.error('Player not found');
      return null;
    }

    console.log('Player found:', player.player_name);
    console.log('Birth date:', player.player_birth_date);
    console.log('Birth city:', player.player_birth_city);
    console.log('Birth country:', player.player_birth_country);

    // Calculate the astro score
    const score = calculateAstroInfluenceScore(player);
    
    // Get detailed astro data
    const astroData = generatePlayerAstroData(
      player.player_birth_date,
      {
        city: player.player_birth_city || undefined,
        country: player.player_birth_country || undefined
      }
    );

    return {
      player: {
        id: player.player_id,
        name: player.player_name,
        birthDate: player.player_birth_date,
        birthPlace: `${player.player_birth_city || 'Unknown'}, ${player.player_birth_country || 'Unknown'}`
      },
      score,
      astroData: {
        elements: astroData.elements,
        modalities: astroData.modalities,
        dominantPlanets: astroData.dominantPlanets,
        moonPhase: astroData.moonPhase
      }
    };
  } catch (error) {
    console.error('Error in getPlayerAstroScore:', error);
    return null;
  }
}

// Main function to compare two players
async function comparePlayers(playerId1: number, playerId2: number) {
  console.log('=== Astrological Influence Score Comparison ===\n');
  
  // Get data for both players
  const player1 = await getPlayerAstroScore(playerId1);
  const player2 = await getPlayerAstroScore(playerId2);

  if (!player1 || !player2) {
    console.error('Could not get data for one or both players');
    return;
  }

  // Display comparison
  console.log('\n=== Comparison ===\n');
  console.log(`Player 1: ${player1.player.name} (ID: ${player1.player.id})`);
  console.log(`Birth: ${player1.player.birthDate} in ${player1.player.birthPlace}`);
  console.log(`Astro Score: ${player1.score.toFixed(2)}/100\n`);
  
  console.log(`Player 2: ${player2.player.name} (ID: ${player2.player.id})`);
  console.log(`Birth: ${player2.player.birthDate} in ${player2.player.birthPlace}`);
  console.log(`Astro Score: ${player2.score.toFixed(2)}/100\n`);

  // Detailed breakdown
  console.log('\n=== Elemental Balance ===');
  console.log(`Player 1 (${player1.player.name}):`);
  console.log(`- Fire: ${player1.astroData.elements.fire.percentage}%`);
  console.log(`- Earth: ${player1.astroData.elements.earth.percentage}%`);
  console.log(`- Air: ${player1.astroData.elements.air.percentage}%`);
  console.log(`- Water: ${player1.astroData.elements.water.percentage}%\n`);
  
  console.log(`Player 2 (${player2.player.name}):`);
  console.log(`- Fire: ${player2.astroData.elements.fire.percentage}%`);
  console.log(`- Earth: ${player2.astroData.elements.earth.percentage}%`);
  console.log(`- Air: ${player2.astroData.elements.air.percentage}%`);
  console.log(`- Water: ${player2.astroData.elements.water.percentage}%\n`);

  console.log('\n=== Modal Balance ===');
  console.log(`Player 1 (${player1.player.name}):`);
  console.log(`- Cardinal: ${player1.astroData.modalities.cardinal.percentage}%`);
  console.log(`- Fixed: ${player1.astroData.modalities.fixed.percentage}%`);
  console.log(`- Mutable: ${player1.astroData.modalities.mutable.percentage}%\n`);
  
  console.log(`Player 2 (${player2.player.name}):`);
  console.log(`- Cardinal: ${player2.astroData.modalities.cardinal.percentage}%`);
  console.log(`- Fixed: ${player2.astroData.modalities.fixed.percentage}%`);
  console.log(`- Mutable: ${player2.astroData.modalities.mutable.percentage}%\n`);

  console.log('\n=== Dominant Planets ===');
  console.log(`Player 1 (${player1.player.name}):`);
  player1.astroData.dominantPlanets.forEach((p: any) => 
    console.log(`- ${p.planet} (${p.type}, Influence: ${p.influence})`)
  );
  
  console.log(`\nPlayer 2 (${player2.player.name}):`);
  player2.astroData.dominantPlanets.forEach((p: any) => 
    console.log(`- ${p.planet} (${p.type}, Influence: ${p.influence})`)
  );

  console.log('\n=== Moon Phase ===');
  console.log(`Player 1 (${player1.player.name}):`);
  console.log(`- Phase: ${player1.astroData.moonPhase.name}`);
  console.log(`- Illumination: ${(player1.astroData.moonPhase.illumination * 100).toFixed(2)}%\n`);
  
  console.log(`Player 2 (${player2.player.name}):`);
  console.log(`- Phase: ${player2.astroData.moonPhase.name}`);
  console.log(`- Illumination: ${(player2.astroData.moonPhase.illumination * 100).toFixed(2)}%`);
}

// Run the comparison for players 10268 and 14745
comparePlayers(10268, 14745).catch(console.error);
