/**
 * Utility functions for astrological chart components
 */
import { ZODIAC_SIGNS } from './types';

/**
 * Calculate the number of planets in each zodiac sign
 * @param planetaryData - The planetary data from API or Supabase
 * @returns Record mapping zodiac sign names to counts
 */
export const calculatePlanetaryCounts = (planetaryData: any): Record<string, number> => {
  console.log('calculatePlanetaryCounts received data:', planetaryData);
  
  if (!planetaryData || !planetaryData.planets) {
    console.log('No planetary data or planets array found');
    return ZODIAC_SIGNS.reduce((acc, sign) => ({ ...acc, [sign]: 0 }), {});
  }

  // Initialize counts for each sign
  const counts: Record<string, number> = ZODIAC_SIGNS.reduce((acc, sign) => ({ ...acc, [sign]: 0 }), {});

  // Handle both array and object formats
  if (Array.isArray(planetaryData.planets)) {
    // New API format: planets is an array of objects with { name, sign, angle, etc. }
    planetaryData.planets.forEach((planet: any) => {
      if (planet && planet.sign && ZODIAC_SIGNS.includes(planet.sign)) {
        counts[planet.sign]++;
      }
    });
  } else {
    // Legacy format: planets is an object with planet names as keys
    Object.entries(planetaryData.planets).forEach(([planet, data]: [string, any]) => {
      if (data && typeof data.lon === 'number') {
        const signIndex = Math.floor(data.lon / 30) % 12;
        const sign = ZODIAC_SIGNS[signIndex];
        counts[sign]++;
      }
    });
  }

  console.log('Calculated planetary counts:', counts);
  return counts;
};

/**
 * Process planets per sign to get a mapping of which planets are in each sign
 * @param planetaryData - The planetary data from API or Supabase
 * @returns Record mapping zodiac sign names to arrays of planet names
 */
export const processPlanetsPerSign = (planetaryData: any): Record<string, string[]> => {
  console.log('processPlanetsPerSign received data:', planetaryData);
  
  if (!planetaryData || !planetaryData.planets) {
    console.log('No planetary data or planets array found');
    return ZODIAC_SIGNS.reduce((acc, sign) => ({ ...acc, [sign]: [] }), {});
  }

  // Initialize empty arrays for each sign
  const planetsPerSign: Record<string, string[]> = ZODIAC_SIGNS.reduce((acc, sign) => ({ ...acc, [sign]: [] }), {});

  // Handle both array and object formats
  if (Array.isArray(planetaryData.planets)) {
    // New API format: planets is an array of objects with { name, sign, angle, etc. }
    planetaryData.planets.forEach((planet: any) => {
      if (planet && planet.name && planet.sign && ZODIAC_SIGNS.includes(planet.sign)) {
        planetsPerSign[planet.sign].push(planet.name);
      }
    });
  } else {
    // Legacy format: planets is an object with planet names as keys
    Object.entries(planetaryData.planets).forEach(([planet, data]: [string, any]) => {
      if (data && typeof data.lon === 'number') {
        const signIndex = Math.floor(data.lon / 30) % 12;
        const sign = ZODIAC_SIGNS[signIndex];
        planetsPerSign[sign].push(planet);
      }
    });
  }

  console.log('Processed planets per sign:', planetsPerSign);
  return planetsPerSign;
};

/**
 * Convert planetary counts object to array format for Chart.js
 * @param counts - Record mapping zodiac sign names to counts
 * @returns Array of counts in zodiac sign order
 */
export const countsToArray = (counts: Record<string, number>): number[] => {
  return ZODIAC_SIGNS.map(sign => counts[sign] || 0);
};

/**
 * Generate aspect lines data for SVG visualization
 * @param counts - Array of planetary counts by zodiac sign
 * @returns Array of line data objects
 */
export interface AspectLineData {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: string;
  strokeDasharray: string;
}

export const generateAspectLines = (counts: number[]): AspectLineData[] => {
  const strongSigns = counts
    .map((count, i) => ({count, index: i}))
    .filter(item => item.count > 1)
    .sort((a, b) => b.count - a.count);

  const lines: AspectLineData[] = [];

  for (let i = 0; i < Math.min(strongSigns.length, 4); i++) {
    for (let j = i + 1; j < Math.min(strongSigns.length, 4); j++) {
      const angle1 = strongSigns[i].index * 30;
      const angle2 = strongSigns[j].index * 30;
      const diff = Math.abs(angle1 - angle2);

      // Only draw aspects for significant angular relationships
      if ([0, 30, 60, 90, 120, 150, 180].includes(diff % 180)) {
        const x1 = 50 + 40 * Math.cos((angle1 - 90) * Math.PI / 180);
        const y1 = 50 + 40 * Math.sin((angle1 - 90) * Math.PI / 180);
        const x2 = 50 + 40 * Math.cos((angle2 - 90) * Math.PI / 180);
        const y2 = 50 + 40 * Math.sin((angle2 - 90) * Math.PI / 180);

        lines.push({
          key: `${i}-${j}`,
          x1,
          y1,
          x2,
          y2,
          stroke: "rgba(255, 215, 0, 0.7)",
          strokeWidth: "0.5",
          strokeDasharray: diff % 30 === 0 ? '0' : '2,2'
        });
      }
    }
  }
  
  return lines;
};

/**
 * Clean up Chart.js instance safely
 * @param chartInstance - The Chart.js instance to destroy
 */
export const cleanupChartInstance = (chartInstance: any): void => {
  if (!chartInstance) return;
  
  try {
    if (typeof chartInstance.destroy === 'function') {
      chartInstance.destroy();
    }
  } catch (error) {
    console.error('Error destroying chart instance:', error);
  }
};

/**
 * Format data for AstroChart library
 * @param astroData - The astrological data
 * @returns Formatted data for AstroChart
 */
export const formatAstroChartData = (astroData: any): { planets: Record<string, number[]>; cusps: number[] } => {
  console.log('formatAstroChartData received data:', astroData);
  console.log('formatAstroChartData - cusps in data:', astroData?.cusps);
  console.log('formatAstroChartData - houses in data:', astroData?.houses);
  
  // Get cusps from the response, either from cusps array or houses array
  let cusps: number[] = [];
  let cuspSource = 'unknown';
  
  if (astroData?.cusps && Array.isArray(astroData.cusps) && astroData.cusps.length === 12) {
    // Use cusps array directly if available and valid
    cusps = astroData.cusps;
    cuspSource = 'direct cusps array';
    console.log('Using cusps directly from astroData.cusps:', cusps);
  } else if (astroData?.houses && Array.isArray(astroData.houses)) {
    // Fall back to extracting cusps from houses array
    cusps = astroData.houses.map((house: any) => 
      typeof house === 'number' ? house : house.cusp
    );
    cuspSource = 'houses array';
    console.log('Extracted cusps from astroData.houses:', cusps);
  } else {
    // If no cusps data is available, calculate equal houses as a last resort
    console.warn('No house cusps found in the API response, using equal houses as fallback');
    cusps = Array.from({ length: 12 }, (_, i) => i * 30);
    cuspSource = 'equal houses fallback';
  }
  
  // Validate cusps to ensure they're all numbers
  const validCusps = cusps.every(cusp => typeof cusp === 'number' && !isNaN(cusp));
  if (!validCusps) {
    console.error('Invalid cusps detected:', cusps);
    console.warn('Falling back to equal houses due to invalid cusps');
    cusps = Array.from({ length: 12 }, (_, i) => i * 30);
    cuspSource = 'equal houses fallback (invalid cusps)';
  }
  
  console.log(`Using cusps from ${cuspSource}:`, cusps);
  
  const chartData: { planets: Record<string, number[]>; cusps: number[] } = {
    planets: {},
    cusps: cusps
  };
  
  console.log('Using cusps:', chartData.cusps);

  // Convert planet data to the format expected by AstroChart
  if (astroData?.planets) {
    if (Array.isArray(astroData.planets)) {
      // New API format: planets is an array of objects
      astroData.planets.forEach((planet: any) => {
        if (planet && planet.name && (typeof planet.angle === 'number' || typeof planet.lon === 'number')) {
          const angle = typeof planet.angle === 'number' ? planet.angle : planet.lon;
          chartData.planets[planet.name] = [angle, 0, 0, 0];
        }
      });
    } else if (typeof astroData.planets === 'object') {
      // Legacy format: planets is an object with planet names as keys
      Object.entries(astroData.planets).forEach(([name, planetData]: [string, any]) => {
        if (planetData && (typeof planetData.lon === 'number' || typeof planetData.angle === 'number')) {
          const angle = typeof planetData.lon === 'number' ? planetData.lon : planetData.angle;
          chartData.planets[name] = [angle, 0, 0, 0];
        }
      });
    }
  }

  console.log('Formatted chart data:', chartData);
  return chartData;
};
