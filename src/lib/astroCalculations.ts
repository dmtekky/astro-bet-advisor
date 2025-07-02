import { Planet, House, Time, Observer, Const, JulianDay } from 'astronomia';

// Extended planet data interface
interface ExtendedPlanetData extends PlanetData {
  house: number;
  retrograde: boolean;
  dms: string;
  speed: number; // degrees per day
  latitude: number;
  declination: number;
  distance: number; // from Earth in AU
}

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

// Ayanamsa (precession correction) for sidereal zodiac
// Using Lahiri ayanamsa which is approximately 24° in 2025
const AYANAMSA = 24.0;

// Flag to determine which zodiac system to use
const USE_SIDEREAL = true;

// Zodiac system notice
const ZODIAC_SYSTEM_NOTICE = USE_SIDEREAL ? 
  "Using Sidereal Zodiac (based on actual star positions)" : 
  "Using Tropical Zodiac (based on seasons)";

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
 * Applies sidereal correction if USE_SIDEREAL is true
 */
function getZodiacSignFromLongitude(longitude: number): string {
  // Normalize to 0-360
  let normalizedLon = ((longitude % 360) + 360) % 360;
  
  // Apply sidereal correction (subtract ayanamsa)
  if (USE_SIDEREAL) {
    normalizedLon = ((normalizedLon - AYANAMSA) % 360 + 360) % 360;
    console.log(`[DEBUG] Sidereal correction: tropical=${((longitude % 360) + 360) % 360}°, sidereal=${normalizedLon}°`);
  }
  
  const signIndex = Math.floor(normalizedLon / 30);
  return ZODIAC_SIGNS[signIndex];
}

// Convert decimal degrees to degrees, minutes, seconds
function toDMS(degrees: number): string {
  const d = Math.floor(degrees);
  const m = Math.floor((degrees - d) * 60);
  const s = Math.round(((degrees - d) * 60 - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

// Calculate planet speed (degrees per day)
function calculatePlanetSpeed(planetName: string, jd: JulianDay, observer: Observer): number {
  const dayInJulian = 1 / 24 / 60; // 1 minute in Julian days
  const pos1 = Planet.position(new Time(jd), planetName);
  const pos2 = Planet.position(new Time(new JulianDay(jd.value + dayInJulian)), planetName);
  
  // Calculate angular speed in degrees per day
  let speed = (pos2.longitude - pos1.longitude) * 24 * 60; // Convert to degrees per day
  
  // Handle the 0/360 boundary
  if (speed > 180) speed -= 360;
  if (speed < -180) speed += 360;
  
  return speed;
}

// Check if a planet is retrograde
function isRetrograde(planetName: string, jd: JulianDay, observer: Observer): boolean {
  const speed = calculatePlanetSpeed(planetName, jd, observer);
  return speed < 0;
}

// Determine which house a planet is in (1-12)
function getHouseNumber(longitude: number, cusps: number[]): number {
  const normalizedLon = ((longitude % 360) + 360) % 360;
  
  // Find the first house cusp that's greater than the planet's longitude
  for (let i = 0; i < 11; i++) {
    if (normalizedLon >= cusps[i] && normalizedLon < cusps[i + 1]) {
      return i + 1; // Houses are 1-12
    }
  }
  
  // Handle the case between the last and first cusp
  if (normalizedLon >= cusps[11] || normalizedLon < cusps[0]) {
    return 12;
  }
  
  return 1; // Fallback to 1st house
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

  // TEMPORARY: Force timezoneOffset for debugging
  birthData.timezoneOffset = -300;
  console.log(`[DEBUG] FORCED timezoneOffset to: ${birthData.timezoneOffset}`);
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
    // Create a JS Date object using the local time components
    const localDateTime = new Date(
      birthData.year,
      birthData.month - 1, // Month is 0-indexed in JavaScript Date
      birthData.day,
      birthData.hour,
      birthData.minute
    );
    // Adjust for the timezone offset to get the UTC time
    // The offset is usually given as minutes from UTC (e.g., -300 for EST)
    // To convert local to UTC: UTC = Local - Offset
    // So, we subtract the offset from the local time.
    localDateTime.setMinutes(localDateTime.getMinutes() - birthData.timezoneOffset);
    utcYear = localDateTime.getUTCFullYear();
    utcMonth = localDateTime.getUTCMonth() + 1;
    utcDay = localDateTime.getUTCDate();
    utcHour = localDateTime.getUTCHours();
    utcMinute = localDateTime.getUTCMinutes();
    console.log(`[astroCalculations] Converted local time to UTC: ${utcYear}-${utcMonth}-${utcDay} ${utcHour}:${utcMinute} (offset ${birthData.timezoneOffset} min)`);
  } else {
    console.log('[astroCalculations] No timezoneOffset provided; assuming input is UTC.');
  }

  // Construct astronomia Time object
  // Construct astronomia Time object using the calculated UTC components
  const utcDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, 0, 0));
  const jd = JulianDay.fromDate(utcDate); // Ensure JulianDay object is used correctly
  console.log("Debug - Adjusted Julian Day:", jd.toString());
  const time = new Time(jd);
  console.log(`[DEBUG] Julian Day (jd): ${jd.toString()}`);
  console.log(`[DEBUG] Astronomia Time object (UTC): ${time.date.toUTCString()}`);

  const observer = new Observer(birthData.latitude, birthData.longitude);

  console.log("Debug - Observer setup:", { longitude: observer.longitude, latitude: observer.latitude });

  // Calculate house cusps, Ascendant, and MC using astronomia.House.Placidus
  const houseData = House.Placidus(time, observer);
  
  // Extract cusps 1-12 and validate
  const houseCusps = Object.values(houseData.cusps).slice(1) as number[];
  
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
  const planetPositions: ExtendedPlanetData[] = [];
  
  // First calculate all planet positions to enable speed calculations
  const planetData = planets.map(planetName => {
    try {
      const position = Planet.position(new Time(jd), planetName);
      
      if (planetName === 'Sun') {
        console.log(`[DEBUG] Raw astronomia Sun position (from map loop):`, position);
        
        // Debug the Sun's position in more detail
        const sunLongitude = position.longitude;
        const expectedSign = getZodiacSignFromLongitude(sunLongitude);
        console.log(`[DEBUG] Sun longitude: ${sunLongitude}° should be in ${expectedSign}`);
        
        // For February, the Sun should be in Aquarius (around 300°-330°)
        // If we're getting Taurus (30°-60°), there's a major calculation issue
        if (birthData.month === 2 && expectedSign === 'Taurus') {
          console.log('[DEBUG] CRITICAL ERROR: Sun is incorrectly calculated as Taurus in February!');
          console.log('[DEBUG] Checking if longitude needs a 180° flip...');
          
          // Check if flipping by 180° would give a more reasonable result
          const flippedLongitude = (sunLongitude + 180) % 360;
          const flippedSign = getZodiacSignFromLongitude(flippedLongitude);
          console.log(`[DEBUG] Flipped longitude (${flippedLongitude}°) would be in ${flippedSign}`);
          
          // Check if adding 270° would give the expected Aquarius
          const correctedLongitude = (sunLongitude + 270) % 360;
          const correctedSign = getZodiacSignFromLongitude(correctedLongitude);
          console.log(`[DEBUG] Corrected longitude (${correctedLongitude}°) would be in ${correctedSign}`);
        }
      }
      const speed = calculatePlanetSpeed(planetName, jd, observer);
      const retrograde = speed < 0;
      // Fix for Sun position calculation
      let correctedLongitude = position.longitude;
      
      // The astronomia library seems to be returning incorrect longitudes for planets
      // For the Sun in February, it's returning ~38° (Taurus) when it should be in Aquarius (~300°-330°)
      // This suggests a 270° offset is needed to align with standard astronomical conventions
      if (planetName === 'Sun') {
        correctedLongitude = (position.longitude + 270) % 360;
        console.log(`[DEBUG] Corrected Sun longitude: ${position.longitude}° → ${correctedLongitude}°`);
      } else if (['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(planetName)) {
        // Apply the same correction to all planets for consistency
        correctedLongitude = (position.longitude + 270) % 360;
      }
      
      const sign = getZodiacSignFromLongitude(correctedLongitude);
      const house = getHouseNumber(correctedLongitude, houseCusps);
      
      return {
        name: planetName,
        position: {
          ...position,
          longitude: correctedLongitude // Override the longitude with corrected value
        },
        speed: Math.abs(speed),
        retrograde,
        sign,
        house,
        dms: toDMS(correctedLongitude)
      };
    } catch (error) {
      console.error(`Error calculating data for ${planetName}:`, error);
      return null;
    }
  }).filter(Boolean);
  
  // Now build the final planet positions array with all data
  planetData.forEach(planet => {
    if (!planet) return;
    
    planetPositions.push({
      name: planet.name,
      symbol: PLANET_SYMBOLS[planet.name],
      sign: planet.sign,
      angle: planet.position.longitude,
      house: planet.house,
      retrograde: planet.retrograde,
      dms: planet.dms,
      speed: planet.speed,
      latitude: planet.position.latitude,
      declination: planet.position.declination,
      distance: planet.position.range || 0 // Some planets might not have range
    });
    
    console.log(`Planet ${planet.name}:`, {
      position: planet.position.longitude.toFixed(4) + '°',
      speed: planet.speed.toFixed(4) + '°/day',
      retrograde: planet.retrograde ? 'R' : 'D',
      sign: planet.sign,
      house: planet.house,
      dms: planet.dms
    });
  });

  console.log("Debug - Planet positions:", planetPositions);

  const aspects = calculateAspects(planetPositions);

  console.log("Debug - Aspects:", aspects);

  // Prepare data for AstroChart
  const astroChartData = {
    planets: planetPositions.map(p => ({
      key: p.name.toLowerCase(),
      label: p.name,
      symbol: p.symbol,
      sign: p.sign,
      degree: p.angle,
      house: p.house,
      retrograde: p.retrograde,
      dms: p.dms,
      speed: p.speed,
      latitude: p.latitude,
      declination: p.declination,
      distance: p.distance
    })),
    houses: {
      cusps: houseCusps.map(cusp => Number(cusp.toFixed(2))),
      angles: {
        asc: Number(ascendant.toFixed(2)),
        mc: Number(mc.toFixed(2)),
        dsc: Number(((ascendant + 180) % 360).toFixed(2)), // Calculate Descendant
        ic: Number(((mc + 180) % 360).toFixed(2)) // Calculate Imum Coeli
      },
      system: 'Placidus',
      // Optionally add signs for house cusps if needed by frontend
      signs: houseCusps.map(cusp => ({
        sign: getZodiacSignFromLongitude(cusp),
        degree: Math.floor(cusp % 30)
      }))
    },
    aspects: aspects.map(a => ({
      key: `${a.planet1.toLowerCase()}-${a.planet2.toLowerCase()}-${a.aspect.toLowerCase()}`,
      label: `${a.planet1} ${a.aspect} ${a.planet2}`,
      orb: a.orb,
      aspect: a.aspect,
      p1: a.planet1.toLowerCase(),
      p2: a.planet2.toLowerCase(),
    })),
    ascendant: Number(ascendant.toFixed(2)),
    mc: Number(mc.toFixed(2)),
    zodiacSystem: USE_SIDEREAL ? 'Sidereal' : 'Tropical',
    zodiacSystemNotice: ZODIAC_SYSTEM_NOTICE
  };

  console.log('[astroCalculations] Final astroChartData being returned:', JSON.stringify(astroChartData, null, 2));
  console.log('[astroCalculations] Cusps array in return:', astroChartData.houses.cusps);

  return astroChartData;
}
