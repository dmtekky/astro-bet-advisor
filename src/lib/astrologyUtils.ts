/**
 * Calculates the count of planets in each zodiac sign from planetary data
 * @param planetaryData The planetary data from the astrology API
 * @returns An object with zodiac sign names as keys and planet counts as values
 */
export function calculatePlanetaryCounts(planetaryData: any): Record<string, number> {
  if (!planetaryData || !planetaryData.planets) {
    return {};
  }

  // Initialize counts for all zodiac signs to 0
  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  
  const counts: Record<string, number> = {};
  zodiacSigns.forEach(sign => {
    counts[sign] = 0;
  });

  // Count planets in each sign
  const planets = planetaryData.planets;
  for (const planet in planets) {
    if (planets[planet]?.sign) {
      const sign = planets[planet].sign;
      if (counts[sign] !== undefined) {
        counts[sign]++;
      }
    }
  }

  return counts;
}
