import { supabase } from '@/lib/supabase';

export interface PlayerStats {
  id: string;
  name: string;
  birth_date: string;
  sport: string;
  win_shares: number;
  stats?: {
    points?: number;
    assists?: number;
    rebounds?: number;
  };
  position?: string;
}


export interface TeamStats {
  totalPoints: number;
  totalAssists: number;
  totalRebounds: number;
  totalWinShares: number;
  playerCount: number;
}

export interface AstroData {
  moon: {
    phase: string;
    phaseValue: number;
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
    sunSaturn: string | null;
    sunJupiter: string | null;
  };
  // Additional fields that might be needed
  mars_sign?: string;
  jupiter_sign?: string;
}

export async function calculateAstrologicalImpact(
  players: PlayerStats[],
  astroData: AstroData,
  gameDate: string
): Promise<number> {
  try {
    // Calculate base score from astrological factors
    let baseScore = 0;

    // Moon phase impact (0-100)
    baseScore += calculateMoonPhaseImpact(astroData.moon.phaseValue);

    // Planetary aspects impact (0-100)
    baseScore += calculateAspectsImpact(astroData.aspects);

    // Planetary signs impact (0-100)
    baseScore += calculatePlanetarySignsImpact(astroData);

    // Mercury retrograde impact (-50 to 0)
    baseScore += astroData.mercury.retrograde ? -50 : 0;

    // Calculate player impact based on win shares
    // (Legacy - now handled in new function)

    // Combine all factors
    const totalScore = baseScore;

    // Normalize to 0-100 range
    const normalizedScore = Math.max(0, Math.min(100, totalScore));

    return normalizedScore;
  } catch (error) {
    console.error('Error calculating astrological impact:', error);
    return 50; // Return neutral score on error
  }
}

/**
 * Calculate the impact of the moon phase
 * @param moonPhase Moon phase (0-1)
 * @returns Impact score (0-100)
 */
function calculateMoonPhaseImpact(moonPhase: number): number {
  // Moon phase is 0-1 (0=new moon, 0.5=full moon)
  // New moon and full moon are most impactful
  const phaseImpact = Math.abs(moonPhase - 0.5) * 100;
  return Math.round(phaseImpact);
}

function calculateAspectsImpact(aspects: AstroData['aspects']): number {
  let impact = 0;

  // Sun-Mars aspects (conjunction/opposition are most impactful)
  if (aspects.sunMars === 'conjunction' || aspects.sunMars === 'opposition') {
    impact += 30;
  } else if (aspects.sunMars === 'square') {
    impact += 15;
  }

  // Sun-Saturn aspects (conjunction/opposition are most impactful)
  if (aspects.sunSaturn === 'conjunction' || aspects.sunSaturn === 'opposition') {
    impact -= 20; // Negative impact
  }

  // Sun-Jupiter aspects (trine is most beneficial)
  if (aspects.sunJupiter === 'trine') {
    impact += 25;
  }

  return Math.round(impact);
}

export function calculatePlanetarySignsImpact(astroData: AstroData): number {
  let impact = 0;

  // Moon in water signs (Cancer, Scorpio, Pisces) is strong
  if (["Cancer", "Scorpio", "Pisces"].includes(astroData.moon.sign)) {
    impact += 20;
  }

  // Mars in fire signs (Aries, Leo, Sagittarius) is powerful
  const marsSign = astroData.mars_sign || 'Aries'; // Default to Aries if not set
  if (["Aries", "Leo", "Sagittarius"].includes(marsSign)) {
    impact += 15;
  }

  // Jupiter in Sagittarius is very beneficial
  const jupiterSign = astroData.jupiter_sign || 'Sagittarius'; // Default to Sagittarius if not set
  if (jupiterSign === "Sagittarius") {
    impact += 25;
  }

  return Math.round(impact);
}

export async function calculatePlayerImpact(
  players: PlayerStats[],
  astroData: AstroData
): Promise<number> {
  try {
    // Get player birth data from Supabase
    const { data: birthData, error } = await supabase
      .from('players')
      .select('*')
      .in('name', players.map(p => p.name));

    if (error) throw error;

    let totalImpact = 0;
    let totalWinShares = 0;

    // Calculate impact for each player
    for (const player of players) {
      const playerData = birthData.find(p => p.name === player.name);
      if (!playerData) continue;

      // Calculate astrological impact based on birth date
      const birthImpact = calculateBirthImpact(
        new Date(playerData.birth_date || new Date().toISOString()),
        {
          ...astroData,
          // Map the new interface to the expected format for calculateBirthImpact
          aspects: {
            ...astroData.aspects, // Keep the original properties
            sun_mars: astroData.aspects.sunMars,
            sun_saturn: astroData.aspects.sunSaturn,
            sun_jupiter: astroData.aspects.sunJupiter,
            // Add the camelCase versions to satisfy the type checker
            sunMars: astroData.aspects.sunMars,
            sunSaturn: astroData.aspects.sunSaturn,
            sunJupiter: astroData.aspects.sunJupiter
          } as any // Use type assertion to handle the complex type
        }
      );

      // Weight by win shares
      totalImpact += birthImpact * player.win_shares;
      totalWinShares += player.win_shares;
    }

    // Normalize by total win shares
    return totalWinShares > 0 ? 
      Math.round(totalImpact / totalWinShares) : 0;

  } catch (error) {
    console.error('Error calculating player impact:', error);
    return 0;
  }
}

function calculateBirthImpact(
  birthDate: Date,
  astroData: AstroData & {
    aspects: {
      sun_mars: string | null;
      sun_saturn: string | null;
      sun_jupiter: string | null;
    };
  }
): number {
  // Calculate age of player
  const age = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  // Calculate impact based on age and astrological factors
  let impact = 0;

  // Younger players (under 25) benefit more from Jupiter aspects
  if (age < 25 && astroData.aspects.sun_jupiter === 'trine') {
    impact += 15;
  }

  // Older players (over 30) benefit more from Saturn aspects
  if (age > 30 && !astroData.aspects.sun_saturn) {
    impact += 10;
  }

  // Players in their prime (25-30) benefit from Mars aspects
  if (age >= 25 && age <= 30 && astroData.aspects.sun_mars) {
    impact += 20;
  }

  return Math.round(impact);
}
