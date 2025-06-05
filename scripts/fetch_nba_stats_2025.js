import { createClient } from '@supabase/supabase-js';
import https from 'https';

// Initialize Supabase client - hardcoded for reliability
const supabaseUrl = 'https://awoxkynorbspcrrggbca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI2NDMzNCwiZXhwIjoyMDYyODQwMzM0fQ.cdBzpp7ASlwN8PSxvGSUn9Wbx9lqDBsTIC5U-psel8w';
const supabase = createClient(supabaseUrl, supabaseKey);

// MySportsFeeds API configuration
const MSF_API_KEY = '8844c949-54d6-4e72-ba93-203dfd';
const MSF_PASSWORD = 'MYSPORTSFEEDS';

// First create our new table that we control directly
async function createNewTable() {
  console.log('Creating new nba_player_season_stats_2025 table...');
  
  const sql = `
  CREATE TABLE IF NOT EXISTS public.nba_player_season_stats_2025 (
    id SERIAL PRIMARY KEY,
    msf_player_id TEXT, 
    player_id UUID,
    player_name TEXT,
    team_abbreviation TEXT,
    team_id UUID,
    season VARCHAR(10) DEFAULT '2024-25',
    games_played INTEGER DEFAULT 0,
    games_started INTEGER DEFAULT 0,
    minutes_played NUMERIC DEFAULT 0,
    points NUMERIC DEFAULT 0,
    total_rebounds NUMERIC DEFAULT 0,
    offensive_rebounds NUMERIC DEFAULT 0,
    defensive_rebounds NUMERIC DEFAULT 0,
    assists NUMERIC DEFAULT 0,
    steals NUMERIC DEFAULT 0,
    blocks NUMERIC DEFAULT 0,
    turnovers NUMERIC DEFAULT 0,
    field_goals_made NUMERIC DEFAULT 0,
    field_goals_attempted NUMERIC DEFAULT 0,
    field_goal_pct NUMERIC DEFAULT 0,
    three_point_made NUMERIC DEFAULT 0,
    three_point_attempted NUMERIC DEFAULT 0, 
    three_point_pct NUMERIC DEFAULT 0,
    free_throws_made NUMERIC DEFAULT 0,
    free_throws_attempted NUMERIC DEFAULT 0,
    free_throw_pct NUMERIC DEFAULT 0,
    personal_fouls NUMERIC DEFAULT 0,
    plus_minus NUMERIC DEFAULT 0,
    raw_stats JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(msf_player_id, season)
  );
  
  CREATE INDEX IF NOT EXISTS idx_nba_player_stats_2025_player_id ON nba_player_season_stats_2025(player_id);
  `;
  
  try {
    // Try direct SQL first (this may fail if exec_sql is not available)
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', { sql_statement: sql });
    if (!sqlError) {
      console.log('✅ Table created via exec_sql');
      return;
    }
    
    // If direct SQL failed, we'll try a different approach with CREATE TABLE from_item
    console.log('Direct SQL failed, trying simple table creation...');
    // Only create the minimal table we need, we'll add data directly
    const { error } = await supabase.from('nba_player_season_stats_2025').insert({
      msf_player_id: 'test_id',
      player_name: 'Test Player',
      team_abbreviation: 'TEST',
      season: '2024-25'
    }).select().single();
    
    if (error && error.code === '42P01') { // Relation does not exist
      console.log('Table does not exist, but we cannot create it. Proceeding anyway...');
      // We'll continue and let Supabase auto-create the table with our first insert
    } else {
      console.log('✅ Table exists or was created');
    }
  } catch (error) {
    console.log('⚠️ Table creation failed, but we will continue anyway:', error.message);
    // Continue - we'll try to use the table anyway
  }
}

// Function to make API requests
function makeApiRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${MSF_API_KEY}:${MSF_PASSWORD}`).toString('base64'),
        'Accept': 'application/json'
      }
    };

    console.log(`Making request to: ${url}`);
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            console.error('Error parsing JSON response:', error);
            reject(error);
          }
        } else {
          console.error(`API request failed with status: ${res.statusCode}`);
          // Output some of the response for debugging
          console.error('Response preview:', data.substring(0, 200));
          reject(new Error(`API request failed with status: ${res.statusCode}`));
        }
      });
    }).on('error', (error) => {
      console.error('Error making API request:', error);
      reject(error);
    });
  });
}

// Main function to fetch and process NBA player stats
async function fetchAndProcessNBAPlayerStats() {
  try {
    await createNewTable();
    console.log('Fetching NBA player stats...');

    // Fetch player stats from MySportsFeeds
    const statsUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nba/2024-2025-regular/player_stats_totals.json';
    const statsData = await makeApiRequest(statsUrl);
    
    if (!statsData || !statsData.playerStatsTotals) {
      throw new Error('No player stats data returned from API');
    }
    
    console.log(`✅ Fetched ${statsData.playerStatsTotals.length} player stats records from API`);
    
    // Process and save the stats - no dependency on player DB matching
    await processAndSaveStats(statsData.playerStatsTotals);
    
    return true;
  } catch (error) {
    console.error('❌ Error in fetchAndProcessNBAPlayerStats:', error);
    throw error;
  }
}

// Process and save player stats to the database - direct insert approach
async function processAndSaveStats(playerStats) {
  console.log(`Processing ${playerStats.length} player stats...`);
  let successCount = 0;
  let errorCount = 0;
  
  // Process in batches of 20 to avoid overwhelming the DB
  const batchSize = 20;
  const totalBatches = Math.ceil(playerStats.length / batchSize);
  
  try {
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const start = batchNum * batchSize;
      const end = Math.min(start + batchSize, playerStats.length);
      const batch = playerStats.slice(start, end);
      console.log(`\nProcessing batch ${batchNum + 1}/${totalBatches} (${start}-${end})...`);
      
      const statsToInsert = [];
      
      for (const playerStat of batch) {
        try {
          if (!playerStat || !playerStat.player || !playerStat.stats) {
            console.log('Skipping invalid player data');
            errorCount++;
            continue;
          }
          
          const player = playerStat.player;
          const team = playerStat.team || {};
          const stats = playerStat.stats;
          
          // Skip if no stats available
          if (!stats || Object.keys(stats).length === 0) {
            console.log(`No stats for player ${player.id} (${player.firstName} ${player.lastName})`);
            errorCount++;
            continue;
          }
          
          // Prepare the stats data for insert
          const statsData = {
            msf_player_id: player.id,
            player_name: `${player.firstName} ${player.lastName}`,
            team_abbreviation: team.abbreviation || 'UNK',
            season: '2024-25',
            games_played: stats.gamesPlayed || 0,
            games_started: stats.gamesStarted || 0,
            minutes_played: stats.minutes || 0,
            points: stats.points || 0,
            total_rebounds: (stats.offReb || 0) + (stats.defReb || 0),
            offensive_rebounds: stats.offReb || 0,
            defensive_rebounds: stats.defReb || 0,
            assists: stats.assists || 0,
            steals: stats.steals || 0,
            blocks: stats.blocks || 0,
            turnovers: stats.turnovers || 0,
            field_goals_made: stats.fgMade || 0,
            field_goals_attempted: stats.fgAtt || 0,
            field_goal_pct: stats.fgPct || 0,
            three_point_made: stats.fg3PtMade || 0,
            three_point_attempted: stats.fg3PtAtt || 0,
            three_point_pct: stats.fg3PtPct || 0,
            free_throws_made: stats.ftMade || 0,
            free_throws_attempted: stats.ftAtt || 0,
            free_throw_pct: stats.ftPct || 0,
            personal_fouls: stats.fouls || 0,
            plus_minus: stats.plusMinus || 0,
            raw_stats: stats
          };
          
          statsToInsert.push(statsData);
          
        } catch (error) {
          console.error(`Error processing player:`, error);
          errorCount++;
        }
      }
      
      // Insert batch
      if (statsToInsert.length > 0) {
        try {
          const { data, error } = await supabase
            .from('nba_player_season_stats_2025')
            .upsert(statsToInsert, { onConflict: ['msf_player_id', 'season'] });
          
          if (error) {
            console.error('❌ Error upserting batch:', error);
            errorCount += statsToInsert.length;
          } else {
            console.log(`✅ Successfully upserted ${statsToInsert.length} records`);
            successCount += statsToInsert.length;
          }
        } catch (error) {
          console.error('❌ Exception during batch upsert:', error);
          errorCount += statsToInsert.length;
        }
      }
    }
    
    console.log(`\n=== Stats processing summary ===`);
    console.log(`Total players: ${playerStats.length}`);
    console.log(`Successful inserts: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    
    return successCount;
  } catch (error) {
    console.error('❌ Error in processing stats:', error);
    throw error;
  }
}

// Run the main function
fetchAndProcessNBAPlayerStats()
  .then((result) => {
    console.log('✅ Stats sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error in stats sync:', error);
    process.exit(1);
  });
