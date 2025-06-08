import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SPORTS_RADAR_API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY || 'J4t0qEW27E9yXM5CYT7R0F2tXwc8nx5ChrN5egbs';
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-articles');
const WEBSITE_OUTPUT_DIR = path.join(process.cwd(), 'public', 'news', 'articles');
const WEBSITE_DATA_DIR = path.join(process.cwd(), 'public', 'news', 'data');

// Zodiac signs and traits for astrological insights
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const ZODIAC_TRAITS = {
  Aries: 'Adventurous, Courageous, Energetic',
  Taurus: 'Patient, Reliable, Determined',
  Gemini: 'Versatile, Curious, Witty',
  Cancer: 'Intuitive, Emotional, Protective',
  Leo: 'Confident, Ambitious, Generous',
  Virgo: 'Analytical, Practical, Diligent',
  Libra: 'Balanced, Diplomatic, Social',
  Scorpio: 'Passionate, Resourceful, Brave',
  Sagittarius: 'Optimistic, Honest, Adventurous',
  Capricorn: 'Responsible, Disciplined, Self-controlled',
  Aquarius: 'Progressive, Original, Independent',
  Pisces: 'Compassionate, Artistic, Intuitive'
};

// Helper functions
function getRandomZodiacSign() {
  return ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)];
}

function getRandomZodiacTraits(sign) {
  return ZODIAC_TRAITS[sign] || 'Mysterious, Enigmatic';
}

function getZodiacSign(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 0 && day <= 19)) return 'Sagittarius';
  if ((month === 0 && day >= 20) || (month === 1 && day <= 18)) return 'Capricorn';
  if ((month === 1 && day >= 19) || (month === 2 && day <= 20)) return 'Aquarius';
  return 'Pisces';
}

async function saveArticle(gameId, articleContent, articleData) {
  try {
    // Ensure the output directories exist
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(WEBSITE_OUTPUT_DIR, { recursive: true });
    await fs.mkdir(WEBSITE_DATA_DIR, { recursive: true });
    
    // Create a slug for the filename if not provided
    const slug = articleData.slug || 
      `${articleData.teamAway.toLowerCase().replace(/\s+/g, '-')}-vs-${articleData.teamHome.toLowerCase().replace(/\s+/g, '-')}-${new Date(articleData.date).toISOString().split('T')[0]}`;
    
    // Save the article as HTML in the public directory
    const htmlOutputPath = path.join(WEBSITE_OUTPUT_DIR, `${slug}.html`);
    await fs.writeFile(htmlOutputPath, articleContent, 'utf8');
    
    // Save the article data as JSON for the API
    const jsonOutputPath = path.join(WEBSITE_OUTPUT_DIR, `${slug}.json`);
    await fs.writeFile(jsonOutputPath, JSON.stringify(articleData, null, 2), 'utf8');
    
    console.log(`✅ Article saved to ${htmlOutputPath}`);
    console.log(`✅ Article data saved to ${jsonOutputPath}`);
    
    return {
      htmlPath: htmlOutputPath,
      jsonPath: jsonOutputPath,
      slug: slug
    };
  } catch (error) {
    console.error('Error saving article:', error);
    return null;
  }
}

async function updateWebsiteIndex(articleData) {
  try {
    const indexPath = path.join(WEBSITE_DATA_DIR, 'index.json');
    let articles = [];
    
    // Load existing articles if index exists
    try {
      await fs.stat(indexPath); // Check if file exists
      const existingData = await fs.readFile(indexPath, 'utf8');
      try {
        const parsedData = JSON.parse(existingData);
        // Handle both array format and object with articles property
        articles = Array.isArray(parsedData) ? parsedData :
                 (parsedData.articles || []);
      } catch (parseError) {
        console.error('Error parsing existing index:', parseError);
        articles = []; // Start with an empty array if parsing fails
      }
    } catch (statError) {
      if (statError.code === 'ENOENT') {
        console.log('Index file not found, creating a new one.');
        // articles is already initialized to []
      } else {
        console.error('Error checking for index file:', statError);
        // articles is already initialized to []
      }
    }
    
    // Prepare article data for the index
    const indexArticle = {
      id: articleData.id,
      title: articleData.title,
      description: articleData.description,
      publishedAt: articleData.publishedAt || new Date().toISOString(),
      image: articleData.image || '',
      teamHome: articleData.teamHome,
      teamAway: articleData.teamAway,
      score: articleData.score,
      date: articleData.date,
      slug: articleData.slug || articleData.id,
      venue: articleData.venue,
      attendance: articleData.attendance,
      duration: articleData.duration
    };
    
    // Add or update the current article
    const existingIndex = articles.findIndex(a => a.id === articleData.id);
    if (existingIndex >= 0) {
      articles[existingIndex] = indexArticle;
    } else {
      articles.unshift(indexArticle);
    }
    
    // Sort by date, newest first
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save the updated index as an object with an articles array
    const indexData = {
      lastUpdated: new Date().toISOString(),
      count: articles.length,
      articles: articles
    };
    
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    
    console.log(`✅ Updated website index with ${articles.length} articles`);
    return true;
  } catch (error) {
    console.error('Error updating website index:', error);
    return false;
  }
}

function buildPlayerCards(players, gameData) {
  console.log(`Building player cards for ${players?.length || 0} players`);
  
  // Ensure we have valid player data
  if (!players || !Array.isArray(players) || players.length === 0) {
    console.warn('No valid player data provided for player cards');
    return '<p>No player data available for this game.</p>';
  }
  
  // Limit to top 5 players to keep the article focused
  const topPlayers = players.slice(0, 5);
  
  const playerCardsHtml = topPlayers.map(player => {
    // Extract player data with fallbacks
    const playerName = player.name || 'Player';
    const position = player.position || 'N/A';
    const stats = player.stats || 'No stats available';
    const zodiac = player.zodiac || getRandomZodiacSign();
    const traits = player.zodiacTraits || getRandomZodiacTraits(zodiac);
    
    // Determine team for styling
    const teamId = player.team;
    const isHomeTeam = teamId === gameData?.home?.team?.id;
    const teamClass = isHomeTeam ? 'home-team' : 'away-team';
    const teamName = isHomeTeam ? 
      (gameData.home.team.market || gameData.home.team.name) :
      (gameData.away.team.market || gameData.away.team.name);
    
    return `
      <div class="player-card ${teamClass}">
        <div class="player-header">
          <h4>${playerName}</h4>
          <span class="team-badge">${teamName}</span>
        </div>
        <div class="player-details">
          <div class="player-position">
            <span class="label">Position:</span>
            <span class="value">${position}</span>
          </div>
          <div class="player-stats">
            <span class="label">Stats:</span>
            <span class="value">${stats}</span>
          </div>
        </div>
        <div class="zodiac-info">
          <div class="zodiac-sign">
            <span class="label">Zodiac:</span>
            <span class="value">${zodiac}</span>
          </div>
          <div class="zodiac-traits">
            <span class="label">Traits:</span>
            <span class="value">${traits}</span>
          </div>
        </div>
      </div>
    `;
  }).join('\n');
  
  return `
    <div class="player-cards">
      ${playerCardsHtml}
      <style>
        .player-card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 1rem;
          margin-bottom: 1rem;
          border-left: 4px solid #4a6baf;
        }
        .player-card.home-team { border-left-color: #4a6baf; }
        .player-card.away-team { border-left-color: #d50032; }
        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #eee;
        }
        .player-header h4 {
          margin: 0;
          font-size: 1.1rem;
        }
        .team-badge {
          background: #f0f0f0;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .player-details {
          margin-bottom: 0.75rem;
        }
        .player-position, .player-stats {
          display: flex;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }
        .label {
          font-weight: 600;
          color: #555;
          min-width: 70px;
          display: inline-block;
        }
        .zodiac-info {
          background: #f9f9f9;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
        }
        .zodiac-sign, .zodiac-traits {
          display: flex;
          margin-bottom: 0.25rem;
        }
      </style>
    </div>
  `;
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

async function generateTestArticle(gameId, date) {
  console.log(`\n--- Generating article for game ${gameId} on ${date} ---`);
  
  // For now, we'll use simulated data since the API requires authentication
  console.log('Using simulated game data for demonstration');
  
  // Create simulated game data
  const gameData = {
    id: gameId,
    scheduled: date,
    status: 'closed',
    home: {
      team: {
        id: 'sr:team:137',
        name: 'Giants',
        market: 'San Francisco',
        alias: 'SF',
        full_name: 'San Francisco Giants'
      },
      runs: 5,
      hits: 8,
      errors: 0
    },
    away: {
      team: {
        id: 'sr:team:119',
        name: 'Dodgers',
        market: 'Los Angeles',
        alias: 'LAD',
        full_name: 'Los Angeles Dodgers'
      },
      runs: 3,
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
  
  try {
    // Generate detailed analysis
    const analysisData = await createDetailedGameAnalysis(gameData);
    
    // Create player cards for key players
    const playerCards = buildPlayerCards(analysisData.keyPlayers, gameData);
    
    // Format the game date
    const gameDate = new Date(gameData.scheduled);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create article content with enhanced formatting
    const articleContent = `
      <div class="game-recap">
        <div class="game-header">
          <h1>${gameData.away.team.market} ${gameData.away.team.name} vs ${gameData.home.team.market} ${gameData.home.team.name}</h1>
          <div class="game-meta">
            <span class="game-date">${formattedDate}</span>
            <span class="game-venue">${gameData.venue?.name || 'TBD'}, ${gameData.venue?.city || ''}</span>
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
          <p>${analysisData.summary}</p>
        </div>
        
        <div class="key-moments">
          <h2>Key Moments</h2>
          <ul class="moments-list">
            ${analysisData.keyPlays.map((play, index) => 
              `<li class="moment" data-inning="${play.inning || 'TBD'}">
                <span class="moment-inning">${play.inning || 'TBD'}</span>
                <span class="moment-text">${play.description}</span>
              </li>`
            ).join('\n')}
          </ul>
        </div>
        
        <div class="player-performances">
          <h2>Top Performers</h2>
          ${playerCards}
        </div>
        
        <div class="astrological-insights">
          <h2>Astrological Insights</h2>
          <div class="insights-content">
            ${analysisData.astrologicalInsights}
          </div>
        </div>
        
        <div class="game-notes">
          <h3>Game Notes</h3>
          <ul>
            <li>Attendance: ${gameData.attendance?.toLocaleString() || 'N/A'}</li>
            <li>Duration: ${gameData.duration || 'N/A'}</li>
            <li>Weather: ${gameData.weather || 'N/A'}</li>
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
        .key-moments { margin: 2rem 0; }
        .moments-list { list-style: none; padding: 0; }
        .moment { 
          padding: 0.75rem; 
          margin: 0.5rem 0; 
          background: #f5f5f5; 
          border-left: 4px solid #4a6baf;
        }
        .moment-inning {
          display: inline-block;
          background: #4a6baf;
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          margin-right: 0.5rem;
          font-size: 0.8rem;
        }
        .astrological-insights { 
          background: #f9f9f9; 
          padding: 1.5rem; 
          border-radius: 8px; 
          margin: 2rem 0;
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
      title: `${gameData.away.team.market} vs ${gameData.home.team.market} - ${gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Game Recap`,
      description: `Recap of the MLB game between ${gameData.away.team.market} ${gameData.away.team.name} and ${gameData.home.team.market} ${gameData.home.team.name} on ${formattedDate}`,
      publishedAt: new Date().toISOString(),
      image: '',
      teamHome: gameData.home.team.market,
      teamAway: gameData.away.team.market,
      score: `${gameData.home.team.market} ${gameData.home.runs || 0} - ${gameData.away.runs || 0} ${gameData.away.team.market}`,
      date: gameDate.toISOString(),
      content: articleContent,
      venue: gameData.venue?.name || 'TBD',
      attendance: gameData.attendance,
      duration: gameData.duration,
      slug: `${gameData.away.team.alias.toLowerCase()}-vs-${gameData.home.team.alias.toLowerCase()}-${gameDate.toISOString().split('T')[0]}`
    };
    
    // Save the article
    const savedArticle = await saveArticle(gameId, articleContent, articleData);
    
    if (savedArticle) {
      // Update the website index
      await updateWebsiteIndex(articleData);
      console.log(`✅ Generated article for ${gameData.away.team.market} vs ${gameData.home.team.market}`);
      return savedArticle;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating article:', error);
    return null;
  }
}

async function generateTestArticles() {
  try {
    console.log('Starting article generation...');
    
    // Generate articles for the last 3 days
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate a unique game ID for this date
      const gameId = `game-${dateStr}`;
      
      // Generate and save the article
      await generateTestArticle(gameId, dateStr);
      
      // Add a small delay between articles
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Article generation complete!');
  } catch (error) {
    console.error('Error in generateTestArticles:', error);
  }
}

// Run the article generation
generateTestArticles().catch(console.error);
