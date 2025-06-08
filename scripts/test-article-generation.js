import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Import sample game data
import sampleGameData from './sample-game-data.js';

// Load environment variables
dotenv.config();

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Output directories
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'news', 'articles');
const DATA_DIR = path.join(process.cwd(), 'public', 'news', 'data');
const IMAGE_DIR = path.join(process.cwd(), 'public', 'news', 'images');

/**
 * Fetches player data from the baseball_players table
 * @param {string} firstName - Player's first name
 * @param {string} lastName - Player's last name
 * @returns {Promise<Object>} - Player data
 */
async function fetchPlayerData(firstName, lastName) {
  try {
    const { data, error } = await supabase
      .from('baseball_players')
      .select('*')
      .ilike('player_first_name', firstName)
      .ilike('player_last_name', lastName)
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn(`Player not found: ${firstName} ${lastName}`, error.message);
    return null;
  }
}

/**
 * Calculates planetary placements based on birth date and location
 * @param {Object} player - Player data from database
 * @returns {Object} - Planetary placements
 */
function calculatePlanetaryPlacements(player) {
  if (!player || !player.player_birth_date || !player.player_birth_city) {
    return {
      sun: 'Unknown',
      moon: 'Unknown',
      rising: 'Unknown',
      mercury: 'Unknown',
      venus: 'Unknown',
      mars: 'Unknown'
    };
  }
  
  // This is a simplified version - in a real implementation,
  // you would use an astrological calculation library
  const birthDate = new Date(player.player_birth_date);
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
  // Determine sun sign (zodiac)
  let sunSign;
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sunSign = 'Aries';
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sunSign = 'Taurus';
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sunSign = 'Gemini';
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sunSign = 'Cancer';
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sunSign = 'Leo';
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sunSign = 'Virgo';
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sunSign = 'Libra';
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sunSign = 'Scorpio';
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sunSign = 'Sagittarius';
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sunSign = 'Capricorn';
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sunSign = 'Aquarius';
  else sunSign = 'Pisces';
  
  // For demonstration, we'll generate simplified placements
  // In a real implementation, these would be calculated based on birth time and location
  const moonSign = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][Math.floor(Math.random() * 12)];
  const risingSign = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][Math.floor(Math.random() * 12)];
  
  return {
    sun: sunSign,
    moon: moonSign,
    rising: risingSign,
    mercury: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][Math.floor(Math.random() * 12)],
    venus: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][Math.floor(Math.random() * 12)],
    mars: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][Math.floor(Math.random() * 12)]
  };
}

/**
 * Extracts key players from game data
 * @param {Object} gameData - Detailed game data
 * @returns {Promise<Array>} - Array of enhanced player objects
 */
async function extractKeyPlayers(gameData) {
  const keyPlayers = [];
  
  // Process home team players
  if (gameData.home && gameData.home.players) {
    for (const player of gameData.home.players) {
      try {
        // Get player's full name
        const fullName = player.full_name || `${player.first_name} ${player.last_name}`;
        const firstName = player.first_name || fullName.split(' ')[0];
        const lastName = player.last_name || fullName.split(' ').slice(1).join(' ');
        
        // Fetch player data from database
        const playerData = await fetchPlayerData(firstName, lastName);
        
        // Calculate planetary placements
        const placements = calculatePlanetaryPlacements(playerData);
        
        // Create enhanced player object
        keyPlayers.push({
          id: player.id,
          name: fullName,
          team: 'home',
          teamName: gameData.home.team.market + ' ' + gameData.home.team.name,
          position: player.primary_position || playerData?.player_primary_position || 'Unknown',
          stats: player.statistics || {},
          zodiac: placements.sun,
          astroInfluenceScore: playerData?.astro_influence_score || (Math.random() * 10).toFixed(2),
          placements: placements,
          seasonPerformance: {
            battingAvg: playerData?.stats_batting_batting_avg || player.statistics?.hitting?.overall?.avg || '.---',
            homeruns: playerData?.stats_batting_homeruns || player.statistics?.hitting?.overall?.hr || 0,
            rbi: playerData?.stats_batting_runs_batted_in || player.statistics?.hitting?.overall?.rbi || 0
          }
        });
      } catch (error) {
        console.warn(`Error processing home player:`, error.message);
      }
    }
  }
  
  // Process away team players
  if (gameData.away && gameData.away.players) {
    for (const player of gameData.away.players) {
      try {
        // Get player's full name
        const fullName = player.full_name || `${player.first_name} ${player.last_name}`;
        const firstName = player.first_name || fullName.split(' ')[0];
        const lastName = player.last_name || fullName.split(' ').slice(1).join(' ');
        
        // Fetch player data from database
        const playerData = await fetchPlayerData(firstName, lastName);
        
        // Calculate planetary placements
        const placements = calculatePlanetaryPlacements(playerData);
        
        // Create enhanced player object
        keyPlayers.push({
          id: player.id,
          name: fullName,
          team: 'away',
          teamName: gameData.away.team.market + ' ' + gameData.away.team.name,
          position: player.primary_position || playerData?.player_primary_position || 'Unknown',
          stats: player.statistics || {},
          zodiac: placements.sun,
          astroInfluenceScore: playerData?.astro_influence_score || (Math.random() * 10).toFixed(2),
          placements: placements,
          seasonPerformance: {
            battingAvg: playerData?.stats_batting_batting_avg || player.statistics?.hitting?.overall?.avg || '.---',
            homeruns: playerData?.stats_batting_homeruns || player.statistics?.hitting?.overall?.hr || 0,
            rbi: playerData?.stats_batting_runs_batted_in || player.statistics?.hitting?.overall?.rbi || 0
          }
        });
      } catch (error) {
        console.warn(`Error processing away player:`, error.message);
      }
    }
  }
  
  return keyPlayers;
}

/**
 * Generates an article using Anthropic's Claude API
 * @param {Object} gameData - Detailed game data
 * @param {Array} keyPlayers - Array of key players with enhanced data
 * @returns {Promise<string>} - Generated article content
 */
async function generateArticleWithLLM(gameData, keyPlayers) {
  try {
    // Format game information for the prompt
    const gameDate = new Date(gameData.scheduled);
    const formattedDate = gameDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const homeTeam = `${gameData.home.team.market} ${gameData.home.team.name}`;
    const awayTeam = `${gameData.away.team.market} ${gameData.away.team.name}`;
    const finalScore = `${awayTeam} ${gameData.away.runs || 0} - ${gameData.home.runs || 0} ${homeTeam}`;
    const venue = gameData.venue?.name || 'the stadium';
    
    // Format player information for the prompt
    const playerInfo = keyPlayers.map(player => {
      return `
Player: ${player.name}
Team: ${player.teamName}
Position: ${player.position}
Zodiac Sign: ${player.zodiac}
Astro Influence Score: ${player.astroInfluenceScore}
Season Stats: ${player.seasonPerformance.battingAvg} BA, ${player.seasonPerformance.homeruns} HR, ${player.seasonPerformance.rbi} RBI
Planetary Placements: Sun in ${player.placements.sun}, Moon in ${player.placements.moon}, Rising in ${player.placements.rising}
      `;
    }).join('\n');
    
    // Create a detailed prompt for Claude
    const prompt = `
You are a professional sports journalist with expertise in baseball and astrology. Write a detailed, engaging article about the MLB game between ${awayTeam} and ${homeTeam} that took place on ${formattedDate} at ${venue}. The final score was ${finalScore}.

TONE AND STYLE:
- Professional yet friendly and accessible
- Emotionally engaging, bringing the excitement of the game to life
- Balanced approach to astrology - include insights without overwhelming the reader
- Use proper formatting with clear headings, paragraphs, and spacing

ARTICLE STRUCTURE:
1. Title: Create an attention-grabbing title that includes both teams
2. Introduction: Set the scene with the key outcome and atmosphere
3. Game Summary: Detailed recap of the game flow and key moments
4. Key Player Analysis: Highlight performances of these key players with their astrological insights:
${playerInfo}
5. Astrological Insights: How the planetary alignments of the game day influenced the outcome
6. Season Context: How this game impacts both teams' season performance
7. Conclusion: Final thoughts and what to watch for in upcoming games

FORMATTING REQUIREMENTS:
- Use proper HTML formatting with <h1>, <h2>, <h3> tags for headings
- Include <p> tags for paragraphs with proper spacing
- Create a visually appealing layout with sections clearly delineated
- Format player stats and astrological information in an easy-to-read manner

IMPORTANT NOTES:
- Focus on factual game reporting first, with astrological insights as a complementary element
- Include specific game events, plays, and statistics to ground the article in reality
- When discussing players' astrological influences, connect them to their performance in meaningful ways
- Mention how their Astro Influence Score correlates with their performance in this particular game
- Reference season-long performance and trends for context
- Keep the overall tone professional while still being engaging and accessible

The article should be approximately 800-1000 words and formatted as HTML that can be directly inserted into a webpage.
`;

    console.log('Sending request to Anthropic Claude...');
    
    // Call Anthropic's Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.7,
      system: 'You are a professional sports journalist with expertise in baseball and astrology.',
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    
    console.log('Received response from Claude');
    
    // Extract and return the generated article
    return response.content[0].text;
  } catch (error) {
    console.error('Error generating article with Claude:', error.message);
    return null;
  }
}

/**
 * Searches for images related to the game using Google Custom Search API
 * @param {string} query - Search query
 * @returns {Promise<string>} - URL of the image
 */
async function searchGameImages(query) {
  try {
    console.log(`Searching for images with query: ${query}`);
    
    // Use Google Custom Search API to find relevant images
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CSE_ID}&searchType=image&key=${GOOGLE_API_KEY}&num=5`;
    
    const response = await axios.get(url);
    
    if (!response.data.items || response.data.items.length === 0) {
      console.warn('No images found, using placeholder');
      return `https://via.placeholder.com/800x400?text=${encodeURIComponent(query)}`;
    }
    
    // Get unique image URLs to avoid duplicates
    const imageUrls = [...new Set(response.data.items.map(item => item.link))];
    
    // Return the first image URL
    return imageUrls[0];
  } catch (error) {
    console.error('Error searching for images:', error.message);
    // Fallback to placeholder image
    return `https://via.placeholder.com/800x400?text=${encodeURIComponent(query)}`;
  }
}

/**
 * Saves the generated article
 * @param {Object} gameData - Game data
 * @param {string} articleContent - Generated article content
 * @param {string} imageUrl - URL of the article image
 * @returns {Promise<Object>} - Saved article information
 */
async function saveArticle(gameData, articleContent, imageUrl) {
  try {
    // Ensure output directories exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(IMAGE_DIR, { recursive: true });
    
    // Generate a slug for the article
    const gameDate = new Date(gameData.scheduled);
    const dateStr = gameDate.toISOString().split('T')[0];
    const slug = `${gameData.away.team.alias.toLowerCase()}-vs-${gameData.home.team.alias.toLowerCase()}-${dateStr}`;
    
    // Create article data object
    const articleData = {
      id: gameData.id,
      title: `${gameData.away.team.market} vs ${gameData.home.team.market} - ${gameDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Game Recap`,
      description: `Recap of the MLB game between ${gameData.away.team.market} ${gameData.away.team.name} and ${gameData.home.team.market} ${gameData.home.team.name}`,
      publishedAt: new Date().toISOString(),
      image: imageUrl,
      teamHome: gameData.home.team.market,
      teamAway: gameData.away.team.market,
      score: `${gameData.home.team.market} ${gameData.home.runs || 0} - ${gameData.away.runs || 0} ${gameData.away.team.market}`,
      date: gameDate.toISOString(),
      venue: gameData.venue?.name || 'TBD',
      attendance: gameData.attendance,
      duration: gameData.duration,
      slug: slug,
      content: articleContent
    };
    
    // Save article as HTML
    const htmlPath = path.join(OUTPUT_DIR, `${slug}.html`);
    await fs.writeFile(htmlPath, articleContent, 'utf8');
    
    // Save article data as JSON
    const jsonPath = path.join(DATA_DIR, `${slug}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(articleData, null, 2), 'utf8');
    
    console.log(`✅ Article saved: ${slug}`);
    console.log(`HTML: ${htmlPath}`);
    console.log(`JSON: ${jsonPath}`);
    
    return { htmlPath, jsonPath, slug, articleData };
  } catch (error) {
    console.error('Error saving article:', error);
    return null;
  }
}

/**
 * Updates the website index with the new article
 * @param {Object} articleData - Article data
 * @returns {Promise<boolean>} - Success status
 */
async function updateWebsiteIndex(articleData) {
  try {
    const indexPath = path.join(DATA_DIR, 'index.json');
    let articles = [];
    let existingData = null;
    
    // Check if index file exists
    try {
      await fs.stat(indexPath);
      const data = await fs.readFile(indexPath, 'utf8');
      existingData = JSON.parse(data);
      articles = Array.isArray(existingData) ? existingData : (existingData.articles || []);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading index file:', error);
      }
      // If file doesn't exist or can't be parsed, start with empty array
      articles = [];
    }
    
    // Create index article object
    const indexArticle = {
      id: articleData.id,
      title: articleData.title,
      description: articleData.description,
      publishedAt: articleData.publishedAt,
      image: articleData.image,
      teamHome: articleData.teamHome,
      teamAway: articleData.teamAway,
      score: articleData.score,
      date: articleData.date,
      slug: articleData.slug,
      venue: articleData.venue,
      attendance: articleData.attendance,
      duration: articleData.duration
    };
    
    // Check if article already exists in the index
    const existingIndex = articles.findIndex(a => a.id === articleData.id);
    if (existingIndex >= 0) {
      articles[existingIndex] = indexArticle;
    } else {
      articles.unshift(indexArticle);
    }
    
    // Sort by date, newest first
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save the updated index
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

/**
 * Main function to generate an article using sample data
 */
async function generateSampleArticle() {
  try {
    console.log('Starting article generation with sample data...');
    
    // Use the sample game data
    const gameData = sampleGameData;
    
    console.log(`Processing game: ${gameData.away.name} vs ${gameData.home.name}`);
    
    // Extract key players with enhanced data
    console.log('Extracting key players and their astrological data...');
    const keyPlayers = await extractKeyPlayers(gameData);
    
    // Generate article with Claude
    console.log('Generating article with Claude...');
    const articleContent = await generateArticleWithLLM(gameData, keyPlayers);
    if (!articleContent) {
      console.log(`Could not generate article - Claude API error`);
      return;
    }
    
    // Search for game images
    console.log('Searching for game images...');
    const imageQuery = `${gameData.away.team.market} ${gameData.away.team.name} vs ${gameData.home.team.market} ${gameData.home.team.name} MLB baseball game`;
    const imageUrl = await searchGameImages(imageQuery);
    
    // Save article and update index
    console.log('Saving article and updating index...');
    const savedArticle = await saveArticle(gameData, articleContent, imageUrl);
    if (savedArticle) {
      await updateWebsiteIndex(savedArticle.articleData);
    }
    
    console.log(`✅ Completed article for ${gameData.away.team.market} vs ${gameData.home.team.market}`);
    console.log('\n✅ Article generation complete!');
    
  } catch (error) {
    console.error('Error in generateSampleArticle:', error);
  }
}

// Run the article generation with sample data
generateSampleArticle().catch(console.error);
