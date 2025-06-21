import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    
    if (!teamId) {
      return new Response('Missing teamId', { status: 400 });
    }
    
    // Fetch team data from Supabase
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data: team, error } = await supabase
      .from('teams')
      .select('name, logo_url, astro_score')
      .eq('id', teamId)
      .single();
    
    if (error || !team) {
      return new Response('Team not found', { status: 404 });
    }
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #4338ca, #000000)',
            color: 'white',
            fontSize: 32,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={team.logo_url}
              alt={team.name}
              width={200}
              height={200}
              style={{ marginBottom: 20 }}
            />
            <div style={{ fontSize: 48, fontWeight: 'bold' }}>{team.name}</div>
            <div style={{ fontSize: 36, marginTop: 20 }}>Astro Score: {team.astro_score}</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
