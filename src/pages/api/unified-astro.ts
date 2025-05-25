import type { APIRoute } from 'astro';

// Define a minimal, valid ApiResponse structure based on useAstroData.ts expectations
interface RawApiAspect {
  planet1: string;
  planet2: string;
  aspect: string;
  angle: number;
  orb: number;
  strength: number;
  applying: boolean;
}

interface ApiResponse {
  date: string;
  query_time?: string;
  sidereal?: boolean;
  ayanamsa?: number;
  planets: Record<string, {
    name?: string;
    longitude: number;
    sign: string;
    degrees?: number;
    degree?: number;
    minute?: number;
    retrograde?: boolean;
    weight?: number;
    error?: boolean;
  }>;
  moonPhase: {
    illumination: number | null;
    angle?: number;
    phase: string;
  };
  elements: {
    fire: { score: number; planets: string[] };
    earth: { score: number; planets: string[] };
    air: { score: number; planets: string[] };
    water: { score: number; planets: string[] };
  };
  modalities: {
    cardinal: { score: number; planets: string[] };
    fixed: { score: number; planets: string[] };
    mutable: { score: number; planets: string[] };
  };
  aspects: RawApiAspect[];
  astro_weather: string;
  interpretations: {
    sun?: string;
    moon?: string;
    mercury?: string;
    venus?: string;
    mars?: string;
    jupiter?: string;
    saturn?: string;
    uranus?: string;
    neptune?: string;
    pluto?: string;
    chiron?: string;
    north_node?: string;
    [key: string]: any; // Allow other interpretations
  };
  [key: string]: any;
}

const defaultApiResponse: ApiResponse = {
  date: new Date().toISOString(),
  query_time: new Date().toISOString(),
  sidereal: true,
  ayanamsa: 24.123,
  planets: {
    sun: { name: 'Sun', longitude: 0, sign: 'Aries', degrees: 0, degree: 0, minute: 0, retrograde: false, weight: 1, error: false },
    moon: { name: 'Moon', longitude: 30, sign: 'Taurus', degrees: 0, degree: 0, minute: 0, retrograde: false, weight: 1, error: false },
  },
  moonPhase: {
    illumination: 0.5,
    angle: 180,
    phase: 'Full Moon',
  },
  elements: {
    fire: { score: 0, planets: [] },
    earth: { score: 0, planets: [] },
    air: { score: 0, planets: [] },
    water: { score: 0, planets: [] },
  },
  modalities: {
    cardinal: { score: 0, planets: [] },
    fixed: { score: 0, planets: [] },
    mutable: { score: 0, planets: [] },
  },
  aspects: [],
  astro_weather: 'Clear skies ahead.',
  interpretations: {
    general: 'A placeholder interpretation.',
    sun: 'Placeholder Sun interpretation.',
    moon: 'Placeholder Moon interpretation.',
    // Add other planets if Dashboard.tsx expects them immediately
  },
};

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  console.log(`[api/unified-astro] Received GET request for date: ${date}`);
  
  // Return a placeholder JSON response
  return new Response(JSON.stringify({ ...defaultApiResponse, date }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
