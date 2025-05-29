import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Simple test function
const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { team_abbr } = await req.json().catch(() => ({}));
    
    if (!team_abbr) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: team_abbr' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Minimal function is working',
        team_abbr,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Start the server
console.log('Starting minimal function...');
serve(handler);
