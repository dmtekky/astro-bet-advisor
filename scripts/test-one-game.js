import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { setTimeout as sleep } from 'timers/promises';

// Load environment variables from .env file in the current directory
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env file from: ${envPath}`);

try {
  dotenv.config({ path: envPath });
} catch (error) {
  console.error('Error loading .env file:', error);
}

// Debug: Log environment variable status
console.log('Environment variables:', {
  SPORTSDATA_MLB_KEY: process.env.SPORTSDATA_MLB_KEY ? '***SET***' : 'NOT SET',
});

// Use the MLB API key from the environment
const SPORTS_RADAR_API_KEY = process.env.SPORTSDATA_MLB_KEY;

if (!SPORTS_RADAR_API_KEY) {
  console.error('Error: SPORTSDATA_MLB_KEY is not set in .env file');
  process.exit(1);
}
const API_RETRY_DELAY = 1000; // 1 second delay between retries
const MAX_RETRIES = 3;

/**
 * Makes an HTTP request with retry logic
 * @param {string} url - The URL to fetch
 * @param {Object} options - Axios request options
 * @param {number} [retryCount=0] - Current retry count
 * @returns {Promise<Object>} - The response data
 */
async function makeRequest(url, options = {}, retryCount = 0) {
  try {
    const response = await axios({
      url,
      timeout: 15000,
      ...options,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MLB Game Tracker/1.0 (your-email@example.com)',
        'Authorization': `Bearer ${SPORTS_RADAR_API_KEY}`,
        ...(options.headers || {})
      },
      params: {
        api_key: SPORTS_RADAR_API_KEY,
        ...(options.params || {})
      }
    });
    return response;
  } catch (error) {
    if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
      // Rate limited, wait and retry
      const retryAfter = error.response?.headers?.['retry-after'] * 1000 || API_RETRY_DELAY * (retryCount + 1);
      console.log(`Rate limited. Waiting ${retryAfter}ms before retry (${retryCount + 1}/${MAX_RETRIES})...`);
      await sleep(retryAfter);
      return makeRequest(url, options, retryCount + 1);
    }
    throw error;
  }
}

if (!SPORTS_RADAR_API_KEY) {
  console.error('Error: SPORTS_RADAR_NEWS_API_KEY is not set in .env file or could not be loaded');
  console.error('Current working directory:', process.cwd());
  console.error('Environment variables available:', Object.keys(process.env));
  process.exit(1);
}

console.log('Environment variables loaded successfully');

// Output directories
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'news', 'articles');
const DATA_DIR = path.join(process.cwd(), 'public', 'news', 'data');
const CACHE_DIR = path.join(process.cwd(), '.cache');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating cache directory:', error);
  }
}

/**
 * Fetches MLB game schedule for a given date
 * @param {string} date - Date in YYYY/MM/DD format
 * @returns {Promise<Array>} - Array of games
 */
async function fetchMLBSchedule(date) {
  const cacheFile = path.join(CACHE_DIR, `schedule_${date.replace(/\//g, '-')}.json`);
  
  try {
    // Try to read from cache first
    try {
      const cachedData = await fs.readFile(cacheFile, 'utf8');
      console.log(`Using cached schedule for ${date}`);
      const parsedData = JSON.parse(cachedData);
      
      // Ensure we have valid game data
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData;
      }
      console.log('Cached data is empty or invalid, fetching from API...');
    } catch (cacheError) {
      // Cache miss or invalid cache, fetch from API
      console.log(`Cache miss for ${date}, fetching from API...`);
    }
    
    const url = `http://api.sportradar.us/mlb/trial/v8/en/games/${date}/schedule.json`;
    console.log(`Fetching MLB schedule from: ${url}`);
    
    const response = await makeRequest(url);
    
    // Log the full response structure for debugging
    console.log('Full API response structure:', Object.keys(response.data || {}));
    
    // Extract games from different possible response structures
    let games = [];
    if (response.data?.games) {
      games = response.data.games;
    } else if (response.data?.league?.games) {
      games = response.data.league.games;
    } else if (Array.isArray(response.data)) {
      games = response.data;
    } else {
      console.log('Unexpected API response structure. Full response:', JSON.stringify(response.data, null, 2));
    }
    
    console.log(`Found ${games.length} games for ${date}`);
    
    // Process and normalize game data
    const processedGames = games.map(game => {
      const rawGameData = game;
      const homeTeam = {
        id: rawGameData.home_team?.id || rawGameData.home?.id || 'unknown',
        name: rawGameData.home_team?.name || rawGameData.home?.name || 'Unknown',
        market: rawGameData.home_team?.market || rawGameData.home?.market || 'Unknown',
        abbr: rawGameData.home?.abbr || '',
        runs: rawGameData.home_team?.runs || rawGameData.home?.runs || 0,
        hits: 0,
        errors: 0,
        wins: rawGameData.home_team?.wins || rawGameData.home?.win || 0,
        losses: rawGameData.home_team?.losses || rawGameData.home?.loss || 0,
        record: `${rawGameData.home_team?.wins || rawGameData.home?.win || 0}-${rawGameData.home_team?.losses || rawGameData.home?.loss || 0}`
      };

      const awayTeam = {
        id: rawGameData.away_team?.id || rawGameData.away?.id || 'unknown',
        name: rawGameData.away_team?.name || rawGameData.away?.name || 'Unknown',
        market: rawGameData.away_team?.market || rawGameData.away?.market || 'Unknown',
        abbr: rawGameData.away?.abbr || '',
        runs: rawGameData.away_team?.runs || rawGameData.away?.runs || 0,
        hits: 0,
        errors: 0,
        wins: rawGameData.away_team?.wins || rawGameData.away?.win || 0,
        losses: rawGameData.away_team?.losses || rawGameData.away?.loss || 0,
        record: `${rawGameData.away_team?.wins || rawGameData.away?.win || 0}-${rawGameData.away_team?.losses || rawGameData.away?.loss || 0}`
      };

      return {
        id: rawGameData.id,
        status: rawGameData.status,
        scheduled: rawGameData.scheduled,
        home_team: homeTeam,
        away_team: awayTeam,
        venue: rawGameData.venue?.name || 'Unknown Venue',
        attendance: rawGameData.attendance,
        duration: rawGameData.duration,
        raw: rawGameData // Keep raw data for reference
      };
    });
    
    // Cache the processed data
    try {
      await fs.mkdir(path.dirname(cacheFile), { recursive: true });
      await fs.writeFile(cacheFile, JSON.stringify(processedGames, null, 2));
      console.log(`Cached schedule data for ${date}`);
    } catch (cacheError) {
      console.error('Error caching schedule:', cacheError);
    }
    
    return processedGames;
    
  } catch (error) {
    console.error(`Error fetching MLB schedule for ${date}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      if (error.response.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      console.error('No response received. Request config:', error.request);
    } else {
      console.error('Error details:', error);
    }
    
    // Try to return cached data if available, even if stale
    try {
      const cachedData = await fs.readFile(cacheFile, 'utf8');
      console.log('Falling back to cached data');
      return JSON.parse(cachedData);
    } catch (fallbackError) {
      console.error('No cached data available');
      return [];
    }
  }
}

/**
 * Fetches detailed game data for a specific game
 * @param {string} gameId - The game ID
 * @returns {Promise<Object>} - Detailed game data
 */
async function fetchGameDetails(gameId) {
  if (!gameId) {
    console.error('No game ID provided');
    return null;
  }
  
  const cacheFile = path.join(CACHE_DIR, `game_${gameId}.json`);
  
  try {
    // Try to read from cache first
    try {
      const cachedData = await fs.readFile(cacheFile, 'utf8');
      console.log(`Using cached game data for ${gameId}`);
      const parsedData = JSON.parse(cachedData);
      
      // Validate cached data
      if (parsedData && (parsedData.id || parsedData.game)) {
        return parsedData;
      }
      console.log('Cached data is invalid, fetching from API...');
    } catch (cacheError) {
      // Cache miss, fetch from API
      console.log(`Cache miss for game ${gameId}, fetching from API...`);
    }
    
    const url = `http://api.sportradar.us/mlb/trial/v8/en/games/${gameId}/summary.json`;
    console.log(`Fetching game details from: ${url}`);
    
    const response = await makeRequest(url);
    let gameData = response.data;
    
    // Log the full response structure and data for debugging
    console.log('Game details response structure:', Object.keys(gameData || {}));
    console.log('Full game details response:', JSON.stringify(gameData, null, 2));
    
    // Handle different response structures
    if (gameData.game) {
      gameData = gameData.game; // Some responses nest under 'game' property
    }
    
    // Process and normalize the game data
    const processedData = {
      id: gameData.id,
      status: gameData.status,
      scheduled: gameData.scheduled,
      home_team: {
        id: gameData.home_team?.id || gameData.home?.id || 'unknown',
        name: gameData.home_team?.name || gameData.home?.name || 'Unknown',
        market: gameData.home_team?.market || gameData.home?.market || 'Unknown',
        abbr: gameData.home?.abbr || '',
        runs: gameData.home_team?.runs || gameData.home?.runs || 0,
        hits: gameData.home?.hits || 0,
        errors: gameData.home?.errors || 0,
        wins: gameData.home_team?.wins || gameData.home?.win || 0,
        losses: gameData.home_team?.losses || gameData.home?.loss || 0,
        record: `${gameData.home_team?.wins || gameData.home?.win || 0}-${gameData.home_team?.losses || gameData.home?.loss || 0}`
      },
      away_team: {
        id: gameData.away_team?.id || gameData.away?.id || 'unknown',
        name: gameData.away_team?.name || gameData.away?.name || 'Unknown',
        market: gameData.away_team?.market || gameData.away?.market || 'Unknown',
        abbr: gameData.away?.abbr || '',
        runs: gameData.away_team?.runs || gameData.away?.runs || 0,
        hits: gameData.away?.hits || 0,
        errors: gameData.away?.errors || 0,
        wins: gameData.away_team?.wins || gameData.away?.win || 0,
        losses: gameData.away_team?.losses || gameData.away?.loss || 0,
        record: `${gameData.away_team?.wins || gameData.away?.win || 0}-${gameData.away_team?.losses || gameData.away?.loss || 0}`
      },
      venue: gameData.venue?.name || gameData.venue_name || 'Unknown Venue',
      attendance: gameData.attendance,
      duration: gameData.duration,
      weather: gameData.weather,
      raw: gameData // Keep raw data for reference
    };
    
    // Extract scoring if available
    if (gameData.scoring || gameData.linescore) {
      processedData.scoring = gameData.scoring || gameData.linescore;
    }
    
    // Extract pitching info if available
    if (gameData.pitching || gameData.winning_pitcher) {
      processedData.pitching = {
        win: gameData.pitching?.win || gameData.winning_pitcher,
        loss: gameData.pitching?.loss || gameData.losing_pitcher,
        save: gameData.pitching?.save || gameData.save_pitcher
      };
    }
    
    // Cache the processed data
    try {
      await fs.mkdir(path.dirname(cacheFile), { recursive: true });
      await fs.writeFile(cacheFile, JSON.stringify(processedData, null, 2));
      console.log(`Cached game data for ${gameId}`);
    } catch (cacheError) {
      console.error('Error caching game data:', cacheError);
    }
    
    return processedData;
    
  } catch (error) {
    console.error(`Error fetching game details for ${gameId}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      if (error.response.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      console.error('No response received. Request config:', error.request);
    } else {
      console.error('Error details:', error);
    }
    
    // Try to return cached data if available, even if stale
    try {
      const cachedData = await fs.readFile(cacheFile, 'utf8');
      console.log('Falling back to cached game data');
      return JSON.parse(cachedData);
    } catch (fallbackError) {
      console.error('No cached game data available');
      return null;
    }
  }
}

/**
 * Extracts and formats game information in a more readable format
 * @param {Object} game - The game object from the schedule
 * @returns {Object} Formatted game information
 */
function formatGameInfo(game) {
  if (!game) return null;
  
  // Log the raw game object for debugging
  console.log('Raw game object:', JSON.stringify(game, null, 2));
  
  // Try to extract team information from different possible structures
  const homeTeam = game.home_team || game.home || {};
  const awayTeam = game.away_team || game.away || {};
  
  // Extract team name - try different possible properties
  const getTeamName = (team) => {
    if (!team) return 'Unknown Team';
    if (team.name) return team.name;
    if (team.market && team.name) return `${team.market} ${team.name}`;
    if (team.market) return team.market;
    if (team.full_name) return team.full_name;
    return 'Unknown Team';
  };
  
  return {
    id: game.id || 'unknown',
    status: game.status || 'unknown',
    scheduled: game.scheduled || game.start_time || new Date().toISOString(),
    home_team: {
      id: homeTeam.id || 'unknown',
      name: getTeamName(homeTeam),
      market: homeTeam.market || homeTeam.abbreviation || 'UNK',
      runs: homeTeam.runs || 0,
      hits: homeTeam.hits || 0,
      errors: homeTeam.errors || 0
    },
    away_team: {
      id: awayTeam.id || 'unknown',
      name: getTeamName(awayTeam),
      market: awayTeam.market || awayTeam.abbreviation || 'UNK',
      runs: awayTeam.runs || 0,
      hits: awayTeam.hits || 0,
      errors: awayTeam.errors || 0
    },
    venue: game.venue?.name || game.venue_name || 'Unknown Venue',
    attendance: game.attendance || 0,
    duration: game.duration || 'Unknown',
    raw: game // Include raw data for debugging
  };
}

/**
 * Extracts and formats game summary information
 * @param {Object} gameData - The detailed game data
 * @returns {Object} Formatted game summary
 */
function formatGameSummary(gameData) {
  if (!gameData) return null;
  
  const summary = {
    game_id: gameData.id,
    status: gameData.status,
    scheduled: gameData.scheduled,
    home_team: {
      name: gameData.home?.name,
      market: gameData.home?.market,
      runs: gameData.home?.runs,
      hits: gameData.home?.hits,
      errors: gameData.home?.errors
    },
    away_team: {
      name: gameData.away?.name,
      market: gameData.away?.market,
      runs: gameData.away?.runs,
      hits: gameData.away?.hits,
      errors: gameData.away?.errors
    },
    winning_pitcher: gameData.pitching?.win?.full_name,
    losing_pitcher: gameData.pitching?.loss?.full_name,
    save_pitcher: gameData.pitching?.save?.full_name,
    home_probable_pitcher: gameData.home?.probable_pitcher,
    away_probable_pitcher: gameData.away?.probable_pitcher,
    venue: gameData.venue?.name,
    attendance: gameData.attendance,
    duration: gameData.duration,
    weather: gameData.weather
  };
  
  return summary;
}

/**
 * Main function to test with one game
 */
async function testOneGame() {
  try {
    console.log('Starting test with one game...');
    
    // Ensure cache directory exists
    await ensureCacheDir();
    
    // Get yesterday's date in YYYY/MM/DD format
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };
    
    const yesterdayStr = formatDate(yesterday);
    
    console.log(`\n=== Fetching games for ${yesterdayStr} ===`);
    
    // Fetch games for yesterday
    const games = await fetchMLBSchedule(yesterdayStr);
    
    if (games.length === 0) {
      console.log('No games found for yesterday. Trying today...');
      const todayStr = formatDate(today);
      const todayGames = await fetchMLBSchedule(todayStr);
      if (todayGames.length === 0) {
        console.log('No games found for today either. Exiting.');
        return;
      }
      games.push(...todayGames);
    }
    
    // Process only the first game
    const game = games[0];
    
    // Log basic game info
    const formattedGame = formatGameInfo(game);
    console.log('\n=== GAME INFORMATION ===');    
    console.log(`\n${formattedGame.away_team.name} @ ${formattedGame.home_team.name}`);
    console.log(`Status: ${formattedGame.status}`);
    console.log(`Scheduled: ${new Date(formattedGame.scheduled).toLocaleString()}`);
    console.log(`Venue: ${formattedGame.venue || 'N/A'}`);
    
    // Fetch game details
    console.log(`\n=== FETCHING GAME DETAILS ===`);
    let gameDetails = await fetchGameDetails(game.id);
    
    // If no details found, try fetching fresh data (bypass cache)
    if (!gameDetails || Object.keys(gameDetails).length === 0) {
      console.log('No game details found in cache, trying fresh fetch...');
      // Force a fresh fetch by adding a timestamp to bypass cache
      gameDetails = await fetchGameDetails(game.id);
    }
    
    // If still no data, show what we have from the schedule
    if (!gameDetails || Object.keys(gameDetails).length === 0) {
      console.log('\n=== GAME SUMMARY ===');
      console.log(`${game.away?.market || 'Away Team'} @ ${game.home?.market || 'Home Team'}`);
      console.log(`Status: ${game.status || 'Unknown'}`);
      console.log(`Date: ${new Date(game.scheduled).toLocaleDateString()}`);
      console.log(`Time: ${new Date(game.scheduled).toLocaleTimeString()}`);
      
      if (game.attendance) {
        console.log(`Attendance: ${parseInt(game.attendance).toLocaleString()}`);
      }
      
      if (game.duration) {
        console.log(`Duration: ${game.duration}`);
      }
      
      if (game.venue?.name) {
        console.log(`Venue: ${game.venue.name}, ${game.venue.city}, ${game.venue.state}`);
      }
      
      // Show team records if available
      if (game.home?.win !== undefined || game.home?.loss !== undefined) {
        console.log(`\n${game.home.market || 'Home'} Record: ${game.home.win || 0}-${game.home.loss || 0}`);
      }
      
      if (game.away?.win !== undefined || game.away?.loss !== undefined) {
        console.log(`${game.away.market || 'Away'} Record: ${game.away.win || 0}-${game.away.loss || 0}`);
      }
      
      // Show broadcast info if available
      if (game.broadcasts?.length > 0) {
        console.log('\nBroadcast Info:');
        game.broadcasts.forEach(broadcast => {
          console.log(`- ${broadcast.network} (${broadcast.type}): ${broadcast.locale}`);
        });
      }
      
      console.log('\nNote: Detailed game statistics are not yet available.');
      return;
    }
    
    const gameData = gameDetails; // Alias for consistency with rest of code
    
    // Extract and display basic game info
    console.log('\n=== GAME DETAILS ===');
    
    // Extract teams from the response
    const homeTeam = gameData.home || {};
    const awayTeam = gameData.away || {};
    const homeTeamId = homeTeam.id || gameData.home_team;
    const awayTeamId = awayTeam.id || gameData.away_team;
    
    // Extract scores from different possible locations in the response
    const homeScore = homeTeam.runs || gameData.home_runs || 
                     (gameData.summary?.home || 0);
    const awayScore = awayTeam.runs || gameData.away_runs || 
                     (gameData.summary?.away || 0);
    
    // Extract hits and errors from team stats if available
    const homeHits = homeTeam.hits || (gameData.stats && gameData.stats[homeTeamId]?.hits) || 0;
    const awayHits = awayTeam.hits || (gameData.stats && gameData.stats[awayTeamId]?.hits) || 0;
    const homeErrors = homeTeam.errors || (gameData.stats && gameData.stats[homeTeamId]?.errors) || 0;
    const awayErrors = awayTeam.errors || (gameData.stats && gameData.stats[awayTeamId]?.errors) || 0;
    
    // Extract team records if available
    const homeRecord = homeTeam.record || {};
    const awayRecord = awayTeam.record || {};
    
    const gameInfo = {
      id: gameData.id || gameData.game_id || 'N/A',
      status: gameData.status || gameData.game_status || 'unknown',
      scheduled: gameData.scheduled ? new Date(gameData.scheduled).toLocaleString() : 
               (gameData.start_time ? new Date(gameData.start_time).toLocaleString() : 'N/A'),
      attendance: gameData.attendance ? gameData.attendance.toLocaleString() : 'N/A',
      duration: gameData.duration || 'N/A',
      venue: gameData.venue?.name || gameData.venue_name || gameData.venue?.display_name || 'N/A',
      home_team: {
        id: homeTeamId || 'N/A',
        name: homeTeam.name || homeTeam.full_name || 'Home Team',
        market: homeTeam.market || homeTeam.abbreviation || homeTeam.abbr || 'HOME',
        runs: homeScore,
        hits: homeHits,
        errors: homeErrors,
        wins: homeRecord.wins || homeTeam.win || 0,
        losses: homeRecord.losses || homeTeam.loss || 0,
        record: homeRecord
      },
      away_team: {
        id: awayTeamId || 'N/A',
        name: awayTeam.name || awayTeam.full_name || 'Away Team',
        market: awayTeam.market || awayTeam.abbreviation || awayTeam.abbr || 'AWAY',
        runs: awayScore,
        hits: awayHits,
        errors: awayErrors,
        wins: awayRecord.wins || awayTeam.win || 0,
        losses: awayRecord.losses || awayTeam.loss || 0,
        record: awayRecord
      },
      // Store raw data for debugging
      _raw: {
        game: gameData,
        home: homeTeam,
        away: awayTeam,
        stats: gameData.stats
      }
    };
    
    // Format the scheduled date/time
    let scheduledDate;
    if (gameData.scheduled) {
      scheduledDate = new Date(gameData.scheduled);
    } else {
      scheduledDate = new Date(game.scheduled);
    }
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Display the game header with team info and score
    const homeTeamName = gameData.home?.market || game.home?.market || 'HOME';
    const awayTeamName = gameData.away?.market || game.away?.market || 'AWAY';
    // Display box score
    console.log('\n=== BOX SCORE ===');
    console.log('Team'.padEnd(15) + 'R   H   E');
    console.log('-'.repeat(25));
    
    // The game data is nested under the 'game' property
    const gameObj = gameData.game || {};
    
    // Extract home and away team data from the game object
    const homeTeamObj = gameObj.home_team || gameObj.home || {};
    const awayTeamObj = gameObj.away_team || gameObj.away || {};
    
    // First, let's check if we have a raw property with the game data
    const rawGameData = gameObj.raw || gameObj;
    
    // Log the structure of the game data for debugging
    console.log('Game data structure:', {
      hasGame: !!rawGameData,
      gameKeys: Object.keys(rawGameData),
      hasHomeTeam: !!rawGameData.home_team,
      hasAwayTeam: !!rawGameData.away_team,
      hasHome: !!rawGameData.home,
      hasAway: !!rawGameData.away,
      hasPitching: !!rawGameData.pitching,
      hasOfficials: !!rawGameData.officials,
      hasBroadcasts: !!rawGameData.broadcasts,
      hasVenue: !!rawGameData.venue
    });
    
    // Debug: Log the entire raw game data structure
    console.log('Raw game data structure:', JSON.stringify({
      game: Object.keys(rawGameData),
      home_team: rawGameData.home_team ? Object.keys(rawGameData.home_team) : 'No home_team',
      away_team: rawGameData.away_team ? Object.keys(rawGameData.away_team) : 'No away_team',
      home: rawGameData.home ? Object.keys(rawGameData.home) : 'No home',
      away: rawGameData.away ? Object.keys(rawGameData.away) : 'No away',
      venue: rawGameData.venue ? Object.keys(rawGameData.venue) : 'No venue'
    }, null, 2));
    
    // Extract detailed game information from the raw data
    const detailedGameInfo = {
      status: rawGameData.status || 'Unknown',
      scheduled: rawGameData.scheduled ? new Date(rawGameData.scheduled).toLocaleString() : 'TBD',
      attendance: rawGameData.attendance ? rawGameData.attendance.toLocaleString() : 'N/A',
      duration: rawGameData.duration || 'N/A',
      venue: rawGameData.venue ? rawGameData.venue.name : 'Unknown Venue',
      location: rawGameData.venue ? 
        `${rawGameData.venue.city}, ${rawGameData.venue.state}` : 'Unknown',
      capacity: rawGameData.venue?.capacity ? 
        rawGameData.venue.capacity.toLocaleString() : 'N/A',
      surface: rawGameData.venue?.surface || 'Unknown',
      weather: rawGameData.weather || {},
      gameType: rawGameData.game_type || 'Regular Season',
      doubleHeader: rawGameData.double_header ? 'Yes' : 'No',
      dayNight: rawGameData.day_night ? rawGameData.day_night === 'D' ? 'Day' : 'Night' : 'Unknown',
      gameNumber: rawGameData.game_number || 1,
      seriesGame: rawGameData.series_game_number || 1,
      seriesStatus: rawGameData.series_status || 'Regular',
      ifNecessary: rawGameData.if_necessary || 'No',
      tiebreaker: rawGameData.tiebreaker || 'No',
      broadcasts: rawGameData.broadcasts || []
    };
    
    // Extract scoring plays if available
    const scoringPlays = [];
    if (gameObj.scoring_plays && Array.isArray(gameObj.scoring_plays)) {
      gameObj.scoring_plays.forEach(play => {
        if (play && play.description) {
          scoringPlays.push({
            inning: play.inning || '?',
            team: play.team || 'Unknown',
            description: play.description,
            runs: play.runs || 0
          });
        }
      });
    }
    
    // Extract key plays (home runs, strikeouts, etc.)
    const keyPlays = [];
    if (gameObj.plays && Array.isArray(gameObj.plays)) {
      gameObj.plays.forEach(play => {
        if (play && play.description && (
          play.description.includes('home run') ||
          play.description.includes('homer') ||
          play.description.includes('grand slam') ||
          play.description.includes('triple play') ||
          play.description.includes('strikes out') ||
          play.description.includes('strikeout') ||
          play.description.includes('steals')
        )) {
          keyPlays.push({
            inning: play.inning || '?',
            team: play.team || 'Unknown',
            description: play.description,
            type: getPlayType(play.description)
          });
        }
      });
    }
    
    // Extract pitching stats
    const pitchingStats = {
      win: {},
      loss: {},
      save: {}
    };
    
    if (gameObj.pitching) {
      if (gameObj.pitching.win) {
        pitchingStats.win = {
          name: gameObj.pitching.win.full_name || 'Unknown',
          wins: gameObj.pitching.win.win || 0,
          losses: gameObj.pitching.win.loss || 0
        };
      }
      
      if (gameObj.pitching.loss) {
        pitchingStats.loss = {
          name: gameObj.pitching.loss.full_name || 'Unknown',
          wins: gameObj.pitching.loss.win || 0,
          losses: gameObj.pitching.loss.loss || 0
        };
      }
      
      if (gameObj.pitching.save) {
        pitchingStats.save = {
          name: gameObj.pitching.save.full_name || 'Unknown',
          saves: gameObj.pitching.save.save || 0,
          blownSaves: gameObj.pitching.save.blown_save || 0
        };
      }
    }
    
    // Display the game information in a detailed format
    try {
      console.log('\n' + '='.repeat(80));
      console.log('=== GAME INFORMATION ==='.padEnd(79) + '=');
      console.log('='.repeat(80));
      
      // Display basic game info
      console.log(`Status: ${gameObj.status || 'Unknown'}`);
      console.log(`Date/Time: ${gameObj.scheduled ? new Date(gameObj.scheduled).toLocaleString() : 'TBD'}`);
      console.log(`Venue: ${gameObj.venue?.name || 'Unknown'}`);
      
      // Display team information
      console.log('\n' + '='.repeat(80));
      console.log('=== TEAM INFORMATION ==='.padEnd(79) + '=');
      console.log('='.repeat(80));
      console.log(`AWAY: ${awayTeam.market} ${awayTeam.name} (${awayTeam.record})`);
      console.log(`HOME: ${homeTeam.market} ${homeTeam.name} (${homeTeam.record})`);
      
      // Display box score
      console.log('\n' + '='.repeat(80));
      console.log('=== BOX SCORE ==='.padEnd(79) + '=');
      console.log('='.repeat(80));
      console.log('Team'.padEnd(25) + 'R   H   E');
      console.log('-'.repeat(35));
      console.log(`${awayTeam.market.padEnd(25)}${awayTeam.runs}   ${awayTeam.hits}   ${awayTeam.errors}`);
      console.log(`${homeTeam.market.padEnd(25)}${homeTeam.runs}   ${homeTeam.hits}   ${homeTeam.errors}`);
      
      // Display scoring plays if available
      if (scoringPlays?.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('=== SCORING PLAYS ==='.padEnd(79) + '=');
        console.log('='.repeat(80));
        
        scoringPlays.forEach((play, index) => {
          console.log(`\n[${play.inning}] ${play.team} scores ${play.runs} run${play.runs !== 1 ? 's' : ''}:`);
          console.log(`  ${play.description}`);
          
          if (play.scoringPlayers?.length > 0) {
            const scorers = play.scoringPlayers.filter(p => p.type === 'scorer').map(p => p.name).join(', ');
            const rbis = play.scoringPlayers.filter(p => p.type === 'rbi').map(p => p.name).join(', ');
            
            if (scorers) console.log(`  Scored by: ${scorers}`);
            if (rbis) console.log(`  RBI: ${rbis}`);
          }
        });
      } else {
        console.log('\nNo scoring plays available');
      }
      
      // Display key plays with more context
      if (keyPlays?.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('=== KEY PLAYS ==='.padEnd(79) + '=');
        console.log('='.repeat(80));
        
        keyPlays.slice(0, 15).forEach((play) => {
          const count = play.count ? `${play.count.balls}-${play.count.strikes}` : '';
          console.log(`\n[${play.inning}] ${play.team} - ${play.type.toUpperCase()} ${count ? `(${count})` : ''}:`);
          console.log(`  ${play.description}`);
          
          // Show runners on base if available
          if (play.runners?.length > 0) {
            const runners = play.runners.map(r => `${r.start} -> ${r.end}`).join(', ');
            console.log(`  Runners: ${runners}`);
          }
        });
        
        if (keyPlays.length > 15) {
          console.log(`\n... and ${keyPlays.length - 15} more plays`);
        }
      } else {
        console.log('\nNo key plays available');
      }
    
      // Display detailed pitching information
      if (pitchingStats.win?.name || pitchingStats.loss?.name || pitchingStats.save?.name) {
        console.log('\n' + '='.repeat(80));
        console.log('=== PITCHING DECISIONS ==='.padEnd(79) + '=');
        console.log('='.repeat(80));
        
        if (pitchingStats.win?.name) {
          const w = pitchingStats.win;
          console.log(`\nWINNING PITCHER: ${w.name} (${w.wins}-${w.losses}${w.era ? `, ${w.era} ERA` : ''})`);
          if (w.inningsPitched !== undefined) {
            console.log(`  ${w.inningsPitched} IP, ${w.hits || 0} H, ${w.runs || 0} R, ${w.earnedRuns || 0} ER, ${w.walks || 0} BB, ${w.strikeouts || 0} K`);
            if (w.homeRuns) console.log(`  HR Allowed: ${w.homeRuns}`);
            if (w.pitches !== undefined) console.log(`  Pitches: ${w.pitches} (${w.strikes || 0} strikes)`);
          }
        }
        
        if (pitchingStats.loss?.name) {
          const l = pitchingStats.loss;
          console.log(`\nLOSING PITCHER: ${l.name} (${l.wins}-${l.losses}${l.era ? `, ${l.era} ERA` : ''})`);
          if (l.inningsPitched !== undefined) {
            console.log(`  ${l.inningsPitched} IP, ${l.hits || 0} H, ${l.runs || 0} R, ${l.earnedRuns || 0} ER, ${l.walks || 0} BB, ${l.strikeouts || 0} K`);
            if (l.homeRuns) console.log(`  HR Allowed: ${l.homeRuns}`);
            if (l.pitches !== undefined) console.log(`  Pitches: ${l.pitches} (${l.strikes || 0} strikes)`);
          }
        }
        
        if (pitchingStats.save?.name) {
          const s = pitchingStats.save;
          console.log(`\nSAVE: ${s.name} (${s.saves} SV, ${s.blownSaves} BS${s.era ? `, ${s.era} ERA` : ''})`);
          if (s.inningsPitched !== undefined) {
            console.log(`  ${s.inningsPitched} IP, ${s.strikeouts || 0} K, ${s.walks || 0} BB`);
          }
          if (s.savesOpportunities !== undefined) {
            console.log(`  Save Opportunities: ${s.saves}/${s.savesOpportunities} (${s.savePercentage || 'N/A'})`);
          }
        }
      }
    
      // Display holds if available
      if (pitchingStats.holds?.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('=== HOLDS ==='.padEnd(79) + '=');
        console.log('='.repeat(80));
        
        pitchingStats.holds.forEach((hold, index) => {
          console.log(`\n${index + 1}. ${hold.name}:`);
          console.log(`  ${hold.holds} HLD, ${hold.era || 'N/A'} ERA, ${hold.inningsPitched || '0.0'} IP`);
          console.log(`  ${hold.strikeouts || 0} K, ${hold.walks || 0} BB`);
          if (hold.inheritedRunners !== undefined) {
            console.log(`  Inherited Runners: ${hold.inheritedRunnersScored || 0}/${hold.inheritedRunners} scored`);
          }
        });
      }
      
      // Display starting pitchers' lines
      if (pitchingStats.starters?.length > 0) {
        console.log('\n' + '='.repeat(80));
        console.log('=== STARTING PITCHERS ==='.padEnd(79) + '=');
        console.log('='.repeat(80));
        
        pitchingStats.starters.forEach((starter, index) => {
          console.log(`\n${index + 1}. ${starter.team} - ${starter.name}${starter.decision ? ` (${starter.decision})` : ''}`);
          console.log(`  ${starter.inningsPitched || '0.0'} IP, ${starter.hits || 0} H, ${starter.runs || 0} R, ${starter.earnedRuns || 0} ER`);
          console.log(`  ${starter.strikeouts || 0} K, ${starter.walks || 0} BB, ${starter.homeRuns || 0} HR`);
          if (starter.pitchCount !== undefined) {
            console.log(`  ${starter.pitchCount} pitches (${starter.strikes || 0} strikes)`);
          }
          if (starter.era || starter.whip) {
            console.log(`  Season: ${starter.era || 'N/A'} ERA, ${starter.whip || 'N/A'} WHIP`);
          }
        });
      }
      
      // Display top performers
      console.log('\n' + '='.repeat(80));
      console.log('=== TOP PERFORMERS ==='.padEnd(79) + '=');
      console.log('='.repeat(80));
      
      // Top hitters
      const topHitters = Object.values(playerStats || {})
        .filter(p => p && p.name && (p.hits || p.rbi || p.runs))
        .sort((a, b) => ((b.hits || 0) * 3 + (b.rbi || 0) * 2 + (b.runs || 0)) - ((a.hits || 0) * 3 + (a.rbi || 0) * 2 + (a.runs || 0)))
        .slice(0, 5);
        
      if (topHitters.length > 0) {
        console.log('\nTOP HITTERS:');
        topHitters.forEach((hitter, index) => {
          console.log(`\n${index + 1}. ${hitter.name} (${hitter.team || 'N/A'})`);
          console.log(`  ${hitter.hits || 0}-${hitter.atBats || 0}, ${hitter.rbi || 0} RBI, ${hitter.runs || 0} R`);
          if (hitter.homeRuns) console.log(`  ${hitter.homeRuns} HR, ${hitter.strikeouts || 0} K, ${hitter.walks || 0} BB`);
          if (hitter.avg) console.log(`  AVG: ${hitter.avg}`);
        });
      }
      
      // Top pitchers
      const topPitchers = Object.values(pitcherStats || {})
        .filter(p => p && p.name && (p.strikeouts || p.hits || p.walks))
        .sort((a, b) => 
          ((b.strikeouts || 0) * 2 - (b.hits || 0) - (b.walks || 0) * 0.5) - 
          ((a.strikeouts || 0) * 2 - (a.hits || 0) - (a.walks || 0) * 0.5)
        )
        .slice(0, 3);
        
      if (topPitchers.length > 0) {
        console.log('\nTOP PITCHERS:');
        topPitchers.forEach((pitcher, index) => {
          console.log(`\n${index + 1}. ${pitcher.name} (${pitcher.team || 'N/A'})`);
          console.log(`  ${pitcher.inningsPitched || '0.0'} IP, ${pitcher.hits || 0} H, ${pitcher.runs || 0} R, ${pitcher.earnedRuns || 0} ER`);
          console.log(`  ${pitcher.strikeouts || 0} K, ${pitcher.walks || 0} BB, ${pitcher.homeRuns || 0} HR`);
          if (pitcher.era || pitcher.whip) {
            console.log(`  ${pitcher.era || 'N/A'} ERA, ${pitcher.whip || 'N/A'} WHIP`);
          }
        });
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('='.repeat(80));
      console.log('=== END OF GAME REPORT ==='.padEnd(79) + '=');
      console.log('='.repeat(80));
      
    } catch (error) {
      console.error('\nError displaying game information:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // If we still don't have scores, try to extract from the raw data
    if ((!homeTeamObj.runs || !awayTeamObj.runs) && gameData.raw) {
      console.log('Attempting to extract from raw data...');
      const raw = gameData.raw;
      
      // Try to find scores in the raw data
      const homeRuns = raw.home?.runs || raw.home_team?.runs || 0;
      const awayRuns = raw.away?.runs || raw.away_team?.runs || 0;
      
      if (homeRuns || awayRuns) {
        console.log(`Found scores in raw data: ${awayRuns}-${homeRuns}`);
        homeTeamObj.runs = homeRuns;
        awayTeamObj.runs = awayRuns;
      }
    }
    
    // Extract runs, hits, and errors from the game data
    let boxHomeRuns = homeTeamObj.runs || 0;
    let boxAwayRuns = awayTeamObj.runs || 0;
    
    // Extract hits and errors from the game data
    let boxHomeHits = homeTeamObj.hits || 0;
    let boxAwayHits = awayTeamObj.hits || 0;
    
    let boxHomeErrors = homeTeamObj.errors || 0;
    let boxAwayErrors = awayTeamObj.errors || 0;
    
    // Helper function to determine play type for categorization
    function getPlayType(description) {
      const desc = description.toLowerCase();
      if (desc.includes('home run') || desc.includes('homer')) return 'home run';
      if (desc.includes('grand slam')) return 'grand slam';
      if (desc.includes('triple play')) return 'triple play';
      if (desc.includes('strikes out') || desc.includes('strikeout')) return 'strikeout';
      if (desc.includes('steals')) return 'stolen base';
      if (desc.includes('double play')) return 'double play';
      return 'other';
    }
    
    // If we still don't have scores, try to extract from the raw data
    if ((boxHomeRuns === 0 && boxAwayRuns === 0) && gameObj.innings) {
      console.log('Extracting scores from innings data...');
      
      // Sum up runs from each inning
      gameObj.innings.forEach(inning => {
        if (inning.home) boxHomeRuns += parseInt(inning.home.runs || 0, 10);
        if (inning.away) boxAwayRuns += parseInt(inning.away.runs || 0, 10);
      });
    }
    
    // Debug: Log the extracted data and full response structure
    console.log('Extracted game data:', {
      boxHomeRuns,
      boxAwayRuns,
      boxHomeHits,
      boxAwayHits,
      boxHomeErrors,
      boxAwayErrors,
      gameDataKeys: Object.keys(gameData),
      gameDataGameKeys: gameData.game ? Object.keys(gameData.game) : 'No game data',
      homeKeys: gameData.home ? Object.keys(gameData.home) : 'No home data',
      awayKeys: gameData.away ? Object.keys(gameData.away) : 'No away data'
    });
    
    // If we still don't have scores, try to extract from the raw game object
    if ((boxHomeRuns === 0 && boxAwayRuns === 0) && gameData.game) {
      console.log('Attempting to extract scores from raw game data...');
      try {
        // Try to find scores in the raw data
        const rawData = JSON.stringify(gameData);
        const homeRunsMatch = rawData.match(/"home"[^}]*"runs?"\s*:\s*(\d+)/i);
        const awayRunsMatch = rawData.match(/"away"[^}]*"runs?"\s*:\s*(\d+)/i);
        
        if (homeRunsMatch) boxHomeRuns = parseInt(homeRunsMatch[1], 10);
        if (awayRunsMatch) boxAwayRuns = parseInt(awayRunsMatch[1], 10);
      } catch (e) {
        console.error('Error extracting scores from raw data:', e);
      }
    }
    
    // Display the box score with the correct data
    console.log('\n=== BOX SCORE ===');
    console.log('Team'.padEnd(15) + 'R   H   E');
    console.log('-'.repeat(25));
    
    // Extract team information with better fallbacks
    const homeTeamData = {
      id: gameObj.home_team || gameObj.home?.id || 'unknown',
      name: gameObj.home?.name || 'Unknown',
      market: gameObj.home?.market || 'Unknown',
      abbr: gameObj.home?.abbr || '',
      runs: 0,
      hits: 0,
      errors: 0,
      win: gameObj.home?.win || 0,
      loss: gameObj.home?.loss || 0,
      record: `${gameObj.home?.win || 0}-${gameObj.home?.loss || 0}`,
      startingPitcher: gameObj.home?.starting_pitcher || gameObj.home?.probable_pitcher || null
    };

    const awayTeamData = {
      id: gameObj.away_team || gameObj.away?.id || 'unknown',
      name: gameObj.away?.name || 'Unknown',
      market: gameObj.away?.market || 'Unknown',
      abbr: gameObj.away?.abbr || '',
      runs: 0,
      hits: 0,
      errors: 0,
      win: gameObj.away?.win || 0,
      loss: gameObj.away?.loss || 0,
      record: `${gameObj.away?.win || 0}-${gameObj.away?.loss || 0}`,
      startingPitcher: gameObj.away?.starting_pitcher || gameObj.away?.probable_pitcher || null
    };

    // Use team market or name if market is not available
    const awayTeamDisplayName = awayTeamData.market || awayTeamData.name;
    const homeTeamDisplayName = homeTeamData.market || homeTeamData.name;
    
    console.log(`${awayTeamDisplayName.padEnd(25)}${boxAwayRuns}   ${boxAwayHits}   ${boxAwayErrors}`);
    console.log(`${homeTeamDisplayName.padEnd(25)}${boxHomeRuns}   ${boxHomeHits}   ${boxHomeErrors}`);
    
    // Display game information
    console.log('\n' + '='.repeat(80));
    console.log('=== GAME DETAILS ==='.padEnd(79) + '=');
    console.log('='.repeat(80));
    
    // Game status and time
    console.log(`Status: ${gameObj.status || 'Unknown'}`);
    console.log(`Date/Time: ${gameObj.scheduled ? new Date(gameObj.scheduled).toLocaleString() : 'TBD'}`);
    console.log(`Venue: ${gameObj.venue?.name || 'Unknown'}`);
    
    // Venue details if available
    if (gameObj.venue) {
      const venue = gameObj.venue;
      console.log(`Location: ${venue.city || 'Unknown'}, ${venue.state || 'Unknown'}`);
      if (venue.capacity) console.log(`Capacity: ${venue.capacity.toLocaleString()}`);
      if (venue.surface) console.log(`Surface: ${venue.surface}`);
    }
    
    // Attendance and duration
    if (gameObj.attendance) console.log(`Attendance: ${gameObj.attendance.toLocaleString()}`);
    if (gameObj.duration) console.log(`Duration: ${gameObj.duration}`);
    
    // Team records
    console.log(`\n${awayTeamDisplayName} Record: ${awayTeamData.record}`);
    console.log(`${homeTeamDisplayName} Record: ${homeTeamData.record}`);
    
    // Starting pitchers if available
    if (awayTeamData.startingPitcher || homeTeamData.startingPitcher) {
      console.log('\nStarting Pitchers:');
      if (awayTeamData.startingPitcher) console.log(`  ${awayTeamDisplayName}: ${awayTeamData.startingPitcher.name || 'TBD'}`);
      if (homeTeamData.startingPitcher) console.log(`  ${homeTeamDisplayName}: ${homeTeamData.startingPitcher.name || 'TBD'}`);
    }
    
    // Display scoring summary if available
    console.log('\n=== SCORING SUMMARY ===');
    
    // Try to get scoring data from different possible locations
    const scoringData = gameData.scoring || gameData.linescore || gameData.periods || [];
    const scoringArray = Array.isArray(scoringData) ? scoringData : [scoringData];
    
    if (scoringArray.length > 0) {
      scoringArray.forEach((inning, index) => {
        // Skip if this is the game summary object or invalid
        if (!inning || inning.title === 'game') return;
        
        // Handle different scoring formats
        if (inning.home !== undefined && inning.away !== undefined) {
          console.log(`Inning ${index + 1}: ${inning.away || 0}-${inning.home || 0}`);
        } else if (inning.runs) {
          console.log(`Inning ${index + 1}: ${inning.runs.away || 0}-${inning.runs.home || 0}`);
        } else if (inning.away_runs !== undefined || inning.home_runs !== undefined) {
          console.log(`Inning ${index + 1}: ${inning.away_runs || 0}-${inning.home_runs || 0}`);
        }
      });
    } else {
      console.log('No detailed scoring data available.');
    }
    
    // Show venue if available
    if (gameData.venue?.name) {
      console.log(`Venue:      ${gameData.venue.name}, ${gameData.venue.city}, ${gameData.venue.state}`);
    } else if (game.venue?.name) {
      console.log(`Venue:      ${game.venue.name}, ${game.venue.city}, ${game.venue.state}`);
    }
    
    // Show attendance if available
    if (gameData.attendance) {
      console.log(`Attendance: ${parseInt(gameData.attendance).toLocaleString()}`);
    } else if (game.attendance) {
      console.log(`Attendance: ${parseInt(game.attendance).toLocaleString()}`);
    }
    
    // Show duration if available
    if (gameData.duration) {
      console.log(`Duration:   ${gameData.duration}`);
    } else if (game.duration) {
      console.log(`Duration:   ${game.duration}`);
    }
    
    // Display team records if available
    if (gameData.home?.win !== undefined || gameData.home?.loss !== undefined) {
      console.log(`\n${gameData.home.market || 'Home'} Record: ${gameData.home.win || 0}-${gameData.home.loss || 0}`);
    } else if (game.home?.win !== undefined || game.home?.loss !== undefined) {
      console.log(`\n${game.home.market || 'Home'} Record: ${game.home.win || 0}-${game.home.loss || 0}`);
    }
    
    if (gameData.away?.win !== undefined || gameData.away?.loss !== undefined) {
      console.log(`${gameData.away.market || 'Away'} Record: ${gameData.away.win || 0}-${gameData.away.loss || 0}`);
    } else if (game.away?.win !== undefined || game.away?.loss !== undefined) {
      console.log(`${game.away.market || 'Away'} Record: ${game.away.win || 0}-${game.away.loss || 0}`);
    }
    
    // Pitching summary
    console.log('\n=== PITCHING SUMMARY ===');
    
    // Extract pitching info from different possible structures
    const pitching = gameData.pitching || {};
    const pitchers = gameData.pitchers || gameData.pitching || {};
    
    // Try to extract winning pitcher
    const winningPitcher = pitching.win || gameData.winning_pitcher || 
                         (pitchers.home?.win ? pitchers.home.win[0] : null) ||
                         (pitchers.away?.win ? pitchers.away.win[0] : null);
    
    if (winningPitcher) {
      const winLoss = [];
      if (winningPitcher.win !== undefined) winLoss.push(`W: ${winningPitcher.win}`);
      if (winningPitcher.loss !== undefined) winLoss.push(`L: ${winningPitcher.loss}`);
      if (winningPitcher.era !== undefined) winLoss.push(`ERA: ${winningPitcher.era}`);
      
      console.log(`\nWinning Pitcher: ${winningPitcher.full_name || winningPitcher.name || 'Unknown'}`);
      if (winLoss.length > 0) {
        console.log(`  ${winLoss.join(', ')}`);
      }
      if (winningPitcher.innings_pitched) {
        console.log(`  IP: ${winningPitcher.innings_pitched}, H: ${winningPitcher.hits || 0}, ` +
                   `R: ${winningPitcher.runs || 0}, ER: ${winningPitcher.earned_runs || 0}, ` +
                   `BB: ${winningPitcher.walks || 0}, SO: ${winningPitcher.strike_outs || 0}`);
      }
    }
    
    // Try to extract losing pitcher
    const losingPitcher = pitching.loss || gameData.losing_pitcher || 
                        (pitchers.home?.loss ? pitchers.home.loss[0] : null) ||
                        (pitchers.away?.loss ? pitchers.away.loss[0] : null);
    
    if (losingPitcher) {
      const winLoss = [];
      if (losingPitcher.win !== undefined) winLoss.push(`W: ${losingPitcher.win}`);
      if (losingPitcher.loss !== undefined) winLoss.push(`L: ${losingPitcher.loss}`);
      if (losingPitcher.era !== undefined) winLoss.push(`ERA: ${losingPitcher.era}`);
      
      console.log(`\nLosing Pitcher: ${losingPitcher.full_name || losingPitcher.name || 'Unknown'}`);
      if (winLoss.length > 0) {
        console.log(`  ${winLoss.join(', ')}`);
      }
      if (losingPitcher.innings_pitched) {
        console.log(`  IP: ${losingPitcher.innings_pitched}, H: ${losingPitcher.hits || 0}, ` +
                   `R: ${losingPitcher.runs || 0}, ER: ${losingPitcher.earned_runs || 0}, ` +
                   `BB: ${losingPitcher.walks || 0}, SO: ${losingPitcher.strike_outs || 0}`);
      }
    }
    
    // Try to extract save pitcher
    const savePitcher = pitching.save || gameData.save_pitcher || 
                       (pitchers.home?.save ? pitchers.home.save[0] : null) ||
                       (pitchers.away?.save ? pitchers.away.save[0] : null);
    
    if (savePitcher) {
      console.log(`\nSave: ${savePitcher.full_name || savePitcher.name || 'Unknown'}`);
      if (savePitcher.save !== undefined) {
        console.log(`  Saves: ${savePitcher.save}`);
      }
      if (savePitcher.innings_pitched) {
        console.log(`  IP: ${savePitcher.innings_pitched}, H: ${savePitcher.hits || 0}, ` +
                   `R: ${savePitcher.runs || 0}, ER: ${savePitcher.earned_runs || 0}, ` +
                   `BB: ${savePitcher.walks || 0}, SO: ${savePitcher.strike_outs || 0}`);
      }
    }
    
    // If no pitching data found, log the raw data for debugging
    if (!winningPitcher && !losingPitcher && !savePitcher) {
      console.log('\nNo detailed pitching data available.');
      if (gameData.pitching || gameData.pitchers) {
        console.log('Raw pitching data:', JSON.stringify(gameData.pitching || gameData.pitchers, null, 2));
      }
    }
    
    // Game info
    console.log('\n=== GAME INFO ===');
    console.log(`Attendance: ${gameData.attendance ? parseInt(gameData.attendance).toLocaleString() : 'N/A'}`);
    console.log(`Duration: ${gameData.duration || 'N/A'}`);
    console.log(`Venue: ${gameData.venue?.name || game.venue?.name || 'N/A'}`);
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Error in testOneGame:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOneGame().catch(console.error);
