// src/pages/players/BasketballPlayerPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getPlayerByApiId } from '../../lib/supabase';
import { generatePlayerAstroData as getAstroData, BirthLocation } from '../../lib/playerAstroService';
import PlayerHeader from '../../components/players/PlayerHeader';
import PlayerInfluenceCard from '../../components/players/PlayerInfluenceCard';
import AstroProfile from '../../components/players/AstroProfile';
import PerformancePrediction from '../../components/players/PerformancePrediction';
import PlayerStatsTable from '../../components/players/PlayerStatsTable';
import { AstroData, AstroSignInfo, ZodiacSign } from '../../types/app.types';
import { Player } from '../../types/nba.types';
import { 
  getElementalInfluences,
  ElementInfluence,
  getElementColor,
  getElementColorClass,
  getElementEmoji
} from '../../utils/elementUtils';
import { getZodiacIllustration } from '../../utils/zodiacIllustrations';

import CircularProgress from '../../components/CircularProgress';
import AstroPeakDay from '../AstroPeakDay';
import BigThreeAstroCards from '../BigThreeAstroCards';



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
  const location = useLocation();
  const [player, setPlayer] = useState<Player | null>(null); // Player type from app.types.ts should align with data structure
  const [astro, setAstro] = useState<AstroData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!playerId) {
          setError('No player ID provided.');
          setLoading(false);
          return;
        }

        console.log(`[PlayerDetailPage] Fetching NBA player with ID: ${playerId}`);
        const fetchedPlayer = await getPlayerByApiId(playerId, 'nba');
        console.log('[PlayerDetailPage] Fetched player data:', fetchedPlayer);

        if (!fetchedPlayer) {
          setError('Player not found.');
          setPlayer(null);
        } else {
          const nbaPlayer = fetchedPlayer as any;
          console.log('NBA Player Data:', nbaPlayer);
          console.log('Impact Score Raw:', nbaPlayer.impact_score, 'Type:', typeof nbaPlayer.impact_score);
          console.log('Player Stats:', {
            points_per_game: nbaPlayer.points_per_game,
            rebounds_per_game: nbaPlayer.rebounds_per_game,
            assists_per_game: nbaPlayer.assists_per_game,
            stats_points_per_game: nbaPlayer.stats_points_per_game,
            stats_rebounds_per_game: nbaPlayer.stats_rebounds_per_game,
            stats_assists_per_game: nbaPlayer.stats_assists_per_game
          });
          // Helper function to safely parse and convert values
          const safeParseFloat = (value: string | number | null | undefined, fallback: number | null = null): number | null => {
            if (value === null || value === undefined) return fallback;
            const num = typeof value === 'string' ? parseFloat(value) : Number(value);
            return isNaN(num) ? fallback : num;
          };

          // Helper function to calculate per game stats
          const getPerGameStat = (total: string | number | null | undefined, 
                                games: string | number | null | undefined, 
                                fallback: number | null = null): number | null => {
            const totalNum = safeParseFloat(total, null);
            const gamesNum = safeParseFloat(games, 1);
            if (totalNum === null || gamesNum === null || gamesNum === 0) return fallback;
            return totalNum / gamesNum;
          };

          // Helper function to calculate percentage
          const getPercentage = (made: string | number | null | undefined, 
                              attempted: string | number | null | undefined, 
                              fallback: number | null = null): number | null => {
            const madeNum = safeParseFloat(made, 0);
            const attemptedNum = safeParseFloat(attempted, 0);
            if (attemptedNum === 0) return fallback;
            return madeNum / attemptedNum;
          };

          // Map the player data to the formatted player object
          const formattedPlayer: Player = {
            id: nbaPlayer.id?.toString() || '',
            player_id: nbaPlayer.external_player_id || nbaPlayer.id?.toString() || '',
            full_name: `${nbaPlayer.first_name || ''} ${nbaPlayer.last_name || ''}`.trim(),
            position: nbaPlayer.primary_position || 'N/A',
            headshot_url: nbaPlayer.photo_url || nbaPlayer.player_official_image_src || undefined,
            birth_date: nbaPlayer.birth_date || nbaPlayer.player_birth_date || undefined,
            number: nbaPlayer.jersey_number || nbaPlayer.player_jersey_number || undefined,
            team_name: nbaPlayer.team_abbreviation || nbaPlayer.player_current_team_abbreviation || undefined,
            birth_location: nbaPlayer.birth_city || nbaPlayer.player_birth_city 
              ? `${nbaPlayer.birth_city || nbaPlayer.player_birth_city}${nbaPlayer.birth_country || nbaPlayer.player_birth_country ? `, ${nbaPlayer.birth_country || nbaPlayer.player_birth_country}` : ''}`
              : undefined,
            league: 'NBA',
            
            // Impact score and astro influence
            impact_score: safeParseFloat(nbaPlayer.impact_score, safeParseFloat(nbaPlayer.astro_influence_score, null)),
            astro_influence_score: safeParseFloat(nbaPlayer.astro_influence_score, null),
            astro_influence: safeParseFloat(nbaPlayer.astro_influence, null),

            // Basic stats - try per_game first, then calculate from totals if needed
            stats_games_played: safeParseFloat(nbaPlayer.games_played, safeParseFloat(nbaPlayer.games_started, null)),
            stats_minutes_per_game: safeParseFloat(nbaPlayer.minutes_per_game) || 
                                  getPerGameStat(nbaPlayer.minutes_played, nbaPlayer.games_played, null),
            
            // Scoring stats
            stats_points_per_game: safeParseFloat(nbaPlayer.points_per_game) || 
                                 getPerGameStat(nbaPlayer.points, nbaPlayer.games_played, null),
            
            // Rebounding stats
            stats_rebounds_per_game: safeParseFloat(nbaPlayer.rebounds_per_game) ||
                                   getPerGameStat(nbaPlayer.rebounds, nbaPlayer.games_played, null),
            stats_offensive_rebounds_per_game: safeParseFloat(nbaPlayer.offensive_rebounds_per_game) ||
                                            getPerGameStat(nbaPlayer.offensive_rebounds, nbaPlayer.games_played, null),
            stats_defensive_rebounds_per_game: safeParseFloat(nbaPlayer.defensive_rebounds_per_game) ||
                                            getPerGameStat(nbaPlayer.defensive_rebounds, nbaPlayer.games_played, null),
            
            // Other stats
            stats_assists_per_game: safeParseFloat(nbaPlayer.assists_per_game) ||
                                  getPerGameStat(nbaPlayer.assists, nbaPlayer.games_played, null),
            stats_steals_per_game: safeParseFloat(nbaPlayer.steals_per_game) ||
                                 getPerGameStat(nbaPlayer.steals, nbaPlayer.games_played, null),
            stats_blocks_per_game: safeParseFloat(nbaPlayer.blocks_per_game) ||
                                 getPerGameStat(nbaPlayer.blocks, nbaPlayer.games_played, null),
            stats_turnovers_per_game: safeParseFloat(nbaPlayer.turnovers_per_game) ||
                                    getPerGameStat(nbaPlayer.turnovers, nbaPlayer.games_played, null),
            
            // Shooting percentages
            stats_field_goal_pct: safeParseFloat(nbaPlayer.field_goal_pct) ||
                                getPercentage(nbaPlayer.field_goals_made, nbaPlayer.field_goals_attempted, null),
            stats_three_point_pct: safeParseFloat(nbaPlayer.three_point_pct) ||
                                 getPercentage(nbaPlayer.three_point_made, nbaPlayer.three_point_attempted, null),
            stats_free_throw_pct: safeParseFloat(nbaPlayer.free_throw_pct) ||
                                getPercentage(nbaPlayer.free_throws_made, nbaPlayer.free_throws_attempted, null),
            
            // Advanced stats
            stats_plus_minus: safeParseFloat(nbaPlayer.plus_minus, null),
            stats_double_doubles: safeParseFloat(nbaPlayer.double_doubles, null),
            stats_triple_doubles: safeParseFloat(nbaPlayer.triple_doubles, null),
            stats_minutes_played: safeParseFloat(nbaPlayer.minutes_played, null)
          };
          setPlayer(formattedPlayer);

          if (formattedPlayer.birth_date && formattedPlayer.birth_location) {
            const birthLocation: BirthLocation | undefined = formattedPlayer.birth_location ? {
              city: formattedPlayer.birth_location.split(',')[0]?.trim(),
              country: formattedPlayer.birth_location.split(',')[1]?.trim() || 'USA'
            } : undefined;

            try {
              const rawAstroData = await getAstroData(formattedPlayer.birth_date, birthLocation);
              const structuredAstroData: AstroData = {
                sunSign: getFullAstroSignInfo(rawAstroData.planets.sun.sign as ZodiacSign),
                moonSign: getFullAstroSignInfo(rawAstroData.planets.moon.sign as ZodiacSign),
                ascendant: getFullAstroSignInfo(rawAstroData.ascendant as ZodiacSign),
                interpretation: undefined,
                chineseZodiac: undefined
              };
              setAstro(structuredAstroData);
              console.log('[PlayerDetailPage] Generated astro data:', structuredAstroData);
            } catch (astroError) {
              console.error('Error generating astrological data:', astroError);
            }
          } else {
            setAstro(null);
          }
        }
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError(`Failed to load player data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchData();
    }
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

  // Diagnostic log to observe state before rendering
  console.log('PlayerDetailPage Render State:', {
    playerExists: !!player,
    playerId: player?.id,
    playerLeague: player?.league,
    isNBAExpected: player?.league === 'NBA',
    isLoading: loading,
    error: error
  });

  // Return early if player data is not available yet
  if (!player) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <span className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading player data"></span>
      </div>
    );
  }

  // Basketball specific stats are used directly in the JSX

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <main className="container mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Header Section */}
        <PlayerHeader player={player} />

        {/* Player Influence and Impact Card */}
        <PlayerInfluenceCard player={player} astro={astro} />

        {/* Performance Prediction */}
        {astro && <PerformancePrediction player={player} astro={astro} />}

        {/* Astrological Profile */}
        {astro && <AstroProfile player={player} astro={astro} />}

        {/* Player Statistics Table */}
        <PlayerStatsTable player={player} league={player.league} />

        {player.league !== 'NBA' && (
          <section className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 border-b pb-3">Basketball Statistics</h2>
            
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-100">
                <p className="text-sm text-orange-600 font-medium">PPG</p>
                <p className="text-2xl font-bold text-gray-800">
                  {player.stats_points_per_game !== null && player.stats_points_per_game !== undefined 
                    ? (typeof player.stats_points_per_game === 'number' 
                        ? player.stats_points_per_game.toFixed(1)
                        : parseFloat(String(player.stats_points_per_game)).toFixed(1))
                    : '0.0'}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">RPG</p>
                <p className="text-2xl font-bold text-gray-800">
                  {player.stats_rebounds_per_game !== null && player.stats_rebounds_per_game !== undefined 
                    ? (typeof player.stats_rebounds_per_game === 'number' 
                        ? player.stats_rebounds_per_game.toFixed(1)
                        : parseFloat(String(player.stats_rebounds_per_game)).toFixed(1))
                    : '0.0'}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                <p className="text-sm text-green-600 font-medium">APG</p>
                <p className="text-2xl font-bold text-gray-800">
                  {player.stats_assists_per_game !== null && player.stats_assists_per_game !== undefined 
                    ? (typeof player.stats_assists_per_game === 'number' 
                        ? player.stats_assists_per_game.toFixed(1)
                        : parseFloat(String(player.stats_assists_per_game)).toFixed(1))
                    : '0.0'}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                <p className="text-sm text-purple-600 font-medium">FG%</p>
                <p className="text-2xl font-bold text-gray-800">
                  {player.stats_field_goal_pct !== null && player.stats_field_goal_pct !== undefined 
                    ? (typeof player.stats_field_goal_pct === 'number' 
                        ? (player.stats_field_goal_pct * 100).toFixed(1)
                        : (parseFloat(String(player.stats_field_goal_pct)) * 100).toFixed(1)) + '%' 
                    : '0.0%'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Offensive Stats */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Offensive Statistics</h3>
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
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">Points Per Game</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_points_per_game || '0.0'}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">Field Goal %</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_field_goal_pct ? (parseFloat(player.stats_field_goal_pct) * 100).toFixed(1) + '%' : 'N/A'}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">3-Point %</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_three_point_pct ? (parseFloat(player.stats_three_point_pct) * 100).toFixed(1) + '%' : 'N/A'}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">Free Throw %</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_free_throw_pct ? (parseFloat(player.stats_free_throw_pct) * 100).toFixed(1) + '%' : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Defensive & Other Stats */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Defensive & Other Stats</h3>
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
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">Rebounds Per Game</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_rebounds_per_game || '0.0'}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">Assists Per Game</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_assists_per_game || '0.0'}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">Steals Per Game</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_steals_per_game || '0.0'}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">Blocks Per Game</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                          {player.stats_blocks_per_game || '0.0'}
                        </td>
                      </tr>
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
        )}
        
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
