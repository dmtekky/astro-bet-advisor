import type { APIRoute } from 'astro';
import { getMoonPhase, getMoonPhaseInfo, getPlanetPositions } from '../../../lib/astroCalculations.js';

export const prerender = false; // Ensure this is serverless, not static

export const GET: APIRoute = async ({ params, request }) => {
  let { date } = params;
  // Strictly extract only YYYY-MM-DD, ignore trailing chars (e.g., :1)
  const match = typeof date === 'string' ? date.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})/) : null;
  const dateStr = match ? match[1] : new Date().toISOString().split('T')[0];

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) {
    return new Response(
      JSON.stringify({ error: 'Invalid date format. Please use YYYY-MM-DD' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get moon phase and phase info
    const moonPhase = getMoonPhase(targetDate);
    const { name: moonPhaseName, illumination } = getMoonPhaseInfo(moonPhase);
    const positions = getPlanetPositions(targetDate);
    
    // Mock celestial events (replace with real logic as needed)
    const celestialEvents = [
      {
        name: moonPhaseName,
        description: `${moonPhaseName} - ${getMoonPhaseInsight(moonPhase)}`,
        intensity: moonPhaseName === 'Full Moon' || moonPhaseName === 'New Moon' ? 'high' : 'medium',
        date: targetDate.toISOString()
      }
    ];

    // Strategic insights based on moon phase
    function getMoonPhaseInsight(phase: number): string {
      if (phase < 0.03 || phase > 0.97) return 'New beginnings, set intentions.';
      if (phase < 0.22) return 'Growth and planning are favored.';
      if (phase < 0.28) return 'First Quarter - Take action on goals.';
      if (phase < 0.47) return 'Build momentum toward your objectives.';
      if (phase < 0.53) return 'Full Moon - Culmination of efforts, time to release.';
      if (phase < 0.72) return 'Waning phase - Let go of what no longer serves you.';
      if (phase < 0.78) return 'Last Quarter - Reflect and prepare for renewal.';
      return 'Balsamic phase - Rest and restore before the next cycle.';
    }

    const moonPhaseInsight = getMoonPhaseInsight(moonPhase);
    const strategicInsights = [
      {
        type: 'moon_phase',
        content: `${moonPhaseName} (${illumination}% illuminated). ${moonPhaseInsight}`
      }
    ];

    return new Response(
      JSON.stringify({
        moon_phase: {
          value: moonPhase,
          name: moonPhaseName,
          illumination: illumination / 100 // Convert to 0-1 range
        },
        positions,
        celestial_events: celestialEvents,
        strategic_insights: strategicInsights
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800'
        }
      }
    );
  } catch (error) {
    console.error('Error generating astro data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate astrological data',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};
