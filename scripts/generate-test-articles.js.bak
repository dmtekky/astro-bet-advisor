// scripts/generate-test-articles.js
import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Keys from environment variables
const SPORTS_RADAR_API_KEY = process.env.SPORTS_RADAR_NEWS_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const CLAUDE_MODEL = 'claude-3-haiku-20240307';
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-articles');
const WEBSITE_OUTPUT_DIR = path.join(process.cwd(), 'src/data/news');
const CACHE_DIR = path.join(__dirname, '../.image-cache');

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create a simple hash for caching
const createHashKey = (str) => {
  return createHash('md5').update(str).digest('hex');
};

// Create output directories if they don't exist
async function ensureOutputDirs() {
  try {
    try {
      await fs.access(TEST_OUTPUT_DIR);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
      console.log(`Created test output directory: ${TEST_OUTPUT_DIR}`);
    }
    
    try {
      await fs.access(WEBSITE_OUTPUT_DIR);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(WEBSITE_OUTPUT_DIR, { recursive: true });
      console.log(`Created website output directory: ${WEBSITE_OUTPUT_DIR}`);
    }
  } catch (error) {
    console.error(`Error creating output directories: ${error.message}`);
    throw error;
  }
}

// Create cache directory if it doesn't exist
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log(`Ensured cache directory exists: ${CACHE_DIR}`);
  } catch (error) {
    console.error(`Error creating cache directory: ${error.message}`);
    throw error;
  }
}

// Fetch MLB schedule for a specific date
async function fetchMLBSchedule(date) {
  try {
    const formattedDate = date.replace(/-/g, '/');
    const url = `https://api.sportradar.us/mlb/trial/v7/en/games/${formattedDate}/schedule.json`;
    
    console.log(`Fetching MLB schedule for ${date}...`);
    const response = await axios.get(url, {
      params: { api_key: SPORTS_RADAR_API_KEY }
    });
    
    return response.data.games || [];
  } catch (error) {
    console.error(`Error fetching MLB schedule: ${error.message}`);
    return [];
  }
}

// Fetch game analysis/recap
async function fetchGameAnalysis(gameId) {
  try {
    console.log(`Fetching game analysis for game ID: ${gameId}...`);
    const response = await axios.get(
      `https://api.sportradar.us/mlb/trial/v7/en/games/${gameId}/summary.json?api_key=${SPORTS_RADAR_API_KEY}`
    );
    
    console.log(`Game analysis data received successfully for game ${gameId}`);
    
    // Extract basic data from response
    const gameData = response.data;
    const homeTeam = gameData.game.home;
    const awayTeam = gameData.game.away;
    
    // Extract key plays from innings
    const keyPlays = extractKeyPlays(gameData);
    
    // Extract notable performances
    const notablePerformances = extractNotablePerformances(gameData);
    
    // Structure the output
    return {
      score: `${awayTeam.name} ${awayTeam.runs} - ${homeTeam.runs} ${homeTeam.name}`,
      teams: {
        home: {
          name: homeTeam.name,
          market: homeTeam.market,
          runs: homeTeam.runs,
          hits: homeTeam.hits,
          errors: homeTeam.errors
        },
        away: {
          name: awayTeam.name,
          market: awayTeam.market,
          runs: awayTeam.runs,
          hits: awayTeam.hits,
          errors: awayTeam.errors
        }
      },
      keyPlays,
      notablePerformances,
      playerData: notablePerformances.map(p => ({ 
        id: p.id,
        full_name: p.name,
        zodiac_sign: p.zodiacSign || 'Unknown',
        element: p.element || 'Unknown'
      }))
    };
  } catch (error) {
    console.error(`Error fetching game analysis: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      if (error.response.data) {
        console.error(`Response data:`, JSON.stringify(error.response.data).substring(0, 200));
      }
    }
    
    // If we hit rate limits, create a basic simulated analysis for debugging purposes
    if (error.response && error.response.status === 429) {
      console.log('Using simulated game analysis for debugging due to rate limits');
      return createSimulatedGameAnalysis(gameId);
    }
    
    return null;
  }
}

// Create a basic simulated game analysis when API rate limits are hit
function createSimulatedGameAnalysis(gameId) {
  return {
    score: 'Rangers 5 - 0 Diamondbacks',
    teams: {
      home: {
        name: 'Diamondbacks',
        market: 'Arizona',
        runs: 0,
        hits: 5,
        errors: 2
      },
      away: {
        name: 'Rangers',
        market: 'Texas',
        runs: 5,
        hits: 11,
        errors: 0
      }
    },
    keyPlays: [
      { inning: 1, description: 'Corey Seager hits a home run to right field', team: 'Rangers' },
      { inning: 3, description: 'Marcus Semien doubles to left, scoring Josh Smith', team: 'Rangers' },
      { inning: 5, description: 'Rangers score 3 runs on consecutive hits', team: 'Rangers' }
    ],
    notablePerformances: [
      { name: 'Corey Seager', team: 'Rangers', stats: 'HR, 2 RBI', position: 'SS', id: 'seager-001', zodiacSign: 'Aries', element: 'Fire' },
      { name: 'Nathan Eovaldi', team: 'Rangers', stats: '6.2 IP, 0 ER, 5 K', position: 'P', id: 'eovaldi-001', zodiacSign: 'Aquarius', element: 'Air' },
      { name: 'Marcus Semien', team: 'Rangers', stats: '2-4, 2B, RBI', position: '2B', id: 'semien-001', zodiacSign: 'Libra', element: 'Air' }
    ],
    playerData: [
      { id: 'seager-001', full_name: 'Corey Seager', zodiac_sign: 'Aries', element: 'Fire' },
      { id: 'eovaldi-001', full_name: 'Nathan Eovaldi', zodiac_sign: 'Aquarius', element: 'Air' },
      { id: 'semien-001', full_name: 'Marcus Semien', zodiac_sign: 'Libra', element: 'Air' }
    ]
  };
}

// Extract key plays from innings
function extractKeyPlays(data) {
  const keyPlays = [];
  
  if (!data.innings) return keyPlays;
  
  data.innings.forEach(inning => {
    // Consider innings with runs scored as key plays
    const homeRuns = inning.home?.runs || 0;
    const awayRuns = inning.away?.runs || 0;
    
    if (homeRuns > 0 || awayRuns > 0) {
      keyPlays.push({
        inning: inning.number,
        description: `${homeRuns > 0 ? `${data.game.home.name} scored ${homeRuns} run(s)` : ''} ${awayRuns > 0 ? `${data.game.away.name} scored ${awayRuns} run(s)` : ''}`.trim(),
        homeScore: data.game.home.runs || 0,
        awayScore: data.game.away.runs || 0
      });
    }
  });
  
  return keyPlays;
}

// Format key plays for the article
function formatKeyPlays(keyPlays = []) {
  if (!keyPlays || keyPlays.length === 0) {
    return 'No key plays data available.';
  }
  
  const playTexts = ['<ul>'];
  
  keyPlays.forEach((play, index) => {
    const { inning, description, score } = play;
    playTexts.push(
      `<li><strong>${inning || 'Unknown Inning'}:</strong> ${description || 'No description available'}` +
      `${score ? ` (${score})` : ''}</li>`
    );
  });
  
  playTexts.push('</ul>');
  return playTexts.join('\n');
}

// Extract notable performances from game data
function extractNotablePerformances(data) {
  try {
    // If we don't have detailed player data, return a minimal analysis
    if (!data?.game?.home?.players || !data?.game?.away?.players) {
      console.log('No detailed player data available, using simplified analysis');
      return [
        {
          name: 'Game Summary',
          team: 'N/A',
          type: 'summary',
          stats: {
            summary: 'Detailed player statistics not available. Check back later for a full analysis.'
          }
        }
      ];
    }

    const performances = [];
    
    // Get all players
    const allPlayers = [
      ...(data.game.home.players || []).map(p => ({ ...p, team: data.game.home.name })),
      ...(data.game.away.players || []).map(p => ({ ...p, team: data.game.away.name }))
    ];
    
    // Simple check for any player data
    if (allPlayers.length === 0) {
      return [
        {
          name: 'Game Summary',
          team: 'N/A',
          type: 'summary',
          stats: {
            summary: 'Player statistics are not yet available for this game.'
          }
        }
      ];
    }
    
    // Try to get basic game info
    const homeTeam = data.game.home.name || 'Home Team';
    const awayTeam = data.game.away.name || 'Away Team';
    const homeScore = data.game.home.runs || 0;
    const awayScore = data.game.away.runs || 0;
    
    return [
      {
        name: 'Game Summary',
        team: 'N/A',
        type: 'summary',
        stats: {
          summary: `The ${homeTeam} ${homeScore}-${awayScore} ${awayTeam} in a competitive matchup.`
        }
      }
    ];
    
  } catch (error) {
    console.error('Error in extractNotablePerformances:', error);
    return [
      {
        name: 'Game Summary',
        team: 'N/A',
        type: 'summary',
        stats: {
          summary: 'An error occurred while generating player performance data.'
        }
      }
    ];
  }
}

// Format notable performances for the article
async function formatNotablePerformances(performances = []) {
  if (!performances || performances.length === 0) {
    return 'No notable performances data available.';
  }
  
  const performanceTexts = [];
  
  // Group by type
  const hitters = performances.filter(p => p.type === 'hitter');
  const pitchers = performances.filter(p => p.type === 'pitcher');
  
  // Format hitters
  if (hitters.length > 0) {
    performanceTexts.push('<h3>Top Hitters:</h3>');
    performanceTexts.push('<ul>');
    hitters.forEach(player => {
      const { name, team, stats } = player;
      performanceTexts.push(
        `<li><strong>${name}</strong> (${team}): ` +
        `${stats.h}-${stats.ab} ${stats.hr > 0 ? `, ${stats.hr} HR` : ''}${stats.rbi > 0 ? `, ${stats.rbi} RBI` : ''} ` +
        `${stats.ops ? `, OPS: ${stats.ops}` : ''}</li>`
      );
    });
    performanceTexts.push('</ul>');
  }
  
  // Format pitchers
  if (pitchers.length > 0) {
    performanceTexts.push('<h3>Top Pitchers:</h3>');
    performanceTexts.push('<ul>');
    pitchers.forEach(player => {
      const { name, team, stats } = player;
      performanceTexts.push(
        `<li><strong>${name}</strong> (${team}): ` +
        `${stats.ip} IP, ${stats.h} H, ${stats.er} ER, ${stats.bb} BB, ${stats.so} K, ${stats.era} ERA</li>`
      );
    });
    performanceTexts.push('</ul>');
  }
  
  return performanceTexts.join('\n');
}

// Scrape Yahoo Sports and ESPN for in-game/action images only
async function scrapeSportsImages(query) {
  const cacheKey = createHashKey(query);
  const cachePath = path.join(__dirname, '../.image-cache', `${cacheKey}-sports.json`);
  // Check cache first
  try {
    if (fs.existsSync(cachePath)) {
      const cachedData = JSON.parse(await fs.readFile(cachePath, 'utf8'));
      console.log('Using cached sports image search results');
      return cachedData;
    }
  } catch (error) {
    console.log('No cache available for sports image search');
  }

  let imageResults = [];

  // Helper: filter out non-game images and prioritize action shots
  function isActionImage(src, alt) {
    if (!src) return false;
    
    const lowerSrc = src.toLowerCase();
    const lowerAlt = (alt || '').toLowerCase();
    
    // Skip common non-action image types
    const skipPatterns = [
      'logo', 'icon', 'social', 'avatar', 'mugshot', 'headshot', 'portrait', 'profile',
      '.svg', '.gif', 'sponsor', 'ad', 'promo', 'thumb', 'placeholder', 'loading', 'pixel'
    ];
    
    if (skipPatterns.some(pattern => lowerSrc.includes(pattern) || lowerAlt.includes(pattern))) {
      return false;
    }
    
    // Look for game/action indicators
    const actionPatterns = [
      'game', 'action', 'play', 'homerun', 'home run', 'pitch', 'hit', 'catch', 'field', 'slide', 'dive', 'throw', 'run', 'score'
    ];
    
    // Prioritize images with action-related terms in URL or alt text
    const hasActionTerm = actionPatterns.some(term => 
      lowerSrc.includes(term) || lowerAlt.includes(term)
    );
    
    // Also include images that are likely game photos (based on common patterns)
    const isLikelyGamePhoto = 
      (lowerSrc.includes('getty') && lowerSrc.includes('mlb-')) ||
      (lowerSrc.includes('apimages') && lowerSrc.includes('mlb-')) ||
      (lowerSrc.includes('mlb') && lowerSrc.match(/\d{6,}/)); // Contains MLB and numbers (likely photo IDs)
    
    return hasActionTerm || isLikelyGamePhoto;
  }

  // Try Yahoo Sports and ESPN for recap/article images
  for (const site of ['yahoo', 'espn']) {
    let searchUrl = '';
    if (site === 'yahoo') {
      searchUrl = `https://sports.yahoo.com/search/?p=${encodeURIComponent(query)}`;
    } else {
      searchUrl = `https://www.espn.com/search/results?q=${encodeURIComponent(query)}`;
    }
    try {
      const { data: html } = await axios.get(searchUrl);
      const $ = cheerio.load(html);
      // Find recap/article links in search results
      let articleLinks = [];
      if (site === 'yahoo') {
        articleLinks = $('a').map((i, el) => {
          const href = $(el).attr('href') || '';
          if (href.includes('/mlb/') && (href.includes('-vs-') || href.includes('/recap'))) {
            return href.startsWith('http') ? href : `https://sports.yahoo.com${href}`;
          }
          return null;
        }).get().filter(Boolean);
      } else {
        articleLinks = $('a').map((i, el) => {
          const href = $(el).attr('href') || '';
          if (href.includes('/mlb/recap') || href.includes('/mlb/game/_/gameId/')) {
            return href.startsWith('http') ? href : `https://www.espn.com${href}`;
          }
          return null;
        }).get().filter(Boolean);
      }
      // For each article, fetch and extract action images
      for (const articleUrl of articleLinks.slice(0, 2)) { // Limit to 2 articles per site
        try {
          const { data: articleHtml } = await axios.get(articleUrl);
          const $$ = cheerio.load(articleHtml);
          $$('img').each((i, el) => {
            const src = $$(el).attr('src') || '';
            const alt = $$(el).attr('alt') || '';
            if (src && isActionImage(src, alt)) {
              // Try to exclude logos, icons, and tiny images
              if (src.includes('logo') || src.includes('icon') || src.includes('social') || src.endsWith('.svg')) return;
              imageResults.push({
                url: src,
                title: alt || query,
                source: site === 'yahoo' ? 'Yahoo Sports' : 'ESPN',
                credit: site === 'yahoo' ? 'Yahoo Sports' : 'ESPN',
                page: articleUrl
              });
            }
          });
        } catch (err) {
          console.error(`${site.toUpperCase()} article scrape error:`, err.message);
        }
      }
    } catch (err) {
      console.error(`${site.toUpperCase()} search scrape error:`, err.message);
    }
  }

  // Return empty array if no images found
  if (!imageResults.length) {
    return [];
  }

  // Limit to a maximum of 6 images
  const limitedImages = imageResults.slice(0, 6);

  // Cache results
  await fs.writeFile(cachePath, JSON.stringify(limitedImages, null, 2));
  return limitedImages;
}

// Fetch images from Sportradar Editorial API
async function fetchSportradarImages(gameId, date) {
  try {
    console.log(`Fetching editorial images from Sportradar for game ${gameId} on ${date}`);
    const apiKey = process.env.SPORTS_RADAR_NEWS_API_KEY;
    if (!apiKey) {
      console.error('SPORTS_RADAR_NEWS_API_KEY not found in environment variables');
      return [];
    }

    // Format date for API request (YYYY/MM/DD)
    const formattedDate = date.replace(/-/g, '/');
    
    // Use retryWithBackoff for this request to handle rate limits better
    const url = `https://api.sportradar.us/mlb/trial/v7/en/games/${gameId}/summary.json?api_key=${SPORTS_RADAR_API_KEY}`;
    console.log(`Requesting Sportradar data from: ${url}`);
    const response = await retryWithBackoff(() => axios.get(url), 4, 3000);
    const data = response.data;
    
    // Debugging - print available keys to understand API response
    console.log('Sportradar API response keys:', Object.keys(data));
    
    // Extract image assets if available
    const images = [];
    
    // Check for editorial images in different possible locations
    if (data.game && data.game.editorial && data.game.editorial.images) {
      console.log(`Found ${data.game.editorial.images.length} editorial images in game data`);
      
      // Map to our standard format
      images.push(...data.game.editorial.images.map(img => ({
        url: img.url,
        title: img.title || `${data.game.away.name} vs ${data.game.home.name}`,
        credit: img.credit || 'Sportradar',
        source: 'Sportradar',
        page: img.source_url || `https://sportradar.com/`
      })));
    } else if (data.editorial && data.editorial.images) {
      console.log(`Found ${data.editorial.images.length} editorial images in root data`);
      
      images.push(...data.editorial.images.map(img => ({
        url: img.url,
        title: img.title || `MLB Game Image`,
        credit: img.credit || 'Sportradar',
        source: 'Sportradar',
        page: img.source_url || `https://sportradar.com/`
      })));
    } else {
      console.log('No editorial images found in Sportradar API response');
      
      // Look for photos embedded in metadata if available
      if (data.metadata && data.metadata.photos) {
        console.log(`Found ${data.metadata.photos.length} photos in metadata`);
        images.push(...data.metadata.photos.map(photo => ({
          url: photo.url,
          title: photo.title || 'MLB Game Photo',
          credit: photo.credit || 'Sportradar',
          source: 'Sportradar',
          page: photo.source_url || 'https://sportradar.com/'
        })));
      }
    }
    
    return images;
  } catch (error) {
    console.error(`Error fetching Sportradar images: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data sample: ${JSON.stringify(error.response.data).substring(0, 100)}`);
    }
    
    // If specifically hit rate limits, provide placeholder Sportradar image
    if (error.response && error.response.status === 429) {
      console.log('Using placeholder Sportradar image due to rate limits');
      return [{
        url: 'https://images.unsplash.com/photo-1508344928928-7165b0c40ae4?q=80&w=1000&auto=format&fit=crop',
        title: 'MLB Baseball Game',
        credit: 'Unsplash',
        source: 'Unsplash',
        page: 'https://unsplash.com/'
      }];
    }
    return [];
  }
}

// Search for Google images
async function searchGoogleImages(query, maxResults = 4) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    console.warn('Missing Google API keys. Skipping Google image search.');
    return [];
  }
  
  console.log(`Searching Google for images: ${query} (limited to ${maxResults} results)`);
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: query,
        searchType: 'image',
        num: maxResults,
        imgSize: 'large',
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike',
        safe: 'active'
      }
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      console.log('No Google images found');
      return [];
    }
    
    console.log(`Found ${response.data.items.length} Google images`);
    return response.data.items.map(item => ({
      url: item.link,
      title: item.title || query,
      source: 'Google Search',
      credit: item.displayLink || 'Google Images',
      page: item.image.contextLink || item.link
    }));
  } catch (error) {
    console.error(`Error searching Google images: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return [];
  }
}

// Helper function to remove duplicate images based on URL similarity
function removeDuplicateImages(images) {
  const uniqueImages = [];
  const seenUrls = new Set();
  
  for (const img of images) {
    // Normalize URL for comparison
    const normalizedUrl = img.url
      .replace(/^https?:\/\//, '')  // Remove protocol
      .replace(/\?.*$/, '')         // Remove query params
      .split('/').pop()             // Get filename
      .replace(/-\d+x\d+(\.\w+)$/, '$1'); // Remove dimensions like -300x200.jpg
      
    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      uniqueImages.push(img);
    }
  }
  
  return uniqueImages;
}

// Search for game images using multiple sources with fallbacks
async function searchGameImages(team1, team2, date, gameId = null) {
  const allImages = [];
  
  // 1. Attempt to fetch from Sportradar first if we have a game ID
  if (gameId) {
    console.log(`Attempting to fetch images from Sportradar for game ID: ${gameId}`);
    const sportradarImages = await fetchSportradarImages(gameId, date);
    
    if (sportradarImages && sportradarImages.length > 0) {
      console.log(`Found ${sportradarImages.length} images from Sportradar`);
      allImages.push(...sportradarImages);
    } else {
      console.log('No Sportradar images found.');
    }
  }
  
  // 2. Try Google image search as second source - limit to 6 images
  const searchQuery = `${team1} vs ${team2} baseball game ${date}`;
  const googleImages = await searchGoogleImages(searchQuery, 6);
  if (googleImages.length > 0) {
    console.log(`Adding ${googleImages.length} images from Google search`);
    allImages.push(...googleImages);
  }
  
  // 3. Finally try scraping Yahoo Sports and ESPN as third source
  if (allImages.length < 10) { // Increase limit since we'll filter duplicates
    console.log('Scraping Yahoo/ESPN for additional images:', `${team1} vs ${team2} ${date}`);
    const scrapedImages = await scrapeSportsImages(`${team1} vs ${team2} ${date}`);
    
    if (scrapedImages && scrapedImages.length > 0) {
      const neededImages = 10 - allImages.length; // Get more to have better selection
      console.log(`Adding ${neededImages} images from Yahoo/ESPN scraping`);
      allImages.push(...scrapedImages.slice(0, neededImages));
    } else {
      console.log('No additional images found from Yahoo/ESPN');
    }
  }
  
  // Remove duplicates and limit to 6 best images
  const uniqueImages = removeDuplicateImages(allImages);
  console.log(`Found ${uniqueImages.length} unique images after deduplication`);
  
  // Return up to 6 images (Claude will pick the best ones)
  return uniqueImages.slice(0, 6);
}

// No Wikimedia fallback as requested by user

// Generate article with Claude
async function generateArticleWithClaude(prompt) {
try {
  console.log('Generating article with Claude...');
  
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    }
  );
  
  let articleContent = response.data.content[0].text;
  
  // Process the article content to ensure proper formatting
  articleContent = processArticleContent(articleContent);
  
  console.log('Article generated successfully');
  
  return {
    title: extractTitle(articleContent),
    content: articleContent,
    excerpt: extractExcerpt(articleContent)
  };
} catch (error) {
  console.error(`Error generating article with Claude: ${error.message}`);
  throw error;
}
}

// Process article content to ensure proper formatting
function processArticleContent(content) {
// Remove any markdown code blocks or extra formatting
content = content.replace(/```html|```/g, '');
  
// Ensure the content has the style tag
if (!content.includes('<style>')) {
  content = `<style>
    .article-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; }
    h1 { font-size: 2.2em; color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
    h2 { font-size: 1.8em; color: #2d3748; margin: 30px 0 15px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
    h3 { font-size: 1.4em; color: #4a5568; margin: 25px 0 10px; }
    p { margin: 0 0 20px 0; font-size: 1.1em; line-height: 1.7; }
    .final-score { 
      background: #f8f9fa; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 20px 0 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .score-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 10px 15px;
      font-size: 1.2em;
    }
    .score-row .team { font-weight: 600; }
    .score-row .runs { font-weight: 700; color: #2b6cb0; }
    .game-status { 
      text-align: center; 
      font-weight: 600; 
      color: #718096;
      margin-top: 10px;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .article-image { 
      margin: 25px 0; 
      text-align: center;
    }
    .article-image img { 
      max-width: 100%; 
      height: auto;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .image-credit { 
      font-size: 0.8em; 
      color: #718096; 
      text-align: right;
      margin-top: 5px;
    }
    .player-name {
      font-weight: 600;
      color: #2b6cb0;
    }
    .player-name a {
      color: inherit;
      text-decoration: none;
    }
    .player-name a:hover {
      text-decoration: underline;
    }
    .section {
      margin-bottom: 30px;
    }
    .key-play {
      background: #f8f9fa;
      border-left: 3px solid #4299e1;
      padding: 10px 15px;
      margin: 15px 0;
      border-radius: 0 4px 4px 0;
    }
    .stat-highlight {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #edf2f7;
    }
    .stat-label { font-weight: 600; }
    .player-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .player-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .player-card-title {
      margin-top: 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
    }
    .player-stats, .player-astro {
      margin-top: 15px;
    }
    .player-stat, .player-astro-stat {
      margin: 5px 0;
    }
  </style>` + content;
}
  
// Ensure content is wrapped in article-container if not already
if (!content.includes('<div class="article-container">')) {
  content = `<div class="article-container">${content}</div>`;
}
  
// Fix any broken HTML
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g, '</div></div>');
  
// Ensure player links are properly formatted
content = content.replace(/href="#player-([^"]+)"/g, (match, playerName) => {
  return `href="#player-${playerName}" target="_blank"`;
});
  
return content;
}

// Extract the title from an HTML article
function extractTitle(htmlContent) {
  if (!htmlContent) return 'MLB Game Recap';
  
  // Try to extract from h1 tag
  const h1Match = htmlContent.match(/<h1>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }
  
  // Alternative: extract from first line if it looks like a title
  const lines = htmlContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('<') && trimmed.length > 10 && trimmed.length < 100) {
      return trimmed;
    }
  }
  
  return 'MLB Game Recap';
}

// Extract an excerpt from the HTML article
function extractExcerpt(htmlContent, maxLength = 150) {
  try {
    // Remove all HTML tags and get plain text
    const plainText = htmlContent.replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Get the first few sentences
    const excerpt = plainText.substring(0, maxLength);
    
    // Add ellipsis if the excerpt is truncated
    return excerpt.length < plainText.length ? `${excerpt}...` : excerpt;
  } catch (error) {
    console.error('Error extracting excerpt:', error);
    return 'Game recap and analysis with astrological insights.';
  }
}

// Fetch player data from Baseball_players table (simulated)
// Fetch player data ONLY from Baseball_players dataset
// This simulates a single source of truth for all player data, including astro chart, birth city, birth date, and astro_influence_score
const BASEBALL_PLAYERS = [
  // Example dataset (should be replaced with real data or loaded from DB/file)
  {
    id: 'player-001',
    full_name: 'Salvador Perez',
    birth_date: '1990-05-10',
    player_birth_city: 'Valencia, Venezuela',
    chart: 'Sun Taurus, Moon Pisces, Mercury Gemini, Venus Aries',
    astro_influence_score: 88,
    zodiac_sign: 'Taurus',
    element: 'Earth',
    stats: { batting_average: '0.275', slugging_percentage: '0.495', on_base_percentage: '0.315' }
  },
  {
    id: 'player-002',
    full_name: 'Brandon Crawford',
    birth_date: '1987-01-21',
    player_birth_city: 'Mountain View, CA',
    chart: 'Sun Aquarius, Moon Cancer, Mercury Capricorn, Venus Pisces',
    astro_influence_score: 72,
    zodiac_sign: 'Aquarius',
    element: 'Air',
    stats: { batting_average: '0.250', slugging_percentage: '0.390', on_base_percentage: '0.320' }
  },
  // Add more real players as needed
];

async function fetchPlayerData(playerName) {
  // Only use Baseball_players dataset
  const player = BASEBALL_PLAYERS.find(p => p.full_name.toLowerCase() === playerName.toLowerCase());
  if (!player) {
    return {
      id: 'unknown',
      full_name: playerName,
      birth_date: 'Unknown',
      player_birth_city: 'Unknown',
      chart: 'Unknown',
      astro_influence_score: 0,
      zodiac_sign: 'Unknown',
      element: 'Unknown',
      stats: { batting_average: 'N/A', slugging_percentage: 'N/A', on_base_percentage: 'N/A' }
    };
  }
  return player;
}

function createPlayerCardHtml(player) {
  // Create a unique ID for the player card using team abbreviation and name
  const playerTeamAbbr = player.player_current_team_abbreviation || '';
  const playerLastName = (player.player_last_name || '').toLowerCase();
  const playerCardId = `player-${playerTeamAbbr}-${playerLastName}`;
  
  return `<div class="player-card" id="${playerCardId}">
    <h3 class="player-card-title">${player.player_first_name || ''} ${player.player_last_name || ''}</h3>
    <div class="player-card-content">
      <div class="player-stats">
        <div class="player-stat"><span class="stat-label">Position:</span> ${player.player_position || 'N/A'}</div>
        <div class="player-stat"><span class="stat-label">Team:</span> ${player.player_current_team_abbreviation || 'N/A'}</div>
        <div class="player-stat"><span class="stat-label">Batting Avg:</span> ${player.player_batting_average || 'N/A'}</div>
        <div class="player-stat"><span class="stat-label">HR:</span> ${player.player_home_runs || 'N/A'}</div>
        <div class="player-stat"><span class="stat-label">RBI:</span> ${player.player_rbi || 'N/A'}</div>
        <div class="player-stat"><span class="stat-label">ERA:</span> ${player.player_era || 'N/A'}</div>
      </div>
      <div class="player-astro">
        <div class="player-astro-stat"><span class="stat-label">Birth:</span> ${player.player_birth_date || 'Unknown'}</div>
        <div class="player-astro-stat"><span class="stat-label">Birth City:</span> ${player.player_birth_city || 'Unknown'}</div>
        <div class="player-astro-stat"><span class="stat-label">Sign:</span> ${player.zodiac_sign || 'Unknown'}</div>
        <div class="player-astro-stat"><span class="stat-label">Element:</span> ${player.element || 'Unknown'}</div>
        <div class="player-astro-stat"><span class="stat-label">Astro Influence:</span> ${player.astro_influence_score || '0'}/10</div>
      </div>
    </div>
    <a href="/playerdetails/${player.id || `${playerTeamAbbr}-${playerLastName}`}" class="player-link"><strong>${player.player_first_name || ''} ${player.player_last_name || ''}</strong> &ndash; View Full Profile</a>
  </div>`;
}

// Utility: Extract unique player names from all narrative sections
function extractReferencedPlayerNames(articleSections) {
  // Combine all text, extract capitalized name pairs (simple heuristic)
  const text = Object.values(articleSections).join(' ');
  const nameRegex = /([A-Z][a-z]+\s[A-Z][a-z]+)/g;
  const names = new Set();
  let match;
  while ((match = nameRegex.exec(text)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names);
}

// Utility: Build player cards for all referenced players
function buildPlayerCards(referencedNames, gameData) {
  // Get team abbreviations for both teams in the game
  const awayTeamAbbr = gameData.away.abbr;
  const homeTeamAbbr = gameData.home.abbr;
  
  return referencedNames.map(name => {
    // Find player by name and team (first try exact match)
    const player = BASEBALL_PLAYERS.find(p => {
      const playerFullName = `${p.player_first_name} ${p.player_last_name}`.toLowerCase();
      const playerTeam = p.player_current_team_abbreviation;
      
      // Check if player name matches and belongs to one of the teams in the game
      return playerFullName === name.toLowerCase() && 
             (playerTeam === awayTeamAbbr || playerTeam === homeTeamAbbr);
    });
    
    // If no exact match with team, try just by name
    const anyPlayer = !player ? BASEBALL_PLAYERS.find(p => {
      const playerFullName = `${p.player_first_name} ${p.player_last_name}`.toLowerCase();
      return playerFullName === name.toLowerCase();
    }) : null;
    
    if (!player && !anyPlayer) {
      return {
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
        element: 'Unknown'
      };
    }
    
    // Return the player from the correct team if found, otherwise any player with that name
    return player || anyPlayer;
  });
}

async function createArticlePrompt(gameData, analysisData, images) {
  // Limit images to 6
  const imgs = (images || []).slice(0, 6);
  
  // Helper for image HTML with credit
  function imageHtml(img) {
    return `<div class="article-image-block"><img src="${img.url}" alt="${img.title || ''}" /><div class="image-credit">Image credit: <a href="${img.page}" target="_blank" rel="noopener">${img.credit || img.source}</a></div></div>`;
  }
  
  // Determine game outcome description based on score
  let gameOutcome = "evenly matched contest";
  const homeName = gameData.home.name;
  const awayName = gameData.away.name;
  const homeScore = analysisData.teams?.home?.runs || 0;
  const awayScore = analysisData.teams?.away?.runs || 0;
  
  if (homeScore > awayScore) {
    const scoreDiff = homeScore - awayScore;
    if (scoreDiff >= 5) {
      gameOutcome = `dominant victory for ${homeName}`;
    } else if (scoreDiff >= 3) {
      gameOutcome = `solid win for ${homeName}`;
    } else {
      gameOutcome = `close win for ${homeName}`;
    }
  } else if (awayScore > homeScore) {
    const scoreDiff = awayScore - homeScore;
    if (scoreDiff >= 5) {
      gameOutcome = `commanding road win for ${awayName}`;
    } else if (scoreDiff >= 3) {
      gameOutcome = `strong showing by ${awayName}`;
    } else {
      gameOutcome = `narrow victory for ${awayName}`;
    }
  } else {
    gameOutcome = "deadlocked tie";
  }
  
  // Get current zodiac sign based on game date
  const gameDate = new Date(gameData.scheduled);
  const month = gameDate.getMonth() + 1;
  const day = gameDate.getDate();
  
  // Simple zodiac sign determination (approximate)
  const zodiacSigns = [
    { name: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { name: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { name: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { name: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { name: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { name: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { name: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { name: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { name: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
    { name: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
    { name: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { name: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } }
  ];
  
  let currentSign = 'Aries'; // Default fallback
  for (const sign of zodiacSigns) {
    if (
      (month === sign.start.month && day >= sign.start.day) ||
      (month === sign.end.month && day <= sign.end.day) ||
      (month > sign.start.month && month < sign.end.month)
    ) {
      currentSign = sign.name;
      break;
    }
  }
  
  // Extract referenced player names from all analysisData narrative fields
  const articleSections = {
    recap: analysisData.recap || '',
    stats: analysisData.stats || '',
    astrology: analysisData.astrology || '',
    notable: analysisData.notable || '',
  };
  
  const referencedNames = extractReferencedPlayerNames(articleSections);
  const playerCards = buildPlayerCards(referencedNames, gameData);
  analysisData.playerData = playerCards;
  
  // Create player cards HTML if player data is available
  const playerCardsHtml = analysisData.playerData && analysisData.playerData.length > 0
    ? `<div class="player-cards-section">
        <h2>Star Players</h2>
        <div class="player-cards-container">
          ${analysisData.playerData.map(player => createPlayerCardHtml(player)).join('')}
        </div>
      </div>`
    : '<!-- No player data available for cards -->';
  
  // Prepare images for Claude analysis
  let imageInstructions = '<!-- No images available -->';
  
  if (imgs.length > 0) {
    // Create a prompt for Claude to analyze and select the best images
    imageInstructions = `ANALYZE AND SELECT THE BEST IMAGES FROM THE FOLLOWING LIST.
    
    INSTRUCTIONS:
    1. Choose the highest quality, most relevant image for the featured image (should show game action)
    2. Select up to 5 additional images that best represent the game
    3. Skip any low quality, blurry, or irrelevant images
    4. Remove any duplicates or near-duplicates
    
    IMAGE ANALYSIS TASKS:
    - For each image, determine if it's high quality and relevant to the game
    - Look for clear action shots, celebrations, or key moments
    - Prefer images showing players in action over posed shots
    - Avoid images with watermarks or poor quality
    
    FORMAT FOR EACH IMAGE YOU WANT TO INCLUDE (copy and paste exactly as shown):
    <!-- IMAGE_SELECTED: [1-6] -->
    <div class="article-image">
      <img src="${imgs[0].url}" alt="${imgs[0].title || 'Game action'}" />
      <div class="image-credit">Image credit: <a href="${imgs[0].page || '#'}" target="_blank" rel="noopener">${imgs[0].credit || imgs[0].source || 'Source'}</a></div>
    </div>
    
    AVAILABLE IMAGES (analyze and select the best ones):
    ${imgs.map((img, index) => `
    --- IMAGE ${index + 1} ---
    URL: ${img.url}
    Title: ${img.title || 'No title'}
    Source: ${img.source || 'Unknown'}
    `).join('\n')}
    
    After analyzing all images, include only the selected images in your response, each wrapped in the FORMAT shown above.`;
  }

  // Format the prompt for Claude with very specific instructions
  const prompt = `
    <style>
      .article-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; }
      h1 { font-size: 2.2em; color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
      h2 { font-size: 1.8em; color: #2d3748; margin: 30px 0 15px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
      h3 { font-size: 1.4em; color: #4a5568; margin: 25px 0 10px; }
      p { margin: 0 0 20px 0; font-size: 1.1em; line-height: 1.7; }
      .final-score { 
        background: #f8f9fa; 
        border-radius: 8px; 
        padding: 20px; 
        margin: 20px 0 30px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .score-row { 
        display: flex; 
        justify-content: space-between; 
        padding: 10px 15px;
        font-size: 1.2em;
      }
      .score-row .team { font-weight: 600; }
      .score-row .runs { font-weight: 700; color: #2b6cb0; }
      .game-status { 
        text-align: center; 
        font-weight: 600; 
        color: #718096;
        margin-top: 10px;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .article-image { 
        margin: 25px 0; 
        text-align: center;
      }
      .article-image img { 
        max-width: 100%; 
        height: auto;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .image-credit { 
        font-size: 0.8em; 
        color: #718096; 
        text-align: right;
        margin-top: 5px;
      }
      .player-name {
        font-weight: 600;
        color: #2b6cb0;
      }
      .player-name a {
        color: inherit;
        text-decoration: none;
      }
      .player-name a:hover {
        text-decoration: underline;
      }
      .section {
        margin-bottom: 30px;
      }
      .key-play {
        background: #f8f9fa;
        border-left: 3px solid #4299e1;
        padding: 10px 15px;
        margin: 15px 0;
        border-radius: 0 4px 4px 0;
      }
      .stat-highlight {
        display: flex;
        justify-content: space-between;
        margin: 10px 0;
        padding: 8px 0;
        border-bottom: 1px solid #edf2f7;
      }
      .stat-label { font-weight: 600; }
    </style>

    <div class="article-container">
      <h1>${gameData.away.market} ${gameData.away.name} vs ${gameData.home.market} ${gameData.home.name}: Game Recap</h1>
      
      <div class="final-score">
        <div class="score-row">
          <span class="team">${gameData.away.market} ${gameData.away.name}</span>
          <span class="runs">${analysisData.teams.away.runs || 0}</span>
        </div>
        <div class="score-row">
          <span class="team">${gameData.home.market} ${gameData.home.name}</span>
          <span class="runs">${analysisData.teams.home.runs || 0}</span>
        </div>
        <div class="game-status">Final</div>
      </div>

      <div class="section">
        <h2>Game Recap & Astrological Insights</h2>
        <p>In a game influenced by the current lunar phase and celestial alignments, the ${gameData.away.market} ${gameData.away.name} faced off against the ${gameData.home.market} ${gameData.home.name} in what promised to be an exciting matchup.</p>
      </div>

      <div class="section">
        <h2>Key Moments</h2>
        <!-- Claude will add key moments here -->
      </div>

      <div class="section">
        <h2>Statistical Highlights</h2>
        <!-- Claude will add statistical highlights here -->
      </div>

      <div class="section">
        <h2>Astrological Analysis</h2>
        <p>The current lunar phase (Waxing Gibbous, 85% illuminated) in ${currentSign} created an energetic atmosphere that influenced today's game. Players with strong ${currentSign} placements in their charts may have felt particularly driven.</p>
        <!-- Claude will add more astrological insights here -->
      </div>

      ${playerCardsHtml}

      <div class="section">
        <h2>Looking Ahead</h2>
        <p>As the teams prepare for their next matchups, astrological conditions suggest [Claude will add forecast].</p>
      </div>
    </div>

    INSTRUCTIONS:
    - Fill in all sections with well-written, engaging content
    - Use the provided HTML structure and CSS classes
    - Include all images where appropriate (see below)
    - Link player names to their player cards using #player-[lastname]
    - Use <strong> tags for emphasis on important stats and names
    - Keep paragraphs concise (2-4 sentences each)
    - Add proper spacing between sections
    - Ensure all player names are properly linked to their player cards
    - Make the article engaging and informative for baseball fans interested in astrology

    FORMATTING RULES:
    - Output ONLY the HTML content (no markdown, no code blocks)
    - Use the provided CSS classes for consistent styling
    - Include all images in appropriate sections
    - Make sure all player names are properly linked
    - Add proper spacing between sections
    - Use semantic HTML5 elements
    - Ensure all links open in new tabs (target="_blank")
    - Add alt text to all images
    
    Key plays:
    ${formatKeyPlays(analysisData.keyPlays)}
    
    Notable player performances:
    ${formatNotablePerformances(analysisData.notablePerformances)}
    
    Player cards to include in the article:
    ${playerCardsHtml}
    
    Images to include:
    ${imageInstructions}
    
    Current lunar phase: Waxing Gibbous (85% illuminated)
    Current zodiac sign: ${currentSign}
    
    FOR GAME CARDS:
    After the intro section, include the following game card HTML as-is:
    <div class="game-card">
      <div class="teams">
        <div class="team away">
          <div class="team-name">${gameData.away.market} ${gameData.away.name}</div>
          <div class="team-score">${analysisData.teams.away.runs}</div>
        </div>
        <div class="team home">
          <div class="team-name">${gameData.home.market} ${gameData.home.name}</div>
          <div class="team-score">${analysisData.teams.home.runs}</div>
        </div>
      </div>
      <div class="game-details">
        <div class="detail">Hits: ${analysisData.teams.away.hits}-${analysisData.teams.home.hits}</div>
        <div class="detail">Errors: ${analysisData.teams.away.errors}-${analysisData.teams.home.errors}</div>
      </div>
    </div>
    
    Remember to focus on the actual players listed in the notable performances, connect their zodiac signs to their performance, and produce a well-formatted, complete HTML article. The article should look polished and ready for web display.
  `;
  
  return prompt;
}

// Save article to the test directory and website
async function saveArticle(gameId, article, metadata) {
  try {
    if (!article || !article.content) {
      console.error('No content provided to saveArticle');
      return null;
    }
    
    const content = article.content;
    let title = article.title;
    
    if (!title) {
      try {
        // Extract title from h1 tag if present
        const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match && h1Match[1]) {
          title = h1Match[1].trim();
        } else {
          title = `${metadata.away.name} vs ${metadata.home.name}: Game Recap`;
        }
      } catch (error) {
        console.error('Error extracting title:', error);
        title = `${metadata.away.name} vs ${metadata.home.name}: Game Recap`;
      }
    }
    
    // Create a slug from the title
    const slug = metadata.away.name.toLowerCase().replace(/\s+/g, '-') + 
                '-vs-' + 
                metadata.home.name.toLowerCase().replace(/\s+/g, '-') + 
                '-' + metadata.date;
    
    // Prepare article data
    const articleData = {
      id: gameId,
      title,
      slug: slug,
      description: `Recap of the MLB game between ${metadata.away.name} and ${metadata.home.name} on ${metadata.date.replace(/-/g, '/')}`,
      publishedAt: `${metadata.date}T00:00:00.000Z`,
      image: metadata.featuredImage || '',
      teamHome: metadata.home.name,
      teamAway: metadata.away.name,
      score: metadata.score,
      date: metadata.date,
      content: content,
      excerpt: `Recap of the game between ${metadata.away.name} and ${metadata.home.name} on ${metadata.date}`,
      status: 'published',
      tags: ['mlb', 'game-recap', 'baseball'],
      author: 'Astro Bet Advisor',
      featuredPlayers: [],
      meta: {
        title: `${metadata.away.name} vs ${metadata.home.name} Game Recap | Full Moon Odds`,
        description: `Recap of the MLB game between ${metadata.away.name} and ${metadata.home.name} on ${metadata.date.replace(/-/g, '/')}`,
        image: metadata.featuredImage || ''
      }
    };
    
    // Create test directory if it doesn't exist
    const testDir = path.join(__dirname, '../test-articles');
    await fs.mkdir(testDir, { recursive: true });
    
    // Save to test directory
    const testPath = path.join(testDir, `${gameId}.json`);
    await fs.writeFile(testPath, JSON.stringify(articleData, null, 2));
    console.log(`Article saved to test directory: ${testPath}`);
    
    // Create website directory if it doesn't exist
    const websiteDir = path.join(__dirname, '../src/data/news');
    await fs.mkdir(websiteDir, { recursive: true });
    
    // Save to website directory
    const websitePath = path.join(websiteDir, `${slug}.json`);
    await fs.writeFile(websitePath, JSON.stringify(articleData, null, 2));
    console.log(`Article saved to website directory: ${websitePath}`);
    
    return articleData;
  } catch (error) {
    console.error(`Error saving article: ${error.message}`);
    throw error;
  }
}

// Update website index file
async function updateWebsiteIndex(article) {
  try {
    const indexPath = path.join(__dirname, '../src/data/news/index.json');
    let index = { articles: [] };
    
    // Read existing index if it exists
    try {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      index = JSON.parse(indexContent);
    } catch (error) {
      console.log('No existing index found, creating new one');
    }
    
    // Check if article already exists in index
    const existingIndex = index.articles.findIndex(a => a.id === article.id);
    
    // Prepare article summary for index
    const articleSummary = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      description: article.description,
      publishedAt: article.publishedAt,
      image: article.image,
      date: article.date,
      teamHome: article.teamHome,
      teamAway: article.teamAway,
      score: article.score,
      excerpt: article.excerpt || ''
    };
    
    // Update or add article to index
    if (existingIndex >= 0) {
      index.articles[existingIndex] = articleSummary;
    } else {
      index.articles.push(articleSummary);
    }
    
    // Sort articles by date (newest first)
    index.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Write updated index
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    console.log('Website index updated successfully');
    
    return true;
  } catch (error) {
    console.error(`Error updating website index: ${error.message}`);
    return false;
async function ensureCacheDirectory() {
  try {
    const cacheDir = path.join(__dirname, '../.image-cache');
    await fs.mkdir(cacheDir, { recursive: true });
    console.log(`Ensured cache directory exists: ${cacheDir}`);
    return cacheDir;
  } catch (error) {
    console.error(`Error creating cache directory: ${error.message}`);
    throw error;
  }
}

// Main function to generate test articles
async function generateTestArticles() {
  try {
    // Check for required API keys
    console.log(`GOOGLE_API_KEY present: ${!!process.env.GOOGLE_API_KEY}`);
    console.log(`GOOGLE_CSE_ID present: ${!!process.env.GOOGLE_CSE_ID}`);
    console.log(`ANTHROPIC_API_KEY present: ${!!process.env.ANTHROPIC_API_KEY}`);
    console.log(`SPORTS_RADAR_API_KEY present: ${!!process.env.SPORTS_RADAR_NEWS_API_KEY}`);
    
    // Create cache directory if it doesn't exist
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log(`Ensured cache directory exists: ${CACHE_DIR}`);
    
    // Get dates to process (default to today if not specified)
    const dates = process.argv[2] ? process.argv[2].split(',') : ['2025-05-21'];
    
    console.log(`Will process games from these dates: ${dates.join(', ')}`);
    
    // Process each date
    for (const date of dates) {
      console.log(`\nProcessing games for ${date}...`);
      
      // Fetch schedule for the date
      console.log(`Fetching MLB schedule for ${date}...`);
      const schedule = await fetchMLBSchedule(date);
      
      if (!schedule || !schedule.games || schedule.games.length === 0) {
        console.log(`No games found for ${date}`);
        continue;
      const analysis = await retryWithBackoff(() => fetchGameAnalysis(game.id), 3, 2000);
      console.log(`Analysis data retrieved: ${analysis !== null}`);
      
      // Fetch images
      const images = await searchGameImages(
        `${game.home.market} ${game.home.name}`,
        `${game.away.market} ${game.away.name}`,
        date,
        game.id // Pass the game ID for Sportradar API
      );
      
      console.log(`Found ${images.length} images for the game`);
      
      // Generate article
      if (analysis) {
        // Create article prompt with player data
        const prompt = await createArticlePrompt(game, analysis, images);
        console.log('Generated prompt for Claude. Sending request...');
        
        const article = await generateArticleWithClaude(prompt);
        console.log('Article generated successfully');
        
        // Extract title
        const title = extractTitle(article);
        console.log(`Title: ${title}`);
        
        // Get featured player data
        const playerProfiles = analysis.playerData || [];
        
        // Create article object
        const articleData = {
          id: game.id,
          title,
          date,
          teamHome: game.home.name,
          teamAway: game.away.name,
          score: analysis.score,
          content: article,
          featuredPlayers: playerProfiles.map(player => ({
            id: player.id,
            name: player.full_name,
            zodiacSign: player.zodiac_sign,
            element: player.element
          }))
        };
        
        // Save article
        await saveArticle(game.id, article, {
          teamHome: game.home.name,
          teamAway: game.away.name,
          date,
          score: analysis.score,
          featuredPlayers: playerProfiles
        });
        
        // Update website index
        await updateWebsiteIndex({
          id: game.id,
          title,
          slug: `${game.away.name.toLowerCase().replace(/\s+/g, '-')}-vs-${game.home.name.toLowerCase().replace(/\s+/g, '-')}-${date}`,
          description: `Recap of the MLB game between ${game.away.name} and ${game.home.name} on ${date.replace(/-/g, '/')}`,
          publishedAt: `${date}T00:00:00.000Z`,
          image: images.length > 0 ? images[0].url : '',
          teamHome: game.home.name,
          teamAway: game.away.name,
          score: analysis.score,
          date,
          featuredPlayers: playerProfiles.slice(0, 3).map(player => player.id)
        });
      } else {
        console.log(`Skipping article generation for game ID ${game.id} due to missing analysis data`);
      }
      
      // Respect API rate limits
      console.log('Waiting 3 seconds before processing...');
      await delay(3000);
    
    console.log('\nArticle generation completed!');
  } catch (error) {
    console.error(`Error in main process: ${error.message}`);
  }
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 2000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      // For rate limits, use a longer backoff
      if (error.response && error.response.status === 429) {
        const delay = initialDelay * Math.pow(3, retries); // More aggressive backoff for rate limits
        console.log(`Rate limited (429). Retrying in ${delay}ms... (Attempt ${retries} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (retries === maxRetries) {
        console.error(`Failed after ${maxRetries} retries:`, error.message);
        throw error;
      } else {
        const delay = initialDelay * Math.pow(2, retries);
        console.log(`Error occurred: ${error.message}. Retrying in ${delay}ms... (Attempt ${retries} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}

// Run the script
generateTestArticles().catch(console.error);

async function generateTestArticle(gameId, date) {
  try {
    console.log(`Generating test article for game ${gameId} on ${date}...`);
    
    // Fetch game data
    const gameData = await fetchGameData(gameId);
    if (!gameData) {
      console.error(`Could not fetch game data for game ${gameId}`);
      return null;
    }
    
    // Fetch game analysis
    const analysisData = await fetchGameAnalysis(gameId);
    const hasAnalysis = !!analysisData;
    console.log(`Analysis data retrieved: ${hasAnalysis}`);
    
    // Fetch images
    console.log(`Attempting to fetch images from Sportradar for game ID: ${gameId}`);
    const images = await searchGameImages(gameId, date, gameData.away.name, gameData.home.name);
    
    // Build player cards
    const playerNames = extractPlayerNames(analysisData);
    const playerCards = buildPlayerCards(playerNames, gameData);
    
    // Create article prompt
    const prompt = createArticlePrompt(gameData, analysisData, images, playerCards);
    
    // Generate article with Claude
    const article = await generateArticleWithClaude(prompt);
    if (!article || !article.content) {
      console.error('Failed to generate article content');
      return null;
    }
    
    // Prepare metadata
    const metadata = {
      date,
      away: gameData.away,
      home: gameData.home,
      score: `${gameData.away.name} ${gameData.away.runs} - ${gameData.home.runs} ${gameData.home.name}`,
      images,
      featuredImage: images && images.length > 0 ? images[0].url : '',
      featuredPlayers: playerCards.filter(card => card.player).map(card => ({
        id: card.player.player_id,
        full_name: `${card.player.player_first_name} ${card.player.player_last_name}`,
        zodiac_sign: card.player.player_zodiac_sign,
        element: card.player.player_element
      }))
    };
    
    // Save article
    const articleData = await saveArticle(gameId, article, metadata);
    if (articleData) {
      // Insert images at their designated positions
      if (images.imageBlocks && images.imageBlocks.length > 0) {
        // Insert featured image at the top if available
        if (images.featuredImage) {
          processedContent = `
            <div class="article-featured-image">
              <img src="${images.featuredImage}" alt="${game.away.name} vs ${game.home.name}" />
              <div class="image-credit">
                <a href="${images.imageBlocks[0]?.page || '#'}" target="_blank" rel="noopener noreferrer">
                  Photo: ${images.imageBlocks[0]?.credit || 'Unknown'}
                </a>
              </div>
            </div>
            ${processedContent}`;
        }
        
        // Insert remaining images at their designated positions
        images.imageBlocks.slice(1).forEach((img, idx) => {
          const placeholder = new RegExp(`\\[IMAGE ${idx + 2} - PLACE AT: (.*?)\\]`, 'i');
          const match = processedContent.match(placeholder);
          
          if (match) {
            processedContent = processedContent.replace(
              match[0],
              img.html || `
                <div class="article-image">
                  <img src="${img.url}" alt="${img.title}" />
                  <div class="image-credit">
                    <a href="${img.page || '#'}" target="_blank" rel="noopener noreferrer">
                      Photo: ${img.credit}
                    </a>
                  </div>
                </div>`
            );
          }
        });
      }
      
      // Remove any remaining image placeholders
      processedContent = processedContent.replace(/\[IMAGE \d+ - PLACE AT: .*?\]/g, '');
      
      // Create article data
      const articleData = {
        title: article.title || `${game.away.name} vs ${game.home.name} Game Recap`,
        content: processedContent,
        excerpt: article.excerpt || `Recap of the game between ${game.away.name} and ${game.home.name} on ${date}`,
        slug: `${game.away.name.toLowerCase().replace(/\s+/g, '-')}-vs-${game.home.name.toLowerCase().replace(/\s+/g, '-')}-${date}`,
        description: `Recap of the MLB game between ${game.away.name} and ${game.home.name} on ${date.replace(/-/g, '/')}`,
        publishedAt: `${date}T00:00:00.000Z`,
        image: images.featuredImage || '',
        teamHome: game.home.name,
        teamAway: game.away.name,
        score: analysis.score,
        date: date,
        status: 'published',
        tags: ['mlb', 'game-recap', 'baseball'],
        author: 'Full Moon Odds',
        meta: {
          title: `${game.away.name} vs ${game.home.name} Game Recap | Full Moon Odds`,
          description: `Recap of the MLB game between ${game.away.name} and ${game.home.name} on ${date.replace(/-/g, '/')}`,
          image: images.featuredImage || ''
        }
      };
      
      // Save article to test directory
      const testArticlePath = path.join(__dirname, '../test/test-article.json');
      await fs.promises.writeFile(testArticlePath, JSON.stringify(articleData, null, 2));
      console.log(`Test article saved to ${testArticlePath}`);
      
      // Save to website data directory
      const websiteArticlePath = path.join(__dirname, '../src/data/articles', `${articleData.slug}.json`);
      await fs.promises.mkdir(path.dirname(websiteArticlePath), { recursive: true });
      await fs.promises.writeFile(websiteArticlePath, JSON.stringify(articleData, null, 2));
      console.log(`Article saved to ${websiteArticlePath}`);
      
      // Update website index
      await updateWebsiteIndex(articleData);
      
      return articleData;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating test article:', error);
    return null;
  }
}
