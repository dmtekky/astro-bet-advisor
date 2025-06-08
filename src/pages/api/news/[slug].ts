// src/pages/api/news/[slug].ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

// Define possible paths to the news data
const POSSIBLE_NEWS_PATHS = [
  path.join(process.cwd(), 'public', 'news', 'data'),  // New location
  path.join(process.cwd(), 'src', 'data', 'news')    // Old location (for backward compatibility)
];

// Helper function to find the first existing file in the possible paths
async function findFirstExistingFile(filename: string): Promise<string | null> {
  for (const basePath of POSSIBLE_NEWS_PATHS) {
    try {
      const filePath = path.join(basePath, filename);
      await fs.access(filePath);
      return filePath;
    } catch (error) {
      // File doesn't exist at this path, try the next one
      continue;
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the slug from the query parameters
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        error: 'Article slug is required'
      });
    }

    // Try to find the article file in any of the possible locations
    const articlePath = await findFirstExistingFile(`${slug}.json`);
    
    if (!articlePath) {
      console.error(`Article ${slug}.json not found in any of:`, POSSIBLE_NEWS_PATHS);
      return res.status(404).json({
        error: 'Article not found',
        message: `Article with slug '${slug}' was not found in any of the expected locations.`
      });
    }

    console.log('Found article at:', articlePath);
    
    // Read the article file
    const articleContent = await fs.readFile(articlePath, 'utf-8');
    const article = JSON.parse(articleContent);

    // Format the response to match the frontend's expected format
    const response = {
      id: article.id || slug,
      title: article.title || `${article.teamAway || 'Away'} vs ${article.teamHome || 'Home'}`,
      description: article.description || article.title || '',
      content: article.content || article.article || '',
      publishedAt: article.publishedAt || article.date || new Date().toISOString(),
      slug: slug as string,
      teamHome: article.teamHome || article.home_team,
      teamAway: article.teamAway || article.away_team,
      image: article.image || '',
      score: typeof article.score === 'string' ? parseScore(article.score) : 
            (article.score || { 
              home: article.homeScore || 0, 
              away: article.awayScore || 0 
            })
    };

    // Return the article data
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching article:', error);
    return res.status(500).json({
      error: 'Failed to fetch article',
      details: error.message
    });
  }
}

// Helper function to parse score strings like "Marlins 0 - Giants 2"
function parseScore(scoreStr: string) {
  if (!scoreStr) return { home: 0, away: 0 };
  const match = scoreStr.match(/(\d+)\s*-\s*(\d+)/);
  return match ? { 
    home: parseInt(match[2].trim(), 10), 
    away: parseInt(match[1].trim(), 10) 
  } : { home: 0, away: 0 };
}
