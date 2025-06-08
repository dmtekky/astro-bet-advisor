#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { calculateTeamChemistry } from '../src/utils/teamChemistry.js';

// Enable ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or Key is not defined in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get zodiac sign from birth date
function getZodiacSign(month, day) {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return 'aquarius';
  } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return 'pisces';
  } else if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return 'aries';
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return 'taurus';
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return 'gemini';
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return 'cancer';
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return 'leo';
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return 'virgo';
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return 'libra';
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return 'scorpio';
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return 'sagittarius';
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return 'capricorn';
  }
  return 'aries'; // Default
}

// Helper function to map NBA injury status to generic availability
function mapNbaInjuryStatus(nbaStatus) {
  if (!nbaStatus) return 'active';
  
  const status = String(nbaStatus).toLowerCase();
  
  // Map NBA injury designations to generic availability
  if (status.includes('out') || status === 'inactive') return 'out';
  if (status.includes('doubt') || status.includes('question')) return 'questionable';
  if (status.includes('probable') || status.includes('game time')) return 'day_to_day';
  if (status === 'active' || status === 'healthy') return 'active';
  
  return 'active'; // Default to active if unknown status
}

async function main() {
  console.log('🏀 Starting NBA Team Chemistry Update');
  const startTime = new Date();
  let updatedCount = 0;
  let errorCount = 0;
  const teamScores = [];

  try {
    // 0. First, check the nba_players table structure and count
    console.log('🔍 Checking nba_players table...');
    
    // Check if we have any players at all
    const { count: totalPlayers, error: countError } = await supabase
      .from('nba_players')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('❌ Error counting NBA players:', countError.message);
    } else {
      console.log(`📊 Total NBA players in database: ${totalPlayers}`);
      
      // Get a sample of players to see their structure
      if (totalPlayers > 0) {
        const { data: samplePlayers, error: sampleError } = await supabase
          .from('nba_players')
          .select('*')
          .limit(5);
          
        if (sampleError) {
          console.error('❌ Error fetching sample players:', sampleError.message);
        } else {
          console.log('🔍 Sample NBA players:', JSON.stringify(samplePlayers, null, 2));
        }
      }
    }
    
    // 1. Fetch all NBA teams
    console.log('\n📋 Fetching NBA teams...');
    const { data: teams, error: teamsError } = await supabase
      .from('nba_teams')
      .select('*')
      .order('name', { ascending: true });

    if (teamsError) {
      throw new Error(`Error fetching teams: ${teamsError.message}`);
    }

    console.log(`🏀 Found ${teams.length} NBA teams`);

    // 2. Process each team
    for (const team of teams) {
      try {
        console.log(`\n🔍 Processing ${team.name} (${team.abbreviation})`);

        // 3. Fetch players for this team with necessary fields
        console.log(`🔍 Fetching NBA players for team: ${team.name} (${team.abbreviation})`);
        
        // Get players for this team with birth dates, using external_team_id to match with team_id in nba_players
        const { data: players, error: playersError } = await supabase
          .from('nba_players')
          .select('*')
          .eq('team_id', team.external_team_id || team.id)  // Try both external_team_id and id
          .not('birth_date', 'is', null);
          
        console.log(`📊 Found ${players?.length || 0} players with birth dates for ${team.name}`);
        
        if (players && players.length > 0) {
          console.log('Sample player data:', {
            id: players[0].id,
            name: `${players[0].first_name} ${players[0].last_name}`,
            birth_date: players[0].birth_date,
            team_id: players[0].team_id
          });
        }

        if (playersError) {
          throw new Error(`Error fetching players: ${playersError.message}`);
        }

        console.log(`📊 Found ${players.length} active players`);

        // 4. Filter players with birth dates and prepare them with weights
        const playersWithWeights = players
          .filter(p => {
            // Only include players with valid birth dates
            if (!p.birth_date) return false;
            
            // Validate birth date format
            const birthDate = new Date(p.birth_date);
            if (isNaN(birthDate.getTime())) {
              console.warn(`⚠️  Invalid birth date for player ${p.id}: ${p.birth_date}`);
              return false;
            }
            return true;
          })
          .map(player => {
            // Parse and validate impact score (0-100 scale)
            let impactScore = parseFloat(player.impact_score);
            if (isNaN(impactScore) || impactScore < 0 || impactScore > 100) {
              console.warn(`⚠️  Invalid impact score for player ${player.id}, defaulting to 50`);
              impactScore = 50; // Default to 50 if invalid
            }
            
            // Map injury status and determine weight
            const injuryStatus = mapNbaInjuryStatus(player.injury_status);
            let availabilityWeight = 1.0;
            
            // Adjust weight based on injury status
            if (injuryStatus === 'out') {
              availabilityWeight = 0.0; // Injured players get zero weight
            } else if (injuryStatus === 'questionable' || injuryStatus === 'day_to_day') {
              availabilityWeight = 0.5; // Reduced weight for injured players
            }
            
            // Calculate element from birth date
            const birthDate = new Date(player.birth_date);
            const zodiacSign = getZodiacSign(birthDate.getMonth() + 1, birthDate.getDate());
            
            // Map zodiac signs to elements
            const zodiacToElement = {
              aries: 'fire', taurus: 'earth', gemini: 'air', cancer: 'water',
              leo: 'fire', virgo: 'earth', libra: 'air', scorpio: 'water',
              sagittarius: 'fire', capricorn: 'earth', aquarius: 'air', pisces: 'water'
            };
            
            const element = zodiacToElement[zodiacSign.toLowerCase()] || 'air';
            
            // Calculate player weight based on impact and availability
            // Base weight on impact score (0.5 to 1.5 range)
            const impactWeight = 0.5 + (impactScore / 100);
            const weight = impactWeight * availabilityWeight;
            
            // Log player info for debugging
            console.log(`   - ${player.first_name} ${player.last_name}: ` +
              `Impact=${impactScore}, Status=${injuryStatus}, ` +
              `Element=${element}, Weight=${weight.toFixed(2)}`);
            
            return {
              ...player,
              id: player.id,
              name: `${player.first_name} ${player.last_name}`.trim(),
              birth_date: player.birth_date,
              impact_score: impactScore,
              astro_influence: 50, // Default value if not set
              injury_status: injuryStatus,
              position: 'player', // Neutral position for basketball
              is_active: injuryStatus !== 'out',
              element: element,
              weight: weight // Set dynamic weight based on impact and availability
            };
          });

        if (playersWithWeights.length < 2) {
          console.log(`⚠️  Not enough players with birth dates for ${team.name}, skipping...`);
          continue;
        }

        // 5. Calculate team chemistry with impact and availability weights
        console.log('🧪 Calculating team chemistry with impact and availability weights...');
        try {
          // Calculate team chemistry with proper weights and elements
          const chemistry = calculateTeamChemistry(playersWithWeights, {
            roleWeights: { player: 1.0 }  // All positions weighted equally
          });
          
          console.log('🧪 Chemistry calculation result:', {
            score: chemistry.score,
            elements: chemistry.elements,
            aspects: chemistry.aspects
          });
          
          // Ensure we have valid element values
          const elements = chemistry.elements || {};
          const elementValues = {
            fire: Math.max(0, Math.min(100, Math.round((elements.fire || 0) * 100) / 100)),
            earth: Math.max(0, Math.min(100, Math.round((elements.earth || 0) * 100) / 100)),
            air: Math.max(0, Math.min(100, Math.round((elements.air || 0) * 100) / 100)),
            water: Math.max(0, Math.min(100, Math.round((elements.water || 0) * 100) / 100)),
            balance: Math.max(0, Math.min(100, Math.round((elements.balance || 0) * 100) / 100)),
            synergyBonus: elements.synergyBonus || 0,
            diversityBonus: elements.diversityBonus || 0
          };
          
          // Ensure the score is valid
          const chemistryScore = Math.max(0, Math.min(100, Math.round(chemistry.score || 0)));
          
          // Prepare update data with properly formatted values
          const updateData = {
            chemistry_score: chemistryScore,
            elemental_balance: elementValues,
            last_astro_update: new Date().toISOString()
          };
          
            console.log('📊 Prepared update data:', JSON.stringify(updateData, null, 2));
          
          console.log(`📊 Updating ${team.name} with chemistry data:`, JSON.stringify({
            chemistry_score: updateData.chemistry_score,
            elemental_balance: updateData.elemental_balance
          }, null, 2));
          
          const { error: updateError } = await supabase
            .from('nba_teams')
            .update(updateData)
            .eq('id', team.id);

          if (updateError) {
            console.error(`❌ Error updating team ${team.name}:`, updateError);
            throw new Error(`Error updating team: ${updateError.message}`);
          }

          console.log(`✅ Successfully updated ${team.name} - Chemistry Score: ${updateData.chemistry_score}/100`);
          teamScores.push({
            name: team.name,
            score: updateData.chemistry_score,
            elements: updateData.elemental_balance,
            players: playersWithWeights.length
          });
          
          updatedCount++;
        } catch (chemError) {
          console.error(`❌ Error calculating chemistry for ${team.name}:`, chemError);
          errorCount++;
          continue; // Skip to next team on error
        }
      } catch (error) {
        console.error(`❌ Error processing ${team?.name || 'unknown team'}:`, error.message);
        errorCount++;
      }
    }

    // 7. Print summary
    console.log('\n🏁 NBA Team Chemistry Update Complete');
    console.log('================================');
    console.log(`✅ Teams Updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Sort teams by chemistry score (highest first)
    teamScores.sort((a, b) => b.score - a.score);
    
    console.log('\n🏆 Top 5 Teams by Chemistry:');
    teamScores.slice(0, 5).forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name}: ${team.score}/100 (${team.players} players)`);
      console.log(`      Elements - Fire: ${team.elements.Fire}, Earth: ${team.elements.Earth}, Air: ${team.elements.Air}, Water: ${team.elements.Water}`);
      console.log(`      Balance: ${team.elements.balance}, Synergy: ${team.elements.synergy}, Diversity: ${team.elements.diversity}`);
    });
    
    // Calculate average score
    const avgScore = teamScores.reduce((sum, team) => sum + team.score, 0) / (teamScores.length || 1);
    console.log(`\n📊 Average Team Chemistry: ${avgScore.toFixed(1)}/100`);
    
    const duration = (new Date() - startTime) / 1000;
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log('================================');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
