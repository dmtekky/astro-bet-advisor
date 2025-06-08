import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
// Add a fallback API key like in the test script
// Get the API key from environment variables - using the same key that worked in test-sportradar-api.js
const SPORTS_RADAR_API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY || 'J4t0qEW27E9yXM5CYT7R0F2tXwc8nx5ChrN5egbs';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

const CACHE_DIR = path.join(__dirname, '../.cache');
const TEST_OUTPUT_DIR = path.join(__dirname, '../test-articles');
const WEBSITE_OUTPUT_DIR = path.join(__dirname, '../public/news'); // Path to public/news
const WEBSITE_DATA_DIR = path.join(__dirname, '../src/data/news'); // Path for index.json

// --- Placeholder Functions ---
async function fetchMLBSchedule(date) {
  try {
    const formattedDate = date.replace(/-/g, '/');
    // Update to use HTTP and v8 API like the working test script
    const url = `http://api.sportradar.us/mlb/trial/v8/en/games/${formattedDate}/schedule.json?api_key=${SPORTS_RADAR_API_KEY}`;
    
    console.log(`Fetching MLB schedule for ${date} from ${url}...`);
    const response = await axios.get(url);
    
    // Check if response.data and response.data.games exist
    if (response.data && response.data.games) {
      console.log(`Found ${response.data.games.length} games for ${date}`);
      return response.data.games;
    } else {
      console.error(`No games found in response for ${date}`);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching MLB schedule for ${date}: ${error.message}`);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    return []; // Return empty array on error
  }
}

async function fetchGameData(gameId) {
  // Update to use HTTP and v8 API like the working test script
  const url = `http://api.sportradar.us/mlb/trial/v8/en/games/${gameId}/summary.json?api_key=${SPORTS_RADAR_API_KEY}`;
  console.log(`Fetching game data for gameId: ${gameId} from ${url}`);
  try {
    const response = await axios.get(url);
    if (response.data && response.data.game) {
      console.log(`Successfully fetched game data for gameId: ${gameId}`);
      return response.data;
    } else {
      console.error(`Invalid response format for gameId ${gameId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching game data for gameId ${gameId}: ${error.message}`);
    if (error.response) {
      console.error(`Error response status: ${error.response.status}`);
      console.error(`Error response data: ${error.response.data}`);
    }
    return null;
  }
}

async function fetchGameAnalysis(gameData) {
  // gameData should contain game.id which is needed to fetch the game summary
  if (!gameData || !gameData.game || !gameData.game.id) {
    console.error('fetchGameAnalysis: Invalid or missing gameData.game.id');
    return null;
  }

  const gameId = gameData.game.id;
  console.log(`Fetching game analysis for game ID: ${gameId}...`);

  try {
    // Update to use HTTP and v8 API like the working test script
    const response = await axios.get(
      `http://api.sportradar.us/mlb/trial/v8/en/games/${gameId}/summary.json?api_key=${SPORTS_RADAR_API_KEY}`
    );
    
    const analysisData = response.data;
    console.log(`Game analysis data received successfully for game ${gameId}`);
    
    // Extract data from the API response
    const gameDetails = analysisData.game;
    const homeTeam = gameDetails.home;
    const awayTeam = gameDetails.away;

    // Pass the full response.data to the extraction functions
    const keyPlays = extractKeyPlays(analysisData);
    const notablePerformances = extractNotablePerformances(analysisData);

    // Create the summary object with player data extracted from notablePerformances
    const summary = {
      game: gameDetails,
      players: {
        home: [], // Will be populated with player details if available
        away: []
      }
    };

    // Construct playerData from notablePerformances
    const playerData = notablePerformances
      .filter(p => p.id) // Ensure player has an id
      .map(p => ({
        id: p.id,
        full_name: p.name,
        zodiac_sign: p.zodiacSign || 'Unknown',
        element: p.element || 'Unknown'
      }));

    // If the response has player data, populate the players arrays
    if (response.data.statistics && response.data.statistics.players) {
      summary.players.home = response.data.statistics.players.home || [];
      summary.players.away = response.data.statistics.players.away || [];
    }

    return {
      score: `${awayTeam.name} ${awayTeam.runs} - ${homeTeam.runs} ${homeTeam.name}`,
      teams: {
        home: {
          name: homeTeam.name,
          market: homeTeam.market,
          abbr: homeTeam.abbr || homeTeam.name.substring(0, 3).toUpperCase(),
          runs: homeTeam.runs,
          hits: homeTeam.hits,
          errors: homeTeam.errors
        },
        away: {
          name: awayTeam.name,
          market: awayTeam.market,
          abbr: awayTeam.abbr || awayTeam.name.substring(0, 3).toUpperCase(),
          runs: awayTeam.runs,
          hits: awayTeam.hits,
          errors: awayTeam.errors
        }
      },
      keyPlays,
      notablePerformances,
      playerData,
      summary // Add the summary object with player details
    };
  } catch (error) {
    console.error(`Error fetching game analysis: ${error.message}`);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    
    // Return null on error, could add simulated data generation here if needed
    return null;
    // return createSimulatedGameAnalysis(gameDataFromAPI.game.id || null);
    return null;
  }
}

async function searchGameImages(gameId, date, awayTeamName, homeTeamName, gameData) {
  console.log(`searchGameImages called for gameId: ${gameId}, date: ${date}, away: ${awayTeamName}, home: ${homeTeamName}`);
  const images = [];

  if (gameData) {
    // Check for editorial images in gameData.game.editorial.images
    if (gameData.game && gameData.game.editorial && gameData.game.editorial.images && gameData.game.editorial.images.length > 0) {
      console.log(`Found ${gameData.game.editorial.images.length} editorial images in gameData.game.editorial.images`);
      images.push(...gameData.game.editorial.images.map(img => ({
        url: img.url,
        title: img.title || `${awayTeamName} vs ${homeTeamName} - Editorial Image`,
        credit: img.credit || 'Sportradar',
        source: 'Sportradar Editorial',
        page: img.source_url || `https://sportradar.com/`
      })));
    }
    // Check for editorial images in gameData.editorial.images (root level)
    else if (gameData.editorial && gameData.editorial.images && gameData.editorial.images.length > 0) {
      console.log(`Found ${gameData.editorial.images.length} editorial images in gameData.editorial.images`);
      images.push(...gameData.editorial.images.map(img => ({
        url: img.url,
        title: img.title || `MLB Game Image - Editorial`,
        credit: img.credit || 'Sportradar',
        source: 'Sportradar Editorial Root',
        page: img.source_url || `https://sportradar.com/`
      })));
    }
    // Check for photos in gameData.metadata.photos
    else if (gameData.metadata && gameData.metadata.photos && gameData.metadata.photos.length > 0) {
      console.log(`Found ${gameData.metadata.photos.length} photos in gameData.metadata.photos`);
      images.push(...gameData.metadata.photos.map(photo => ({
        url: photo.url,
        title: photo.title || 'MLB Game Photo - Metadata',
        credit: photo.credit || 'Sportradar',
        source: 'Sportradar Metadata',
        page: photo.source_url || 'https://sportradar.com/'
      })));
    } else {
      console.log('No editorial or metadata images found in Sportradar gameData.');
    }
  } else {
    console.log('No gameData provided to searchGameImages for Sportradar image extraction.');
  }

  // TODO: Implement Google Custom Search for additional images if Sportradar images are insufficient or per user preference.
  console.log('Placeholder: Google Custom Search for images would run here.');
  
  console.log(`searchGameImages returning ${images.length} image(s).`);
  return images;
}

async function generateArticleWithClaude(prompt) {
  console.log('generateArticleWithClaude called');
  // TODO: Implement actual logic
  return { title: 'Placeholder Title', content: '<p>Placeholder content.</p>', excerpt: 'Placeholder excerpt.' };
}

async function saveArticle(gameId, article, metadata) {
  console.log('saveArticle called for gameId:', gameId);
  
  // Check if we have all required data
  if (!gameId || !article || !metadata) {
    console.error('Missing required data for saving article');
    return false;
  }
  
  try {
    // Ensure the output directory exists
    await fs.mkdir(WEBSITE_OUTPUT_DIR, { recursive: true });
    
    // Save the article content as HTML
    const articlePath = path.join(WEBSITE_OUTPUT_DIR, `${gameId}.html`);
    await fs.writeFile(articlePath, article, 'utf8');
    
    // Save the metadata as JSON
    const metaPath = path.join(WEBSITE_DATA_DIR, `${gameId}.json`);
    await fs.mkdir(path.dirname(metaPath), { recursive: true });
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
    
    console.log(`Saved article and metadata for game ${gameId}`);
    return true;
  } catch (error) {
    console.error(`Error saving article for game ${gameId}:`, error);
    return false;
  }
}

async function updateWebsiteIndex(articleData) {
  console.log('updateWebsiteIndex called');
  
  try {
    const indexPath = path.join(WEBSITE_DATA_DIR, 'index.json');
    let articles = [];
    
    // Check if index file exists
    try {
      const data = await fs.readFile(indexPath, 'utf8');
      articles = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error; // Re-throw if it's not a "file not found" error
      }
      // If file doesn't exist, we'll create it with the new article
    }
    
    // Add or update the article in the index
    const existingIndex = articles.findIndex(a => a.id === articleData.id);
    if (existingIndex >= 0) {
      articles[existingIndex] = articleData;
    } else {
      articles.push(articleData);
    }
    
    // Sort by date, newest first
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save the updated index
    await fs.mkdir(path.dirname(indexPath), { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify(articles, null, 2), 'utf8');
    
    console.log('Updated website index with new article');
    return true;
  } catch (error) {
    console.error('Error updating website index:', error);
    return false;
  }
}

const BASEBALL_PLAYERS = [
  // Example dataset (should be replaced with real data or loaded from DB/file)
  {
    id: 'player-001',
    full_name: 'Salvador Perez',
    player_first_name: 'Salvador', // Added for consistency with old buildPlayerCards logic
    player_last_name: 'Perez',     // Added for consistency
    birth_date: '1990-05-10',
    player_birth_city: 'Valencia, Venezuela',
    player_current_team_abbreviation: 'KC', // Example, assuming this field exists
    player_position: 'C',
    chart: 'Sun Taurus, Moon Pisces, Mercury Gemini, Venus Aries',
    astro_influence_score: 88,
    zodiac_sign: 'Taurus',
    element: 'Earth',
    stats: { batting_average: '0.275', slugging_percentage: '0.495', on_base_percentage: '0.315', player_home_runs: 'N/A', player_rbi: 'N/A', player_era: 'N/A', player_wins: 'N/A', player_strikeouts: 'N/A' }
  },
  {
    id: 'player-002',
    full_name: 'Brandon Crawford',
    player_first_name: 'Brandon',
    player_last_name: 'Crawford',
    birth_date: '1987-01-21',
    player_birth_city: 'Mountain View, CA',
    player_current_team_abbreviation: 'SF', // Example
    player_position: 'SS',
    chart: 'Sun Aquarius, Moon Cancer, Mercury Capricorn, Venus Pisces',
    astro_influence_score: 72,
    zodiac_sign: 'Aquarius',
    element: 'Air',
    stats: { batting_average: '0.250', slugging_percentage: '0.390', on_base_percentage: '0.320', player_home_runs: 'N/A', player_rbi: 'N/A', player_era: 'N/A', player_wins: 'N/A', player_strikeouts: 'N/A' }
  }
  // Add more real players as needed
];

function buildPlayerCards(referencedNames, gameData) {
  console.log('buildPlayerCards called with', referencedNames, 'and gameData');
  if (!gameData || !gameData.game || !gameData.game.home || !gameData.game.away) {
    console.warn('buildPlayerCards: Invalid gameData structure for team abbreviations.');
    return referencedNames.map(name => ({ 
      id: `error-invalid-gamedata-${name.replace(/\s+/g, '-').toLowerCase()}`,
      full_name: name, 
      error: 'Invalid gameData for player card generation' 
    }));
  }

  const awayTeamAbbr = gameData.game.away.abbr;
  const homeTeamAbbr = gameData.game.home.abbr;
  
  return referencedNames.map(name => {
    // Normalize the input name for comparison
    const normalizedName = name.toLowerCase();

    // Find player by name and team (first try exact match on full_name)
    let player = BASEBALL_PLAYERS.find(p => {
      const playerFullName = p.full_name ? p.full_name.toLowerCase() : '';
      const playerTeam = p.player_current_team_abbreviation;
      
      if (!p.player_current_team_abbreviation) {
        // console.warn(`Player ${p.full_name || p.id} in BASEBALL_PLAYERS is missing 'player_current_team_abbreviation'. Team-specific matching may be affected.`);
      }
      return playerFullName === normalizedName && 
             (playerTeam === awayTeamAbbr || playerTeam === homeTeamAbbr);
    });
    
    // If no exact match with team, try just by name (full_name)
    if (!player) {
      player = BASEBALL_PLAYERS.find(p => {
        const playerFullName = p.full_name ? p.full_name.toLowerCase() : '';
        return playerFullName === normalizedName;
      });
    }

    // Fallback for players not found in BASEBALL_PLAYERS
    if (!player) {
      console.warn(`Player "${name}" not found in BASEBALL_PLAYERS. Creating a default card.`);
      return {
        id: `unknown-${name.replace(/\s+/g, '-').toLowerCase()}`,
        player_first_name: name.split(' ')[0] || '',
        player_last_name: name.split(' ').slice(1).join(' ') || '',
        full_name: name,
        player_birth_date: 'Unknown',
        player_birth_city: 'Unknown',
        player_current_team_abbreviation: 'UNK',
        player_position: 'Unknown',
        // Ensure all stat fields from the old script's default are present
        player_batting_average: 'N/A',
        player_home_runs: 'N/A',
        player_rbi: 'N/A',
        player_era: 'N/A',
        player_wins: 'N/A',
        player_strikeouts: 'N/A',
        // Include astro fields as well for consistency
        astro_influence_score: 0,
        zodiac_sign: 'Unknown',
        element: 'Unknown',
        chart: 'Unknown' // Added chart for completeness
      };
    }
    
    // Return a copy of the player object to avoid modifying the constant
    // and ensure all expected fields are present, falling back to defaults if necessary
    return {
        ...{
            // Defaults for all fields expected by the old script's unknown player structure
            id: `unknown-${name.replace(/\s+/g, '-').toLowerCase()}`,
            player_first_name: name.split(' ')[0] || '',
            player_last_name: name.split(' ').slice(1).join(' ') || '',
            full_name: name,
            player_birth_date: 'Unknown',
            player_birth_city: 'Unknown',
            player_current_team_abbreviation: 'UNK',
            player_position: 'Unknown',
            player_batting_average: 'N/A',
            player_home_runs: 'N/A',
            player_rbi: 'N/A',
            player_era: 'N/A',
            player_wins: 'N/A',
            player_strikeouts: 'N/A',
            astro_influence_score: 0,
            zodiac_sign: 'Unknown',
            element: 'Unknown',
            chart: 'Unknown'
        },
        ...player // Spread the found player data, overwriting defaults
    };
  });
}

// --- Helper Functions for Prompt Formatting ---

function getZodiacSign(date) {
  // Handle undefined or invalid date formats
  if (!date || typeof date !== 'string' || date.length < 10) {
    console.log(`Invalid date format for zodiac calculation: ${date}`);
    return 'Unknown';
  }
  
  // date is expected in 'YYYY-MM-DD' format
  const day = parseInt(date.substring(8, 10));
  const month = parseInt(date.substring(5, 7));
  if (isNaN(day) || isNaN(month)) return 'Unknown'; // Basic validation

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  return 'Unknown';
}

function formatKeyPlays(analysisData) {
  if (!analysisData || !analysisData.keyPlays || analysisData.keyPlays.length === 0) {
    return '<p>No key plays available for this game.</p>';
  }
  let html = '<ul>';
  analysisData.keyPlays.forEach(play => {
    // Assuming play has description, awayScore, homeScore
    html += `<li>${play.description} (Score: ${play.awayScore}-${play.homeScore})</li>`;
  });
  html += '</ul>';
  return html;
}

function formatNotablePerformances(notablePerformances, playerData) {
  // notablePerformances: array of { playerName, performanceDescription }
  // playerData: array of player objects from buildPlayerCards, expected to have { name, teamAbbreviation, id (for card link) }
  if (!notablePerformances || notablePerformances.length === 0) {
    return '<p>No notable performances highlighted for this game.</p>';
  }

  let html = '';
  notablePerformances.forEach(perf => {
    const playerName = perf.playerName || 'Unknown Player';
    const playerDetail = playerData.find(p => p.name === playerName);
    
    const playerCardId = playerDetail ? playerDetail.id : `${(playerDetail && playerDetail.teamAbbreviation) || 'UNKNOWN'}-${playerName.replace(/\s+/g, '-')}`;

    html += `
      <div>
        <h4>${playerName} (<a href="#${playerCardId}">see player card</a>)</h4>
        <p>${perf.performanceDescription}</p>
      </div>
    `;
  });
  return html;
}

function createPlayerCardHtml(player) {
  // player object is expected to have: 
  // id (card ID, e.g., "KC-Salvador-Perez"), 
  // fullName, birthDate, position, teamAbbreviation,
  // stats (object: { batting_average, slugging_percentage, on_base_percentage, home_runs, rbi, era, wins, losses, strikeouts }), 
  // astrologicalInsights (string), and optionally zodiacSign (birth zodiac)

  if (!player || !player.id) {
    console.warn('Skipping player card generation due to missing player data or ID for player:', player ? player.fullName : 'Unknown');
    return '';
  }

  const cardId = player.id;
  const birthZodiacSign = player.zodiacSign || (player.birthDate ? getZodiacSign(player.birthDate) : 'Unknown');

  let statsHtml = '<p>No detailed stats available.</p>';
  if (player.stats) {
    statsHtml = '<ul>';
    if (player.position && player.position.toUpperCase() !== 'P') { // Batter stats
      statsHtml += `<li>BA: ${player.stats.batting_average !== undefined ? player.stats.batting_average : 'N/A'}</li>`;
      statsHtml += `<li>SLG: ${player.stats.slugging_percentage !== undefined ? player.stats.slugging_percentage : 'N/A'}</li>`;
      statsHtml += `<li>OBP: ${player.stats.on_base_percentage !== undefined ? player.stats.on_base_percentage : 'N/A'}</li>`;
      statsHtml += `<li>HR: ${player.stats.home_runs !== undefined ? player.stats.home_runs : 'N/A'}</li>`;
      statsHtml += `<li>RBI: ${player.stats.rbi !== undefined ? player.stats.rbi : 'N/A'}</li>`;
    } else if (player.position && player.position.toUpperCase() === 'P') { // Pitcher stats
      statsHtml += `<li>ERA: ${player.stats.era !== undefined ? player.stats.era : 'N/A'}</li>`;
      statsHtml += `<li>W-L: ${player.stats.wins !== undefined ? player.stats.wins : 'N/A'}-${player.stats.losses !== undefined ? player.stats.losses : 'N/A'}</li>`;
      statsHtml += `<li>SO: ${player.stats.strikeouts !== undefined ? player.stats.strikeouts : 'N/A'}</li>`;
    } else { // Position unknown or other - provide a mix or generic stats
        statsHtml += `<li>Batting Avg: ${player.stats.batting_average !== undefined ? player.stats.batting_average : 'N/A'}</li>`;
        statsHtml += `<li>Home Runs: ${player.stats.home_runs !== undefined ? player.stats.home_runs : 'N/A'}</li>`;
        statsHtml += `<li>ERA: ${player.stats.era !== undefined ? player.stats.era : 'N/A'}</li>`;
    }
    statsHtml += '</ul>';
  }
  
  const astrologicalInfo = player.astrologicalInsights || `Astrological insights for ${birthZodiacSign} players like ${player.fullName} on this game day...`;

  return `
    <div class="player-card" id="${cardId}">
      <h3>${player.fullName} (${player.teamAbbreviation || 'N/A'} - ${player.position || 'N/A'})</h3>
      <p><strong>Birth Zodiac Sign:</strong> ${birthZodiacSign}</p>
      <h4>Game Day Astrological Influence:</h4>
      <p>${astrologicalInfo}</p>
      <h4>Key Stats:</h4>
      ${statsHtml}
    </div>
  `;
}

// End of new helper functions

function createArticlePrompt(gameData, analysisData, images, playerCards) {
  // Limit images (e.g., to 3 as discussed for refinement)
  const imgs = (images || []).slice(0, 3);

  // Game outcome description
  let gameOutcome = "an evenly matched contest";
  const homeName = gameData.game.home.name || 'Home Team';
  const awayName = gameData.game.away.name || 'Away Team';
  const homeScore = analysisData.summary?.game?.home?.runs ?? 0;
  const awayScore = analysisData.summary?.game?.away?.runs ?? 0;

  if (homeScore > awayScore) {
    const scoreDiff = homeScore - awayScore;
    if (scoreDiff >= 5) gameOutcome = `a dominant victory for the ${homeName}`;
    else if (scoreDiff >= 3) gameOutcome = `a solid win for the ${homeName}`;
    else gameOutcome = `a close win for the ${homeName}`;
  } else if (awayScore > homeScore) {
    const scoreDiff = awayScore - homeScore;
    if (scoreDiff >= 5) gameOutcome = `a commanding road win for the ${awayName}`;
    else if (scoreDiff >= 3) gameOutcome = `a strong showing by the ${awayName}`;
    else gameOutcome = `a narrow victory for the ${awayName}`;
  } else if (homeScore === 0 && awayScore === 0 && (!analysisData.summary?.game?.status || analysisData.summary?.game?.status === 'scheduled')) {
    gameOutcome = "details are emerging from this matchup";
  } else if (homeScore === awayScore) {
    gameOutcome = "a deadlocked tie";
  }

  // Get current zodiac sign based on game date using the new helper
  let gameDateString = gameData.game.scheduled || gameData.game.date; // Try scheduled first, then date
  
  // If we have a full ISO date with time, extract just the date portion
  if (gameDateString && gameDateString.includes('T')) {
    gameDateString = gameDateString.split('T')[0]; // Extract YYYY-MM-DD from ISO format
  }
  
  console.log(`Game date for zodiac calculation: ${gameDateString}`);
  const currentSign = getZodiacSign(gameDateString);

  // Player cards HTML using the playerCards argument and createPlayerCardHtml helper
  const playerCardsHtml = playerCards && playerCards.length > 0
    ? `<div class="player-cards-section">
        <h2>Star Players Spotlight</h2>
        <div class="player-cards-container">
          ${playerCards.map(player => createPlayerCardHtml(player)).join('')}
        </div>
      </div>`
    : '<!-- No player data available for cards -->';

  // Key Plays HTML using formatKeyPlays helper
  const keyPlaysHtml = formatKeyPlays({ keyPlays: analysisData.summary?.keyPlays || [] });

  // Notable Performances HTML using formatNotablePerformances helper
  const notablePerformancesHtml = formatNotablePerformances(analysisData.summary?.notablePerformances || [], playerCards);

  // Image instructions
  let imageInstructions = '<!-- No images available for selection. -->';
  if (imgs.length > 0) {
    imageInstructions = `
    IMPORTANT IMAGE SELECTION TASK:
    From the "AVAILABLE IMAGES" list below, select the BEST images for the article.
    You MUST choose ONE featured image (high-action, compelling) and up to TWO additional supporting images.
    
    OUTPUT FORMAT FOR EACH SELECTED IMAGE (Strictly follow this format, including the comment):
    <!-- IMAGE_SELECTED: [Original index from list, e.g., 1, 2, or 3] -->
    <div class="article-image">
      <img src="[Image URL]" alt="[Descriptive Alt Text]" />
      <div class="image-credit">Image credit: <a href="[Image Page URL]" target="_blank" rel="noopener">[Image Credit/Source]</a></div>
    </div>

    AVAILABLE IMAGES:
    ${imgs.map((img, index) => `
    --- IMAGE ${index + 1} ---
    URL: ${img.url}
    Title: ${img.title || 'Game action'}
    Source: ${img.source || 'Source'}
    Page URL: ${img.page || '#'} 
    Credit: ${img.credit || img.source || 'N/A'}
    `).join('\n')}
    
    Respond with ONLY the HTML for the selected images using the specified "OUTPUT FORMAT". Do NOT include any other text or explanation about your choices.
    Place the featured image first.
    `;
  }

  // The main prompt structure
  const prompt = `
    You are an expert sports journalist and astrologer tasked with writing an engaging baseball game recap.
    Your article must be well-structured, insightful, and incorporate astrological themes related to the game day's zodiac sign: ${currentSign}.
    The game was between the ${awayName} and the ${homeName}. The final score was ${awayName} ${awayScore} - ${homeName} ${homeScore}, resulting in ${gameOutcome}.
    
    Follow these instructions VERY CAREFULLY:
    1.  OUTPUT ONLY THE HTML CONTENT FOR THE ARTICLE. Do NOT include any markdown, introductory text, or explanations outside the HTML.
    2.  The article should start with an <h1> title that is captivating and relevant.
    3.  Incorporate the provided "Game Day Astrological Theme", "Key Plays", "Notable Performances", and "Player Cards" into a cohesive narrative.
    4.  Player names mentioned in the narrative should link to their respective player cards if a card exists (e.g., <a href="#PLAYER_CARD_ID">Player Name</a>). Player card IDs are in the format like "TEAM-Player-Name".
    5.  Use the provided CSS styles by adhering to the class names and HTML structure.
    6.  The tone should be engaging, professional, and subtly mystical, blending sports analysis with astrological insights.
    7.  The article should include a game recap, astrological analysis related to ${currentSign}, highlights of key plays, and notable player performances.
    8.  IMAGE INTEGRATION: Follow the "IMPORTANT IMAGE SELECTION TASK" instructions precisely to select and embed images. Place the selected image HTML where appropriate in the article flow (e.g., one featured image near the top, others interspersed).

    <style>
      .article-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      h1 { font-size: 2.4em; color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
      h2 { font-size: 1.8em; color: #2c5282; margin: 35px 0 15px; padding-bottom: 8px; border-bottom: 1px solid #cbd5e0; }
      h3 { font-size: 1.5em; color: #2d3748; margin: 25px 0 10px; }
      h4 { font-size: 1.2em; color: #4a5568; margin: 20px 0 8px; }
      p { margin-bottom: 1.5em; font-size: 1em; line-height: 1.7; }
      ul, ol { margin-bottom: 1.5em; padding-left: 20px; }
      li { margin-bottom: 0.5em; }
      a { color: #3182ce; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .final-score-box { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; }
      .final-score-box h3 { margin-top: 0; color: #1a365d; font-size: 1.6em; }
      .score-details { font-size: 1.2em; margin: 10px 0; }
      .score-details .team-name { font-weight: 600; }
      .score-details .runs { font-weight: bold; font-size: 1.3em; color: #2c5282; }
      .game-status-recap { font-style: italic; color: #4a5568; margin-top: 10px; }
      .article-image-block { margin: 25px 0; text-align: center; } /* This class is for already placed images, not for Claude selection */
      .article-image-block img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
      .article-image { margin: 25px 0; text-align: center; } /* Class for Claude to use for selected images */
      .article-image img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
      .image-credit { font-size: 0.85em; color: #718096; margin-top: 8px; text-align: center; }
      .astrological-insight { background-color: #e6fffa; border-left: 4px solid #38b2ac; padding: 15px 20px; margin: 25px 0; border-radius: 0 4px 4px 0; }
      .astrological-insight h4 { margin-top: 0; color: #2c7a7b; }
      .key-plays-section ul { list-style-type: disc; }
      .notable-performances-section div { margin-bottom: 1.5em; padding-left: 15px; border-left: 3px solid #f6e05e; }
      .notable-performances-section h4 a { color: #dd6b20; }
      .player-cards-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      .player-cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
      .player-card { background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s ease-in-out; }
      .player-card:hover { transform: translateY(-5px); }
      .player-card h3 { margin-top: 0; font-size: 1.3em; color: #1a365d; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; margin-bottom: 12px; }
      .player-card p { font-size: 0.95em; margin-bottom: 0.8em; }
      .player-card h4 { font-size: 1.1em; color: #2d3748; margin-top: 15px; margin-bottom: 5px; }
      .player-card ul { font-size: 0.9em; padding-left: 18px; margin-bottom: 0; }
      .player-card ul li { margin-bottom: 0.3em; }
      .game-recap-intro p:first-of-type { font-size: 1.1em; font-weight: 500; }
    </style>

    <article class="article-container">
      <!-- Title will be generated by Claude based on the content -->
      <!-- Example: <h1>The ${awayName} Clash with ${homeName} Under a ${currentSign} Sky!</h1> -->
      
      <section class="game-recap-intro">
        <p>The cosmic energies of ${currentSign} set a dynamic stage for today’s MLB showdown as the ${awayName} faced off against the ${homeName}. Spectators witnessed ${analysisData.summary?.overview?.gameDescription || 'a captivating game from start to finish'}, culminating in ${gameOutcome}.</p>
        <!-- Claude should insert the FEATURED IMAGE HTML here, following the IMAGE_SELECTED format -->
      </section>

      <section class="final-score-box">
        <h3>Final Score</h3>
        <div class="score-details">
          <span class="team-name">${awayName}:</span> <span class="runs">${awayScore}</span>
        </div>
        <div class="score-details">
          <span class="team-name">${homeName}:</span> <span class="runs">${homeScore}</span>
        </div>
        <p class="game-status-recap">${analysisData.summary?.overview?.recap || 'A memorable contest that kept fans on the edge of their seats.'}</p>
      </section>

      <section class="astrological-insight">
        <h4>Game Day Astrological Theme: ${currentSign}</h4>
        <p>${analysisData.summary?.overview?.astrologicalAnalysis || `Today's game, played under the vibrant influence of ${currentSign}, hinted at themes of [Claude: insert typical ${currentSign} traits like 'bold initiatives/emotional currents/sharp strategies/grounded efforts']. This astrological backdrop seemed to color the game's turning points by [Claude: elaborate with examples, e.g., 'fueling unexpected comebacks / highlighting disciplined defense / sparking moments of individual brilliance'].`}</p>
      </section>

      <section class="key-plays-section">
        <h2>Key Plays Unpacked</h2>
        ${keyPlaysHtml}
        <!-- Claude can add more narrative around key plays here, linking to astrological themes if possible. -->
        <!-- Claude might insert an additional IMAGE HTML here, following the IMAGE_SELECTED format -->
      </section>

      <section class="notable-performances-section">
        <h2>Stellar Performances</h2>
        ${notablePerformancesHtml}
        <!-- Claude can expand on these performances, perhaps tying them to player's birth zodiac or game day astrology. -->
      </section>
      
      ${playerCardsHtml}

      <section class="game-summary-and-outlook">
          <h2>Game Summary & Astrological Outlook</h2>
          <p>In essence, this game was a compelling chapter in the MLB season, marked by [Claude: e.g., 'the fiery spirit of ${currentSign}', 'the strategic depth of both teams', 'pivotal moments that shifted momentum']. The narrative of the game, from key plays to standout performances, resonated with the day's astrological undercurrents.</p>
          <p>Looking forward, the celestial alignments suggest that [Claude: provide a brief, engaging astrological outlook for the teams or key players, e.g., 'the ${homeScore > awayScore ? homeName : awayName} may find the upcoming period favorable for building on this momentum, especially if they tap into the intuitive aspects of the approaching lunar cycle...'].</p>
          <!-- Claude might insert a final IMAGE HTML here, following the IMAGE_SELECTED format -->
      </section>

      <!-- IMPORTANT: IMAGE SELECTION INSTRUCTIONS -->
      <!--
      ${imageInstructions}
      -->
      
    </article>
  `;
  return prompt;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper Functions for Game Analysis (from old script) ---
function createSimulatedGameAnalysis(gameId) {
  // gameId is not strictly used here but kept for signature consistency if needed later
  console.log(`Creating simulated game analysis ${gameId ? 'for game ' + gameId : ''}`);
  return {
    score: 'Simulated TeamA 5 - Simulated TeamB 3',
    teams: {
      home: { name: 'Simulated TeamB', market: 'MarketB', abbr: 'SMB', runs: 3, hits: 7, errors: 1 },
      away: { name: 'Simulated TeamA', market: 'MarketA', abbr: 'SMA', runs: 5, hits: 10, errors: 0 }
    },
    keyPlays: [
      { inning: 1, description: 'Player One hits a solo home run.', team: 'SMA' },
      { inning: 4, description: 'Player Two scores on a double by Player Three.', team: 'SMB' }
    ],
    notablePerformances: [
      { name: 'Player One', team: 'SMA', stats: '1-4, HR, RBI', id: 'sim-player-1', zodiacSign: 'Leo', element: 'Fire' },
      { name: 'Player Three', team: 'SMB', stats: '2-4, 2B, RBI', id: 'sim-player-3', zodiacSign: 'Cancer', element: 'Water' }
    ],
    playerData: [
      { id: 'sim-player-1', full_name: 'Player One', zodiac_sign: 'Leo', element: 'Fire' },
      { id: 'sim-player-3', full_name: 'Player Three', zodiac_sign: 'Cancer', element: 'Water' }
    ]
  };
}

function extractKeyPlays(data) {
  const keyPlays = [];
  if (!data || !data.innings) {
    console.log('extractKeyPlays: No innings data found.');
    return keyPlays;
  }
  data.innings.forEach(inning => {
    const homeRuns = inning.home?.runs || 0;
    const awayRuns = inning.away?.runs || 0;
    if (homeRuns > 0 || awayRuns > 0) {
      keyPlays.push({
        inning: inning.number,
        description: `${homeRuns > 0 ? `${data.game.home.name} scored ${homeRuns} run(s)` : ''} ${awayRuns > 0 ? `${data.game.away.name} scored ${awayRuns} run(s)` : ''}`.trim(),
        homeScore: inning.home?.score_after_inning || data.game.home?.runs || 0, // Attempt to get score at that point
        awayScore: inning.away?.score_after_inning || data.game.away?.runs || 0
      });
    }
  });
  console.log(`extractKeyPlays: Found ${keyPlays.length} key plays.`);
  return keyPlays;
}

const extractNotablePerformances = (data) => {
  console.log('extractNotablePerformances called.');
  if (!data || !data.game || !data.game.home || !data.game.away) {
    console.log('extractNotablePerformances: Basic game data (home/away teams) missing.');
    return [{ name: 'Game Summary', team: 'N/A', type: 'summary', stats: { summary: 'Core game data is missing for performance analysis.' } }];
  }

  const homeTeamName = data.game.home.name || 'Home Team';
  const awayTeamName = data.game.away.name || 'Away Team';
  const homeScore = data.game.home.runs !== undefined ? data.game.home.runs : 'N/A';
  const awayScore = data.game.away.runs !== undefined ? data.game.away.runs : 'N/A';

  // This is a simplified version based on the old script's fallback.
  console.log('extractNotablePerformances: Returning generic game summary as detailed player stats parsing is not yet fully implemented here.');
  return [
    {
      name: 'Game Summary',
      team: 'N/A',
      type: 'summary',
      stats: {
        summary: `The ${homeTeamName} vs ${awayTeamName} game concluded with a score of ${homeScore} - ${awayScore}. More detailed player performances will be analyzed if available.`
      },
      id: `summary-${data.game.id || 'unknown_game'}` 
    }
  ];
};

async function generateTestArticle(gameId, date) {
  console.log(`\n--- Generating article for game ${gameId} on ${date} ---`);
  
  // Fetch real game data from Sportradar API
  let gameData;
  try {
    const gameDate = date.replace(/-/g, '/');
    const scheduleUrl = `http://api.sportradar.us/mlb/trial/v8/en/games/${gameDate}/schedule.json?api_key=${SPORTS_RADAR_API_KEY}`;
    console.log(`Fetching schedule from: ${scheduleUrl}`);
    
    const scheduleResponse = await axios.get(scheduleUrl);
    const games = scheduleResponse.data.games || [];
    
    if (games.length === 0) {
      console.log('No games found for the specified date');
      return null;
    }
    
    // Find the specific game by ID or use the first game
    gameData = games.find(game => game.id === gameId) || games[0];
    
    if (!gameData) {
      console.error('No valid game data found');
      return null;
    }
    
    console.log(`Found game: ${gameData.away_team} vs ${gameData.home_team}`);
    
    // Add some mock data for testing
    gameData.summary = `In an exciting matchup, the ${gameData.away.name || gameData.away_team} faced off against the ${gameData.home.name || gameData.home_team} at ${gameData.venue?.name || 'the ballpark'}. ` +
      `The game was a close contest with both teams showing strong performances.`;
      
    // Ensure the team data is properly structured
    gameData.away = gameData.away || {};
    gameData.home = gameData.home || {};
    gameData.away.team = gameData.away.team || { market: gameData.away.market, name: gameData.away.name };
    gameData.home.team = gameData.home.team || { market: gameData.home.market, name: gameData.home.name };
    gameData.away.runs = gameData.away.runs || 0;
    gameData.home.runs = gameData.home.runs || 0;
    
  } catch (error) {
    console.error('Error fetching game data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
  
  // Limit to top 5 players to keep the article focused
  const topPlayers = [];
  
  // Create player cards HTML
  const playerCardsHtml = topPlayers.map(player => {
    const playerName = player.name || 'Player';
    const position = player.position || 'N/A';
    const stats = player.stats || 'No stats available';
    const zodiac = player.zodiac || 'N/A';
    const traits = player.zodiacTraits || [];
    
    return `
      <div class="player-card">
        <h3>${playerName}</h3>
        <p>Position: ${position}</p>
        <p>Stats: ${JSON.stringify(stats)}</p>
        <div class="zodiac-info">
          <p>Zodiac: ${zodiac}</p>
          ${traits.length > 0 ? `<p>Traits: ${traits.join(', ')}</p>` : ''}
        </div>
      </div>
    `;
  }).join('\n');
  
  // Create the article content
  const articleContent = `
    <div class="game-recap">
      <div class="game-header">
        <h1>${gameData.away.team.market} vs ${gameData.home.team.market}</h1>
        <div class="game-meta">
          <span>${new Date(gameData.scheduled).toLocaleDateString()} • ${gameData.venue?.name || 'TBD'}</span>
        </div>
        
        <div class="final-score">
          <div class="team">
            <span class="team-name">${gameData.away.team.market}</span>
            <span class="team-runs">${gameData.away.runs || 0}</span>
          </div>
          <div class="team">
            <span class="team-name">${gameData.home.team.market}</span>
            <span class="team-runs">${gameData.home.runs || 0}</span>
          </div>
        </div>
      </div>
      
      <div class="game-summary">
        <h2>Game Recap</h2>
        <p>${gameData.summary || 'No game summary available.'}</p>
      </div>
      
      ${topPlayers.length > 0 ? `
      <div class="player-performances">
        <h2>Top Performers</h2>
        <div class="player-cards">
          ${playerCardsHtml}
        </div>
      </div>
      ` : ''}
      
      <div class="game-notes">
        <h3>Game Notes</h3>
        <ul>
          <li>Attendance: ${gameData.attendance?.toLocaleString() || 'N/A'}</li>
          <li>Duration: ${gameData.duration || 'N/A'}</li>
          <li>Venue: ${gameData.venue?.name || 'N/A'}</li>
        </ul>
      </div>
    </div>
    
    <style>
      .game-recap { max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; }
      .game-header { text-align: center; margin-bottom: 2rem; }
      .game-meta { color: #666; margin: 0.5rem 0; }
      .final-score { 
        display: flex; 
        justify-content: center; 
        gap: 2rem; 
        margin: 1.5rem 0; 
        font-size: 1.5rem;
      }
      .team { text-align: center; }
      .team-name { display: block; font-weight: bold; }
      .team-runs { font-size: 2.5rem; font-weight: bold; }
      .player-cards { 
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
        gap: 1rem; 
        margin: 1rem 0; 
      }
      .player-card {
        background: #f9f9f9;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .player-card h3 {
        margin-top: 0;
        color: #333;
      }
      .zodiac-info {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #eee;
      }
      .game-notes { 
        font-size: 0.9rem; 
        color: #666; 
        margin-top: 2rem; 
        padding-top: 1rem; 
        border-top: 1px solid #eee;
      }
    </style>
  `;
  
  // Create article metadata
  const articleData = {
    id: gameData.id || gameId,
    title: `${gameData.away.team.market} vs ${gameData.home.team.market} - ${new Date(gameData.scheduled).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    description: `Recap of the MLB game between ${gameData.away.team.market} and ${gameData.home.team.market}`,
    publishedAt: new Date().toISOString(),
    image: '',
    teamHome: gameData.home.team.market,
    teamAway: gameData.away.team.market,
    score: `${gameData.away.runs || 0} - ${gameData.home.runs || 0}`,
    date: new Date(gameData.scheduled).toISOString(),
    content: articleContent,
    venue: gameData.venue?.name || 'TBD',
    attendance: gameData.attendance,
    duration: gameData.duration
  };
  
  // Save the article
  await saveArticle(gameId, articleContent, articleData);
  
  // Update the website index
  await updateWebsiteIndex(articleData);
  
  console.log(`✅ Generated article for ${gameData.away.team.market} vs ${gameData.home.team.market}`);
  
  return articleData;
}

async function generateSimulatedArticle(gameId, date) {
  console.log('Generating simulated article data...');
  
  // Use the existing simulated data as fallback
  const gameData = {
    id: gameId,
    scheduled: date,
    status: 'closed',
    home: {
      team: {
        name: 'Giants',
        market: 'San Francisco',
        alias: 'SF',
        id: 'sr:team:3792'
      },
      runs: 4,
      hits: 8,
      errors: 0
    },
    away: {
      team: {
        name: 'Dodgers',
        market: 'Los Angeles',
        alias: 'LAD',
        id: 'sr:team:3809'
      },
      runs: 2,
      hits: 6,
      errors: 1
    },
    venue: {
      name: 'Oracle Park',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA'
    },
    attendance: 38742,
    duration: '3:12',
    weather: '72°F, Clear'
  };
  
  // Generate analysis with more detailed content
  const analysisData = await createDetailedGameAnalysis(gameData);
  
  // Rest of the function remains the same as the original generateTestArticle
  // but using the simulated data structure
  
  // ... [rest of the function remains the same]
  
  return articleData;
}

async function createDetailedGameAnalysis(gameData) {
  console.log('Creating detailed game analysis...');
  
  // Simulate more detailed analysis
  const keyPlays = [
    { inning: '1st', description: `${gameData.away.team.market} scores first with a solo home run.` },
    { inning: '3rd', description: `${gameData.home.team.market} ties the game with an RBI double.` },
    { 
      inning: '7th', 
      description: `${gameData.home.team.market} takes the lead with a 2-run homer, bringing the score to ${gameData.home.runs}-${gameData.away.runs}.` 
    },
    { 
      inning: '9th', 
      description: `${gameData.home.team.market}'s closer strikes out the side to secure the win.` 
    }
  ];
  
  // Generate astrological insights based on the game date
  const gameDate = new Date(gameData.scheduled);
  const zodiacSign = getZodiacSign(gameDate);
  
  const astrologicalInsights = `
    <p>The game took place under the sign of ${zodiacSign}, which often brings unexpected turns of events. 
    This was evident in the ${gameDate.getMonth() < 6 ? 'early' : 'late'} part of the season, 
    where ${gameData.home.team.market} showed strong ${zodiacSign} energy with their performance.</p>
    
    <p>Key players born under ${zodiacSign} had a significant impact on the game's outcome, 
    particularly in the later innings when the pressure was highest.</p>
  `;
  
  // Generate a more detailed summary
  const summary = `In a thrilling matchup at ${gameData.venue?.name || 'the ballpark'}, the 
  ${gameData.home.team.market} defeated the ${gameData.away.team.market} with a final score of 
  ${gameData.home.runs}-${gameData.away.runs}. The game featured strong pitching and timely hitting, 
  with the home team pulling ahead in the later innings to secure the victory.`;
  
  // Identify key players
  const keyPlayers = [
    { 
      id: 'player-1',
      name: 'Mike Trout',
      team: gameData.home.team.id,
      position: 'CF',
      stats: '3-4, 2B, HR, 3 RBI',
      zodiac: 'Leo',
      zodiacTraits: 'Confident, Ambitious, Generous'
    },
    { 
      id: 'player-2',
      name: 'Mookie Betts',
      team: gameData.away.team.id,
      position: 'RF',
      stats: '2-4, HR, 2 RBI',
      zodiac: 'Libra',
      zodiacTraits: 'Balanced, Diplomatic, Social'
    },
    { 
      id: 'player-3',
      name: 'Jacob deGrom',
      team: gameData.home.team.id,
      position: 'SP',
      stats: '7.0 IP, 5 H, 2 ER, 10 K',
      zodiac: 'Cancer',
      zodiacTraits: 'Intuitive, Emotional, Protective'
    }
  ];
  
  return {
    summary,
    keyPlays,
    astrologicalInsights,
    keyPlayers,
    weather: gameData.weather || '72°F, Clear',
    attendance: gameData.attendance?.toLocaleString() || '38,742',
    duration: gameData.duration || '3:12'
  };
}

async function generateTestArticles() {
  console.log('generateTestArticles called');
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(WEBSITE_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(WEBSITE_DATA_DIR, { recursive: true });

    const dates = process.argv[2] ? process.argv[2].split(',') : ['2025-05-30']; // Using current season date
    console.log(`Processing dates: ${dates.join(', ')}`);

    for (const date of dates) {
      const schedule = await fetchMLBSchedule(date);
      await delay(2000); // Add delay after schedule fetch to avoid rate limiting
      
      if (schedule && schedule.length > 0) { // schedule is now the array of games
        const gameToProcess = schedule[0]; // Process the first game for now
        console.log(`Processing game: ${gameToProcess.id} on ${date}`);
        await generateTestArticle(gameToProcess.id, date);
      } else {
        console.log(`No games found for ${date}`);
      }
      await delay(2000); // Increase delay between games
    }
    console.log('Finished generateTestArticles.');
  } catch (error) {
    console.error('Error in generateTestArticles:', error);
  }
}

generateTestArticles();

