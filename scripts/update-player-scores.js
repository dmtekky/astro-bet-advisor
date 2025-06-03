#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // For making HTTP requests in Node.js
import { calculateTeamChemistry } from '../src/utils/teamChemistry.js';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

// Get API URL from command line argument or environment variable
const astroApiUrl = process.argv[2] || process.env.ASTRO_API_URL;

console.log('Configuration:', { 
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseKey,
  astroApiUrl: astroApiUrl || 'Not provided'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

if (!astroApiUrl) {
  console.warn('Warning: No astrodata API URL provided. Astrodata will not be fetched for chemistry.');
  console.warn('Usage: node scripts/update-player-scores.js [astro-api-url]');
} else {
  console.log(`✅ Will fetch astrodata from: ${astroApiUrl}`);
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

// Calculate astro influence score based on consistent player performance metrics
function calculateAstroInfluenceScore(player) {
  if (!player) return 0;
  
  // Base score from player stats with consistent weights
  let score = 0;
  
  // Batting stats with consistent weights
  if (player.stats_batting_hits) score += player.stats_batting_hits * 0.5;
  if (player.stats_batting_runs) score += player.stats_batting_runs * 0.7;
  if (player.stats_batting_homeruns) score += player.stats_batting_homeruns * 1.8;
  
  // Recent performance modifier (capped at 30% boost)
  const recentGames = player.stats_games_played || 0;
  const recentPerformanceModifier = 1 + (Math.min(recentGames, 30) / 100); // 1% per game up to 30%
  score *= recentPerformanceModifier;
  
  // Normalize to 0-100 range with 2 decimal places
  score = Math.min(100, Math.max(0, score));
  return parseFloat(score.toFixed(2));
}

async function updatePlayerScores() {
  const startTime = new Date();
  console.log(`🚀 Starting player score update at ${startTime.toISOString()}`);
  
  try {
    // Fetch all players with stats (in batches of 1000)
    console.log('Fetching players with stats...');
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
        
      if (error) {
        console.error('❌ Error fetching players:', error);
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
      console.log('⚠️  No players found in the database');
      return false;
    }
    
    console.log(`✅ Found ${allPlayers.length} players to process`);
    
    // Process players in batches
    const batchSizeProcess = 50;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allPlayers.length; i += batchSizeProcess) {
      const batch = allPlayers.slice(i, i + batchSizeProcess);
      const updates = [];
      
      // Prepare batch updates
      for (const player of batch) {
        const impactScore = calculateImpactScore(player);
        const astroScore = calculateAstroInfluenceScore(player);
        
        // Always update scores for every player
        updates.push({
          player_id: player.player_id,
          impact_score: impactScore,
          astro_influence_score: astroScore,
          updated_at: new Date().toISOString()
        });
      }
      
      // Process batch updates
      if (updates.length > 0) {
        const { data, error } = await supabase
          .from('baseball_players')
          .upsert(updates, { onConflict: 'player_id' });
          
        if (error) {
          console.error(`❌ Error updating batch ${i / batchSizeProcess + 1}:`, error);
          errorCount += updates.length;
        } else {
          updatedCount += updates.length;
          console.log(`   Updated ${updates.length} players (${updatedCount} total)`);
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    console.log(`\n🎉 Player score update completed!`);
    console.log(`   Total players processed: ${allPlayers.length}`);
    console.log(`   Players updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Duration: ${duration.toFixed(2)} seconds`);
    console.log(`   Finished at: ${endTime.toISOString()}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Helper to get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper to fetch astrodata for a given date
async function fetchAstroDataForDate(dateString) {
  if (!astroApiUrl) {
    console.log('Skipping astrodata fetch as ASTRO_API_URL is not set.');
    return null;
  }
  try {
    const response = await fetch(`${astroApiUrl}?date=${dateString}`);
    if (!response.ok) {
      console.error(`Error fetching astrodata for ${dateString}: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    console.log(`✨ Successfully fetched astrodata for ${dateString}`);
    return data;
  } catch (error) {
    console.error(`❌ Exception fetching astrodata for ${dateString}:`, error.message);
    return null;
  }
}

// Update team chemistry data based on player scores and astro data
async function updateTeamChemistry() {
  const startTime = new Date();
  console.log(`\n🔮 Starting team chemistry update at ${startTime.toISOString()}`);
  
  try {
    // Check if the team_chemistry table exists
    let tableExists = false;
    let tableError = null;
    
    try {
      const { data, error } = await supabase
        .from('team_chemistry')
        .select('*')
        .limit(1);
      
      tableExists = !error;
      tableError = error;
    } catch (err) {
      tableError = err;
    }
    
    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating team_chemistry table...');
      const { error: createTableError } = await supabase.rpc('create_team_chemistry_table');
      
      if (createTableError) {
        console.error('❌ Error creating team_chemistry table:', createTableError);
        console.log('Please create the team_chemistry table manually with the following schema:');
        console.log(`
        CREATE TABLE IF NOT EXISTS public.team_chemistry (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
          overall_score NUMERIC(5,2) NOT NULL,
          elemental_balance JSONB NOT NULL,
          aspect_harmony JSONB NOT NULL,
          calculated_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(team_id)
        );
        `);
        return false;
      }
    } else if (tableError) {
      console.error('❌ Error checking for team_chemistry table:', tableError);
      return false;
    }
    
    console.log('Fetching teams with active players...');
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    
    if (teamsError) {
      throw new Error(`Error fetching teams: ${teamsError.message}`);
    }
    
    if (!teams || teams.length === 0) {
      console.log('No teams found');
      return;
    }
    
    console.log(`✅ Found ${teams.length} teams to process`);
    let errorCount = 0;
    let teamsUpdated = 0;
    let updatedCount = 0;

    // Fetch astrodata for the current date once for all teams in this run
    const currentDateStr = getCurrentDate();
    console.log(`
📅 Fetching master astrodata for date: ${currentDateStr}`);
    const masterAstroDataToday = await fetchAstroDataForDate(currentDateStr);
    if (!masterAstroDataToday) {
      console.warn('⚠️ Master astrodata for today could not be fetched. Chemistry scores might be less accurate.');
    }
    
    for (const team of teams) {
      // Map team abbreviations to match player data (some teams use different abbreviations)
      const teamAbbreviationMap = {
        'OAK': 'OAK',  // Athletics
        'WAS': 'WAS', // Nationals
        'TB': 'TB',   // Rays
        'CWS': 'CWS', // White Sox
        'LAA': 'LAA', // Angels
        'LAD': 'LAD', // Dodgers
        'NYM': 'NYM', // Mets
        'NYY': 'NYY', // Yankees
        'SD': 'SD',   // Padres
        'SF': 'SF',   // Giants
        'STL': 'STL', // Cardinals
        'KC': 'KC',   // Royals
        'CLE': 'CLE', // Guardians
        'CIN': 'CIN', // Reds
        'CHC': 'CHC', // Cubs
        'BOS': 'BOS', // Red Sox
        'BAL': 'BAL', // Orioles
        'ATL': 'ATL', // Braves
        'ARI': 'ARI', // Diamondbacks
        'COL': 'COL', // Rockies
        'DET': 'DET', // Tigers
        'HOU': 'HOU', // Astros
        'MIA': 'MIA', // Marlins
        'MIL': 'MIL', // Brewers
        'MIN': 'MIN', // Twins
        'PHI': 'PHI', // Phillies
        'PIT': 'PIT', // Pirates
        'SEA': 'SEA', // Mariners
        'TEX': 'TEX', // Rangers
        'TOR': 'TOR',  // Blue Jays
        'OAK': 'ATH',  // Athletics (using ATH as the player abbreviation)
        'ATH': 'ATH'   // Also map ATH to ATH in case the team is referenced this way
      };
      
      // Use mapped abbreviation if it exists, otherwise use the team's abbreviation
      const playerAbbreviation = teamAbbreviationMap[team.abbreviation] || team.abbreviation;
      
      console.log(`\n--- Processing team ${team.name} (${team.abbreviation}) ---`);
      console.log(`Looking for players with team_abbreviation or player_current_team_abbreviation = '${playerAbbreviation}'`);
      
      // First, let's check how many players we find with this query
      const countQuery = supabase
        .from('baseball_players')
        .select('*', { count: 'exact', head: true })
        .or(`team_abbreviation.eq.${playerAbbreviation},player_current_team_abbreviation.eq.${playerAbbreviation}`)
        .not('player_first_name', 'is', null)
        .not('player_last_name', 'is', null)
        .not('player_birth_date', 'is', null);
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error(`❌ Error counting players for team ${team.name}:`, countError);
        errorCount++;
        continue;
      }
      
      console.log(`Found ${count || 0} players for team ${team.name} (${team.abbreviation})`);
      
      // If we found players, fetch them
      if (count > 0) {
        const { data: players, error: playersError } = await supabase
          .from('baseball_players')
          .select('*')
          .or(`team_abbreviation.eq.${playerAbbreviation},player_current_team_abbreviation.eq.${playerAbbreviation}`)
          .not('player_first_name', 'is', null)
          .not('player_last_name', 'is', null)
          .not('player_birth_date', 'is', null);
          
        if (playersError) {
          console.error(`❌ Error fetching players for team ${team.name}:`, playersError);
          errorCount++;
          continue;
        }
        
        console.log(`Processing ${players.length} players for team ${team.name}`);
        
        // Map player data to the format expected by calculateTeamChemistry
        const mappedPlayers = players.map(player => ({
          id: player.id,
          birth_date: player.player_birth_date,
          impact_score: calculateImpactScore(player),
          astro_influence: calculateAstroInfluenceScore(player),
          position: player.player_position,
          is_active: true, // Assuming active unless we have data saying otherwise
          injury_status: 'active' // Default to active unless we have injury data
        }));
        
        console.log(`Calculating chemistry for ${mappedPlayers.length} mapped players`);
        
        // Calculate team chemistry using the masterAstroDataToday fetched once
        const chemistry = calculateTeamChemistry(mappedPlayers, { 
          teamAstroData: masterAstroDataToday 
        });
        
        console.log('Chemistry calculation result:', {
          score: chemistry.score,
          elements: chemistry.elements,
          aspects: chemistry.aspects,
          metadata: chemistry.metadata
        });
        
        // Prepare data for upsert
        const teamChemistryData = {
          team_id: team.id,
          team_name: team.name, // Required field
          team_abbreviation: team.abbreviation, // Required field
          score: chemistry.score, // Using 'score' instead of 'overall_score'
          elements: chemistry.elements, // Using 'elements' instead of 'elemental_balance'
          aspects: chemistry.aspects, // Using 'aspects' instead of 'aspect_harmony'
          calculated_at: new Date().toISOString(),
          last_updated: new Date().toISOString() // Using 'last_updated' instead of 'updated_at'
          // Note: metadata field removed as it doesn't exist in the database schema
        };
        
        // Upsert team chemistry data
        const { error: upsertError } = await supabase
          .from('team_chemistry')
          .upsert(teamChemistryData, { onConflict: 'team_id' });
          
        if (upsertError) {
          console.error(`❌ Error updating chemistry for team ${team.name}:`, upsertError);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Updated chemistry for team ${team.name} (${team.abbreviation}): ${chemistry.score}/100`);
        teamsUpdated++;
      } else {
        console.log(`⚠️ No players found for team ${team.name} (${team.abbreviation}), setting score to 0`);
        
        // Prepare data for upsert with score 0
        const teamChemistryData = {
          team_id: team.id,
          team_name: team.name,
          team_abbreviation: team.abbreviation,
          score: 0,
          elements: { chemistryElementScore: 0, balance: 0, fire: 0, earth: 0, air: 0, water: 0, synergyBonus: 0, diversityBonus: 0 },
          aspects: { netHarmony: 0, harmonyScore: 0, challengeScore: 0, aspects: [], score: 0 },
          calculated_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };
        
        // Upsert team chemistry data with score 0
        const { error: upsertError } = await supabase
          .from('team_chemistry')
          .upsert(teamChemistryData, { onConflict: 'team_id' });
          
        if (upsertError) {
          console.error(`❌ Error updating chemistry for team ${team.name}:`, upsertError);
          errorCount++;
        } else {
          console.log(`✅ Set chemistry to 0 for team ${team.name} (${team.abbreviation})`);
          teamsUpdated++;
        }
        continue;
      }
      
      // Small delay between teams
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    console.log(`\n🎉 Team chemistry update completed!`);
    console.log(`   Teams updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Duration: ${duration.toFixed(2)} seconds`);
    console.log(`   Finished at: ${endTime.toISOString()}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error during chemistry update:', error);
    return false;
  }
}

// Run both updates in sequence
async function updateAll() {
  const playerUpdateSuccess = await updatePlayerScores();
  console.log('\n---------------------------------------');
  
  if (playerUpdateSuccess) {
    const chemistryUpdateSuccess = await updateTeamChemistry();
    return playerUpdateSuccess && chemistryUpdateSuccess;
  }
  
  return false;
}

// Run the update
updateAll()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
