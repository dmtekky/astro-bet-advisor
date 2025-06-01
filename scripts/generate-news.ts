// scripts/generate-news.ts
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const TEST_ARTICLES_DIR = path.join(__dirname, '../test-articles');
const PUBLIC_NEWS_DIR = path.join(__dirname, '../public/news');
const API_DATA_DIR = path.join(__dirname, '../src/data/news');

// Function to generate a slug from a string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

// Function to format date (YYYY-MM-DD)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// Function to ensure output directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(PUBLIC_NEWS_DIR, { recursive: true });
    await fs.mkdir(API_DATA_DIR, { recursive: true });
    console.log(`Ensured directories exist: ${PUBLIC_NEWS_DIR} and ${API_DATA_DIR}`);
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
}

// Main function to process articles
async function processArticles() {
  await ensureDirectories();
  
  try {
    console.log(`Looking for JSON articles in ${TEST_ARTICLES_DIR}...`);
    const files = await fs.readdir(TEST_ARTICLES_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log(`No JSON articles found in ${TEST_ARTICLES_DIR}. Run the generate-test-articles.js script first.`);
      return;
    }
    
    console.log(`Found ${jsonFiles.length} JSON articles to process.`);
    
    // Array to hold all article metadata for the index file
    const allArticlesMetadata: any[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(TEST_ARTICLES_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const articleData = JSON.parse(fileContent);
      
      if (!articleData.article || !articleData.metadata) {
        console.warn(`Skipping ${file}: Invalid article data structure.`);
        continue;
      }
      
      const { id, metadata, article: htmlContent, generated } = articleData;
      
      // Create slug
      const title = `${metadata.homeTeam} vs ${metadata.awayTeam} - Game Recap`;
      const slug = slugify(`${metadata.awayTeam}-vs-${metadata.homeTeam}-${metadata.date}`);
      const publishDate = new Date(metadata.date).toISOString();
      const description = `Recap of the MLB game between ${metadata.awayTeam} and ${metadata.homeTeam} on ${new Date(metadata.date).toLocaleDateString()}`;
      const image = metadata.images && metadata.images.length > 0 ? metadata.images[0].url : '';
      
      // Create article metadata for the index
      const articleMetadata = {
        id,
        title,
        slug,
        description,
        publishedAt: publishDate,
        image,
        teamHome: metadata.homeTeam,
        teamAway: metadata.awayTeam,
        score: metadata.score,
        date: metadata.date
      };
      
      allArticlesMetadata.push(articleMetadata);
      
      // Save the full article content to the public directory (for direct access)
      const publicArticlePath = path.join(PUBLIC_NEWS_DIR, `${slug}.html`);
      await fs.writeFile(publicArticlePath, htmlContent);
      console.log(`Saved article HTML to ${publicArticlePath}`);
      
      // Save the full article data (with metadata) to the API data directory
      const apiArticlePath = path.join(API_DATA_DIR, `${slug}.json`);
      await fs.writeFile(
        apiArticlePath, 
        JSON.stringify({
          ...articleMetadata,
          content: htmlContent
        }, null, 2)
      );
      console.log(`Saved article data to ${apiArticlePath}`);
    }
    
    // Sort articles by date (newest first)
    allArticlesMetadata.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    // Save the index file with all article metadata
    const indexPath = path.join(API_DATA_DIR, 'index.json');
    await fs.writeFile(
      indexPath,
      JSON.stringify({ articles: allArticlesMetadata }, null, 2)
    );
    console.log(`Saved articles index to ${indexPath}`);
    
    console.log('✅ Article processing complete!');
    
  } catch (error) {
    console.error('Error processing articles:', error);
  }
}

// Run the function
processArticles().catch(console.error);
