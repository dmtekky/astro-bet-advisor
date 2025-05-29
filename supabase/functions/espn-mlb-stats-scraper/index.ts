// Minimal Supabase Edge Function
export default async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const requestBody = await req.json();
    const { team_abbr } = requestBody;
    
    // Simple response
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Minimal function is working',
        team_abbr,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

async function processAllTeams(supabase: any, season: number) {
  const { data: teams, error } = await supabase
    .from('mlb_team_espn_mappings')
    .select('*')
    .eq('active', true);
  if (error) throw error;
  const results = [];
  for (const team of teams) {
    try {
      console.log(`Processing team: ${team.espn_name}`);
      const teamResult = await processSingleTeam(supabase, team, season);
      results.push({
        team: team.espn_name,
        players_processed: teamResult.processed,
        players_mapped: teamResult.mapped,
        players_errors: teamResult.errors
      });
      await sleep(2000);
    } catch (error) {
      console.error(`Error processing team ${team.espn_name}:`, error);
      results.push({
        team: team.espn_name,
        error: error.message
      });
    }
  }
  return new Response(
    JSON.stringify({
      status: 'success',
      teams_processed: results.length,
      results
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function processTeam(supabase: any, team_abbr: string, season: number) {
  console.log(`[processTeam] Starting to process team with abbreviation: ${team_abbr} for season: ${season}`);
  
  try {
    const { data: team, error } = await supabase
      .from('mlb_team_espn_mappings')
      .select('*')
      .eq('espn_abbr', team_abbr)
      .eq('active', true)
      .single();
      
    if (error) {
      console.error('[processTeam] Error fetching team data:', error);
      throw error;
    }
    
    console.log('[processTeam] Retrieved team data:', JSON.stringify(team, null, 2));
    
    if (!team) {
      throw new Error(`No active team found with abbreviation: ${team_abbr}`);
    }
    
    const result = await processSingleTeam(supabase, team, season);
    
    console.log(`[processTeam] Successfully processed team ${team.espn_name}. Results:`, result);
    
    return new Response(
      JSON.stringify({
        status: 'success',
        team: team.espn_name,
        ...result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[processTeam] Error processing team:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
        team: team_abbr
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function processSingleTeam(supabase: any, team: any, season: number) {
  console.log('Starting processSingleTeam with team:', JSON.stringify(team, null, 2));
  console.log('Season:', season);
  
  if (!team.espn_id) {
    throw new Error(`Missing espn_id for team: ${team.espn_name}`);
  }
  
  try {
    // First, get the roster to get player IDs
    const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${team.espn_id}/roster`;
    console.log(`[processSingleTeam] Fetching roster from: ${rosterUrl}`);
    
    const rosterResponse = await fetch(rosterUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.espn.com/'
      }
    });
    
    if (!rosterResponse.ok) {
      const errorText = await rosterResponse.text();
      console.error(`[processSingleTeam] Failed to fetch roster: ${rosterResponse.status} ${rosterResponse.statusText}`, errorText);
      throw new Error(`Failed to fetch roster: ${rosterResponse.status} ${rosterResponse.statusText}`);
    }
    
    const rosterData = await rosterResponse.json();
    
    // Log the raw response structure for debugging
    console.log(`[processSingleTeam] Raw roster data structure:`, JSON.stringify({
      timestamp: rosterData.timestamp,
      status: rosterData.status,
      season: rosterData.season,
      team: rosterData.team?.displayName,
      athletesCount: Array.isArray(rosterData.athletes) ? rosterData.athletes.length : 'Not an array',
      athletesType: typeof rosterData.athletes,
      athletesSample: Array.isArray(rosterData.athletes) && rosterData.athletes.length > 0 
        ? rosterData.athletes[0] 
        : 'No athletes in array',
      topLevelKeys: Object.keys(rosterData)
    }, null, 2));
    console.log(`[processSingleTeam] Roster API response for team ${team.espn_name} - Top-level keys:`, Object.keys(rosterData));
    console.log(`[processSingleTeam] Full roster data sample (first 2 players):`, 
      JSON.stringify(rosterData.athletes?.slice(0, 2), null, 2));
    
    // Extract player IDs from the roster
    const playerIds: string[] = [];
    
    // First, try to extract players from the athletes array if it exists
    if (rosterData.athletes && Array.isArray(rosterData.athletes)) {
      console.log(`[processSingleTeam] Found ${rosterData.athletes.length} players in rosterData.athletes`);
      
      rosterData.athletes.forEach((athlete: any) => {
        try {
          if (athlete.id) {
            const playerId = athlete.id;
            const playerName = athlete.fullName || athlete.displayName || 'Unknown';
            const playerPosition = athlete.position?.displayName || 'Unknown';
            
            playerIds.push(playerId);
            console.log(`[processSingleTeam] Found player: ${playerName} (ID: ${playerId}, Position: ${playerPosition})`);
          }
        } catch (error) {
          console.error(`[processSingleTeam] Error processing athlete:`, error);
        }
      });
    } else {
      console.log('[processSingleTeam] No athletes array found in roster data or it is not an array');
    }
    
    // If no players found in athletes array, try to find them in position groups
    if (playerIds.length === 0) {
      console.log('[processSingleTeam] Looking for players in position groups...');
      
      // Check if we have position groups with players
      const positionGroups = [
        'catcher', 'first_base', 'second_base', 'third_base', 'shortstop',
        'left_field', 'center_field', 'right_field', 'designated_hitter',
        'starting_pitcher', 'relief_pitcher', 'pitcher'
      ];
      
      positionGroups.forEach(position => {
        if (rosterData[position] && Array.isArray(rosterData[position])) {
          console.log(`[processSingleTeam] Found ${rosterData[position].length} players in position: ${position}`);
          
          rosterData[position].forEach((player: any) => {
            try {
              if (player.id) {
                const playerId = player.id;
                const playerName = player.fullName || player.displayName || 'Unknown';
                playerIds.push(playerId);
                console.log(`[processSingleTeam] Found ${position} player: ${playerName} (ID: ${playerId})`);
              }
            } catch (error) {
              console.error(`[processSingleTeam] Error processing ${position} player:`, error);
            }
          });
        }
      });
    }
    
    // If still no players found, try to find any player-like objects in the response
    if (playerIds.length === 0) {
      console.log('[processSingleTeam] Performing deep search for player objects...');
      
      const findPlayers = (obj: any, path: string = ''): void => {
        if (!obj || typeof obj !== 'object') return;
        
        // Check if this looks like a player object
        if (obj.id && (obj.fullName || obj.displayName)) {
          const playerId = obj.id;
          const playerName = obj.fullName || obj.displayName || 'Unknown';
          
          if (!playerIds.includes(playerId)) {
            playerIds.push(playerId);
            console.log(`[processSingleTeam] Found player in ${path}: ${playerName} (ID: ${playerId})`);
          }
          return;
        }
        
        // Recursively search through object properties
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              findPlayers(item, `${newPath}[${index}]`);
            });
          } else if (value && typeof value === 'object') {
            findPlayers(value, newPath);
          }
        });
      };
      
      // Start the recursive search
      findPlayers(rosterData);
    }
    
    console.log(`[processSingleTeam] Total players found: ${playerIds.length}`);
    
    console.log(`[processSingleTeam] Found ${playerIds.length} players in the roster for ${team.espn_name}`);
    
    if (playerIds.length === 0) {
      console.error('[processSingleTeam] No player IDs found in roster data. Full response:', 
        JSON.stringify(rosterData, null, 2));
      
      // Create a summary of the roster data
      const rosterSummary = {
        team: rosterData.team?.displayName || 'Unknown Team',
        rosterCount: 0,
        positions: {},
        samplePlayers: [],
        availableKeys: Object.keys(rosterData)
      };
      
      // Helper function to process players
      const processPlayer = (player: any, positionGroup?: string) => {
        if (!player?.id) return;
        
        rosterSummary.rosterCount++;
        const position = player.position?.displayName || positionGroup || 'Unknown';
        rosterSummary.positions[position] = (rosterSummary.positions[position] || 0) + 1;
        
        if (rosterSummary.samplePlayers.length < 3) {
          rosterSummary.samplePlayers.push({
            id: player.id,
            name: player.fullName || player.displayName || 'Unknown',
            position: position,
            jersey: player.jersey || player.number || 'N/A'
          });
        }
      };
      
      // Process players from different possible locations in the response
      if (rosterData.athletes?.length > 0) {
        rosterData.athletes.slice(0, 5).forEach(processPlayer);
      }
      
      if (rosterData.athletesByPosition?.length > 0) {
        rosterData.athletesByPosition.forEach((group: any) => {
          if (group.items?.length > 0) {
            group.items.slice(0, 5).forEach((player: any) => 
              processPlayer(player, group.position?.displayName || group.position)
            );
          }
        });
      }
      
      return {
        processed: 0,
        mapped: 0,
        errors: 0,
        debug: {
          message: 'No player IDs found in roster data',
          rosterSummary: rosterSummary,
          rosterUrl: rosterUrl
        }
      };
    }
    
    // Fetch stats for each player (limiting to first 5 for testing)
    const allPlayerStats = [];
    let processed = 0;
    let mapped = 0;
    let errors = 0;
    
    // Process players in small batches to avoid rate limiting
    const batchSize = 2; // Reduced batch size to be more conservative
    const maxPlayers = 5; // Limit to first 5 players for testing
    
    console.log(`[processSingleTeam] Starting to process stats for ${Math.min(playerIds.length, maxPlayers)} players`);
    
    for (let i = 0; i < Math.min(playerIds.length, maxPlayers); i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      console.log(`[processSingleTeam] Processing batch ${i / batchSize + 1}:`, batch);
      
      const batchPromises = batch.map(playerId => {
        console.log(`[processSingleTeam] Fetching stats for player ${playerId}...`);
        return fetchPlayerStats(playerId, season)
          .then(stats => {
            console.log(`[processSingleTeam] Successfully fetched stats for player ${playerId}`);
            return stats;
          })
          .catch(error => {
            console.error(`[processSingleTeam] Error fetching stats for player ${playerId}:`, error.message);
            errors++;
            return null;
          });
      });
      
      try {
        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(Boolean);
        
        console.log(`[processSingleTeam] Batch ${i / batchSize + 1} results:`, {
          total: batch.length,
          success: validResults.length,
          failed: batch.length - validResults.length
        });
        
        allPlayerStats.push(...validResults);
        processed += batch.length;
        mapped += validResults.length;
        
        // Add a small delay between batches
        if (i + batchSize < Math.min(playerIds.length, maxPlayers)) {
          console.log(`[processSingleTeam] Waiting 1.5 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (batchError) {
        console.error(`[processSingleTeam] Error processing batch ${i / batchSize + 1}:`, batchError);
        errors += batch.length; // Count all in batch as errors
      }
    }
    console.log(`Found ${allPlayerStats.length} batting players with stats for ${team.espn_name}`);
    
    // Get team ID for mapping
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('name', team.espn_name)
      .single();
      
    if (teamError && teamError.code !== 'PGRST116') {
      throw teamError;
    }
    
    const team_id = teamData?.id;
    let processed = 0;
    let mapped = 0;
    let errors = 0;
    
    // Process each player's stats
    for (const playerStat of allPlayerStats) {
      try {
        processed++;
        const { mapped: playerMapped, player_id } = await mapPlayerByName(
          supabase,
          playerStat.name,
          team_id
        );
        if (playerMapped) {
          mapped++;
          await updatePlayerStats(supabase, player_id, playerStat, season, team_id);
        } else {
          console.log(`Could not map player: ${playerStat.name}`);
        }
      } catch (error) {
        console.error(`Error processing player ${playerStat.name}:`, error);
        errors++;
      }
      await sleep(100);
    }
    
    return { 
      processed, 
      mapped, 
      errors,
      debug: {
        message: 'Processed players',
        playerCount: allPlayerStats.length,
        playerIds: playerIds.slice(0, 5) // Return first 5 player IDs for debugging
      }
    };
  } catch (error) {
    console.error(`Error in processSingleTeam for team ${team.espn_name}:`, error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

async function fetchPlayerStats(playerId: string, season: string | number) {
  const statsUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/athletes/${playerId}/stats?season=${season}`;
  console.log(`[fetchPlayerStats] Fetching stats for player ${playerId} from: ${statsUrl}`);
  
  try {
    const response = await fetch(statsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.espn.com/'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchPlayerStats] Failed to fetch stats for player ${playerId} (${response.status} ${response.statusText}):`, errorText);
      return null;
    }
    
    const data = await response.json();
    
    // Log the structure of the response for debugging
    console.log(`[fetchPlayerStats] Raw stats data for player ${playerId}:`, JSON.stringify({
      playerId,
      status: response.status,
      statsAvailable: !!data.stats,
      statCategories: data.stats?.map((s: any) => ({
        name: s.name,
        displayName: s.displayName,
        statsCount: s.splits?.length || 0
      })) || [],
      athleteInfo: data.athlete ? {
        id: data.athlete.id,
        fullName: data.athlete.fullName,
        displayName: data.athlete.displayName,
        position: data.athlete.position
      } : 'No athlete info',
      topLevelKeys: Object.keys(data)
    }, null, 2));
    
    // Try to extract the player's name from the response
    const playerName = data.athlete?.fullName || data.athlete?.displayName || `Player_${playerId}`;
    console.log(`[fetchPlayerStats] Successfully fetched stats for ${playerName} (${playerId})`);
    
    // Parse the stats from the response
    let playerStats: Record<string, any> = {
      name: playerName,
      espn_id: playerId
    };
    
    // Try to find batting stats in the response
    if (data.stats && Array.isArray(data.stats)) {
      // Look for batting stats in the stats array
      const battingStats = data.stats.find((statGroup: any) => 
        statGroup.name === 'batting' || 
        statGroup.displayName?.toLowerCase().includes('batting')
      );
      
      if (battingStats?.splits?.[0]?.stats) {
        // Found batting stats in the splits
        Object.entries(battingStats.splits[0].stats).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            playerStats[key] = value;
          }
        });
      } else if (data.athlete?.statistics) {
        // Try to get stats from athlete statistics
        playerStats = { ...playerStats, ...data.athlete.statistics };
      }
    }
    
    // Add some basic stats if they're missing but available elsewhere
    if (!playerStats.battingAverage && data.athlete?.statistics?.batting?.avg) {
      playerStats.battingAverage = parseFloat(data.athlete.statistics.batting.avg);
    }
    
    console.log(`[fetchPlayerStats] Parsed stats for ${playerName}:`, 
      Object.keys(playerStats).filter(k => k !== 'rawData')
    );
    
    return {
      ...playerStats,
      rawData: data // Include full response for debugging
    };
  } catch (error) {
    console.error(`[fetchPlayerStats] Error fetching stats for player ${playerId}:`, error);
    return null;
  }
}

function parseTeamBattingStatsFromJson(json: any) {
  // ... (rest of the code remains the same)
  const allPlayerStats = [];
  try {
    let athletesList: any[] = [];
    let sourcePath = '';

    // Try to find the list of athletes/players in common locations
    if (json.results && json.results.athletes && Array.isArray(json.results.athletes)) {
      athletesList = json.results.athletes;
      sourcePath = 'json.results.athletes';
    } else if (json.athletes && Array.isArray(json.athletes)) {
      athletesList = json.athletes;
      sourcePath = 'json.athletes';
    } else if (json.results && json.results.splits && json.results.splits.categories) {
      const categories = json.results.splits.categories;
      const battingCategory = categories.find((cat: any) => cat.name === 'batting' || cat.displayName === 'Batting');
      if (battingCategory && battingCategory.leaders && Array.isArray(battingCategory.leaders)) {
        // This is the structure we tried before, transform leaders to look like athletes
        sourcePath = 'json.results.splits.categories[...].leaders';
        const statHeaders = battingCategory.statHeaders;
        if (!statHeaders) {
          console.log(`parseTeamBattingStatsFromJson: '${sourcePath}' found, but missing statHeaders.`);
          return [];
        }
        for (const leader of battingCategory.leaders) {
          if (leader.athlete) {
            // Construct an 'athlete-like' object from the leader
            const athleteObj = { ...leader.athlete, leaderStats: leader.stats, statHeadersFromLeader: statHeaders };
            athletesList.push(athleteObj);
          }
        }
      } else {
        console.log('parseTeamBattingStatsFromJson: Path json.results.splits.categories found, but no batting category with leaders.');
      }
    }

    if (athletesList.length === 0) {
      console.log('parseTeamBattingStatsFromJson: No list of athletes/players found in expected locations.');
      return [];
    }
    console.log(`parseTeamBattingStatsFromJson: Found ${athletesList.length} athletes/players from path: '${sourcePath}'.`);

    const statKeyMapping: Record<string, string> = {
      'GP': 'games', 'gamesPlayed': 'games',
      'AB': 'at_bats', 'atBats': 'at_bats',
      'R': 'runs', 'runsScored': 'runs',
      'H': 'hits',
      '2B': 'doubles', 'doubles': 'doubles',
      '3B': 'triples', 'triples': 'triples',
      'HR': 'home_runs', 'homeRuns': 'home_runs',
      'RBI': 'rbi', 'RBIs': 'rbi',
      'BB': 'walks', 'baseOnBalls': 'walks',
      'SO': 'strikeouts', 'strikeOuts': 'strikeouts', 'K': 'strikeouts',
      'SB': 'stolen_bases', 'stolenBases': 'stolen_bases',
      'CS': 'caught_stealing', 'caughtStealing': 'caught_stealing',
      'AVG': 'batting_average', 'avg': 'batting_average', 'battingAverage': 'batting_average',
      'OBP': 'on_base_pct', 'onBasePct': 'on_base_pct',
      'SLG': 'slugging_pct', 'slugAvg': 'slugging_pct', 'sluggingPercentage': 'slugging_pct',
      'OPS': 'ops', 'onBasePlusSlugging': 'ops',
    };

    for (const athlete of athletesList) {
      const playerName = athlete.displayName || athlete.fullName || athlete.name;
      if (!playerName) continue;

      const parsedStats: Record<string, any> = { name: playerName };
      let statsSource: any = null;

      // Determine where to get stats from (direct stats object or from leader structure)
      if (athlete.leaderStats && athlete.statHeadersFromLeader) {
        // This athlete was constructed from the 'leaders' array
        const leaderRawStats = athlete.leaderStats;
        const leaderStatHeaders = athlete.statHeadersFromLeader;
        leaderStatHeaders.forEach((header: string, index: number) => {
          const dbKey = statKeyMapping[header] || statKeyMapping[header.toLowerCase()];
          if (dbKey) {
            const value = leaderRawStats[index];
            if (['batting_average', 'on_base_pct', 'slugging_pct', 'ops'].includes(dbKey)) {
              parsedStats[dbKey] = parseFloat(value || '0');
            } else {
              parsedStats[dbKey] = parseInt(value || '0', 10);
            }
          }
        });
      } else if (athlete.stats && Array.isArray(athlete.stats)) {
        // This athlete has a 'stats' array, find batting stats within it
        const battingStatsBlock = athlete.stats.find((s: any) => s.name === 'batting' || s.displayName === 'Batting' || s.type === 'batting' || s.group === 'batting');
        if (battingStatsBlock && battingStatsBlock.stats && Array.isArray(battingStatsBlock.stats)) {
           // Batting stats are an array of { name, value } objects
           statsSource = {};
           battingStatsBlock.stats.forEach((s: any) => { statsSource[s.name] = s.value; });
        } else if (battingStatsBlock) { // sometimes stats are directly on the batting block
           statsSource = battingStatsBlock;
        }
      } else if (athlete.splits && athlete.splits.categories) { // Alternative structure sometimes seen
         const bCat = athlete.splits.categories.find((c:any) => c.name === 'batting');
         if (bCat && bCat.stats) statsSource = bCat.stats.reduce((obj:any, item:any) => (obj[item.name] = item.value, obj) ,{});
      }

      if (statsSource) {
         // We have an object of stat_name: value pairs
        for (const key in statsSource) {
          const dbKey = statKeyMapping[key] || statKeyMapping[key.toLowerCase()];
          if (dbKey) {
            const value = statsSource[key];
            if (['batting_average', 'on_base_pct', 'slugging_pct', 'ops'].includes(dbKey)) {
              parsedStats[dbKey] = parseFloat(value || '0');
            } else {
              parsedStats[dbKey] = parseInt(String(value || '0'), 10);
            }
          }
        }
      }
      
      // Only add if we actually parsed some stats beyond just the name
      if (Object.keys(parsedStats).length > 1) {
        allPlayerStats.push(parsedStats);
      }
    }
  } catch (error) {
    console.error('Error in parseTeamBattingStatsFromJson:', error);
    console.error('Problematic JSON snippet (full json, first 1000 chars):', JSON.stringify(json, null, 2).substring(0,1000));
    return [];
  }
  return allPlayerStats;
}


function parseTeamBattingStats(html: string) {
  const players = [];
  try {
    const tableRegex = /<table class="Table Table--align-right.*?"[\s\S]*?<\/table>/g;
    const tableMatches = html.match(tableRegex);
    if (!tableMatches || tableMatches.length === 0) {
      console.log("No stats tables found in HTML");
      return players;
    }
    const battingTable = tableMatches[0];
    const headerRegex = /<tr class="Table__TR Table__even".*?>([\s\S]*?)<\/tr>/;
    const headerMatch = battingTable.match(headerRegex);
    if (!headerMatch) {
      console.log("Could not find header row in table");
      return players;
    }
    const headerCells = headerMatch[1].match(/<th.*?>(.*?)<\/th>/g) || [];
    const headerLabels = headerCells.map(cell => cell.replace(/<[^>]*>/g, '').trim());
    const nameIdx = 0;
    const gamesIdx = headerLabels.indexOf('GP');
    const abIdx = headerLabels.indexOf('AB');
    const runsIdx = headerLabels.indexOf('R');
    const hitsIdx = headerLabels.indexOf('H');
    const doublesIdx = headerLabels.indexOf('2B');
    const triplesIdx = headerLabels.indexOf('3B');
    const hrIdx = headerLabels.indexOf('HR');
    const rbiIdx = headerLabels.indexOf('RBI');
    const sbIdx = headerLabels.indexOf('SB');
    const csIdx = headerLabels.indexOf('CS');
    const bbIdx = headerLabels.indexOf('BB');
    const soIdx = headerLabels.indexOf('SO');
    const avgIdx = headerLabels.indexOf('AVG');
    const obpIdx = headerLabels.indexOf('OBP');
    const slgIdx = headerLabels.indexOf('SLG');
    const opsIdx = headerLabels.indexOf('OPS');
    const playerRowRegex = /<tr class="Table__TR Table__TR--sm Table__even".*?>([\s\S]*?)<\/tr>/g;
    let playerRowMatch;
    while ((playerRowMatch = playerRowRegex.exec(battingTable)) !== null) {
      const cells = playerRowMatch[1].match(/<td.*?>([\s\S]*?)<\/td>/g) || [];
      if (cells.length < 5) continue;
      const nameCell = cells[nameIdx];
      const nameMatch = nameCell.match(/>([^<]+)<\/a>/);
      if (!nameMatch) continue;
      const playerName = nameMatch[1].trim();
      const playerStats = {
        name: playerName,
        games: parseInt(cells[gamesIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        at_bats: parseInt(cells[abIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        runs: parseInt(cells[runsIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        hits: parseInt(cells[hitsIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        doubles: parseInt(cells[doublesIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        triples: parseInt(cells[triplesIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        home_runs: parseInt(cells[hrIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        rbi: parseInt(cells[rbiIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        stolen_bases: parseInt(cells[sbIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        caught_stealing: parseInt(cells[csIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        walks: parseInt(cells[bbIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        strikeouts: parseInt(cells[soIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        batting_average: parseFloat(cells[avgIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        on_base_pct: parseFloat(cells[obpIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        slugging_pct: parseFloat(cells[slgIdx]?.replace(/<[^>]*>/g, '').trim() || '0'),
        ops: parseFloat(cells[opsIdx]?.replace(/<[^>]*>/g, '').trim() || '0')
      };
      players.push(playerStats);
    }
  } catch (error) {
    console.error("Error parsing batting stats:", error);
  }
  return players;
}

async function mapPlayerByName(supabase: any, espnName: string, team_id: string | null) {
  const { data: exactMatch } = await supabase
    .from('players')
    .select('id')
    .eq('espn_name', espnName)
    .maybeSingle();
  if (exactMatch) {
    return { mapped: true, player_id: exactMatch.id };
  }
  const nameParts = espnName.split(' ');
  let query = supabase
    .from('players')
    .select('id, first_name, last_name')
    .eq('external_source', 'mlb')
    .ilike('first_name', nameParts[0]);
  if (nameParts.length > 1) {
    const lastName = nameParts.slice(1).join(' ');
    query = query.ilike('last_name', lastName);
  }
  if (team_id) {
    query = query.eq('team_id', team_id);
  }
  const { data: players } = await query;
  if (players && players.length === 1) {
    await supabase
      .from('players')
      .update({ espn_name: espnName, espn_last_checked: new Date().toISOString() })
      .eq('id', players[0].id);
    return { mapped: true, player_id: players[0].id };
  } else if (players && players.length > 1) {
    console.log(`Multiple matches found for ${espnName}`);
    return { mapped: false, player_id: null };
  } else {
    console.log(`No matches found for ${espnName}`);
    return { mapped: false, player_id: null };
  }
}

async function updatePlayerStats(
  supabase: any, 
  player_id: string, 
  stats: any, 
  season: number, 
  team_id: string | null
) {
  const { error } = await supabase
    .from('baseball_stats')
    .upsert({
      player_id,
      season,
      team_id,
      games: stats.games,
      at_bats: stats.at_bats,
      runs: stats.runs,
      hits: stats.hits,
      doubles: stats.doubles,
      triples: stats.triples,
      home_runs: stats.home_runs,
      rbi: stats.rbi,
      stolen_bases: stats.stolen_bases,
      caught_stealing: stats.caught_stealing,
      walks: stats.walks,
      strikeouts: stats.strikeouts,
      batting_average: stats.batting_average,
      on_base_pct: stats.on_base_pct,
      slugging_pct: stats.slugging_pct,
      ops: stats.ops,
      last_updated: new Date().toISOString(),
      data_source: 'espn'
    }, {
      onConflict: 'player_id,season'
    });
  if (error) {
    throw error;
  }
  return true;
}
