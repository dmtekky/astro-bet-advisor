
// get-latest-formula-weights/index.ts
// Edge function to get the latest formula weights for a sport

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Define cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Handle CORS preflight requests
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    const url = new URL(req.url);
    const sport = url.searchParams.get('sport');
    
    if (!sport) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Sport parameter is required" 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Query the database for the latest weights for the specified sport
    const { data, error } = await supabase
      .from('formula_weights')
      .select('*')
      .eq('sport', sport)
      .order('last_updated', { ascending: false })
      .limit(1);
    
    if (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Return the weights or a default object
    const weights = data && data.length > 0 ? data[0] : null;
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: weights
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error(`Error in get-latest-formula-weights function: ${err}`);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
