require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { generatePlayerAstroData } = require('./playerAstroService.cjs');

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('No .env file found. Make sure to set your environment variables.');
}

// Check for required environment variables
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_KEY) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

/**
 * @typedef {Object} BaseballPlayer
 * @property {number} id
 * @property {string} [name]
 * @property {string} [player_name] Some schemas might use this
 * @property {string|null} [birth_date]
 * @property {string|null} [player_birth_date] Some schemas might use this
 * @property {string|null} [birth_city]
 * @property {string|null} [player_birth_city] Some schemas might use this
 * @property {string|null} [birth_country]
 * @property {string|null} [player_birth_country] Some schemas might use this
 */

/**
 * Calculates astrological influence score for a player
 * @param {BaseballPlayer} player - The player data
 * @returns {number} - The calculated score (0-100)
 */
async function calculateAstroInfluenceScore(player, currentDate) {
  // Handle different possible field names for birth date and name
  const playerBirthDate = player.player_birth_date || player.birth_date;
  const playerName = player.player_full_name || 
                    (player.player_first_name && player.player_last_name ? 
                     `${player.player_first_name} ${player.player_last_name}` : 
                     player.name || 'unnamed');
  
  if (!playerBirthDate) {
    console.log(`Player ${player.player_id || player.id} (${playerName}) missing birth date`);
    return 0;
  }
  try {
    console.log(`\n--- Processing player: ${playerName} ---`);
    console.log(`Birth date: ${playerBirthDate}`);
    
    // Parse the birth date first
    const birthDate = new Date(playerBirthDate);
    if (isNaN(birthDate.getTime())) {
      throw new Error(`Invalid birth date: ${playerBirthDate}`);
    }
    
    // Generate astrological data
    const astroData = generatePlayerAstroData(
      playerBirthDate,
      player.birth_location,
      currentDate
    );
    
    console.log('Astro data:', JSON.stringify(astroData, null, 2));

    // Initialize score components with dynamic weights
    let elementalScore = 0;
    let modalScore = 0;
    let dominantPlanetScore = 0;
    let moonPhaseScore = 0;
    let aspectsScore = 0;
    
    // Calculate birth date components
    const birthMonth = birthDate.getMonth() + 1; // 1-12
    const birthDay = birthDate.getDate();
    const birthDayOfYear = Math.floor((birthDate - new Date(birthDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Get current date components from the passed parameter
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentDay = currentDate.getDate();
    const currentDayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Calculate seasonal factors
    const seasonFactor = 0.5 + (0.5 * Math.sin((currentMonth * 2 - 1) * Math.PI / 6)); // 0.5-1.0 based on month
    const moonPhase = astroData.moonPhase || 0.5; // 0-1
    
    // Log the current date info for debugging
    console.log(`Current date: ${currentDate.toISOString().split('T')[0]}, Month: ${currentMonth}, Day of year: ${currentDayOfYear}`);
    
    // Base weights - extremely high planet influence
    const weights = {
      elemental: 0.10,    // Minimal weight for elements
      modal: 0.02,        // Minimal weight for modalities
      planets: 0.80,      // Dominant weight for planets
      moon: 0.05,         // Reduced weight for moon phase
      aspects: 0.03       // Minimal weight for aspects
    };
    
    // Add some variation based on the player's birth date
    const playerFactor = (birthMonth / 12) * 0.5 + 0.75; // 0.75-1.25 range based on birth month
    
    // Adjust weights based on current date and moon phase
    weights.planets += 0.1 * seasonFactor; // Planets more influential in certain seasons
    weights.elemental += 0.1 * (1 - seasonFactor); // Elements balance the planets
    weights.moon += 0.05 * Math.sin(moonPhase * Math.PI * 2); // Moon more influential around full/new moon
    
    // Log the weights being used
    console.log('Dynamic weights:', {
      seasonFactor: seasonFactor.toFixed(2),
      moonPhase: moonPhase.toFixed(2),
      weights: {
        elemental: (weights.elemental * 100).toFixed(1) + '%',
        planets: (weights.planets * 100).toFixed(1) + '%',
        aspects: (weights.aspects * 100).toFixed(1) + '%',
        moon: (weights.moon * 100).toFixed(1) + '%',
        modal: (weights.modal * 100).toFixed(1) + '%'
      }
    });

    // 1. Elemental Balance (dynamic weight)
    if (astroData.elements) {
      const elements = ['fire', 'earth', 'air', 'water'];
      const elementalValues = elements.map(el => ({
        element: el,
        value: astroData.elements[el]?.percentage || 0,
        // Base power for each element (can be adjusted seasonally)
        power: {
          fire: 1.2,    // Fire is powerful in summer
          earth: 1.1,   // Earth is stable
          air: 1.0,     // Air is neutral
          water: 1.15   // Water is powerful in winter
        }[el]
      }));
      
      // Sort by value (highest first)
      elementalValues.sort((a, b) => b.value - a.value);
      
      // Calculate score based on element distribution and current season
      let totalElementalScore = 0;
      let dominantElement = null;
      let maxScore = 0;
      
      elementalValues.forEach((el, index) => {
        // Higher weight for dominant elements
        const elementWeight = (4 - index) * 0.25; // 1.0 for 1st, 0.75 for 2nd, etc.
        const seasonModifier = 0.8 + (0.4 * Math.sin((currentMonth + index) * Math.PI / 6)); // Varies by month
        
        const elementScore = (el.value / 100) * el.power * elementWeight * seasonModifier;
        totalElementalScore += elementScore;
        
        if (elementScore > maxScore) {
          maxScore = elementScore;
          dominantElement = el.element;
        }
      });
      
      // Normalize to 0-1 range
      const normalizedScore = Math.min(1, totalElementalScore / 2);
      elementalScore = weights.elemental * normalizedScore;
      
      console.log(`Elemental scores: ${JSON.stringify(elementalValues)}`);
      console.log(`Dominant element: ${dominantElement}`);
      console.log(`Elemental score: ${(elementalScore * 100).toFixed(2)}`);
    } else {
      console.warn('No elements data found in astroData');
      elementalScore = weights.elemental * 0.3; // Penalty for missing data
    }

    // 2. Modal Balance (small weight, mostly static)
    if (astroData.modalities) {
      // Simple modal balance calculation
      const modalities = ['cardinal', 'fixed', 'mutable'];
      const modalValues = modalities.map(m => ({
        type: m,
        value: astroData.modalities[m] || 0
      }));
      
      // Sort by value (highest first)
      modalValues.sort((a, b) => b.value - a.value);
      
      // Simple score based on distribution
      const modalRange = modalValues[0].value - modalValues[2].value;
      const modalBalanceScore = 1 - (modalRange / 100);
      
      modalScore = weights.modal * modalBalanceScore;
      
      console.log('Modal distribution:', JSON.stringify(modalValues));
      console.log(`Modal score: ${(modalScore * 100).toFixed(2)}`);
    } else {
      console.warn('No modalities data found in astroData');
      modalScore = weights.modal * 0.5; // 50% of weight if no data
    }

    // Calculate dominant planet score with significantly enhanced influence
    if (astroData.dominantPlanets) {
      // Extremely enhanced planet weights with massive differentiation
      // Enhanced weights with stronger Sun and Moon influence
      const planetWeights = {
        'sun': 4.5,      // Greatly increased influence for core identity (from 3.5)
        'moon': 4.0,     // Significantly increased emotional influence (from 3.0)
        'mercury': 2.5,  // Communication and intellect
        'venus': 3.2,    // Harmony and aesthetics
        'mars': 4.0,     // Maximum competitive drive
        'jupiter': 3.8,  // Luck and expansion
        'saturn': 3.5,   // Discipline and structure
        'uranus': 2.8,   // Innovation and change
        'neptune': 2.5,  // Intuition and creativity
        'pluto': 3.2     // Transformation and power
      };

      const planetScores = {};
      let totalPlanetScore = 0;
      
      // Score each dominant planet with dramatically enhanced influence
      astroData.dominantPlanets.all.forEach(planet => {
        const planetName = planet.toLowerCase();
        const weight = planetWeights[planetName] || 1.5; // Increased default minimum
        // Apply aggressive exponential scaling for maximum differentiation
        const baseScore = Math.pow(weight, 1.8) * 40; // Greatly increased base score and steeper curve
        
        // Add significant bonuses for primary and secondary planets
        const isPrimary = astroData.dominantPlanets.primary?.toLowerCase() === planetName;
        const isSecondary = astroData.dominantPlanets.secondary?.toLowerCase() === planetName;
        const primaryBonus = isPrimary ? baseScore * 0.5 : 0;
        const secondaryBonus = isSecondary ? baseScore * 0.25 : 0;
        
        const score = baseScore + primaryBonus + secondaryBonus;
        
        planetScores[planetName] = score;
        totalPlanetScore += score;
      });
      
      // Enhanced aspect bonus with dynamic date-based weighting
      const currentDateObj = currentDate || new Date();
      const dayOfYear = Math.floor((currentDateObj - new Date(currentDateObj.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      
      // Calculate dynamic aspect bonus based on current date (cycles every 30 days)
      const aspectCycle = (dayOfYear % 30) / 30; // 0-1 value that cycles every month
      const dynamicAspectMultiplier = 0.8 + (Math.sin(aspectCycle * Math.PI * 2) * 0.2); // 0.8-1.0 multiplier
      
      // Score aspects based on type and current date
      const aspectScores = {
        'conjunction': 10,  // Strongest aspect
        'opposition': 8,
        'square': 6,
        'trine': 7,
        'sextile': 4,
        'quincunx': 3,
        'semi-sextile': 2,
        'semi-square': 2,
        'sesqui-quadrate': 2,
        'quintile': 3,
        'bi-quintile': 3
      };
      
      // Calculate total aspect bonus with dynamic weighting
      const aspectBonus = (astroData.aspects || []).reduce((total, aspect) => {
        if (!aspect?.type) return total;
        const baseScore = aspectScores[aspect.type.toLowerCase()] || 1;
        // Apply orb penalty (closer to exact = stronger)
        const orbPenalty = 1 - (Math.min(aspect.orb || 0, 10) / 20); // Max 10° orb, 50% penalty at max orb
        return total + (baseScore * orbPenalty * dynamicAspectMultiplier);
      }, 0);
      
      // Cap aspect bonus at 30 points (10% of max score)
      totalPlanetScore += Math.min(aspectBonus, 30);
      
      // Apply seasonal multiplier (deterministic based on date)
      const seasonMultiplier = 0.6 + (seasonFactor * 0.8); // 0.6-1.4 multiplier based on season
      totalPlanetScore *= seasonMultiplier;
      
      // Normalize to 0-1 range with higher potential max
      dominantPlanetScore = Math.min(1, totalPlanetScore / 40);
      
      console.log('Planet scores:', JSON.stringify(planetScores, null, 2));
      console.log(`Aspect bonus: ${aspectBonus.toFixed(2)}`);
      console.log(`Season factor: ${(0.8 + (seasonFactor * 0.4)).toFixed(2)}x`);
      console.log(`Dominant planet score: ${(dominantPlanetScore * 100).toFixed(2)}`);
      
      // Apply the weight to the final score
      dominantPlanetScore *= weights.planets;
    } else {
      console.warn('No dominant planets data found in astroData');
      dominantPlanetScore = 0.5 * weights.planets; // 50% of weight if no data
    }

    // Calculate moon phase score (0-1)
    try {
      // Get current moon phase (0 = new moon, 0.5 = full moon, 1.0 = next new moon)
      const moonPhase = astroData.moonPhase || 0.5;
      
      // Moon phase scoring based on current date
      const moonCycleDay = Math.floor(moonPhase * 29.53); // Convert to day in moon cycle
      
      // Calculate base score with enhanced seasonal adjustment
      let phaseScore = 0.5 + (0.5 * Math.sin(moonPhase * Math.PI * 2));
      
      // Enhanced seasonal effects with currentDayOfYear
      const seasonAdjustment = 0.2 * Math.sin((currentDayOfYear / 365) * Math.PI * 2);
      phaseScore = Math.max(0.2, Math.min(1, phaseScore + seasonAdjustment));
      
      // Add bonus for full and new moons
      if (moonPhase < 0.05 || moonPhase > 0.95) { // New moon
        phaseScore = Math.min(1, phaseScore * 1.3);
      } else if (moonPhase > 0.45 && moonPhase < 0.55) { // Full moon
        phaseScore = Math.min(1, phaseScore * 1.4);
      }
      
      // Apply weight
      moonPhaseScore = phaseScore * weights.moon;
      
      console.log(`Moon phase: ${(moonPhase * 100).toFixed(2)} (day ${moonCycleDay})`);
      console.log(`Season adjustment: ${(seasonAdjustment * 100).toFixed(2)}`);
      console.log(`Moon phase score: ${(moonPhaseScore * 100).toFixed(2)}`);
    } catch (error) {
      console.error('Error calculating moon phase score:', error.message);
      moonPhaseScore = 0.5 * weights.moon; // Default neutral score on error
    }

    // 5. Aspects (dynamic weight) - Focused on current transits
    if (Array.isArray(astroData.aspects) && astroData.aspects.length > 0) {
      // Aspect weights based on current astrological significance
      const aspectWeights = {
        'conjunction': {
          base: 1.2,
          current: 1.3  // More significant during new/full moons
        },
        'opposition': {
          base: 1.1,
          current: 1.2  // More significant during full moons
        },
        'trine': { base: 1.0 },
        'square': { base: 0.8 },
        'sextile': { base: 0.7 },
        'quintile': { base: 0.6 },
        'quincunx': { base: 0.5 },
        'semisextile': { base: 0.3 }
      };
      
      // Current astrological factors
      const isFullMoon = Math.abs(moonPhase - 0.5) < 0.1; // Close to full moon
      const isNewMoon = moonPhase < 0.1 || moonPhase > 0.9; // Close to new moon
      const mercuryRetrograde = false; // Could be determined from ephemeris
      
      let totalAspectScore = 0;
      let validAspects = 0;
      
      // Score each aspect based on type and current conditions
      astroData.aspects.forEach(aspect => {
        if (!aspect || !aspect.type) return;
        
        const aspectType = aspect.type.toLowerCase();
        const config = aspectWeights[aspectType] || { base: 0.2 };
        
        // Base score from aspect type
        let aspectScore = config.base;
        
        // Apply current conditions
        if (isFullMoon && aspectType === 'opposition') {
          aspectScore *= 1.5;
        } else if (isNewMoon && aspectType === 'conjunction') {
          aspectScore *= 1.5;
        }
        
        // Apply orb penalty (tighter orbs are stronger)
        const maxOrb = 10; // Default max orb in degrees
        const orb = Math.min(Math.abs(aspect.orb || 0), maxOrb);
        const orbFactor = 1 - (orb / maxOrb);
        
        // Final score with orb consideration
        const finalScore = aspectScore * orbFactor;
        
        totalAspectScore += finalScore;
        validAspects++;
      });
      
      // Calculate average score and apply weight
      if (validAspects > 0) {
        const avgScore = totalAspectScore / validAspects;
        aspectsScore = weights.aspects * Math.min(1, avgScore * 1.2);
      }
    } else {
      console.warn('No aspects data found in astroData');
      // Use a moderate penalty for missing aspects
      aspectsScore = 0.3 * 0.4; // 40% of max if no aspects
    }

    // Log final score components for debugging
    console.log(`Final score components for ${player.full_name}:`);
    console.log(`- Elemental: ${(elementalScore * 100).toFixed(2)}`);
    console.log(`- Modal: ${(modalScore * 100).toFixed(2)}`);
    console.log(`- Dominant Planets: ${(dominantPlanetScore * 100).toFixed(2)}`);
    console.log(`- Moon Phase: ${(moonPhaseScore * 100).toFixed(2)}`);
    console.log(`- Aspects: ${(aspectsScore * 100).toFixed(2)}`);
    
    // Combine all components with their respective weights and player factor
    const combinedScore = (
      (elementalScore * weights.elemental) +
      (modalScore * weights.modal) +
      (dominantPlanetScore * weights.planets) +
      (moonPhaseScore * weights.moon) +
      (aspectsScore * weights.aspects)
    ) * 100 * playerFactor; // Apply player factor for more variation
    
    console.log('Final score components:', {
      elemental: (elementalScore * 100).toFixed(2),
      modal: (modalScore * 100).toFixed(2),
      planets: (dominantPlanetScore * 100).toFixed(2),
      moon: (moonPhaseScore * 100).toFixed(2),
      aspects: (aspectsScore * 100).toFixed(2)
    });
    
    // Ensure score is within 0-100 range
    const boundedScore = Math.max(0, Math.min(100, combinedScore));
    
    // Log final score components with weights
    console.log('Final score components for', player.full_name + ':');
    console.log(`- Elemental: ${(elementalScore * 100).toFixed(2)} (weight: ${weights.elemental.toFixed(2)})`);
    console.log(`- Modal: ${(modalScore * 100).toFixed(2)} (weight: ${weights.modal.toFixed(2)})`);
    console.log(`- Dominant Planets: ${(dominantPlanetScore * 100).toFixed(2)} (weight: ${weights.planets.toFixed(2)})`);
    console.log(`- Moon Phase: ${(moonPhaseScore * 100).toFixed(2)} (weight: ${weights.moon.toFixed(2)})`);
    console.log(`- Aspects: ${(aspectsScore * 100).toFixed(2)} (weight: ${weights.aspects.toFixed(2)})`);
    console.log(`- Player factor: ${playerFactor.toFixed(2)}`);
    console.log('Raw combined score:', combinedScore.toFixed(2));
    
    console.log(`Final score for ${player.full_name}: ${boundedScore.toFixed(2)}`);
    console.log('---');
    
    return boundedScore;
  } catch (error) {
    console.error('Error calculating astro influence score:', error);
    return 50; // Return a neutral score on error
  }
}

async function main() {
  console.log('Fetching all MLB players...');
  // First try with the specific columns, fall back to * if that fails
  let players;
  let error;
  
  // Try with specific column names first
  const { data: playersData, error: specificError } = await supabase
    .from('baseball_players')
    .select('id,name,birth_date,birth_city,birth_country')
    .limit(1000); // Limit to 1000 players for testing
    
  if (specificError) {
    console.log('Specific column query failed, trying with *...');
    const { data: allData, error: allError } = await supabase
      .from('baseball_players')
      .select('*')
      .limit(1000); // Limit to 1000 players for testing
    
    if (allError) {
      console.error('Error fetching players:', allError);
      process.exit(1);
    }
    players = allData;
  } else {
    players = playersData;
  }
  
  if (!players || players.length === 0) {
    console.error('No players found in baseball_players table');
    process.exit(1);
  }
  
  console.log(`Found ${players.length} players`);
  // Log the first player to verify structure
  console.log('First player sample:', JSON.stringify(players[0], null, 2));
  
  // Calculate scores for all players
  const scores = [];
  const currentDate = new Date();
  
  for (const player of players) {
    try {
      console.log(`\n--- Processing player: ${player.name || player.full_name || 'Unknown'} ---`);
      console.log(`Birth date: ${player.birth_date}`);
      
      const score = await calculateAstroInfluenceScore(player, currentDate);
      scores.push(score);
    } catch (error) {
      console.error(`Error processing player ${player.id}:`, error);
      // Push a neutral score on error to avoid breaking the distribution
      scores.push(50);
    }
  }

  // --- Universal Base Point Boost ---
  const baseBoostMaxScore = Math.max(...scores);
  const baseBoost = 96 - baseBoostMaxScore;
  console.log(`\nUniversal base boost to apply: ${baseBoost.toFixed(2)}`);

  // --- Full/New Moon Bonus ---
  // Moon phase: 0 = new, 0.5 = full, 1 = new
  function isFullMoon(moonPhase) {
    return Math.abs(moonPhase - 0.5) < 0.03; // within ~1.5 days of full moon
  }
  function isNewMoon(moonPhase) {
    return (moonPhase < 0.03 || moonPhase > 0.97); // within ~1.5 days of new moon
  }
  // Use the first player's astro data as a proxy for the current date's moon phase
  let moonPhaseVal = null;
  try {
    const testAstro = await generatePlayerAstroData({ birth_date: currentDate.toISOString().split('T')[0] }, currentDate);
    moonPhaseVal = testAstro.moonPhase;
  } catch (e) {
    console.warn('Could not determine moon phase for full/new moon bonus');
  }
  let moonBonus = 0;
  if (moonPhaseVal !== null) {
    if (isFullMoon(moonPhaseVal) || isNewMoon(moonPhaseVal)) {
      moonBonus = 5;
      console.log('Full or New Moon detected! Applying +5 point bonus to all scores.');
    }
  }

  // --- Apply boosts to all scores ---
  for (let i = 0; i < scores.length; i++) {
    scores[i] = Math.max(0, Math.min(100, scores[i] + baseBoost + moonBonus));
  }

  // Histogram bins (0-10, 10-20, ..., 90-100)
  const bins = Array(10).fill(0);
  for (const score of scores) {
    const idx = Math.min(9, Math.floor(score / 10));
    bins[idx]++;
  }
  // Print histogram
  console.log('\nAstro Score Distribution (bin = 10):');
  for (let i = 0; i < bins.length; i++) {
    const range = `${i * 10}-${i === 9 ? 100 : (i + 1) * 10 - 1}`;
    const bar = '█'.repeat(Math.round(bins[i] / Math.max(...bins) * 40));
    console.log(`${range.padEnd(7)} | ${bar} (${bins[i]})`);
  }
  // Calculate statistics
  const sortedScores = [...scores].sort((a, b) => a - b);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const medianScore = scores.length % 2 === 0 
    ? (sortedScores[scores.length/2 - 1] + sortedScores[scores.length/2]) / 2 
    : sortedScores[Math.floor(scores.length/2)];

  // Print detailed statistics
  console.log('\nScore Statistics:');
  console.log(`- Players: ${scores.length}`);
  console.log(`- Min: ${minScore.toFixed(2)}`);
  console.log(`- Max: ${maxScore.toFixed(2)}`);
  console.log(`- Avg: ${avgScore.toFixed(2)}`);
  console.log(`- Median: ${medianScore.toFixed(2)}`);
  
  // Print decile distribution
  console.log('\nDecile Distribution:');
  for (let i = 0; i < 10; i++) {
    const start = i * 10;
    const end = (i + 1) * 10 - (i === 9 ? 0 : 1);
    const count = scores.filter(s => s >= start && s <= end).length;
    const pct = (count / scores.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.ceil(count / scores.length * 50));
    console.log(`${String(start).padStart(2)}-${String(end).padEnd(3)} | ${bar} ${pct}% (${count})`);
  }

  // Write detailed CSV with player info
  const csv = ['player_id,player_name,score,elemental,modal,planets,moon,aspects'].concat(
    players.map((p, i) => {
      const score = scores[i];
      const playerId = p.player_id || p.id || 'unknown';
      const playerName = p.player_name || p.name || `${p.player_first_name || ''} ${p.player_last_name || ''}`.trim() || 'unknown';
      return `${playerId},${JSON.stringify(playerName).replace(/,/g, ';')},${score.toFixed(2)}`;
    })
  ).join('\n');
  
  fs.writeFileSync('astro_scores_histogram.csv', csv);
  console.log('\nDetailed scores written to astro_scores_histogram.csv');
}

/**
 * Gets the current season based on date
 */
/**
 * Gets the current season based on date
 * @param {Date} date - The date to check
 * @returns {string} - The current season (Spring, Summer, Fall, Winter)
 */
function getCurrentSeason(date) {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

/**
 * Gets the current seasonal weights based on date
 */
/**
 * Gets seasonal weights for elements and modalities
 * @param {Date} date - The date to check
 * @returns {Object} - Object containing weights for elements and modalities
 */
function getSeasonalWeights(date) {
  const month = date.getMonth() + 1; // 1-12
  
  // Spring (Mar-May) - Emphasize cardinal signs (Aries, Cancer, Libra, Capricorn)
  if (month >= 3 && month <= 5) {
    return {
      elements: { fire: 1.2, earth: 0.9, air: 1.1, water: 0.8 },
      modalities: { cardinal: 1.3, fixed: 0.9, mutable: 0.8 }
    };
  }
  
  // Summer (Jun-Aug) - Emphasize fixed signs (Taurus, Leo, Scorpio, Aquarius)
  if (month >= 6 && month <= 8) {
    return {
      elements: { fire: 1.1, earth: 1.2, air: 0.9, water: 0.8 },
      modalities: { cardinal: 0.9, fixed: 1.3, mutable: 0.8 }
    };
  }
  
  // Fall (Sep-Nov) - Emphasize mutable signs (Gemini, Virgo, Sagittarius, Pisces)
  if (month >= 9 && month <= 11) {
    return {
      elements: { fire: 0.9, earth: 1.1, air: 1.2, water: 0.8 },
      modalities: { cardinal: 0.8, fixed: 0.9, mutable: 1.3 }
    };
  }
  
  // Winter (Dec-Feb) - Balance with slight emphasis on water
  return {
    elements: { fire: 0.8, earth: 0.9, air: 1.1, water: 1.2 },
    modalities: { cardinal: 1.0, fixed: 1.1, mutable: 0.9 }
  };
}

main().catch(console.error);
