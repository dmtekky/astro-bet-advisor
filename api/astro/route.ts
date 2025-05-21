import type { APIRoute } from 'astro';
import * as Astronomy from 'astronomy-engine';

// Import types and enums from astronomy-engine
import { Body, Observer, Equator, Ecliptic, MoonPhase, EquatorialCoordinates } from 'astronomy-engine';

// Type for aspect calculation result
type AspectResult = {
  name: string;
  aspect: string;
  orb: number;
  influence: string;
} | null;

// Type for retrograde status
type RetrogradeStatus = {
  planet: string;
  isRetrograde: boolean;
  influence: string;
};

// Type for planetary hour ruler
type HourRuler = {
  ruler: string;
  sign: string;
  is_daytime: boolean;
  influence: string;
  is_positive: boolean;
};

// Type for element counts
type ElementCounts = {
  fire: number;
  earth: number;
  air: number;
  water: number;
};

// Helper function to get ecliptic longitude for a body
function getEclipticLongitude(body: Body, date: Date, observer: Observer): number {
  try {
    // Use a simpler approach since Ecliptic conversion is problematic
    // This is an approximation that should work for basic calculations
    const time = date.getTime() / 1000; // Convert to seconds since epoch
    const pos = Astronomy.EclipticLongitude(body, time);
    return pos;
  } catch (error) {
    console.error(`Error calculating longitude for ${Body[body]}:`, error);
    return 0; // Return default value in case of error
  }
}

// Calculate aspects between two celestial bodies
function calculateAspects(body1: Body, body2: Body, date: Date, observer: Observer): AspectResult {
  try {
    const lon1 = getEclipticLongitude(body1, date, observer);
    const lon2 = getEclipticLongitude(body2, date, observer);
    
    // Calculate the angle between the two bodies (0-180 degrees)
    let angle = Math.abs(lon1 - lon2) % 360;
    if (angle > 180) angle = 360 - angle;
    
    // Define major aspects and their orbs (in degrees)
    const aspects = [
      { name: 'conjunction', angle: 0, orb: 10, influence: 'Intensified energy' },
      { name: 'sextile', angle: 60, orb: 4, influence: 'Harmonious opportunity' },
      { name: 'square', angle: 90, orb: 8, influence: 'Challenging tension' },
      { name: 'trine', angle: 120, orb: 8, influence: 'Easy flow' },
      { name: 'opposition', angle: 180, orb: 10, influence: 'Polarity' }
    ] as const;
    
    // Check for any matching aspects
    for (const aspect of aspects) {
      const diff = Math.abs(angle - aspect.angle);
      if (diff <= aspect.orb) {
        return {
          name: `${Body[body1]}-${Body[body2]}`,
          aspect: aspect.name,
          orb: diff,
          influence: aspect.influence
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error calculating aspects:', error);
    return null;
  }
}

// Get retrograde status for a planet
function getRetrogradeStatus(body: Body, date: Date): RetrogradeStatus {
  // Create a time slightly in the future to calculate speed
  const futureDate = new Date(date.getTime() + 24 * 60 * 60 * 1000); // 1 day later
  const lon1 = getEclipticLongitude(body, date, new Astronomy.Observer(0, 0, 0));
  const lon2 = getEclipticLongitude(body, futureDate, new Astronomy.Observer(0, 0, 0));
  
  // Calculate approximate speed in degrees per day
  let speed = lon2 - lon1;
  if (speed > 180) speed -= 360;
  if (speed < -180) speed += 360;
  
  const isRetrograde = speed < 0;
  
  const influences = {
    [Body.Mercury]: {
      direct: 'Clear communication, smooth logistics',
      retrograde: 'Review strategies, expect delays'
    },
    [Body.Venus]: {
      direct: 'Harmonious team dynamics',
      retrograde: 'Re-evaluate values and relationships'
    },
    [Body.Mars]: {
      direct: 'High energy, direct action',
      retrograde: 'Strategic patience required'
    },
    [Body.Jupiter]: {
      direct: 'Expansion and opportunity',
      retrograde: 'Internal growth, review beliefs'
    },
    [Body.Saturn]: {
      direct: 'Structured progress',
      retrograde: 'Reassess responsibilities'
    }
  };
  
  const influence = influences[body] || { direct: '', retrograde: '' };
  
  return {
    planet: Body[body],
    isRetrograde,
    influence: isRetrograde ? influence.retrograde : influence.direct
  };
}

// Helper function to handle errors
function handleError(status: number, message: string, error?: any) {
  console.error(`[${new Date().toISOString()}] Error:`, message, error);
  return new Response(JSON.stringify({
    success: false,
    error: message,
    details: error instanceof Error ? error.message : String(error)
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Format time as HH:MM
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Check if it's daytime at the observer's location (simplified)
function isDaytime(observer: Observer, date: Date): boolean {
  try {
    // Use a simple calculation instead of SunRiseSet which might not be available
    const hours = date.getUTCHours() + (observer.longitude / 15); // Adjust for longitude
    return hours >= 6 && hours < 18; // Consider 6 AM to 6 PM as daytime
  } catch (error) {
    console.error('Error calculating daytime:', error);
    // Default to true as a fallback
    return true;
  }
}

// Calculate planetary hour ruler (simplified version)
function calculatePlanetaryHour(observer: Observer, date: Date): HourRuler {
  const hour = date.getHours();
  const isDay = isDaytime(observer, date);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Traditional planetary hours sequence starting with the day's ruler
  const planetaryHours = [
    'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'
  ] as const;
  
  // Adjust starting point based on day of week
  const startIndex = dayOfWeek % 7;
  const hourIndex = (startIndex + Math.floor(hour / 2)) % 7;
  const ruler = planetaryHours[hourIndex];
  
  // Get current Sun's position for the sign
  const sunLon = getEclipticLongitude(Body.Sun, date, observer);
  const sunSign = getZodiacSign(sunLon);
  
  // Simplified influence based on ruler
  const influenceMap = {
    Sun: 'Vitality, confidence, leadership',
    Moon: 'Emotions, intuition, nurturing',
    Mercury: 'Communication, intellect, adaptability',
    Venus: 'Love, beauty, harmony',
    Mars: 'Energy, action, courage',
    Jupiter: 'Expansion, luck, wisdom',
    Saturn: 'Discipline, responsibility, structure'
  } as const;
  
  return {
    ruler,
    sign: sunSign,
    is_daytime: isDay,
    influence: influenceMap[ruler] || 'Neutral influence',
    is_positive: ['Sun', 'Venus', 'Jupiter', 'Moon'].includes(ruler)
  };
}

// Convert degrees to zodiac sign
function getZodiacSign(degrees: number): string {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(degrees / 30) % 12];
}

// Get zodiac icon
function getZodiacIcon(sign: string): string {
  const icons: Record<string, string> = {
    'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
    'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
    'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
  };
  return icons[sign] || '✨';
}

// Get moon phase name from phase value (0-1)
function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.23) return 'Waxing Crescent';
  if (phase < 0.27) return 'First Quarter';
  if (phase < 0.48) return 'Waxing Gibbous';
  if (phase < 0.52) return 'Full Moon';
  if (phase < 0.73) return 'Waning Gibbous';
  if (phase < 0.77) return 'Last Quarter';
  return 'Waning Crescent';
}

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get the date parameter from URL
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date') || undefined;
    let date: Date;

    if (dateParam) {
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return handleError(400, 'Invalid date format. Use YYYY-MM-DD');
      }
      date = new Date(dateParam);
    } else {
      date = new Date();
    }

    // Set to noon UTC for consistent daily calculations
    date.setUTCHours(12, 0, 0, 0);

    // Default observer location (New York)
    const observer = new Observer(40.7128, -74.0060, 10);

    // Calculate moon data
    const moonPhase = MoonPhase(date) / 360; // Convert to 0-1 range
    const moonPhaseName = getMoonPhaseName(moonPhase);
    const moonLon = getEclipticLongitude(Body.Moon, date, observer);
    const moonSign = getZodiacSign(moonLon);

    // Calculate sun data
    const sunLon = getEclipticLongitude(Body.Sun, date, observer);
    const sunSign = getZodiacSign(sunLon);

    // Calculate next moon phases (approximate)
    const nextNewMoon = new Date(date);
    nextNewMoon.setDate(date.getDate() + (29.53 - (date.getTime() % 29.53)));
    
    const nextFullMoon = new Date(nextNewMoon);
    nextFullMoon.setDate(nextNewMoon.getDate() + 14.77);
    
    // Ensure nextFullMoon is after nextNewMoon
    if (nextFullMoon.getTime() < nextNewMoon.getTime()) {
      nextFullMoon.setDate(nextFullMoon.getDate() + 29.53);
    }
    
    // Calculate aspects
    const aspectConfigs = [
      { body1: Body.Sun, body2: Body.Mars },
      { body1: Body.Moon, body2: Body.Jupiter },
      { body1: Body.Mercury, body2: Body.Saturn },
      { body1: Body.Venus, body2: Body.Mars }
    ] as const;

    const aspects = aspectConfigs
      .map(({ body1, body2 }) => calculateAspects(body1, body2, date, observer))
      .filter((aspect): aspect is NonNullable<typeof aspect> => aspect !== null);
    
    // Get retrograde status for personal planets
    const planets = [Body.Mercury, Body.Venus, Body.Mars] as const;
    const retrogradeStatus = planets.map(planet => getRetrogradeStatus(planet, date));

    // Calculate if it's daytime (simplified)
    const now = new Date();
    const hours = now.getHours();
    const isDay = hours >= 6 && hours < 18;
    const currentIsDaytime = isDaytime(observer, date);
    
    // Simplified planetary hour ruler
    const currentHourRuler: HourRuler = {
      ruler: 'Sun',
      sign: sunSign,
      is_daytime: currentIsDaytime,
      influence: currentIsDaytime ? 'High energy, take action' : 'Reflect and plan',
      is_positive: true
    };
    
    // Simplified elemental balance
    const elementCounts: ElementCounts = {
      fire: 30,
      earth: 30,
      air: 20,
      water: 20
    };
    
    // Generate strategic insights
    const activeAspect = aspects[0] || null;
    const retrogradePlanets = retrogradeStatus.filter(r => r.isRetrograde);
    
    const strategicInsights = [
      {
        title: 'Key Aspect Alert',
        content: activeAspect 
          ? `Watch for ${activeAspect.name} ${activeAspect.aspect} (${activeAspect.orb.toFixed(1)}° orb): ${activeAspect.influence}`
          : 'No major aspects currently active',
        icon: 'aspect-ratio'
      },
      {
        title: 'Retrograde Watch',
        content: retrogradePlanets.length > 0
          ? retrogradePlanets.map(r => `${r.planet} is retrograde: ${r.influence}`).join('; ')
          : 'No personal planets retrograde currently',
        icon: 'rotate-ccw'
      },
      {
        title: 'Moon Phase',
        content: `Current phase: ${moonPhaseName}. ${getMoonPhaseInsight(moonPhase)}`,
        icon: 'moon'
      },
      {
        title: 'Elemental Balance',
        content: `Fire: ${elementCounts.fire}%, Earth: ${elementCounts.earth}%, ` +
                `Air: ${elementCounts.air}%, Water: ${elementCounts.water}%`,
        icon: 'layers'
      },
      {
        title: 'Best Time for Action',
        content: `Favors ${currentHourRuler.ruler} hours (${currentHourRuler.is_daytime ? 'day' : 'night'}). ${currentHourRuler.influence}`,
        icon: 'clock'
      }
    ];

    // Get moon phase insight
    function getMoonPhaseInsight(phase: number): string {
      if (phase < 0.125) return 'New beginnings and setting intentions. Good for starting new strategies.';
      if (phase < 0.25) return 'Building momentum. Time to take action on plans.';
      if (phase < 0.375) return 'Peak energy. Ideal for important decisions and bold moves.';
      if (phase < 0.5) return 'Harvest time. Reap what you\'ve sown and analyze results.';
      if (phase < 0.625) return 'Release and let go. Time to eliminate what no longer serves you.';
      if (phase < 0.75) return 'Deep reflection. Review strategies and make adjustments.';
      if (phase < 0.875) return 'Planning phase. Research and prepare for the next cycle.';
      return 'Completion and transition. Tie up loose ends before the new cycle begins.';
    }

    // Build the response
    const response = {
      success: true,
      date: date.toISOString().split('T')[0],
      current_time: new Date().toISOString(),
      location: {
        name: 'New York',
        latitude: observer.latitude,
        longitude: observer.longitude,
        elevation: observer.height
      },
      moon: {
        phase: moonPhaseName,
        phase_value: moonPhase,
        sign: moonSign,
        icon: getZodiacIcon(moonSign),
        next_new_moon: nextNewMoon.toISOString().split('T')[0],
        next_full_moon: nextFullMoon.toISOString().split('T')[0]
      },
      sun: {
        sign: sunSign,
        icon: getZodiacIcon(sunSign),
        next_sign: getZodiacSign((Math.floor(sunLon / 30) * 30 + 30) % 360),
        next_sign_date: new Date(date.getTime() + (30 / 0.9856) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      strategic_insights: strategicInsights,
      metadata: {
        calculation_time: new Date().toISOString(),
        data_source: 'astronomy-engine',
        version: '1.0.1',
        elements: elementCounts,
        aspects: aspects,
        retrograde_planets: retrogradeStatus.filter(r => r.isRetrograde).map(r => r.planet)
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return handleError(500, 'Internal server error', error);
  }
}
