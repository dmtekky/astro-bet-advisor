import astroData from '@/astrology/interpretations/astroData.json';
import { AstroData, PlanetData } from '../../../../types/astrology'; // Adjusted import path

// This utility function generates the key placement interpretations by looking up planetary data and matching signs.
export const generateInterpretations = (planetaryData: PlanetData[] | any[]): AstroData => {
  console.log('generateInterpretations called with:', JSON.stringify(planetaryData?.slice(0, 2)));
  
  const interpretations: AstroData = { planets: {}} as AstroData;

  if (!Array.isArray(planetaryData)) {
    console.error('planetaryData is not an array:', planetaryData);
    return astroData; // Return full astroData as fallback
  }

  planetaryData.forEach(planet => {
    // Skip if planet doesn't have name or house
    if (!planet || !planet.name || !planet.house) {
      console.log('Skipping planet without name or house:', planet);
      return;
    }

    try {
      const planetName = planet.name;
      const houseNumber = planet.house;
      
      console.log(`Processing ${planetName} in house ${houseNumber}`);
      
      // Check if this planet exists in astroData and has houses data
      if (astroData.planets[planetName as keyof typeof astroData.planets]?.houses) {
        const houseKey = `house${houseNumber}` as keyof typeof astroData.planets[typeof planetName]['houses'];
        const interpretation = astroData.planets[planetName as keyof typeof astroData.planets].houses[houseKey];
        
        if (interpretation) {
          console.log(`Found interpretation for ${planetName} in ${houseKey}`);
          
          // Initialize the planet's houses object if it doesn't exist
          if (!interpretations.planets[planetName as keyof typeof interpretations.planets]) {
            interpretations.planets[planetName as keyof typeof interpretations.planets] = { houses: {} };
          }
          
          // Add the interpretation
          interpretations.planets[planetName as keyof typeof interpretations.planets].houses[houseKey] = interpretation;
        } else {
          console.log(`No interpretation found for ${planetName} in ${houseKey}`);
        }
      } else {
        console.log(`No houses data for planet ${planetName}`);
      }
    } catch (error) {
      console.error('Error processing planet:', planet, error);
    }
  });

  console.log('Generated interpretations for planets:', Object.keys(interpretations.planets));
  
  // For now, return the full astroData.json for other sections (like signs, aspects) if they are not yet dynamically generated.
  // In the future, this function should be expanded to generate all interpretations dynamically.
  return { ...astroData, planets: interpretations.planets };
};
