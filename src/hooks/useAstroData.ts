import { useMemo } from 'react';
import { getZodiacSign, getZodiacIcon } from '@/lib/astroCalc';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error(`API request failed with status ${res.status}`);
  }
  return res.json();
});

// Helper functions
const getSignInfo = (longitude: number) => {
  const sign = getZodiacSignFromLongitude(longitude);
  return {
    sign,
    degree: longitude % 30,
    icon: getZodiacIcon(sign)
  };
};

const calculateAspect = (pos1: number, pos2: number) => {
  const diff = Math.abs(pos1 - pos2) % 360;
  const aspect = diff <= 180 ? diff : 360 - diff;
  
  if (aspect <= 8) return 'conjunction';
  if (Math.abs(aspect - 60) <= 8) return 'sextile';
  if (Math.abs(aspect - 90) <= 8) return 'square';
  if (Math.abs(aspect - 120) <= 8) return 'trine';
  if (Math.abs(aspect - 180) <= 8) return 'opposition';
  return null;
};

const getZodiacSignFromLongitude = (longitude: number) => {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  const index = Math.floor(longitude / 30) % 12;
  return signs[index];
};

const getMoonPhaseName = (percentage: number): string => {
  if (percentage < 2 || percentage > 98) return 'New Moon';
  if (percentage < 23) return 'Waxing Crescent';
  if (percentage < 27) return 'First Quarter';
  if (percentage < 48) return 'Waxing Gibbous';
  if (percentage < 52) return 'Full Moon';
  if (percentage < 73) return 'Waning Gibbous';
  if (percentage < 77) return 'Last Quarter';
  return 'Waning Crescent';
};

const calculateElementalBalance = () => ({
  fire: 25,
  earth: 25,
  air: 25,
  water: 25
});

const getPlanetaryHour = () => ({
  ruler: 'Sun',
  influence: 'Vitality, Confidence',
  sign: 'Leo'
});

const getLunarNodeForecast = () => ({
  northNode: {
    sign: 'Taurus',
    degree: 15
  },
  southNode: {
    sign: 'Scorpio',
    degree: 15
  },
  nextTransitDate: null,
  nextTransitType: null,
  nextTransitSign: null,
  upcomingTransits: []
});

const getUpcomingCelestialEvents = (): CelestialEvent[] => [
  {
    name: 'Full Moon',
    description: 'Full Moon in Scorpio - A time for release and transformation.',
    intensity: 'high' as const,
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Mercury Square Mars',
    description: 'Heightened communication and potential conflicts.',
    intensity: 'medium' as const,
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

interface CelestialEvent {
  name: string;
  description: string;
  intensity: 'low' | 'medium' | 'high';
  date?: string;
}

interface AstroData {
  moon: {
    phase: string;
    phaseValue: number;
    sign: string;
    icon: string;
  };
  sun: {
    sign: string;
    icon: string;
    degree: number;
  };
  mercury: {
    retrograde: boolean;
    sign: string;
    degree: number;
  };
  venus: {
    sign: string;
    degree: number;
  };
  mars: {
    sign: string;
    degree: number;
  };
  jupiter: {
    sign: string;
    degree: number;
  };
  saturn: {
    sign: string;
    degree: number;
  };
  aspects: {
    sunMars: string | null;
    sunJupiter: string | null;
    sunSaturn: string | null;
    moonVenus: string | null;
    marsJupiter: string | null;
    venusMars: string | null;
  };
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  currentHour: {
    ruler: string;
    influence: string;
    sign: string;
  };
  lunarNodes: {
    northNode: {
      sign: string;
      degree: number;
    };
    southNode: {
      sign: string;
      degree: number;
    };
    nextTransitDate: string | null;
    nextTransitType: 'north' | 'south' | null;
    nextTransitSign: string | null;
    upcomingTransits: Array<{
      date: string;
      type: 'north' | 'south';
      sign: string;
      degree: number;
    }>;
  };
  fixedStars: Array<{
    name: string;
    magnitude: number;
    influence: string;
    position: {
      sign: string;
      degree: number;
    };
  }>;
  celestialEvents: CelestialEvent[];
  next_event: CelestialEvent | null;
}

// Base URL for API requests
const API_BASE_URL = import.meta.env.PROD 
  ? '' // In production, use relative URLs (handled by Vercel rewrites)
  : '/api'; // In development, use the Vite proxy

export function useAstroData(date: Date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  const { data: apiData, error, isLoading } = useSWR(
    `${API_BASE_URL}/astro/${dateStr}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: true,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;
        // Retry after 1 second
        setTimeout(() => revalidate({ retryCount }), 1000);
      },
    }
  );

  console.log('API Response:', { apiData, error, isLoading });

  const transformedData = useMemo<AstroData | null>(() => {
    if (!apiData) return null;
    
    const { moon_phase, positions } = apiData;
    
    const lunarNodes = getLunarNodeForecast();
    const celestialEvents = getUpcomingCelestialEvents();

    return {
      moon: {
        phase: getMoonPhaseName(moon_phase * 100),
        phaseValue: moon_phase,
        ...getSignInfo(positions.moon.longitude)
      },
      sun: getSignInfo(positions.sun.longitude),
      mercury: {
        retrograde: positions.mercury.speed < 0,
        ...getSignInfo(positions.mercury.longitude)
      },
      venus: getSignInfo(positions.venus.longitude),
      mars: getSignInfo(positions.mars.longitude),
      jupiter: getSignInfo(positions.jupiter.longitude),
      saturn: getSignInfo(positions.saturn.longitude),
      aspects: {
        sunMars: calculateAspect(positions.sun.longitude, positions.mars.longitude),
        sunJupiter: calculateAspect(positions.sun.longitude, positions.jupiter.longitude),
        sunSaturn: calculateAspect(positions.sun.longitude, positions.saturn.longitude),
        moonVenus: calculateAspect(positions.moon.longitude, positions.venus.longitude),
        marsJupiter: calculateAspect(positions.mars.longitude, positions.jupiter.longitude),
        venusMars: calculateAspect(positions.venus.longitude, positions.mars.longitude)
      },
      elements: calculateElementalBalance(),
      currentHour: getPlanetaryHour(),
      lunarNodes,
      fixedStars: [],
      celestialEvents,
      next_event: celestialEvents[0] || null
    } as AstroData;
  }, [apiData]);

  return {
    astroData: transformedData,
    loading: isLoading,
    error: error as Error | null
  };
}
