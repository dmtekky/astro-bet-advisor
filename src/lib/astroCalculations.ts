
import { Planet, House, Time, Observer, Const } from 'astronomia';

// Define the birth data interface to match the API request
export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  city?: string;
  timezoneOffset?: number; // Minutes offset from UTC, e.g. -240 for EDT (UTC-4)
}

// Define a type for our planet data
interface PlanetData {
  name: string;
  symbol: string;
  sign: string;
  angle: number;
}

// Planet symbols for the UI
const PLANET_SYMBOLS: Record<string, string> = {
  'Sun': '☉',
  'Moon': '☽',
  'Mercury': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptune': '♆',
  'Pluto': '♇'
};

// Zodiac signs in order
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// List of planets to calculate
const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
];

// Aspect definitions with orbs
const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 8 },
  { name: 'Trine', angle: 120, orb: 8 },
  { name: 'Square', angle: 90, orb: 7 },
  { name: 'Sextile', angle: 60, orb: 6 },
  { name: 'Quincunx', angle: 150, orb: 5 },
  { name: 'Semi-Square', angle: 45, orb: 3 },
  { name: 'Semi-Sextile', angle: 30, orb: 3 }
];

/**
 * Get the zodiac sign for a given ecliptic longitude (in degrees)
 */
function getZodiacSignFromLongitude(longitude: number): string {
  // Normalize to 0-360 degrees
  const normalized = ((longitude % 360) + 360) % 360;
  
  // Each sign is 30 degrees
  const index = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[index % 12];
}

/**
 * Calculate aspects between planets
 */
function calculateAspects(planetPositions: any[]): any[] {
  const aspects: any[] = [];
  
  // Compare each planet with every other planet
  for (let i = 0; i < planetPositions.length; i++) {
    for (let j = i + 1; j < planetPositions.length; j++) {
      const planet1 = planetPositions[i];
      const planet2 = planetPositions[j];
      
      // Calculate the angular difference between the two planets
      let diff = Math.abs(planet1.angle - planet2.angle);
      if (diff > 180) diff = 360 - diff; // Get the shorter arc
      
      // Detailed debug logging for aspects
      console.log(`Calculating aspect between ${planet1.name} and ${planet2.name}: difference = ${diff}°, aspect checked = ${ASPECTS[0].name}, orb = ${ASPECTS[0].orb}`);
      
      // Check if the difference matches any aspect within the allowed orb
      for (const aspect of ASPECTS) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= aspect.orb) {
          aspects.push({
            planet1: planet1.name,
            planet2: planet2.name,
            aspect: aspect.name,
            orb: parseFloat(orb.toFixed(2))
          });
          break; // Only record the closest aspect
        }
      }
    }
  }
  
  return aspects;
}



export async function calculatePlanetaryPositions(birthData: BirthData): Promise<any> {
  // Log the received birth data
  console.log('Calculating planetary positions for:', birthData);

  
  // --- Timezone Handling ---
  // If timezoneOffset is provided, convert local birth time to UTC
  let utcYear = birthData.year;
  let utcMonth = birthData.month;
  let utcDay = birthData.day;
  let utcHour = birthData.hour;
  let utcMinute = birthData.minute;
  if (typeof birthData.timezoneOffset === 'number') {
    // Create a JS Date in local time, then shift by offset
    const localDate = new Date(Date.UTC(
      birthData.year, birthData.month - 1, birthData.day,
      birthData.hour, birthData.minute
    ));
    // Subtract the offset (in minutes) to get UTC time
    localDate.setUTCMinutes(localDate.getUTCMinutes() - birthData.timezoneOffset);
    utcYear = localDate.getUTCFullYear();
    utcMonth = localDate.getUTCMonth() + 1;
    utcDay = localDate.getUTCDate();
    utcHour = localDate.getUTCHours();
    utcMinute = localDate.getUTCMinutes();
    console.log(`[astroCalculations] Converted local time to UTC: ${utcYear}-${utcMonth}-${utcDay} ${utcHour}:${utcMinute} (offset ${birthData.timezoneOffset} min)`);
  } else {
    console.log('[astroCalculations] No timezoneOffset provided; assuming input is UTC.');
  }

  // Construct astronomia Time object
  const time = new Time(utcYear, utcMonth, utcDay, utcHour, utcMinute, 0);
  console.log('[astroCalculations] astronomia Time (UTC):', time);

  // Create astronomia Observer object
  const observer = new Observer(birthData.latitude, birthData.longitude);
  console.log('Observer:', observer);

  // Calculate house cusps, Ascendant, and MC using astronomia.House.Placidus
  const houseData = House.Placidus(time, observer);
  const houseCusps = Object.values(houseData.cusp).slice(1) as number[]; // Extract cusps 1-12
  const ascendant = houseData.ascendant;
  const mc = houseData.mc;
  console.log('House cusps (from astronomia.House.Placidus):', houseCusps);
  console.log('Ascendant (from astronomia.House.Placidus):', ascendant);
  console.log('MC (from astronomia.House.Placidus):', mc);

  // Calculate actual planetary positions using astronomia
  const planetPositions: PlanetData[] = [];

  for (const planetName of PLANETS) {
    try {
      let longitude: number;
      let latitude: number;

      switch (planetName) {
        case 'Sun':
          const sun = Planet.Sun(time);
          longitude = sun.lon;
          latitude = sun.lat;
          break;
        case 'Moon':
          const moon = Planet.Moon(time);
          longitude = moon.lon;
          latitude = moon.lat;
          break;
        case 'Mercury':
          const mercury = Planet.Mercury(time);
          longitude = mercury.lon;
          latitude = mercury.lat;
          break;
        case 'Venus':
          const venus = Planet.Venus(time);
          longitude = venus.lon;
          latitude = venus.lat;
          break;
        case 'Mars':
          const mars = Planet.Mars(time);
          longitude = mars.lon;
          latitude = mars.lat;
          break;
        case 'Jupiter':
          const jupiter = Planet.Jupiter(time);
          longitude = jupiter.lon;
          latitude = jupiter.lat;
          break;
        case 'Saturn':
          const saturn = Planet.Saturn(time);
          longitude = saturn.lon;
          latitude = saturn.lat;
          break;
        case 'Uranus':
          const uranus = Planet.Uranus(time);
          longitude = uranus.lon;
          latitude = uranus.lat;
          break;
        case 'Neptune':
          const neptune = Planet.Neptune(time);
          longitude = neptune.lon;
          latitude = neptune.lat;
          break;
        case 'Pluto':
          const pluto = Planet.Pluto(time);
          longitude = pluto.lon;
          latitude = pluto.lat;
          break;
        default:
          console.warn(`Unknown planet: ${planetName}`);
          continue;
      }

      console.log(`[DEBUG] ${planetName} raw longitude: ${longitude}°`);
      const sign = getZodiacSignFromLongitude(longitude);

      planetPositions.push({
        name: planetName,
        symbol: PLANET_SYMBOLS[planetName],
        sign: sign,
        angle: longitude,
      });
    } catch (error) {
      console.error(`Error calculating position for ${planetName}:`, error);
    }
  }

  const aspects = calculateAspects(planetPositions);

  // Prepare data for AstroChart
  const astroChartData = {
    planets: planetPositions.map(p => ({
      key: p.name.toLowerCase(),
      label: p.name,
      symbol: p.symbol,
      sign: p.sign,
      degree: p.angle,
    })),
    aspects: aspects.map(a => ({
      key: `${a.planet1.toLowerCase()}-${a.planet2.toLowerCase()}-${a.aspect.toLowerCase()}`,
      label: `${a.planet1} ${a.aspect} ${a.planet2}`,
      orb: a.orb,
      aspect: a.aspect,
      p1: a.planet1.toLowerCase(),
      p2: a.planet2.toLowerCase(),
    })),
    cusps: houseCusps,
    ascendant: ascendant,
    mc: mc,
  };

  return astroChartData;

}
