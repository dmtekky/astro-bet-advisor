import { AstroData, CelestialBody, Aspect } from './astrology';

export interface GamePredictionData extends Omit<AstroData, 'latitude' | 'longitude' | 'altitude' | 'timezone'> {
  observer: {
    latitude: number;
    longitude: number;
    timezone: string;
    altitude: number;
  };
  sun: CelestialBody;
  moon: CelestialBody;
  planets: Record<string, CelestialBody>;
  aspects: Aspect[];
  moonPhase: {
    name: string;
    value: number;
    illumination: number;
  };
  elements: {
    fire: { score: number; planets: string[] };
    earth: { score: number; planets: string[] };
    water: { score: number; planets: string[] };
    air: { score: number; planets: string[] };
  };
}

export const createDefaultCelestialBody = (name: string, sign: string = 'Aries'): CelestialBody => ({
  name,
  sign: sign as any,
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

export const createDefaultPredictionData = (): GamePredictionData => ({
  date: new Date().toISOString(),
  queryTime: new Date().toISOString(),
  observer: {
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
    altitude: 0,
  },
  sun: createDefaultCelestialBody('Sun'),
  moon: createDefaultCelestialBody('Moon'),
  planets: {
    sun: createDefaultCelestialBody('Sun'),
    moon: createDefaultCelestialBody('Moon'),
    mercury: createDefaultCelestialBody('Mercury'),
    venus: createDefaultCelestialBody('Venus'),
    mars: createDefaultCelestialBody('Mars'),
    jupiter: createDefaultCelestialBody('Jupiter'),
    saturn: createDefaultCelestialBody('Saturn'),
    uranus: createDefaultCelestialBody('Uranus'),
    neptune: createDefaultCelestialBody('Neptune'),
    pluto: createDefaultCelestialBody('Pluto'),
  },
  aspects: [],
  moonPhase: {
    name: 'New Moon',
    value: 0,
    illumination: 0,
  },
  elements: {
    fire: { score: 0, planets: [] },
    earth: { score: 0, planets: [] },
    water: { score: 0, planets: [] },
    air: { score: 0, planets: [] },
  },
});
