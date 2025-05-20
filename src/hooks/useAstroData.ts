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

// Base URL for API requests - using environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL ? 
  `${import.meta.env.VITE_API_URL}/astro-date` : 
  '/api/astro-date';

export function useAstroData(dateParam: Date | string = new Date()) {
  // Always produce a YYYY-MM-DD string
  let dateStr: string;
  if (dateParam instanceof Date) {
    dateStr = dateParam.toISOString().split('T')[0];
  } else if (typeof dateParam === 'string') {
    // Extract only the date part (YYYY-MM-DD)
    const match = dateParam.match(/\d{4}-\d{2}-\d{2}/);
    dateStr = match ? match[0] : new Date().toISOString().split('T')[0];
  } else {
    dateStr = new Date().toISOString().split('T')[0];
  }
  const { data: apiData, error, isLoading } = useSWR(
    `${API_BASE_URL}?date=${dateStr}`,
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
    
    try {
      const { moon_phase, positions, celestial_events = [] } = apiData;
      
      // Safely get position or return default values
      const getPosition = (planet: string) => {
        const pos = positions?.[planet.toLowerCase()];
        if (!pos) return { longitude: 0, speed: 0 };
        return {
          longitude: typeof pos.longitude === 'number' ? pos.longitude : 0,
          speed: typeof pos.speed === 'number' ? pos.speed : 0
        };
      };
      
      const moonPos = getPosition('moon');
      const sunPos = getPosition('sun');
      const mercuryPos = getPosition('mercury');
      const venusPos = getPosition('venus');
      const marsPos = getPosition('mars');
      const jupiterPos = getPosition('jupiter');
      const saturnPos = getPosition('saturn');
      
      const lunarNodes = getLunarNodeForecast();
      
      // Map the API's celestial_events to the expected format
      const celestialEvents: CelestialEvent[] = Array.isArray(celestial_events) 
        ? celestial_events.map(event => ({
            name: event.name || 'Unknown Event',
            description: event.description || '',
            intensity: (['low', 'medium', 'high'].includes(event.intensity?.toLowerCase()) 
              ? event.intensity.toLowerCase() 
              : 'medium') as 'low' | 'medium' | 'high',
            date: event.date || new Date().toISOString()
          }))
        : [];

      return {
        moon: {
          phase: getMoonPhaseName((moon_phase || 0) * 100),
          phaseValue: moon_phase || 0,
          ...getSignInfo(moonPos.longitude)
        },
        sun: getSignInfo(sunPos.longitude),
        mercury: {
          retrograde: (mercuryPos.speed || 0) < 0,
          ...getSignInfo(mercuryPos.longitude)
        },
        venus: getSignInfo(venusPos.longitude),
        mars: getSignInfo(marsPos.longitude),
        jupiter: getSignInfo(jupiterPos.longitude),
        saturn: getSignInfo(saturnPos.longitude),
        aspects: {
          sunMars: calculateAspect(sunPos.longitude, marsPos.longitude),
          sunJupiter: calculateAspect(sunPos.longitude, jupiterPos.longitude),
          sunSaturn: calculateAspect(sunPos.longitude, saturnPos.longitude),
          moonVenus: calculateAspect(moonPos.longitude, venusPos.longitude),
          marsJupiter: calculateAspect(marsPos.longitude, jupiterPos.longitude),
          venusMars: calculateAspect(venusPos.longitude, marsPos.longitude)
        },
        elements: calculateElementalBalance(),
        currentHour: getPlanetaryHour(),
        lunarNodes,
        fixedStars: [],
        celestialEvents,
        next_event: celestialEvents[0] || null
      } as AstroData;
    } catch (error) {
      console.error('Error transforming astro data:', error);
      return null;
    }
  }, [apiData]);

  return {
    astroData: transformedData,
    loading: isLoading,
    error: error as Error | null
  };
}
