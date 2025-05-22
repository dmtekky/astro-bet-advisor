// Astrology Data Cache Update Script
// Run this script daily with a cron job to keep your cache fresh
// Example cron: 0 0 * * * node /path/to/update_astro_cache.js

import swisseph from 'swisseph';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY/SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Zodiac signs in order
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Nakshatras (Lunar Mansions)
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Planet information for Swiss Ephemeris
const PLANETS = [
  { name: 'sun', seId: swisseph.SE_SUN },
  { name: 'moon', seId: swisseph.SE_MOON },
  { name: 'mercury', seId: swisseph.SE_MERCURY },
  { name: 'venus', seId: swisseph.SE_VENUS },
  { name: 'mars', seId: swisseph.SE_MARS },
  { name: 'jupiter', seId: swisseph.SE_JUPITER },
  { name: 'saturn', seId: swisseph.SE_SATURN },
  { name: 'uranus', seId: swisseph.SE_URANUS },
  { name: 'neptune', seId: swisseph.SE_NEPTUNE },
  { name: 'pluto', seId: swisseph.SE_PLUTO },
  { name: 'north_node', seId: swisseph.SE_TRUE_NODE }
];

// Lahiri Ayanamsa - standard in Vedic/Sidereal astrology
const AYANAMSA = swisseph.SE_SIDM_LAHIRI;
const AYANAMSA_VALUE = 24.1;

/**
 * Main function to update the astrology cache
 */
async function updateAstroCache() {
  console.log('Starting astrology cache update...');
  
  try {
    // Initialize Swiss Ephemeris
    swisseph.swe_set_sid_mode(AYANAMSA, 0, 0);
    
    // Update data for today and the next 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      console.log(`Calculating astrological data for ${dateStr}...`);
      
      // Calculate astro data
      const astroData = await calculateAstroData(date);
      
      // Store in Supabase
      const { error } = await supabase
        .from('astro_cache')
        .upsert({
          date: dateStr,
          data: astroData,
          created_at: new Date().toISOString()
        }, { onConflict: 'date' });
      
      if (error) {
        console.error(`Error storing data for ${dateStr}:`, error);
      } else {
        console.log(`Successfully updated cache for ${dateStr}`);
      }
    }
    
    console.log('Cache update completed successfully!');
  } catch (error) {
    console.error('Error updating astrology cache:', error);
    process.exit(1);
  }
}

/**
 * Calculate astrological data for a given date
 */
async function calculateAstroData(date) {
  // Convert date to Julian day
  const julianDay = dateToJulianDay(date);
  
  // Calculate positions for all planets
  const planetPositions = await calculatePlanetaryPositions(julianDay);
  
  // Calculate moon phase
  const moonPhase = calculateMoonPhase(julianDay);
  
  // Calculate aspects between planets
  const aspects = calculateAspects(planetPositions);
  
  // Assemble the complete response
  return {
    date: date.toISOString().split('T')[0],
    query_time: new Date().toISOString(),
    sidereal: true,
    ayanamsa: AYANAMSA_VALUE,
    observer: {
      latitude: 40.7128, // NYC coordinates by default
      longitude: -74.0060,
      timezone: "America/New_York"
    },
    planets: planetPositions,
    moon_phase: moonPhase,
    aspects
  };
}

/**
 * Convert JavaScript Date to Julian Day number required by Swiss Ephemeris
 */
function dateToJulianDay(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600;
  
  return swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);
}

/**
 * Calculate planetary positions using Swiss Ephemeris
 */
async function calculatePlanetaryPositions(julianDay) {
  const positions = {};
  
  for (const planet of PLANETS) {
    try {
      // Calculate position
      const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED;
      const result = await new Promise((resolve, reject) => {
        swisseph.swe_calc_ut(julianDay, planet.seId, flags, (err, body) => {
          if (err) reject(err);
          else resolve(body);
        });
      });
      
      // Get longitude and determine sign
      const longitude = result.longitude;
      const signIndex = Math.floor(longitude / 30);
      const degree = longitude % 30;
      
      // Calculate nakshatra for Moon
      let nakshatra = null;
      let nakshatra_pada = null;
      if (planet.name === 'moon') {
        const nakIndex = Math.floor(longitude * 27 / 360);
        nakshatra = NAKSHATRAS[nakIndex % 27];
        nakshatra_pada = Math.floor((longitude * 27 % 360) / 3.333) + 1;
      }
      
      // Determine if retrograde
      const isRetrograde = result.longitudeSpeed < 0;
      
      // Store position data
      positions[planet.name] = {
        name: planet.name.charAt(0).toUpperCase() + planet.name.slice(1).replace('_', ' '),
        longitude,
        latitude: result.latitude,
        speed: result.longitudeSpeed,
        sign: ZODIAC_SIGNS[signIndex % 12],
        degree: Math.floor(degree),
        minute: Math.floor((degree % 1) * 60),
        nakshatra,
        nakshatra_pada,
        retrograde: isRetrograde
      };
    } catch (error) {
      console.error(`Error calculating position for ${planet.name}:`, error);
      // Skip this planet on error
    }
  }
  
  return positions;
}

/**
 * Calculate moon phase using Swiss Ephemeris
 */
function calculateMoonPhase(julianDay) {
  try {
    // Get phase angle
    const phaseAngle = swisseph.swe_pheno_ut(julianDay, swisseph.SE_MOON, 0);
    const illuminated = phaseAngle.phase_angle / 180;
    
    // Determine phase name
    const phaseName = getMoonPhaseName(illuminated);
    
    return {
      illumination: illuminated,
      phase_name: phaseName
    };
  } catch (error) {
    console.error('Error calculating moon phase:', error);
    return {
      illumination: 0.5,
      phase_name: 'Unknown'
    };
  }
}

/**
 * Get moon phase name from illumination value
 */
function getMoonPhaseName(illumination) {
  if (illumination < 0.03) return 'New Moon';
  if (illumination < 0.22) return 'Waxing Crescent';
  if (illumination < 0.28) return 'First Quarter';
  if (illumination < 0.47) return 'Waxing Gibbous';
  if (illumination < 0.53) return 'Full Moon';
  if (illumination < 0.72) return 'Waning Gibbous';
  if (illumination < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

/**
 * Calculate aspects between planets
 */
function calculateAspects(planetPositions) {
  const aspects = [];
  const planetNames = Object.keys(planetPositions);
  
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planet1 = planetNames[i];
      const planet2 = planetNames[j];
      
      const angle = Math.abs(planetPositions[planet1].longitude - planetPositions[planet2].longitude) % 360;
      const aspect = getAspectType(angle);
      
      if (aspect) {
        aspects.push({
          planets: [planet1, planet2],
          type: aspect.type,
          angle,
          orb: Math.abs(angle - aspect.angle),
          influence: aspect.influence
        });
      }
    }
  }
  
  return aspects;
}

/**
 * Get aspect type based on angle
 */
function getAspectType(angle) {
  const aspects = [
    { type: 'conjunction', angle: 0, orb: 8, influence: 'Intensified energy and focus' },
    { type: 'sextile', angle: 60, orb: 6, influence: 'Harmonious opportunities' },
    { type: 'square', angle: 90, orb: 8, influence: 'Tension and challenges' },
    { type: 'trine', angle: 120, orb: 8, influence: 'Flow and ease' },
    { type: 'opposition', angle: 180, orb: 10, influence: 'Polarization and awareness' }
  ];
  
  for (const aspect of aspects) {
    const diff = Math.abs(angle - aspect.angle);
    if (diff <= aspect.orb || Math.abs(360 - diff) <= aspect.orb) {
      return aspect;
    }
  }
  
  return null;
}

// Run the main function
updateAstroCache().then(() => {
  console.log('Astrology cache update complete');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
