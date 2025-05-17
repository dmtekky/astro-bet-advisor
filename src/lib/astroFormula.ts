import { supabase } from '@/lib/supabase';


interface PlayerStats {
  name: string;
  birth_date: string;
  sport: string;
  win_shares: number;
}

interface AstroData {
  moon_phase: number;
  moon_sign: string;
  sun_sign: string;
  mercury_sign: string;
  venus_sign: string;
  mars_sign: string;
  jupiter_sign: string;
  saturn_sign: string;
  mercury_retrograde: boolean;
  aspects: {
    sun_mars: string | null;
    sun_saturn: string | null;
    sun_jupiter: string | null;
  };
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
    baseScore += calculateMoonPhaseImpact(astroData.moon_phase);

    // Planetary aspects impact (0-100)
    baseScore += calculateAspectsImpact(astroData.aspects);

    // Planetary signs impact (0-100)
    baseScore += calculatePlanetarySignsImpact(astroData);

    // Mercury retrograde impact (-50 to 0)
    baseScore += astroData.mercury_retrograde ? -50 : 0;

    // Calculate player impact based on win shares
    const playerImpact = await calculatePlayerImpact(players, astroData);

    // Combine all factors
    const totalScore = baseScore + playerImpact;

    // Normalize to 0-100 range
    const normalizedScore = Math.max(0, Math.min(100, totalScore));

    return normalizedScore;
  } catch (error) {
    console.error('Error calculating astrological impact:', error);
    return 50; // Return neutral score on error
  }
}

function calculateMoonPhaseImpact(moonPhase: number): number {
  // Moon phase is 0-1 (0=new moon, 0.5=full moon)
  // New moon and full moon are most impactful
  const phaseImpact = Math.abs(moonPhase - 0.5) * 100;
  return Math.round(phaseImpact);
}

function calculateAspectsImpact(aspects: AstroData['aspects']): number {
  let impact = 0;

  // Sun-Mars aspects (conjunction/opposition are most impactful)
  if (aspects.sun_mars === 'conjunction' || aspects.sun_mars === 'opposition') {
    impact += 30;
  } else if (aspects.sun_mars === 'square') {
    impact += 15;
  }

  // Sun-Saturn aspects (conjunction/opposition are most impactful)
  if (aspects.sun_saturn === 'conjunction' || aspects.sun_saturn === 'opposition') {
    impact -= 20; // Negative impact
  }

  // Sun-Jupiter aspects (trine is most beneficial)
  if (aspects.sun_jupiter === 'trine') {
    impact += 25;
  }

  return Math.round(impact);
}

export function calculatePlanetarySignsImpact(astroData: AstroData): number {
  let impact = 0;

  // Moon in water signs (Cancer, Scorpio, Pisces) is strong
  if (["Cancer", "Scorpio", "Pisces"].includes(astroData.moon_sign)) {
    impact += 20;
  }

  // Mars in fire signs (Aries, Leo, Sagittarius) is powerful
  if (["Aries", "Leo", "Sagittarius"].includes(astroData.mars_sign)) {
    impact += 15;
  }

  // Jupiter in Sagittarius is very beneficial
  if (astroData.jupiter_sign === "Sagittarius") {
    impact += 25;
  }

  return Math.round(impact);
}

async function calculatePlayerImpact(
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
        new Date(playerData.birth_date),
        astroData
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
  astroData: AstroData
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
