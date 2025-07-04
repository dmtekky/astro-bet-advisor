import astroDataInterpretations from '../../../astrology/interpretations/astroData.json';
import { AstroData, PlanetData, Aspect, AspectType, CelestialBody, ZodiacSign, PlanetName } from '../../../types/astrology';

export const generateInterpretations = (planetaryData: PlanetData[], date: string, queryTime: string, latitude: number, longitude: number, timezone: string): AstroData => {
  const planets: Record<string, CelestialBody> = {};
  planetaryData.forEach(planet => {
    planets[planet.name] = {
      name: planet.name,
      longitude: planet.longitude,
      sign: planet.sign as ZodiacSign,
      house: planet.house,
      retrograde: planet.retrograde || false,
      speed: planet.speed || 0,
      degree: planet.degree || 0,
    };
  });

  const houseInterpretations: any = {};
  planetaryData.forEach(planet => {
    if (planet.name && planet.house) {
      const planetInterp = astroDataInterpretations[planet.name as PlanetName];
      if (planetInterp && planetInterp.houses) {
        const houseKey = `house${planet.house}`;
        const houseKeyTyped = houseKey as keyof typeof planetInterp.houses;
        const interpretation = planetInterp.houses[houseKeyTyped];
        if (interpretation) {
          if (!houseInterpretations[planet.name]) houseInterpretations[planet.name] = { houses: {} };
          houseInterpretations[planet.name].houses[houseKey] = interpretation;
        }
      }
    }
  });

  const aspects: Aspect[] = [];
  const orb = 10;
  planetaryData.forEach((planetA, indexA) => {
    planetaryData.forEach((planetB, indexB) => {
      if (indexA < indexB) {
        const deltaLon = Math.min(Math.abs(planetA.longitude - planetB.longitude), 360 - Math.abs(planetA.longitude - planetB.longitude));
        let aspectType: AspectType | null = null;
        switch (true) {
          case deltaLon < orb:
            aspectType = 'conjunction';
            break;
          case deltaLon > 180 - orb && deltaLon < 180 + orb:
            aspectType = 'opposition';
            break;
          case deltaLon > 120 - orb && deltaLon < 120 + orb:
            aspectType = 'trine';
            break;
          case deltaLon > 90 - orb && deltaLon < 90 + orb:
            aspectType = 'square';
            break;
          case deltaLon > 60 - orb && deltaLon < 60 + orb:
            aspectType = 'sextile';
            break;
          case deltaLon > 150 - orb && deltaLon < 150 + orb:
            aspectType = 'quincunx';
            break;
        }

        if (aspectType) {
          const planetPairKey = `${aspectType}_${planetA.name}_${planetB.name}`.toLowerCase();
          const aspectData = astroDataInterpretations.aspects[aspectType as AspectType];
          const influence = (aspectData as any)[planetPairKey]?.description || 'No specific interpretation available';
          aspects.push({
            from: planetA.name,
            to: planetB.name,
            type: aspectType,
            orb: deltaLon,
            influence: influence,
          });
        }
      }
    });
  });

  return {
    date: date,
    queryTime: queryTime,
    observer: { latitude: latitude, longitude: longitude, timezone: timezone },
    latitude: latitude,
    longitude: longitude,
    timezone: timezone,
    sun: planets['Sun'] || { name: 'Sun', longitude: 0, sign: 'Aries' as ZodiacSign, retrograde: false, degree: 0 },
    moon: planets['Moon'] || { name: 'Moon', longitude: 0, sign: 'Aries' as ZodiacSign, retrograde: false, phase: 0, phase_name: 'New Moon', degree: 0 },
    planets: planets,
    houses: { system: 'Placidus', cusps: [], angles: { asc: 0, mc: 0, dsc: 0, ic: 0 } },
    aspects: aspects,
    patterns: [],
    dignities: {},
    elements: { fire: { score: 0, planets: [], percentage: 0 }, earth: { score: 0, planets: [], percentage: 0 }, air: { score: 0, planets: [], percentage: 0 }, water: { score: 0, planets: [], percentage: 0 } },
    modalities: { cardinal: { score: 0, planets: [] }, fixed: { score: 0, planets: [] }, mutable: { score: 0, planets: [] } },
    moonPhase: { name: 'Unknown', value: 0, illumination: 0, nextFullMoon: new Date(), ageInDays: 0, phaseType: 'new' },
  } as AstroData;
};
