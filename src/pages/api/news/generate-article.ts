import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { PlayerCardProps } from '@/components/PlayerCardNew'; // For player card data structure
import { slugify } from '@/utils/slugify'; // Assuming you have a slugify utility

// Define a type for the Vercel request and response
interface VercelRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
  body: any;
}

interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  send?: (body: any) => VercelResponse;
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

// --- Types for Player and Article Data ---
type PlayerDataForCard = PlayerCardProps;

interface GeneratedArticleDetail {
  title: string;
  slug: string;
  markdownContent: string | null;
  topPlayers: PlayerDataForCard[];
  // Add other relevant fields like gameId, date, etc.
  gameId?: string | number | null;
  newsSourceId?: string;
  publishedAt?: string;
}

// --- Helper Function: Fetch SportsRadar News ---
async function fetchSportsRadarNews(apiKey: string): Promise<any[]> {
  const NEWS_API_URL = 'https://api.sportradar.us/mlb/trial/v7/en/league/official_news.json';
  const url = `${NEWS_API_URL}?api_key=${apiKey}`;
  console.log(`Fetching MLB news from SportsRadar: ${NEWS_API_URL}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`SportsRadar API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`SportsRadar API request failed: ${response.statusText} - ${errorBody}`);
    }
    const data = await response.json() as any;
    const newsItems = data.articles || data.news || [];
    console.log(`Fetched ${newsItems.length} news items from SportsRadar.`);
    return newsItems;
  } catch (error: any) {
    console.error('Error fetching or parsing SportsRadar news:', error);
    throw new Error(`Failed to fetch SportsRadar news: ${error.message}`);
  }
}

// --- Helper Function: Fetch Top Players for Teams ---
async function fetchTopPlayersForTeams(
  homeTeamId: string | null,
  awayTeamId: string | null,
  limit: number = 4
): Promise<PlayerDataForCard[]> {
  if (!supabase) {
    console.error('Supabase client not initialized. Cannot fetch players.');
    return [];
  }
  if (!homeTeamId && !awayTeamId) {
    console.warn('No team IDs provided to fetchTopPlayersForTeams. Returning empty array.');
    return [];
  }

  const teamIds = [homeTeamId, awayTeamId].filter(Boolean) as string[];

  if (teamIds.length === 0) {
    return [];
  }

  try {
    const { data: players, error } = await supabase
      .from('players')
      .select(`
        id,
        player_id,
        full_name,
        headshot_url,
        team_id,
        birth_date,
        primary_number,
        primary_position,
        impact_score,
        astro_influence,
        astro_influence_score,
        teams ( abbreviation ) 
      `)
      .in('team_id', teamIds)
      .order('impact_score', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top players:', error);
      return [];
    }

    if (!players) {
      return [];
    }
    
    // Map to PlayerDataForCard structure
    return players.map(p => ({
        id: p.id, // Supabase internal UUID
        player_id: p.player_id, // External player ID
        full_name: p.full_name,
        headshot_url: p.headshot_url,
        team_id: p.team_id,
        birth_date: p.birth_date,
        primary_number: p.primary_number,
        primary_position: p.primary_position,
        impact_score: p.impact_score,
        astro_influence: p.astro_influence,
        astro_influence_score: p.astro_influence_score,
        // Construct linkPath, assuming player_id is used for the player's page URL
        linkPath: p.teams?.abbreviation && p.player_id ? `/team/${p.teams.abbreviation}/player/${p.player_id}` : undefined,
    }));

  } catch (e) {
    console.error('Exception in fetchTopPlayersForTeams:', e);
    return [];
  }
}


// --- Helper Function: Generate Article with Anthropic Claude ---
async function generateArticleWithClaude(apiKey: string, prompt: string): Promise<string | null> {
  if (!apiKey) {
    console.error('Anthropic API Key is missing.');
    return null;
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229', // Or your preferred model
        max_tokens: 3000, // Increased token limit
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Anthropic API request failed with status ${response.status}: ${errorBody}`);
      return null;
    }
    const data = await response.json() as any;
    return data.content?.[0]?.text || null;
  } catch (error: any) {
    console.error('Error generating article with Anthropic Claude:', error);
    return null;
  }
}

// --- Main Handler Function ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.query;
  if (!cronSecret || token !== cronSecret) {
    console.error('Unauthorized attempt to access generate-article endpoint.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
    const rawNewsItems = await fetchSportsRadarNews(sportsRadarApiKey);

    if (!rawNewsItems || rawNewsItems.length === 0) {
      console.log('No news items fetched from SportsRadar.');
      return res.status(200).json({ message: 'No new MLB news items found to process.', articlesGenerated: 0, generatedArticles: [] });
    }

    const generatedArticles: GeneratedArticleDetail[] = [];

    // Process only the first news item for now, or implement iteration
    const newsItem = rawNewsItems[0]; 
    if (newsItem) {
      const articleTitle = newsItem.title || 'Recent MLB Event';
      const summary = newsItem.summary || newsItem.description || 'An exciting MLB game took place recently.';
      const newsSourceId = newsItem.id || newsItem.guid || undefined; // ID from SportsRadar
      const publishedAt = newsItem.published || newsItem.updated || new Date().toISOString();

      // --- CRITICAL TODO: Extract team IDs from newsItem ---
      // The structure of newsItem from SportsRadar needs to be inspected to find
      // how game/team information is provided. You need to map SportsRadar team IDs
      // to your internal Supabase team UUIDs.
      // For example, if newsItem.teams contains [{id: 'SR_TEAM_ID_HOME', role: 'home'}, ...],
      // you'd need a mapping or another query to get your Supabase team UUIDs.
      const homeTeamInternalId: string | null = null; // Placeholder
      const awayTeamInternalId: string | null = null; // Placeholder
      const gameIdFromNews: string | number | null = newsItem.game_id || null; // Placeholder

      // Example: If newsItem has references to teams involved
      // if (newsItem.references && Array.isArray(newsItem.references)) {
      //   const homeTeamRef = newsItem.references.find(ref => ref.type === 'team' && ref.role === 'home');
      //   const awayTeamRef = newsItem.references.find(ref => ref.type === 'team' && ref.role === 'away');
      //   // You would then need to map homeTeamRef.id (SportsRadar ID) to your Supabase team UUID
      //   // homeTeamInternalId = await mapSportsRadarIdToSupabaseId(homeTeamRef?.id);
      //   // awayTeamInternalId = await mapSportsRadarIdToSupabaseId(awayTeamRef?.id);
      // }
      console.log(`Attempting to fetch players for home: ${homeTeamInternalId}, away: ${awayTeamInternalId}`);
      const topPlayers = await fetchTopPlayersForTeams(homeTeamInternalId, awayTeamInternalId, 4);
      console.log(`Fetched ${topPlayers.length} top players.`);

      let playerPerformancesPromptSegment = "";
      if (topPlayers.length > 0) {
        const playerNames = topPlayers.map(p => p.full_name).join(', ');
        playerPerformancesPromptSegment = `
Pay special attention to the performances of these key players if they were involved: ${playerNames}.
Include a dedicated section titled "Key Player Spotlights" discussing their contributions, stats, and any astrological influences if relevant.
`;
      }

      const prompt = `
        As an expert sports journalist and astrologer, write a well-structured, engaging, and SEO-optimized news article in Markdown format about the following MLB event.
        The article should be suitable for a sports betting advisory site that incorporates astrological insights.

        **Event Title:** ${articleTitle}
        **Event Summary:** ${summary}
        ${newsItem.game_date ? `**Game Date:** ${newsItem.game_date}` : ''}

        **Article Structure and Formatting Instructions:**
        1.  **Headline:** Create a compelling, SEO-friendly headline based on the Event Title.
        2.  **Introduction (1-2 paragraphs):** Briefly summarize the event and its significance. Hook the reader.
        3.  **Game Recap/Event Details (2-4 paragraphs):** Describe what happened, key moments, scores (if a game), and standout performances.
        4.  **Astrological Insights (1-2 paragraphs):** Weave in relevant astrological influences on the teams or key players. Mention planetary alignments, zodiac signs, or elemental energies if applicable and how they might have impacted the game's flow or outcome. Be specific but accessible.
        ${playerPerformancesPromptSegment}
        5.  **Betting Angle/Looking Ahead (1 paragraph):** Briefly touch upon any implications for bettors or what this event means for the teams/players moving forward.
        6.  **Conclusion (1 paragraph):** Summarize the key takeaways.
        7.  **Formatting:**
            *   Use Markdown for all formatting.
            *   Employ headings (##), subheadings (###), bullet points (* or -), and bold/italic text for emphasis and readability.
            *   Ensure paragraphs are well-separated.
            *   If mentioning statistics, present them clearly.
            *   The tone should be professional, insightful, and slightly informal/engaging.

        Generate only the Markdown content for the article.
      `;

      const generatedMarkdown = await generateArticleWithClaude(anthropicApiKey!, prompt);
      const articleSlug = slugify(articleTitle); // Generate a slug

      if (generatedMarkdown) {
        generatedArticles.push({
          title: articleTitle,
          slug: articleSlug,
          markdownContent: generatedMarkdown,
          topPlayers: topPlayers,
          gameId: gameIdFromNews,
          newsSourceId: newsSourceId,
          publishedAt: publishedAt,
        });
        console.log(`Successfully generated article: ${articleTitle}`);
      } else {
        console.error(`Failed to generate article content for: ${articleTitle}`);
      }
    }

    // TODO: Step 5: Store the generated articles (from generatedArticles array) in Supabase `articles` table
    // This would involve iterating through `generatedArticles` and inserting each one.
    // Ensure your `articles` table can store the markdown content and potentially an array of top player IDs or their full data.

    if (generatedArticles.length > 0) {
      return res.status(200).json({
        message: `Successfully generated ${generatedArticles.length} article(s).`,
        articlesGenerated: generatedArticles.length,
        generatedArticles: generatedArticles, // Send structured data
      });
    } else {
      return res.status(200).json({
        message: 'No articles were generated based on the fetched news.',
        articlesGenerated: 0,
        generatedArticles: [],
      });
    }

  } catch (error: any) {
    console.error('Error in AI News Generation process:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}