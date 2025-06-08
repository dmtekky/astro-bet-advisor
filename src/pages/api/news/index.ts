// src/pages/api/news/index.ts
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

// Only use the /public/news/data directory which has the correct articles
const NEWS_DATA_PATH = path.join(process.cwd(), 'public', 'news', 'data');

// Helper function to find a file in the news data path
async function findFileInNewsPath(filename: string): Promise<string | null> {
  console.log(`Looking for ${filename} in news data path...`);
  
  const filePath = path.join(NEWS_DATA_PATH, filename);
  console.log(`Checking ${filePath}...`);
  
  try {
    await fs.access(filePath);
    console.log(`Found ${filename} at ${filePath}`);
    return filePath;
  } catch (error) {
    console.log(`${filename} not found at ${filePath}`);
    return null;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    // Initialize an array to hold all articles
    let allArticles = [];
    
    // Only use the index.json file in the /public/news/data directory
    const indexPath = path.join(NEWS_DATA_PATH, 'index.json');
    console.log('Reading news index from:', indexPath);
    
    try {
      // Read the index file
      const content = await fs.readFile(indexPath, 'utf8');
      console.log('Index file content:', content.substring(0, 200) + '...');
      
      // Parse the index file
      const data = JSON.parse(content);
      const articles = data.articles || [];
      
      console.log(`Found ${articles.length} articles in index`);
      allArticles = articles;
      
      // Log the articles for debugging
      console.log('Articles from index:', JSON.stringify(allArticles.map(a => a.title), null, 2));
    } catch (error) {
      console.error('Error reading/parsing index file:', error.message);
      throw new Error(`Failed to read news index: ${error.message}`);
    }
    
    // If we didn't find any articles, return an empty array
    if (allArticles.length === 0) {
      console.error('No articles found in the news data directory');
      return res.status(404).json({
        articles: [],
        message: "No news articles found. Please generate articles first.",
        error: `No articles found in ${NEWS_DATA_PATH}`
      });
    }
    
    console.log(`Total unique articles found: ${allArticles.length}`);
    console.log('Articles:', JSON.stringify(allArticles, null, 2));
    
    // We already have all articles in the allArticles array
    const articles = allArticles;
    
    if (!Array.isArray(articles)) {
      return res.status(500).json({
        error: "Invalid news data format: expected an array of articles or an object with an 'articles' array"
      });
    }
    
    // Map the articles to match the expected format in the frontend
    const formattedArticles = articles.map(article => ({
      id: article.id || article.gameId || `article-${Math.random().toString(36).substr(2, 9)}`,
      title: article.title || `${article.teamAway || 'Away'} vs ${article.teamHome || 'Home'} - Game Recap`,
      description: article.description || article.title || `Recap of the MLB game between ${article.teamAway || 'Away'} and ${article.teamHome || 'Home'}`,
      content: article.content || '', // Content will be loaded from the file when viewing the article
      publishedAt: article.publishedAt || article.date || new Date().toISOString(),
      slug: article.slug || (article.path ? article.path.replace(/\.\w+$/, '') : `article-${Date.now()}`),
      teamHome: article.teamHome || article.home_team,
      teamAway: article.teamAway || article.away_team,
      image: article.image || '',
      score: typeof article.score === 'string' ? parseScore(article.score) : 
            (article.score || { 
              home: article.homeScore || 0, 
              away: article.awayScore || 0 
            })
    }));
    
    // Helper function to parse score strings like "Marlins 0 - Giants 2"
    function parseScore(scoreStr: string) {
      if (!scoreStr) return { home: 0, away: 0 };
      const match = scoreStr.match(/(\d+)\s*-\s*(\d+)/);
      return match ? { home: parseInt(match[2]), away: parseInt(match[1]) } : { home: 0, away: 0 };
    }
    
    // Set content type and return the articles in the expected format
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      articles: formattedArticles
    });
    
  } catch (error) {
    console.error('Error in /api/news:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: "Failed to fetch news articles",
      details: error.message
    });
  }
}
