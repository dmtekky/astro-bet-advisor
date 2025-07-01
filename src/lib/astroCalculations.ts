import { Planet, House, Time, Observer, Const, JulianDay } from 'astronomia';

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
  console.log("Debug - Input birth data:", birthData);
  console.log("GUARANTEED CUSPS VERSION - calculatePlanetaryPositions loaded");
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
  const localTime = new Date(Date.UTC(birthData.year, birthData.month - 1, birthData.day, birthData.hour, birthData.minute, 0, 0));
  if (typeof birthData.timezoneOffset === 'number') {
    const offsetMinutes = birthData.timezoneOffset;
    localTime.setUTCMinutes(localTime.getUTCMinutes() - offsetMinutes); // Correct offset application
  }
  const jd = new JulianDay().fromDate(localTime); // Ensure JulianDay object is used correctly
  console.log("Debug - Adjusted Julian Day:", jd.toString());
  const time = new Time(jd);
  console.log('[astroCalculations] astronomia Time (UTC):', time);

  // Create astronomia Observer object
  const observer = new Observer();
  observer.longitude = birthData.longitude;
  observer.latitude = birthData.latitude;
  console.log("Debug - Observer setup:", { longitude: observer.longitude, latitude: observer.latitude });

  // Calculate house cusps, Ascendant, and MC using astronomia.House.Placidus
  const houseData = House.Placidus(time, observer);
  
  // Extract cusps 1-12 and validate
  const houseCusps = Object.values(houseData.cusp).slice(1) as number[];
  
  // Validate that we have exactly 12 house cusps
  if (!houseCusps || houseCusps.length !== 12) {
    console.error('ERROR: Invalid house cusps generated by astronomia:', houseCusps);
    // Provide fallback cusps only if absolutely necessary
    // This should not happen with astronomia but we need to be safe
    const fallbackCusps = Array.from({ length: 12 }, (_, i) => i * 30);
    console.warn('Using fallback equal house cusps:', fallbackCusps);
    houseCusps.splice(0, houseCusps.length, ...fallbackCusps);
  }
  
  const ascendant = houseData.ascendant;
  const mc = houseData.mc;
  
  console.log('House cusps (from astronomia.House.Placidus):', houseCusps);
  console.log('Raw house data from astronomia:', JSON.stringify(houseData));
  console.log('Ascendant (from astronomia.House.Placidus):', ascendant);
  console.log('MC (from astronomia.House.Placidus):', mc);

  // For each planet, calculate and log positions with more detail
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const planetPositions = [];
  planets.forEach(planetName => {
    let position;
    try {
      switch (planetName) {
        case 'Sun':
          position = Planet.position(Const.Sun, jd, observer);
          break;
        case 'Moon':
          position = Planet.position(Const.Moon, jd, observer);
          break;
        case 'Mercury':
          position = Planet.position(Const.Mercury, jd, observer);
          break;
        case 'Venus':
          position = Planet.position(Const.Venus, jd, observer);
          break;
        case 'Mars':
          position = Planet.position(Const.Mars, jd, observer);
          break;
        case 'Jupiter':
          position = Planet.position(Const.Jupiter, jd, observer);
          break;
        case 'Saturn':
          position = Planet.position(Const.Saturn, jd, observer);
          break;
        case 'Uranus':
          position = Planet.position(Const.Uranus, jd, observer);
          break;
        case 'Neptune':
          position = Planet.position(Const.Neptune, jd, observer);
          break;
        case 'Pluto':
          position = Planet.position(Const.Pluto, jd, observer);
          break;
      }
      console.log(`Debug - ${planetName} position: longitude=${position.lon}, latitude=${position.lat}, RA=${position.ra}, Dec=${position.dec}`);
      const sign = getZodiacSignFromLongitude(position.lon);
      planetPositions.push({
        name: planetName,
        symbol: PLANET_SYMBOLS[planetName],
        sign: sign,
        angle: position.lon,
      });
    } catch (error) {
      console.error(`Error calculating position for ${planetName}:`, error);
    }
  });

  console.log("Debug - Planet positions:", planetPositions);

  const aspects = calculateAspects(planetPositions);

  console.log("Debug - Aspects:", aspects);

  // Prepare data for AstroChart
  // Guarantee cusps is a top-level array of 12 numbers, rounded to 2 decimals
  const formattedCusps = (houseCusps && Array.isArray(houseCusps) && houseCusps.length === 12)
    ? houseCusps.map(cusp => Number(cusp.toFixed(2)))
    : Array.from({ length: 12 }, (_, i) => i * 30);

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

  console.log('[astroCalculations] Final astroChartData being returned:', JSON.stringify(astroChartData, null, 2));
  console.log('[astroCalculations] Cusps array in return:', astroChartData.cusps);

  return astroChartData;
}
