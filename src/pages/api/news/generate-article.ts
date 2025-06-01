import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Define a type for the Vercel request and response if not already globally available
// For simplicity, using 'any' for now, but you might have specific types
interface VercelRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
  body: any;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  send?: (body: any) => VercelResponse; // For non-JSON responses like HTML
  setHeader: (name: string, value: string | string[]) => VercelResponse;
}

// --- Environment Variable Loading & Validation ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const sportsRadarApiKey = process.env.SPORTS_RADAR_NEWS_API_KEY;
const cronSecret = process.env.CRON_SECRET;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  // In a real scenario, you might not throw here if the function can operate without Supabase
  // or if Supabase is initialized later. For now, we assume it's critical.
} else {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

if (!anthropicApiKey) {
  console.error('Missing ANTHROPIC_API_KEY environment variable');
}
if (!sportsRadarApiKey) {
  console.error('Missing SPORTS_RADAR_NEWS_API_KEY environment variable');
}
if (!cronSecret) {
  console.error('Missing CRON_SECRET environment variable for endpoint security');
}

// --- Helper Function: Fetch SportsRadar News ---
async function fetchSportsRadarNews(apiKey: string): Promise<any[]> {
  // TODO: Replace with your actual SportsRadar MLB News API endpoint
  const NEWS_API_URL = 'https://api.sportradar.us/mlb/trial/v7/en/league/official_news.json'; 
  // TODO: Confirm if 'api_key' is the correct query parameter name for authentication
  const url = `${NEWS_API_URL}?api_key=${apiKey}`;

  console.log(`Fetching MLB news from SportsRadar: ${NEWS_API_URL}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`SportsRadar API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`SportsRadar API request failed: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json() as any; // Add more specific type if known
    
    // TODO: Adjust the path to news items based on the actual API response structure
    // Assuming news items are in a property like 'articles' or 'news'
    const newsItems = data.articles || data.news || []; 
    console.log(`Fetched ${newsItems.length} news items from SportsRadar.`);
    return newsItems;

  } catch (error: any) {
    console.error('Error fetching or parsing SportsRadar news:', error);
    throw new Error(`Failed to fetch SportsRadar news: ${error.message}`);
  }
}

// --- Helper Function: Generate Article with Anthropic Claude ---
async function generateArticleWithClaude(apiKey: string, prompt: string): Promise<string | null> {
  const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  // Using claude-3-haiku-20240307 as planned
  const CLAUDE_MODEL = 'claude-3-haiku-20240307'; 

  console.log(`Sending prompt to Anthropic Claude (${CLAUDE_MODEL}). Prompt length: ${prompt.length}`);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048, // Adjustable: starting with a generous amount
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Anthropic API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`Anthropic API request failed: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json() as any; // Add more specific type if known

    // Extracting text content based on typical Claude API response structure
    // The response structure is an object with a 'content' array, 
    // and each item in 'content' has a 'text' field.
    if (data.content && Array.isArray(data.content) && data.content.length > 0 && data.content[0].text) {
      const generatedText = data.content[0].text;
      console.log(`Received response from Anthropic. Generated text length: ${generatedText.length}`);
      return generatedText;
    } else {
      console.error('Unexpected response structure from Anthropic:', data);
      throw new Error('Failed to extract generated text from Anthropic response.');
    }

  } catch (error: any) {
    console.error('Error calling Anthropic API:', error);
    // Returning null or re-throwing, depending on desired error handling for the caller
    return null; 
  }
}


// --- Main Handler Function ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Check Request Method (Allow only POST)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Check CRON_SECRET for authorization
  const { token } = req.query;
  if (!cronSecret || token !== cronSecret) {
    console.error('Unauthorized attempt to access generate-article endpoint.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Ensure critical environment variables are loaded before proceeding
  if (!supabaseUrl || !supabaseKey || !anthropicApiKey || !sportsRadarApiKey) {
    const missingVars = [
      ...(!supabaseUrl || !supabaseKey ? ['Supabase config'] : []),
      ...(!anthropicApiKey ? ['ANTHROPIC_API_KEY'] : []),
      ...(!sportsRadarApiKey ? ['SPORTS_RADAR_NEWS_API_KEY'] : []),
    ].join(', ');
    console.error(`Critical environment variables missing: ${missingVars}`);
    return res.status(500).json({ error: 'Internal Server Error: Configuration missing.', details: `Missing: ${missingVars}` });
  }

  try {
    console.log('AI News Generation process started...');

    // --- Core Logic ---
    // Step 1: Fetch MLB news from SportsRadar API
    if (!sportsRadarApiKey) { // Should be caught by earlier check, but good to be safe
        throw new Error('SportsRadar API Key is not configured.');
    }
    const rawNewsItems = await fetchSportsRadarNews(sportsRadarApiKey);

    if (!rawNewsItems || rawNewsItems.length === 0) {
      console.log('No news items fetched from SportsRadar or an error occurred.');
      return res.status(200).json({ message: 'No new MLB news items found to process.', articlesGenerated: 0 });
    }

    // TODO: Step 2: For each (or a selection of) news item(s):
    //   a. Fetch relevant astrological data (if needed, or assume available)
    //   b. Fetch relevant team/player data from Supabase (if needed)
    //   c. Construct a detailed prompt for Anthropic Claude

    // TODO: Step 3: Call Anthropic API to generate the SEO-optimized article
    // const generatedArticleContent = await generateArticleWithClaude(prompt);

    // TODO: Step 4: Parse Anthropic's response (content, title, SEO meta, image ideas)

    // TODO: Step 5: Store the generated article in Supabase `articles` table
    // const { data, error } = await supabase.from('articles').insert([{ ...articleData }]);

    let articlesGeneratedCount = 0;
    const generatedArticleSnippets: string[] = [];

    // TODO: Implement proper iteration, prompt engineering, and error handling per article
    // For now, let's try to generate content for the first news item if available
    if (rawNewsItems.length > 0) {
      const firstNewsItem = rawNewsItems[0]; // Process only the first item for now
      // TODO: Extract actual title/summary from firstNewsItem once structure is known
      const placeholderTitle = firstNewsItem.title || 'a recent MLB event';
      const simplePrompt = `Write a short, engaging news paragraph about ${placeholderTitle}. Make it suitable for sports fans interested in astrology.`;

      if (!anthropicApiKey) { // Should be caught by earlier check
        throw new Error('Anthropic API Key is not configured.');
      }
      const generatedContent = await generateArticleWithClaude(anthropicApiKey, simplePrompt);

      if (generatedContent) {
        articlesGeneratedCount++;
        generatedArticleSnippets.push(generatedContent.substring(0, 100) + '...'); // Store a snippet
        console.log(`Generated content for news item: ${placeholderTitle}`);
        // TODO: Step 4: Parse Anthropic's response (content, title, SEO meta, image ideas)
        // TODO: Step 5: Store the generated article in Supabase `articles` table
      } else {
        console.log(`Failed to generate content for news item: ${placeholderTitle}`);
      }
    }

    console.log(`AI News Generation process partially completed. Articles attempted: 1, Successfully generated: ${articlesGeneratedCount}`);
    return res.status(200).json({
      message: `AI News Generation process partially completed. Attempted to generate for 1 news item.`,
      articlesFetched: rawNewsItems.length,
      articlesGenerated: articlesGeneratedCount,
      generatedSnippets: generatedArticleSnippets // For quick review
    });

  } catch (error: any) {
    console.error('Error during AI News Generation:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
