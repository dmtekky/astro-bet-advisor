// src/pages/PlayerDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPlayerByApiId } from '../lib/supabase';
import { generatePlayerAstroData as getAstroData, BirthLocation } from '../lib/playerAstroService';
import { AstroData, AstroSignInfo, ZodiacSign, BattingStats, FieldingStats, Player as BasePlayer } from '../types/app.types';
import { getZodiacIllustration } from '../utils/zodiacIllustrations';
import CircularProgress from '../components/CircularProgress';
import AstroPeakDay from './AstroPeakDay';

// Extend the base Player type with additional fields
interface Player extends Omit<BasePlayer, 'id'> {
  id: string;
  player_id: string;
  full_name: string | null;
  position: string | null;
  number?: string | number | null;
  headshot_url: string | null;
  team_name?: string | null;
  impact_score?: string | number | null;
  birth_date: string | null;
  birth_location?: string | null;
  astro_influence_score?: number | null;
  // Map database fields to component props for backward compatibility
  astro_influence?: number | null;
  // Add all the missing fields from the original Player type
  [key: string]: any; // Temporary solution for missing fields
}

interface ElementComposition {
  name: string;
  percentage: number;
}

interface ElementInfluence {
  element: string;
  percentage: number;
  strength: string;
  description: string;
}

const getElementForSign = (sign: string): string => {
  const elementMap: Record<string, string> = {
    'Aries': 'Fire',
    'Taurus': 'Earth',
    'Gemini': 'Air',
    'Cancer': 'Water',
    'Leo': 'Fire',
    'Virgo': 'Earth',
    'Libra': 'Air',
    'Scorpio': 'Water',
    'Sagittarius': 'Fire',
    'Capricorn': 'Earth',
    'Aquarius': 'Air',
    'Pisces': 'Water'
  };
  return elementMap[sign] || 'Earth'; // Default to Earth if sign not found
};

const calculateElementalComposition = (astro: AstroData): ElementComposition[] => {
  const elements = ['Fire', 'Earth', 'Air', 'Water'];
  const elementCounts: Record<string, number> = {
    'Fire': 0,
    'Earth': 0,
    'Air': 0,
    'Water': 0
  };

  // Count elements from sun, moon, and ascendant signs
  elementCounts[getElementForSign(astro.sunSign.sign)] += 1.5; // Sun has more weight
  elementCounts[getElementForSign(astro.moonSign.sign)] += 1.2; // Moon has medium weight
  elementCounts[getElementForSign(astro.ascendant.sign)] += 1.0; // Ascendant has base weight

  // Calculate percentages
  const total = Object.values(elementCounts).reduce((sum, count) => sum + count, 0);
  
  return elements.map(element => ({
    name: element,
    percentage: Math.round((elementCounts[element] / total) * 100)
  }));
};

const getElementColor = (element: string): string => {
  const colors: Record<string, string> = {
    'Fire': '#ef4444',    // Red
    'Earth': '#22c55e',   // Green
    'Air': '#3b82f6',     // Blue
    'Water': '#8b5cf6'    // Purple
  };
  return colors[element] || '#6b7280'; // Default to gray
};

const getElementColorClass = (element: string): string => {
  const classes: Record<string, string> = {
    'Fire': 'bg-red-500',
    'Earth': 'bg-green-500',
    'Air': 'bg-blue-500',
    'Water': 'bg-purple-500'
  };
  return classes[element] || 'bg-gray-400';
};

const getElementEmoji = (element: string): string => {
  const emojis: Record<string, string> = {
    'Fire': '🔥',
    'Earth': '🌍',
    'Air': '💨',
    'Water': '💧'
  };
  return emojis[element] || '✨';
};

const getElementStrength = (percentage: number): string => {
  if (percentage >= 35) return 'Strong Influence';
  if (percentage >= 20) return 'Moderate Influence';
  return 'Minimal Influence';
};

const getElementDescription = (element: string, percentage: number, playerName: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    'Fire': {
      strong: `${playerName} has a powerful Fire presence (${percentage}%), bringing intense energy, passion, and competitive drive to the game. This makes ${playerName} a natural leader with a strong will to win.`,
      moderate: `A balanced Fire presence (${percentage}%) gives ${playerName} good energy and motivation, though they may need to be mindful of maintaining consistency.`,
      minimal: `With minimal Fire (${percentage}%), ${playerName} may need to work on bringing more energy and assertiveness to their game.`
    },
    'Earth': {
      strong: `A strong Earth presence (${percentage}%) gives ${playerName} exceptional reliability, consistency, and practical skills. They're the rock of the team, always delivering solid performances.`,
      moderate: `A balanced Earth presence (${percentage}%) helps ${playerName} stay grounded and focused, though they may need to work on being more adaptable.`,
      minimal: `With minimal Earth (${percentage}%), ${playerName} may need to focus on developing more consistency and reliability in their performance.`
    },
    'Air': {
      strong: `A dominant Air presence (${percentage}%) gives ${playerName} excellent mental agility, communication skills, and the ability to understand complex plays and strategies.`,
      moderate: `A good balance of Air (${percentage}%) gives ${playerName} solid mental agility and the ability to understand complex plays.`,
      minimal: `With minimal Air (${percentage}%), ${playerName} may need to work on their strategic thinking and communication on the field.`
    },
    'Water': {
      strong: `A strong Water presence (${percentage}%) gives ${playerName} exceptional emotional intelligence, intuition, and team chemistry. They're able to read the game and their teammates with ease.`,
      moderate: `A balanced Water presence (${percentage}%) helps ${playerName} connect with teammates and understand the flow of the game.`,
      minimal: `Minimal Water (${percentage}%) suggests ${playerName} may need to work on emotional awareness and team chemistry.`
    }
  };

  const strength = percentage >= 35 ? 'strong' : percentage >= 20 ? 'moderate' : 'minimal';
  return descriptions[element]?.[strength] || `${playerName}'s ${element} influence is ${strength}.`;
};

const getInfluenceStrength = (score: number): string => {
  if (score >= 90) return 'exceptionally influenced';
  if (score >= 70) return 'strongly influenced';
  if (score >= 50) return 'moderately influenced';
  if (score >= 30) return 'slightly influenced';
  return 'minimally influenced';
};

const getElementalInfluences = (astro: AstroData, playerName: string): ElementInfluence[] => {
  const elements = calculateElementalComposition(astro);
  
  return elements.map(element => ({
    element: element.name,
    percentage: element.percentage,
    strength: getElementStrength(element.percentage),
    description: getElementDescription(element.name, element.percentage, playerName)
  }));
};

// Helper to get detailed sign information (element, modality, keywords)
// This is a simplified version. In a real app, this might come from a more robust service or data source.
const zodiacDetailsMap: Record<ZodiacSign, Omit<AstroSignInfo, 'sign' | 'house'>> = {
  Aries: { element: 'Fire', modality: 'Cardinal', keywords: ['energetic', 'pioneering'] },
  Taurus: { element: 'Earth', modality: 'Fixed', keywords: ['grounded', 'sensual'] },
  Gemini: { element: 'Air', modality: 'Mutable', keywords: ['communicative', 'curious'] },
  Cancer: { element: 'Water', modality: 'Cardinal', keywords: ['nurturing', 'protective'] },
  Leo: { element: 'Fire', modality: 'Fixed', keywords: ['charismatic', 'expressive'] },
  Virgo: { element: 'Earth', modality: 'Mutable', keywords: ['analytical', 'practical'] },
  Libra: { element: 'Air', modality: 'Cardinal', keywords: ['harmonious', 'diplomatic'] },
  Scorpio: { element: 'Water', modality: 'Fixed', keywords: ['intense', 'transformative'] },
  Sagittarius: { element: 'Fire', modality: 'Mutable', keywords: ['adventurous', 'optimistic'] },
  Capricorn: { element: 'Earth', modality: 'Cardinal', keywords: ['disciplined', 'ambitious'] },
  Aquarius: { element: 'Air', modality: 'Fixed', keywords: ['innovative', 'humanitarian'] },
  Pisces: { element: 'Water', modality: 'Mutable', keywords: ['compassionate', 'imaginative'] },
};

const getFullAstroSignInfo = (signName: ZodiacSign): AstroSignInfo => {
  const details = zodiacDetailsMap[signName] || { element: 'Unknown', modality: 'Unknown', keywords: [] };
  return {
    sign: signName,
    ...details,
  };
};

const PlayerDetailPage: React.FC = () => {
  const { teamId, playerId } = useParams<{ teamId: string; playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null); // Player type from app.types.ts should align with data structure
  const [astro, setAstro] = useState<AstroData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('[PlayerDetailPage] Attempting to fetch data for playerId (player_api_id):', playerId);
      if (!playerId) { // Check if playerId is undefined
        console.error('[PlayerDetailPage] Player ID is missing from URL params.');
        setError('Player ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Use playerId (which is player_api_id from URL) to fetch player
        console.log(`[PlayerDetailPage] Calling getPlayerByApiId with: ${playerId}`);
        const fetchedPlayer = await getPlayerByApiId(playerId); // This is the critical call
        console.log('[PlayerDetailPage] Fetched player data:', fetchedPlayer);

        if (!fetchedPlayer) {
          setError('Player not found.');
          setPlayer(null);
        } else {
          // Map the fetched player data from baseball_players table to our Player type
          const formattedPlayer: Player = {
            id: fetchedPlayer.player_id,                    // Using player_id as the ID since it's the unique identifier
            player_id: fetchedPlayer.player_id,              // The external player ID
            full_name: fetchedPlayer.player_full_name || 
                     `${fetchedPlayer.player_first_name || ''} ${fetchedPlayer.player_last_name || ''}`.trim(),
            position: fetchedPlayer.player_primary_position || 'N/A',
            headshot_url: fetchedPlayer.player_official_image_src || undefined,
            birth_date: fetchedPlayer.player_birth_date || undefined,
            
            // Map optional fields
            number: fetchedPlayer.player_jersey_number ? String(fetchedPlayer.player_jersey_number) : undefined,
            team_name: fetchedPlayer.player_current_team_abbreviation || undefined,
            birth_location: fetchedPlayer.player_birth_city ? 
                         `${fetchedPlayer.player_birth_city}${fetchedPlayer.player_birth_country ? `, ${fetchedPlayer.player_birth_country}` : ''}` : 
                         undefined,
            impact_score: fetchedPlayer.impact_score ? String(fetchedPlayer.impact_score) : undefined,
            astro_influence_score: fetchedPlayer.astro_influence_score ?? undefined,
            // For backward compatibility with existing code
            astro_influence: fetchedPlayer.astro_influence_score ?? undefined,

            // Map stats fields from the database columns
            stats_batting_at_bats: fetchedPlayer.stats_batting_at_bats ?? undefined,
            stats_batting_runs: fetchedPlayer.stats_batting_runs ?? undefined,
            stats_batting_hits: fetchedPlayer.stats_batting_hits ?? undefined,
            stats_batting_rbi: fetchedPlayer.stats_batting_runs_batted_in ?? undefined,
            stats_batting_home_runs: fetchedPlayer.stats_batting_homeruns ?? undefined,
            stats_batting_strikeouts: fetchedPlayer.stats_batting_strikeouts ?? undefined,
            stats_batting_walks: fetchedPlayer.stats_batting_walks ?? undefined,
            stats_batting_avg: fetchedPlayer.stats_batting_batting_avg ?? undefined,
            stats_batting_obp: fetchedPlayer.stats_batting_on_base_pct ?? undefined,
            stats_batting_slg: fetchedPlayer.stats_batting_slugging_pct ?? undefined,
            stats_batting_ops: fetchedPlayer.stats_batting_on_base_plus_slugging_pct ?? undefined,
            stats_fielding_putouts: undefined, // Not in the current schema
            stats_fielding_assists: fetchedPlayer.stats_fielding_assists ?? undefined,
            stats_fielding_errors: fetchedPlayer.stats_fielding_errors ?? undefined,
            stats_fielding_pct: undefined, // Not in the current schema
          };
          setPlayer(formattedPlayer);

          // Log the mapped player data for debugging
          console.log('Mapped player data:', formattedPlayer);
          console.log('Raw player data:', fetchedPlayer);
          if (fetchedPlayer.astro_influence_score !== undefined) {
            console.log('Astro influence score:', fetchedPlayer.astro_influence_score);
          }
          
          // Fetch astrological data only if birth_date is available
          if (formattedPlayer.birth_date) {
            // getAstroData (generatePlayerAstroData) expects location object
            const location = formattedPlayer.birth_location ? { city: formattedPlayer.birth_location } : undefined;
            const rawAstroData = await getAstroData(formattedPlayer.birth_date, location);
            if (rawAstroData) {
              const structuredAstroData: AstroData = {
                sunSign: getFullAstroSignInfo(rawAstroData.sunSign as ZodiacSign),
                moonSign: getFullAstroSignInfo(rawAstroData.moonSign as ZodiacSign),
                ascendant: getFullAstroSignInfo(rawAstroData.ascendant as ZodiacSign),
                // rawAstroData does not contain dailyHoroscope, interpretation, or chineseZodiac directly.
                // These are optional in AstroData, so we can set them to undefined or default values.
                interpretation: undefined, // Or a default string like "Interpretation not available."
                chineseZodiac: undefined,  // Or a default string
                // dailyHoroscope is also optional in AstroData and can be omitted if not available
              };
              setAstro(structuredAstroData);
            } else {
              setAstro(null);
            }
          } else {
            setAstro(null); // No birth date, no astro data
          }
        }
      } catch (err) {
        console.error('Error fetching player or astro data:', err);
        setError('Failed to load player details.');
        setPlayer(null);
        setAstro(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <span className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading player data"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p>{error}</p>
          <a href="/dashboard" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Player Not Found</h2>
          <p>The requested player could not be found.</p>
          <a href="/dashboard" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Batting and Fielding stats extraction (similar to your Astro page)
  // Batting and Fielding stats are now directly on the 'player' object after mapping
  const battingStats: BattingStats = {
    at_bats: player.stats_batting_at_bats,
    runs: player.stats_batting_runs,
    hits: player.stats_batting_hits,
    rbi: player.stats_batting_rbi,
    home_runs: player.stats_batting_home_runs,
    strikeouts: player.stats_batting_strikeouts,
    walks: player.stats_batting_walks,
    avg: player.stats_batting_avg,
    obp: player.stats_batting_obp,
    slg: player.stats_batting_slg,
    ops: player.stats_batting_ops,
  };

  const fieldingStats: FieldingStats = {
    inningsPlayed: player.stats_fielding_innings_played,
    totalChances: player.stats_fielding_total_chances,
    fielderTagOuts: player.stats_fielding_fielder_tag_outs,
    fielderForceOuts: player.stats_fielding_fielder_force_outs,
    fielderPutOuts: player.stats_fielding_fielder_put_outs,
    outsFaced: player.stats_fielding_outs_faced,
    assists: player.stats_fielding_assists,
    errors: player.stats_fielding_errors,
    fielderDoublePlays: player.stats_fielding_fielder_double_plays,
    fielderTriplePlays: player.stats_fielding_fielder_triple_plays,
    fielderStolenBasesAllowed: player.stats_fielding_fielder_stolen_bases_allowed,
    fielderCaughtStealing: player.stats_fielding_fielder_caught_stealing,
    fielderStolenBasePct: player.stats_fielding_fielder_stolen_base_pct,
    passedBalls: player.stats_fielding_passed_balls,
    fielderWildPitches: player.stats_fielding_fielder_wild_pitches,
    fieldingPct: player.stats_fielding_fielding_pct,
    rangeFactor: player.stats_fielding_range_factor
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <main className="container mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Header Section */}
        <section className="flex flex-col items-center text-center gap-4 bg-white p-8 rounded-lg shadow-md">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600 bg-gray-100 flex items-center justify-center">
            {player.headshot_url ? (
              <img 
                src={player.headshot_url}
                alt={`${player.full_name} headshot`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150/cccccc/666666?text=No+Image';
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-800 text-xl font-bold">
                {player.full_name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-800">{player.full_name}</h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">#{player.number || 'N/A'}</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">{player.position || 'N/A'}</span>
            {player.team_name && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">{player.team_name}</span>}
          </div>
          {player.birth_date && (
            <p className="text-gray-600 mt-2">Born: {new Date(player.birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          )}
          {player.birth_location && (
            <p className="text-gray-600">From: {player.birth_location}</p>
          )}
        </section>

        {/* Influence and Impact Scores */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Astrological Influence</h2>
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center">
                <CircularProgress 
                  value={player.astro_influence_score || 0} 
                  size={160}
                  strokeWidth={12}
                  showDescription={true}
                >
                  <span className="text-3xl font-bold">
                    {player.astro_influence_score !== undefined ? Math.round(player.astro_influence_score) : 0}%
                  </span>
                  <span className="text-sm text-gray-500 mt-1">Astro Influence</span>
                </CircularProgress>
                <p className="mt-2 text-sm text-gray-600 max-w-xs text-center">
                  {player.full_name?.split(' ')[0]}'s performance may be {getInfluenceStrength(player.astro_influence_score || 0)} by today's celestial alignments.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Player Impact</h2>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-lg">Overall Impact:</p>
                <span className="font-bold text-blue-600 text-xl">{player.impact_score || 'N/A'}</span>
              </div>
              {player.impact_score && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(player.impact_score.toString()) * 10, 100)}%` }}
                  ></div>
                </div>
              )}
              <p className="mt-4 text-sm text-gray-600">
                Impact score represents the player's overall contribution based on statistical performance and astrological alignment.
              </p>

              {/* Elemental Composition Section */}
              {astro && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Elemental Composition</h3>
                  <div className="relative h-6 rounded-full bg-gray-100 shadow-inner overflow-hidden">
                    <div className="absolute inset-0 flex">
                      {calculateElementalComposition(astro).map((element, index, array) => (
                        <div 
                          key={element.name}
                          className={`h-full relative ${getElementColorClass(element.name)}`}
                          style={{
                            width: `${element.percentage}%`,
                            marginLeft: index === 0 ? '0' : '-1px',
                            zIndex: array.length - index
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                          {element.percentage > 12 && (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-overlay">
                              {element.percentage}% {element.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {calculateElementalComposition(astro).map(element => (
                      <div key={element.name} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-sm mr-2 shadow-sm"
                          style={{ backgroundColor: getElementColor(element.name) }}
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {element.name} <span className="text-gray-500">{element.percentage}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Performance Prediction Card */}
        {astro && (() => {
          // Get elemental composition for prediction basis
          const elementalComposition = calculateElementalComposition(astro);
          
          // Sort elements by percentage to find dominant elements
          const sortedElements = [...elementalComposition].sort((a, b) => b.percentage - a.percentage);
          const dominantElement = sortedElements[0].name;
          const secondaryElement = sortedElements[1].name;
          
          // Calculate overall favorability based on planetary alignments
          // For a more deterministic result, use birthdate and current date
          const playerBirthDate = new Date(player.birth_date || new Date());
          const birthDay = playerBirthDate.getDate();
          const currentDate = new Date();
          const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86400000);
          
          // Create a semi-deterministic value based on birthdate and current date
          const favorabilityValue = ((birthDay + dayOfYear) % 100) / 100;
          const isFavorable = favorabilityValue > 0.4; // Slightly bias toward favorable predictions
          
          // Get moon phase information
          const moonPhase = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'][dayOfYear % 8];
          
          // Baseball skills affected by elements
          const elementalSkills = {
            'Fire': ['power hitting', 'aggressive base running', 'fastball velocity', 'competitive drive'],
            'Earth': ['defensive consistency', 'plate discipline', 'ground ball pitching', 'endurance'],
            'Air': ['pitch recognition', 'bat speed', 'breaking ball movement', 'strategic thinking'],
            'Water': ['adaptability', 'clutch performance', 'changeup effectiveness', 'team chemistry']
          };
          
          // Generate prediction statement based on planetary status
          const getOutlookStatement = () => {
            if (isFavorable) {
              const statements = [
                `Planetary alignments are currently enhancing ${player.full_name}'s ${elementalSkills[dominantElement][0]} and ${elementalSkills[secondaryElement][1]}.`,
                `${astro.sunSign.sign}'s energy is currently boosting ${player.full_name}'s natural ${dominantElement.toLowerCase()} element attributes.`,
                `The current ${moonPhase} phase aligns well with ${player.full_name}'s ${astro.moonSign.sign} moon sign, suggesting peak performance potential.`,
                `${player.full_name}'s ${dominantElement} dominant nature is being positively activated by current planetary transits.`
              ];
              return statements[dayOfYear % statements.length];
            } else {
              const statements = [
                `Current planetary alignments may challenge ${player.full_name}'s natural ${dominantElement.toLowerCase()} element strengths.`,
                `${player.full_name}'s ${astro.sunSign.sign} energy is currently experiencing resistance from planetary transits.`,
                `The current ${moonPhase} phase creates tension with ${player.full_name}'s ${astro.moonSign.sign} moon sign.`,
                `Planetary positions suggest ${player.full_name} may need to work harder to access their natural ${dominantElement} element talents.`
              ];
              return statements[dayOfYear % statements.length];
            }
          };
          
          // Generate specific performance impacts based on dominant element
          const getPerformanceImpacts = () => {
            const impacts = [];
            
            // Add element-specific impacts
            if (dominantElement === 'Fire') {
              impacts.push(isFavorable 
                ? `Strong power hitting potential, especially against ${['left-handed', 'right-handed'][dayOfYear % 2]} pitchers`
                : `May struggle with timing on breaking balls, affecting power numbers`);
              impacts.push(isFavorable
                ? `Increased aggression on the basepaths could lead to extra bases`
                : `Risk of overaggression could lead to baserunning errors`);
            } 
            else if (dominantElement === 'Earth') {
              impacts.push(isFavorable
                ? `Exceptional defensive positioning and fielding consistency expected`
                : `May play too conservatively in high-pressure defensive situations`);
              impacts.push(isFavorable
                ? `Excellent pitch selection and plate discipline likely`
                : `Could be overly patient at the plate, missing hittable pitches`);
            }
            else if (dominantElement === 'Air') {
              impacts.push(isFavorable
                ? `Enhanced ability to read and react to complex pitch sequences`
                : `May overthink at-bats, leading to mental fatigue late in games`);
              impacts.push(isFavorable
                ? `Quick adjustments to opposing pitchers' strategies`
                : `Could struggle against pitchers with unpredictable patterns`);
            }
            else if (dominantElement === 'Water') {
              impacts.push(isFavorable
                ? `Exceptional performance in high-pressure, clutch situations`
                : `Emotional fluctuations might affect consistency`);
              impacts.push(isFavorable
                ? `Adaptive approach allows quick recovery from slumps`
                : `Might be overly influenced by team momentum swings`);
            }
            
            // Add moon sign specific impact
            impacts.push(isFavorable
              ? `${astro.moonSign.sign} moon sign suggests peak performance during ${['night games', 'day games', 'home stands', 'road trips'][dayOfYear % 4]}`
              : `${astro.moonSign.sign} moon sign suggests caution during ${['night games', 'day games', 'home stands', 'road trips'][dayOfYear % 4]}`);
            
            return impacts;
          };
          
          // Get next favorable date based on moon sign
          const getNextFavorablePeriod = () => {
            const moonSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
            const favorableSigns = [
              astro.sunSign.sign,
              astro.moonSign.sign,
              moonSigns[(moonSigns.indexOf(astro.sunSign.sign) + 4) % 12], // Trine aspect
              moonSigns[(moonSigns.indexOf(astro.sunSign.sign) + 8) % 12]  // Trine aspect
            ];
            
            const randomFavorableSign = favorableSigns[dayOfYear % favorableSigns.length];
            return `Moon in ${randomFavorableSign} (${['early', 'mid', 'late'][dayOfYear % 3]} ${['June', 'July', 'August', 'September', 'October'][dayOfYear % 5]} is optimal)`;
          };
          
          return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <div className="flex items-start">
                <div 
                  className={`flex-shrink-0 h-6 w-1 rounded-full ${
                    isFavorable ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                ></div>
                <div className="ml-4 w-full">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {isFavorable ? 'Favorable Outlook' : 'Challenging Period'}
                  </h3>
                  <p className="text-gray-700 mb-3">{getOutlookStatement()}</p>
                  
                  <div className="mb-3">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Astrological Impacts on Performance:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {getPerformanceImpacts().map((impact, index) => (
                        <li key={index} className="text-sm text-gray-600">{impact}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-sm text-indigo-600 font-medium">
                      Next favorable period: {getNextFavorablePeriod()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Astrological Insights */}
        {astro && (
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Astrological Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Sun Sign</h3>
                <div className="space-y-2">
                  <p className="text-xl font-medium">{astro.sunSign.sign || 'N/A'}</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{astro.sunSign.element}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{astro.sunSign.modality}</span>
                  </div>
                  <p className="text-sm text-gray-600 italic">{astro.sunSign.keywords.join(', ')}</p>
                  <p className="text-sm text-gray-700 mt-2">Represents core essence and personality.</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Moon Sign</h3>
                <div className="space-y-2">
                  <p className="text-xl font-medium">{astro.moonSign.sign || 'N/A'}</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{astro.moonSign.element}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{astro.moonSign.modality}</span>
                  </div>
                  <p className="text-sm text-gray-600 italic">{astro.moonSign.keywords.join(', ')}</p>
                  <p className="text-sm text-gray-700 mt-2">Reflects emotions and inner self.</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Ascendant</h3>
                <div className="space-y-2">
                  <p className="text-xl font-medium">{astro.ascendant.sign || 'N/A'}</p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{astro.ascendant.element}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{astro.ascendant.modality}</span>
                  </div>
                  <p className="text-sm text-gray-600 italic">{astro.ascendant.keywords.join(', ')}</p>
                  <p className="text-sm text-gray-700 mt-2">Represents how others perceive you.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <h3 className="font-semibold text-indigo-800 mb-2">Astrological Interpretation</h3>
              <AstroPeakDay
                player={player}
                astro={astro}
              />
            </div>
            
            <div className="mt-6">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">Compatibility</h3>
                <p className="text-gray-700">
                  {(() => {
                    // Determine compatible signs based on sun sign element
                    const elementToCompatibles: Record<string, string[]> = {
                      Fire: ['Aries', 'Leo', 'Sagittarius'],
                      Earth: ['Taurus', 'Virgo', 'Capricorn'],
                      Air: ['Gemini', 'Libra', 'Aquarius'],
                      Water: ['Cancer', 'Scorpio', 'Pisces'],
                    };
                    const sunElement = astro.sunSign.element;
                    const compatibleSigns = elementToCompatibles[sunElement] || [];
                    return `${player.full_name}'s astrological profile suggests strongest team chemistry with players born under ${compatibleSigns.join(', ')} signs.`;
                  })()}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Baseball Statistics */}
        <section className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 border-b pb-3">Baseball Statistics</h2>
          
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
              <p className="text-sm text-blue-600 font-medium">BATTING AVG</p>
              <p className="text-2xl font-bold text-gray-800">{battingStats.avg || '.000'}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
              <p className="text-sm text-green-600 font-medium">HOME RUNS</p>
              <p className="text-2xl font-bold text-gray-800">{battingStats.home_runs || '0'}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
              <p className="text-sm text-purple-600 font-medium">RBI</p>
              <p className="text-2xl font-bold text-gray-800">{battingStats.rbi || '0'}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100">
              <p className="text-sm text-yellow-600 font-medium">OPS</p>
              <p className="text-2xl font-bold text-gray-800">{battingStats.ops || '.000'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Batting Stats */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Batting Statistics</h3>
              </div>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistic</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(battingStats).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {value !== null && value !== undefined ? value : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fielding Stats */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Fielding Statistics</h3>
              </div>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistic</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(fieldingStats).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {value !== null && value !== undefined ? value : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Recent Performance Graph Placeholder */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Performance Trend</h3>
            <div className="h-48 bg-white p-4 rounded border border-gray-200 flex items-center justify-center">
              <p className="text-gray-500">Performance trend visualization will be available soon.</p>
            </div>
          </div>
        </section>

        {/* Elemental Influence Section */}
        {astro && (
          <section className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Elemental Influence</h2>
            <div className="space-y-4">
              {getElementalInfluences(astro, player?.full_name?.split(' ')[0] || 'Their').map((influence) => (
                <div key={influence.element} className="p-4 rounded-lg border-l-4 bg-gray-50" style={{ borderColor: getElementColor(influence.element) }}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-800">{influence.element}: {influence.percentage}%</h4>
                    <span className="text-sm text-gray-500">{influence.strength}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{influence.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default PlayerDetailPage;
