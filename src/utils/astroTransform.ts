import { CelestialBody, ZodiacSign, Aspect, MoonPhaseInfo, AstroData } from '@/types/astrology';
import { GamePredictionData } from '@/types/gamePredictions';

type HookAstroData = ReturnType<typeof import('@/hooks/useAstroData')>['astroData'];

const createDefaultCelestialBody = (name: string, sign: ZodiacSign = 'Aries'): CelestialBody => ({
  name,
  sign,
  longitude: 0,
  latitude: 0,
  distance: 1,
  speed: 0,
  degree: 0,
  minute: 0,
  house: 1,
  retrograde: false,
  declination: 0,
  rightAscension: 0,
  phase: 0,
  phaseValue: 0,
  phase_name: `New ${name}`,
  magnitude: 0,
  illumination: name === 'Moon' ? 0 : 1,
  dignity: {
    score: 0,
    status: {
      ruler: false,
      exaltation: false,
      detriment: false,
      fall: false,
      triplicity: false,
      term: false,
      face: false,
    },
    essentialScore: 0,
    accidentalScore: 0,
    mutualReception: [],
  },
});

export const transformAstroData = (hookData: HookAstroData): GamePredictionData | null => {
  if (!hookData) return null;

  const observerData = hookData.observer || { latitude: 0, longitude: 0, timezone: 'UTC' };

  const planetsData: Record<string, CelestialBody> = {};
  let sunBody: CelestialBody | undefined;
  let moonBody: CelestialBody | undefined;

  if (hookData.planets) {
    for (const key in hookData.planets) {
      const p = hookData.planets[key];
      if (!p) continue;

      const baseBody = createDefaultCelestialBody(p.name || key, (p.sign as ZodiacSign) || 'Aries');
      
      const celestialBody: CelestialBody = {
        ...baseBody,
        name: p.name || key,
        longitude: p.longitude,
        sign: (p.sign as ZodiacSign) || 'Aries',
        degree: p.degree ?? (p as any).degrees ?? 0,
        minute: p.minute ?? 0,
        retrograde: p.retrograde ?? false,
        speed: (p as any).speed ?? baseBody.speed,
        latitude: (p as any).latitude ?? baseBody.latitude,
        distance: (p as any).distance ?? baseBody.distance,
        house: (p as any).house ?? baseBody.house,
        declination: (p as any).declination ?? baseBody.declination,
        rightAscension: (p as any).rightAscension ?? baseBody.rightAscension,
        phase: (p as any).phase ?? baseBody.phase,
        phaseValue: (p as any).phaseValue ?? baseBody.phaseValue,
        phase_name: (p as any).phase_name ?? baseBody.phase_name,
        magnitude: (p as any).magnitude ?? baseBody.magnitude,
        illumination: (p as any).illumination ?? baseBody.illumination,
        dignity: (p as any).dignity ?? baseBody.dignity,
      };
      
      planetsData[key.toLowerCase()] = celestialBody;
      if (key.toLowerCase() === 'sun') sunBody = celestialBody;
      if (key.toLowerCase() === 'moon') moonBody = celestialBody;
    }
  }

  const finalSunData = sunBody || createDefaultCelestialBody('Sun', (hookData.planets?.sun?.sign as ZodiacSign) || 'Aries');
  const finalMoonData = moonBody || createDefaultCelestialBody('Moon', (hookData.planets?.moon?.sign as ZodiacSign) || 'Aries');
  
  const moonPhaseData: MoonPhaseInfo = {
    name: hookData.moonPhase?.name || 'New Moon',
    value: hookData.moonPhase?.value ?? 0,
    illumination: hookData.moonPhase?.illumination ?? 0,
    nextFullMoon: hookData.moonPhase?.nextFullMoon || new Date(Date.now() + 29.53 * 24 * 60 * 60 * 1000),
    ageInDays: hookData.moonPhase?.ageInDays ?? 0,
    phaseType: hookData.moonPhase?.phaseType || 'new'
  };

  const validAspectTypes: Array<Aspect['type']> = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
  const aspectsData: Aspect[] = (hookData.aspects || []).map(hookAspect => {
    const aspectType = hookAspect.type.toLowerCase() as Aspect['type'];
    let interpretation = (hookAspect as any).interpretation || 
      (hookData.interpretations?.[`${hookAspect.planets[0]?.name}-${hookAspect.planets[1]?.name}-${hookAspect.type}`] as string);
    
    if (!interpretation) {
      interpretation = (hookData.interpretations?.[hookAspect.type] as string) || 'General influence';
    }
    
    let lackingInterpretation = '';
    if (!(hookAspect as any).interpretation && !hookData.interpretations?.[`${hookAspect.planets[0]?.name}-${hookAspect.planets[1]?.name}-${hookAspect.type}`]) {
      lackingInterpretation = `Interpretation for ${hookAspect.planets[0]?.name} ${hookAspect.type} ${hookAspect.planets[1]?.name} is pending.`;
    }
    
    if (interpretation && lackingInterpretation) {
      interpretation += ` Additionally, ${lackingInterpretation.charAt(0).toLowerCase() + lackingInterpretation.slice(1)}`;
    } else if (lackingInterpretation) {
      interpretation = lackingInterpretation;
    }

    return {
      from: hookAspect.planets[0]?.name || 'Unknown Planet',
      to: hookAspect.planets[1]?.name || 'Unknown Planet',
      type: aspectType,
      orb: hookAspect.orb,
      influence: { 
        description: interpretation,
        strength: (hookAspect as any).influence?.strength ?? 0.5,
        area: (hookAspect as any).influence?.area ?? [],
      },
      exact: Math.abs(hookAspect.orb) < 1, 
    };
  }).filter(aspect => validAspectTypes.includes(aspect.type));
  
  // Calculate element percentages based on the simplified elements format
  const calculateElementPercentages = (elements: any) => {
    // Handle case where elements is already in the correct format with percentages
    if (elements?.fire?.percentage !== undefined) {
      return elements;
    }

    // Handle case where elements is a simple object with direct percentage values
    if (elements && typeof elements.fire === 'number') {
      console.log('Processing simplified elements format:', elements);
      return {
        fire: { score: elements.fire, planets: [], percentage: Math.round(elements.fire) },
        earth: { score: elements.earth, planets: [], percentage: Math.round(elements.earth) },
        water: { score: elements.water, planets: [], percentage: Math.round(elements.water) },
        air: { score: elements.air, planets: [], percentage: Math.round(elements.air) },
      };
    }

    // Handle case where elements has score and planets
    if (elements?.fire?.score !== undefined) {
      const elementScores = {
        fire: elements.fire?.score || 0,
        earth: elements.earth?.score || 0,
        water: elements.water?.score || 0,
        air: elements.air?.score || 0,
      };

      const totalScore = Object.values(elementScores).reduce((sum, score) => sum + score, 0);
      
      if (totalScore === 0) {
        return {
          fire: { ...elements.fire || {}, percentage: 25 },
          earth: { ...elements.earth || {}, percentage: 25 },
          water: { ...elements.water || {}, percentage: 25 },
          air: { ...elements.air || {}, percentage: 25 },
        };
      }

      return {
        fire: { 
          ...elements.fire || { score: 0, planets: [] },
          percentage: Math.round((elementScores.fire / totalScore) * 100)
        },
        earth: { 
          ...elements.earth || { score: 0, planets: [] },
          percentage: Math.round((elementScores.earth / totalScore) * 100)
        },
        water: { 
          ...elements.water || { score: 0, planets: [] },
          percentage: Math.round((elementScores.water / totalScore) * 100)
        },
        air: { 
          ...elements.air || { score: 0, planets: [] },
          percentage: Math.round((elementScores.air / totalScore) * 100)
        },
      };
    }

    // Default fallback
    console.log('Using default element distribution');
    return {
      fire: { score: 0, planets: [], percentage: 25 },
      earth: { score: 0, planets: [], percentage: 25 },
      water: { score: 0, planets: [], percentage: 25 },
      air: { score: 0, planets: [], percentage: 25 },
    };
  };

  // Log the raw elements data from hookData
  console.group('Raw elements data in transformAstroData:');
  console.log('hookData.elements:', hookData.elements);
  if (hookData.elements) {
    console.log('fire:', hookData.elements.fire);
    console.log('earth:', hookData.elements.earth);
    console.log('water:', hookData.elements.water);
    console.log('air:', hookData.elements.air);
  }
  console.groupEnd();

  const elementsWithPercentages = calculateElementPercentages(hookData.elements);

  // Log the calculated percentages
  console.group('Calculated element percentages:');
  console.log('fire:', elementsWithPercentages.fire.percentage);
  console.log('earth:', elementsWithPercentages.earth.percentage);
  console.log('water:', elementsWithPercentages.water.percentage);
  console.log('air:', elementsWithPercentages.air.percentage);
  console.groupEnd();

  return {
    date: hookData.date,
    queryTime: hookData.queryTime || new Date().toISOString(),
    observer: {
      latitude: observerData.latitude,
      longitude: observerData.longitude,
      timezone: observerData.timezone,
      altitude: 0, 
    },
    sun: finalSunData,
    moon: finalMoonData,
    planets: planetsData,
    aspects: aspectsData,
    moonPhase: moonPhaseData,
    elements: elementsWithPercentages,
    modalities: hookData.modalities as any, 
    houses: hookData.houses as any,
    patterns: hookData.patterns as any,
    dignities: hookData.dignities as any,
  };
};
