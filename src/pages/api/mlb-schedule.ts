import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  console.log('[[[CASCADE DEBUG]]] MLB Schedule API route hit!');
  
  try {
    // Use V2 API with the correct endpoint format
    const apiKey = '502451'; // Patreon API key for V2 access
    const date = url.searchParams.get('date');
    const year = date ? new Date(date).getFullYear() : 2025; // Use current year or extract from date
    
    // Construct the direct API URL using V2 format from docs
    // For V2, don't include API key in URL, it goes in the header
    const apiUrl = `https://www.thesportsdb.com/api/v2/json/schedule/league/4424-mlb/${year}`;
    console.log(`[[[CASCADE DEBUG]]] Fetching MLB schedule for ${year} using V2 API`)
    
    console.log(`[[[CASCADE DEBUG]]] API URL: ${apiUrl}`);
    
    // Fetch data directly with API key in the header
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': apiKey // TheSportsDB expects 'x-api-key' header
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[[[CASCADE DEBUG]]] API Error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ error: `API Error: ${response.status}` }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const data = await response.json();
    console.log('[[[CASCADE DEBUG]]] API Response:', JSON.stringify(data).substring(0, 200) + '...');
    
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[[[CASCADE DEBUG]]] Error in MLB schedule API route:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch MLB schedule', 
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

