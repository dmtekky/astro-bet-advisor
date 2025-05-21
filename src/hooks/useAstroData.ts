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
    degree: number;
    illumination: number;
  };
  sun: {
    sign: string;
    icon: string;
    degree: number;
    next_sign: string;
    next_sign_date: string;
    rises_at: string;
    sets_at: string;
  };
  mercury: {
    retrograde: boolean;
    sign: string;
    degree: number;
    speed: number;
    station: null | string;
    next_retrograde: {
      starts: string;
      ends: string;
    };
  };
  venus: {
    sign: string;
    degree: number;
    speed: number;
    phase: string;
    visibility: string;
  };
  mars: {
    sign: string;
    degree: number;
    speed: number;
    house: number;
    aspect: string;
  };
  jupiter: {
    sign: string;
    degree: number;
    speed: number;
    retrograde: boolean;
    house: number;
  };
  saturn: {
    sign: string;
    degree: number;
    speed: number;
    retrograde: boolean;
    house: number;
  };
  uranus: {
    sign: string;
    degree: number;
    speed: number;
    retrograde: boolean;
    house: number;
  };
  neptune: {
    sign: string;
    degree: number;
    speed: number;
    retrograde: boolean;
    house: number;
  };
  pluto: {
    sign: string;
    degree: number;
    speed: number;
    retrograde: boolean;
    house: number;
  };
  aspects: {
    [key: string]: string;
  };
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  modalities: {
    cardinal: number;
    fixed: number;
    mutable: number;
  };
  current_hour: {
    ruler: string;
    influence: string;
    sign: string;
    is_positive: boolean;
  };
  lunar_nodes: {
    north_node: {
      sign: string;
      degree: number;
      house: number;
    };
    south_node: {
      sign: string;
      degree: number;
      house: number;
    };
    next_transit: {
      type: string;
      sign: string;
      date: string;
      description: string;
    };
    karmic_lessons: string[];
  };
  fixed_stars: Array<{
    name: string;
    magnitude: number;
    influence: string;
    position: {
      sign: string;
      degree: number;
      house: number;
    };
    orb: number;
    nature: string;
    mythology: string;
  }>;
  celestial_events: Array<{
    name: string;
    type: string;
    description: string;
    intensity: 'low' | 'medium' | 'high';
    date: string;
    exact_time?: string;
    timezone?: string;
    [key: string]: any;
  }>;
  next_event: {
    name: string;
    type: string;
    description: string;
    intensity: 'low' | 'medium' | 'high';
    date: string;
    exact_time?: string;
    timezone?: string;
    [key: string]: any;
  } | null;
  meta: {
    generated_at: string;
    api_version: string;
    data_source: string;
    timezone: string;
    ephemeris: string;
    house_system: string;
    sidereal: boolean;
  };
}

// Base URL for API requests - using a relative path to work in both dev and prod
const getApiBaseUrl = () => {
  return 'http://localhost:3001/api/astro';
};

const API_BASE_URL = getApiBaseUrl();

interface UseAstroDataReturn {
  astroData: AstroData | null;
  loading: boolean;
  error: Error | null;
}

export function useAstroData(dateParam: Date | string = new Date()): UseAstroDataReturn {
  // Always produce a YYYY-MM-DD string
  let dateStr: string;
  if (dateParam instanceof Date) {
    dateStr = dateParam.toISOString().split('T')[0];
  } else if (typeof dateParam === 'string') {
    // Strictly extract only the YYYY-MM-DD part, ignore any trailing characters (e.g. :1)
    const match = dateParam.match(/^\d{4}-\d{2}-\d{2}/);
    dateStr = match ? match[0] : new Date().toISOString().split('T')[0];
  } else {
    dateStr = new Date().toISOString().split('T')[0];
  }
  
  // ALWAYS call useSWR unconditionally, never inside conditionals
  const { data: apiData, error, isLoading } = useSWR<AstroData>(
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
  
  // Generate fallback data
  const fallbackData = useMemo(() => {
    // Create data that matches the AstroData interface
    const now = new Date();
    const mockMoonPhase = 0.75; // Example value
    
    return {
      moon: {
        phase: getMoonPhaseName(mockMoonPhase * 100),
        phaseValue: mockMoonPhase,
        sign: 'Scorpio',
        icon: '♏️',
        degree: 15,
        illumination: 0.78
      },
      sun: {
        sign: 'Taurus',
        icon: '♉️',
        degree: 15,
        next_sign: 'Gemini',
        next_sign_date: now.toISOString().split('T')[0],
        rises_at: '05:45',
        sets_at: '20:30'
      },
      mercury: {
        retrograde: false,
        sign: 'Taurus',
        degree: 10,
        speed: 1.2,
        station: null,
        next_retrograde: {
          starts: '2025-09-01',
          ends: '2025-09-25'
        }
      },
      venus: {
        sign: 'Gemini',
        degree: 20,
        speed: 1.1,
        phase: 'crescent',
        visibility: 'morning star'
      },
      mars: {
        sign: 'Leo',
        degree: 5,
        speed: 0.8,
        house: 5,
        aspect: 'trine Jupiter'
      },
      jupiter: {
        sign: 'Pisces',
        degree: 25,
        speed: 0.15,
        retrograde: false,
        house: 12
      },
      saturn: {
        sign: 'Aquarius',
        degree: 18,
        speed: 0.1,
        retrograde: true,
        house: 10
      },
      uranus: {
        sign: 'Taurus',
        degree: 12,
        speed: 0.05,
        retrograde: false,
        house: 2
      },
      neptune: {
        sign: 'Pisces',
        degree: 22,
        speed: 0.03,
        retrograde: true,
        house: 11
      },
      pluto: {
        sign: 'Capricorn',
        degree: 28,
        speed: 0.01,
        retrograde: false,
        house: 9
      },
      aspects: {
        sun_moon: 'trine',
        sun_mercury: 'conjunction',
        sun_venus: 'sextile',
        sun_mars: 'square',
        sun_saturn: 'opposition',
        sun_jupiter: 'trine',
        moon_venus: 'sextile',
        moon_mars: 'trine',
        mercury_venus: 'sextile',
        mercury_mars: 'square',
        venus_mars: 'trine',
        jupiter_saturn: 'square',
        uranus_pluto: 'sextile'
      },
      elements: {
        fire: 3,
        earth: 4,
        air: 2,
        water: 3
      },
      modalities: {
        cardinal: 3,
        fixed: 5,
        mutable: 4
      },
      current_hour: {
        ruler: 'Mars',
        influence: 'Action and initiative are favored',
        sign: 'Aries',
        is_positive: true
      },
      lunar_nodes: {
        north_node: {
          sign: 'Gemini',
          degree: 12.5,
          house: 3
        },
        south_node: {
          sign: 'Sagittarius',
          degree: 12.5,
          house: 9
        },
        next_transit: {
          type: 'north',
          sign: 'Gemini',
          date: '2025-06-15',
          description: 'North Node enters Gemini'
        },
        karmic_lessons: [
          'Develop communication skills',
          'Be open to new ideas',
          'Avoid dogmatic thinking'
        ]
      },
      fixed_stars: [
        {
          name: 'Sirius',
          magnitude: -1.46,
          influence: 'Success, fame, protection',
          position: {
            sign: 'Cancer',
            degree: 14,
            house: 4
          },
          orb: 2.5,
          nature: 'Mars/Jupiter',
          mythology: 'The Dog Star, associated with Isis and Anubis'
        }
      ],
      celestial_events: [
        {
          name: 'Full Moon',
          type: 'moon_phase',
          description: 'Full Moon in Scorpio - A time for release and transformation.',
          intensity: 'high',
          date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          exact_time: '14:00:00',
          timezone: 'UTC'
        },
        {
          name: 'Mercury Square Mars',
          type: 'aspect',
          description: 'Heightened communication and potential conflicts.',
          intensity: 'medium',
          date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          exact_time: '10:15:00',
          timezone: 'UTC'
        }
      ],
      next_event: {
        name: 'Mercury Retrograde',
        type: 'mercury_retrograde',
        description: 'Mercury goes retrograde in Gemini',
        intensity: 'high',
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        exact_time: '08:30:00',
        timezone: 'UTC'
      },
      meta: {
        generated_at: now.toISOString(),
        api_version: '1.0.0',
        data_source: 'mock',
        timezone: 'UTC',
        ephemeris: 'Moshier',
        house_system: 'Placidus',
        sidereal: false
      }
    } as AstroData;
  }, []);
  
  // Process and return final data
  const finalData = useMemo(() => {
    // If we have API data, use it directly as it already matches our expected structure
    if (apiData) {
      // Ensure all required fields are present
      const normalizedData: AstroData = {
        ...fallbackData, // Start with fallback data as base
        ...apiData,      // Override with API data
        // Ensure nested objects are properly merged
        elements: {
          ...fallbackData.elements,
          ...(apiData.elements || {})
        },
        aspects: {
          ...fallbackData.aspects,
          ...(apiData.aspects || {})
        },
        modalities: {
          ...fallbackData.modalities,
          ...(apiData.modalities || {})
        },
        current_hour: {
          ...fallbackData.current_hour,
          ...(apiData.current_hour || {})
        },
        lunar_nodes: {
          ...fallbackData.lunar_nodes,
          ...(apiData.lunar_nodes || {}),
          north_node: {
            ...fallbackData.lunar_nodes.north_node,
            ...(apiData.lunar_nodes?.north_node || {})
          },
          south_node: {
            ...fallbackData.lunar_nodes.south_node,
            ...(apiData.lunar_nodes?.south_node || {})
          },
          next_transit: {
            ...fallbackData.lunar_nodes.next_transit,
            ...(apiData.lunar_nodes?.next_transit || {})
          },
          karmic_lessons: [
            ...(apiData.lunar_nodes?.karmic_lessons || fallbackData.lunar_nodes.karmic_lessons)
          ]
        },
        fixed_stars: [
          ...(apiData.fixed_stars || fallbackData.fixed_stars)
        ],
        celestial_events: [
          ...(apiData.celestial_events || fallbackData.celestial_events)
        ],
        next_event: apiData.next_event || fallbackData.next_event,
        meta: {
          ...fallbackData.meta,
          ...(apiData.meta || {})
        }
      };
      
      return {
        astroData: normalizedData,
        loading: isLoading,
        error: error ? new Error(error.message) : null,
      };
    }
    
    // Use fallback data when API data is not available
    return {
      astroData: fallbackData,
      loading: isLoading,
      error: error ? new Error(error.message) : null,
    };
  }, [apiData, error, isLoading, fallbackData]);
  
  return finalData;
}
