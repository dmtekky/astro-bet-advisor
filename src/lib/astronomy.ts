import * as A from 'astronomy-engine';

// Cache for lunar node positions to avoid recalculating for the same date
const lunarNodeCache: Record<string, {north: string, south: string}> = {};

// Zodiac signs in order
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

/**
 * Get the zodiac sign for a given ecliptic longitude (in degrees)
 */
function getZodiacSignFromLongitude(longitude: number): string {
  // Normalize to 0-360 degrees
  const normalized = ((longitude % 360) + 360) % 360;
  
  // Each sign is 30 degrees
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const index = Math.floor(normalized / 30);
  return signs[index % 12];
}

/**
 * Get the current positions of the lunar nodes (North and South)
 */
export function getLunarNodes(date: Date = new Date()): {north: string, south: string} {
  const dateStr = date.toISOString().split('T')[0]; // Use date as cache key
  
  // Return cached value if available
  if (lunarNodeCache[dateStr]) {
    return lunarNodeCache[dateStr];
  }
  
  // For the purpose of this app, we'll use a simplified approach
  // since astronomy-engine's API doesn't directly expose lunar nodes
  // Calculate the approximate position of the North Node
  // (This is a simplified calculation and not astronomically precise)
  
  // The Moon's nodes complete a full cycle (360°) approximately every 18.6 years
  const NODE_CYCLE_YEARS = 18.6;
  const NODE_CYCLE_DAYS = NODE_CYCLE_YEARS * 365.25;
  
  // Use a known North Node position as a reference point
  // For example, on Jan 1, 2020, the North Node was at approximately 6° Cancer
  const REFERENCE_DATE = new Date('2020-01-01T00:00:00Z');
  const REFERENCE_NODE_LONGITUDE = 96; // 6° Cancer = 96° (30° * 3 + 6°)
  
  // Calculate days since reference date
  const daysSinceReference = (date.getTime() - REFERENCE_DATE.getTime()) / (1000 * 60 * 60 * 24);
  
  // Calculate the change in longitude (degrees per day)
  const degreesPerDay = 360 / NODE_CYCLE_DAYS;
  const degreesMoved = (daysSinceReference * degreesPerDay) % 360;
  
  // Calculate current North Node longitude
  let nodeLongitude = (REFERENCE_NODE_LONGITUDE - degreesMoved + 360) % 360;
  
  // The South Node is always 180° opposite the North Node
  const southNodeLongitude = (nodeLongitude + 180) % 360;
  
  // Convert to zodiac signs
  const result = {
    north: getZodiacSignFromLongitude(nodeLongitude),
    south: getZodiacSignFromLongitude(southNodeLongitude)
  };
  
  // Cache the result
  lunarNodeCache[dateStr] = result;
  
  return result;
}

/**
 * Get the next few lunar node transits (when the nodes change signs)
 * @param count Number of transits to return (default: 3)
 * @returns Array of {date: Date, type: 'north' | 'south', sign: string}
 */
export function getNextLunarNodeTransits(count: number = 3): Array<{date: Date, type: 'north' | 'south', sign: string}> {
  const transits: Array<{date: Date, type: 'north' | 'south', sign: string}> = [];
  const now = new Date();
  let currentDate = new Date(now);
  
  // We'll check for transits over the next 20 years (lunar nodes cycle is ~18.6 years)
  const endDate = new Date(now);
  endDate.setFullYear(now.getFullYear() + 20);
  
  // Get the starting positions
  let lastNorthSign = getLunarNodes(currentDate).north;
  let lastSouthSign = getLunarNodes(currentDate).south;
  
  // Check each day for sign changes
  while (transits.length < count && currentDate < endDate) {
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Next day
    
    // Get current positions
    const {north: currentNorthSign, south: currentSouthSign} = getLunarNodes(currentDate);
    
    // Check for North Node sign change
    if (currentNorthSign !== lastNorthSign) {
      transits.push({
        date: new Date(currentDate),
        type: 'north',
        sign: currentNorthSign
      });
      lastNorthSign = currentNorthSign;
    }
    
    // Check for South Node sign change
    if (currentSouthSign !== lastSouthSign) {
      transits.push({
        date: new Date(currentDate),
        type: 'south',
        sign: currentSouthSign
      });
      lastSouthSign = currentSouthSign;
    }
  }
  
  // Sort by date and return the requested number of transits
  return transits
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

/**
 * Get the current and next few lunar node transits
 * @param count Number of future transits to include (default: 2)
 * @returns Object with current nodes and upcoming transits
 */
export function getLunarNodeForecast(count: number = 2) {
  const now = new Date();
  const current = getLunarNodes(now);
  const nextTransits = getNextLunarNodeTransits(count);
  
  // Find the next transit for the current node (north or south)
  const nextTransit = nextTransits[0];
  
  return {
    current: {
      northNode: current.north,
      southNode: current.south,
      nextTransitDate: nextTransit?.date || null,
      nextTransitType: nextTransit?.type || null,
      nextTransitSign: nextTransit?.sign || null
    },
    upcomingTransits: nextTransits
  };
}
