import { useState, useEffect } from 'react';
import { getZodiacSign, getZodiacIcon } from '@/lib/astroCalc';
import { calculateAstrologicalImpact } from '@/lib/astroFormula';

interface AstroData {
  moon: {
    phase: string;
    sign: string;
    icon: string;
  };
  sun: {
    sign: string;
    icon: string;
  };
  mercury: {
    retrograde: boolean;
    sign: string;
  };
  aspects: {
    sunMars: string | null;
    sunJupiter: string | null;
    sunSaturn: string | null;
  };
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  currentHour: {
    ruler: string;
    influence: string;
  };
  lunarNodes: {
    northNode: string;
    southNode: string;
  };
  celestialEvents: Array<{
    name: string;
    description: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
}

export function useAstroData() {
  const [astroData, setAstroData] = useState<AstroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAstroData = async () => {
      try {
        const now = new Date();
        const sunSign = getZodiacSign(now);
        
        // In a real app, you'd fetch this from your backend or calculate it
        // This is a simplified version with mock data
        const data: AstroData = {
          moon: {
            phase: calculateMoonPhase(now),
            sign: getZodiacSign(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), // Mock: moon changes sign ~2.5 days
            icon: getZodiacIcon(getZodiacSign(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)))
          },
          sun: {
            sign: sunSign,
            icon: getZodiacIcon(sunSign)
          },
          mercury: {
            retrograde: isMercuryRetrograde(now),
            sign: getZodiacSign(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)) // Mock: changes sign ~monthly
          },
          aspects: {
            sunMars: Math.random() > 0.5 ? 'trine' : 'square',
            sunJupiter: Math.random() > 0.7 ? 'sextile' : null,
            sunSaturn: Math.random() > 0.8 ? 'square' : null
          },
          elements: calculateElementalBalance(now),
          currentHour: getCurrentPlanetaryHour(now),
          lunarNodes: {
            northNode: 'Aries',
            southNode: 'Libra'
          },
          celestialEvents: getUpcomingCelestialEvents(now)
        };

        setAstroData(data);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching astro data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAstroData();
    
    // Update every hour
    const interval = setInterval(fetchAstroData, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { astroData, loading, error };
}

// Helper functions
function calculateMoonPhase(date: Date): string {
  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const cycle = 29.53; // days
  const knownNewMoon = new Date('2023 04 20 04:12'); // A known new moon date
  const diff = date.getTime() - knownNewMoon.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  const phase = ((days % cycle) / cycle) * 8;
  return phases[Math.floor(phase)];
}

function isMercuryRetrograde(date: Date): boolean {
  // Mock: Mercury is retrograde ~3-4 times a year for ~3 weeks
  const dayOfYear = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - 
                   Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
  return dayOfYear % 90 > 70; // Roughly 20% of the time
}

function calculateElementalBalance(date: Date) {
  // Mock: Vary elements based on time of year
  const month = date.getMonth();
  return {
    fire: 30 + (month % 3 === 0 ? 20 : 0),
    earth: 20 + (month % 3 === 1 ? 20 : 0),
    air: 25 + (month % 3 === 2 ? 20 : 0),
    water: 25 + ((month + 1) % 3 === 0 ? 20 : 0)
  };
}

function getCurrentPlanetaryHour(date: Date) {
  const hours = [
    'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'
  ];
  const influences = [
    'Confidence', 'Luck', 'Communication', 'Intuition', 'Discipline', 'Expansion', 'Action'
  ];
  const hour = date.getHours() % 7;
  return {
    ruler: hours[hour],
    influence: influences[hour]
  };
}

function getUpcomingCelestialEvents(date: Date) {
  // Mock: Return next 1-2 events
  const events = [
    {
      name: 'Perseid Meteor Shower',
      description: 'Peak meteor visibility with potential for increased luck',
      intensity: 'high' as const
    },
    {
      name: 'Full Moon in Scorpio',
      description: 'Intense energy for strategic bets',
      intensity: 'medium' as const
    }
  ];
  
  return events.slice(0, 1 + (date.getDate() % 2)); // Return 1 or 2 events
}
