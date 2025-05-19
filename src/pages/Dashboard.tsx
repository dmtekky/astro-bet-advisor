import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip } from 'react-tooltip';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GameCard } from '@/features/dashboard/GameCard';
import { useAstroData } from '@/hooks/useAstroData';
import { useCurrentEphemeris } from '@/hooks/useFormulaData';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import { calculateAstrologicalImpact } from '@/lib/astroFormula';
import type { Game } from '@/features/dashboard/GameCard'; // Update import to use Game interface

// Default values moved to the top to avoid usage before declaration
const defaultAspects = {
  sunMars: null,
  sunJupiter: null,
  sunSaturn: null,
  moonVenus: null,
  mercuryMars: null,
  venusMars: null
} as const;

const defaultElements = {
  fire: 0,
  earth: 0,
  air: 0,
  water: 0
};

const defaultEvent = {
  name: 'No upcoming events',
  date: new Date().toISOString(),
  intensity: 'low' as const,
  description: 'No major celestial events in the near future.'
};

const defaultSigns = {
  moon: 'Aries',
  sun: 'Aries',
  mercury: 'Taurus',
  venus: 'Gemini',
  mars: 'Cancer',
  jupiter: 'Leo',
  saturn: 'Virgo',
  uranus: 'Libra',
  neptune: 'Scorpio',
  pluto: 'Sagittarius'
};

// No sample games - we'll use real data from Supabase via the hooks

// Type definitions for astrological data
type AspectKey = keyof typeof defaultAspects;
type ElementKey = keyof typeof defaultElements;

type AspectRecord = Record<AspectKey, string | null>;
type ElementRecord = Record<ElementKey, number>;

interface CelestialEvent {
  name: string;
  date?: string;  // Make date optional
  intensity: 'low' | 'medium' | 'high';
  description: string;
  // Add other possible properties that might be used
  startTime?: string;
  endTime?: string;
  type?: string;
  icon?: string;
}

// Extend the Game interface to include required properties
interface DashboardGame extends Game {
  astroEdge: number;
  astroInfluence: string;
}

// Type for the component's local state
interface DashboardState {
  loading: boolean;
  error: Error | null;
  astroData: AstroData | null;
  games: DashboardGame[];
  nbaGames: DashboardGame[];
  mlbGames: DashboardGame[];
  lunarNodeData: {
    northNode: string;
    southNode: string;
    nextTransitDate: string | null;
    nextTransitType: 'north' | 'south' | null;
    nextTransitSign: string | null;
    upcomingTransits: Array<{ date: string; type: 'north' | 'south'; sign: string }>;
  };
}

// AstroData interface matching the hook's return type
// Base type for astro data with all possible properties
type BaseAstroData = {
  moon: {
    phase: string | number;
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
    moonVenus?: string | null;
    mercuryMars?: string | null;
    venusMars?: string | null;
  };
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  currentHour?: {
    ruler: string;
    influence: string;
  };
  lunarNodes: {
    northNode: string;
    southNode: string;
    nextTransitDate: string | null;
    nextTransitType: 'north' | 'south' | null;
    nextTransitSign: string | null;
    upcomingTransits?: Array<{
      date: string;
      type: 'north' | 'south';
      sign: string;
    }>;
  };
  celestialEvents?: CelestialEvent[];
  next_event?: CelestialEvent | null;
  moon_phase?: string | number;
  moon_sign?: string;
  mercury_retrograde?: boolean;
  mercury_sign?: string;
  venus_sign?: string;
  mars_sign?: string;
  jupiter_sign?: string;
  saturn_sign?: string;
  uranus_sign?: string;
  neptune_sign?: string;
  pluto_sign?: string;
  planetary_hour?: string;
  north_node?: string;
  south_node?: string;
  sun_sign?: string;
  sun_icon?: string;
  moonPhase?: string | number;
  moonSign?: string;
  mercuryRetrograde?: boolean;
  mercurySign?: string;
  venusSign?: string;
  marsSign?: string;
  jupiterSign?: string;
  saturnSign?: string;
  uranusSign?: string;
  neptuneSign?: string;
  plutoSign?: string;
  planetaryHour?: string;
  nextEvent?: CelestialEvent;
  [key: string]: any; // Allow additional properties
};

// Intersection type to ensure required properties are present
type AstroData = BaseAstroData & {
  moon: {
    phase: string | number;
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
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  lunarNodes: {
    northNode: string;
    southNode: string;
    nextTransitDate: string | null;
    nextTransitType: 'north' | 'south' | null;
    nextTransitSign: string | null;
  };
};

const Dashboard = () => {
  const { data: ephemerisData } = useCurrentEphemeris();
  const { astroData, loading: astroLoading, error: astroError } = useAstroData();
  
  // Fetch games for each sport
  const { games: nbaGames = [], loading: nbaLoading, error: nbaError } = useUpcomingGames('basketball_nba');
  const { games: mlbGames = [], loading: mlbLoading, error: mlbError } = useUpcomingGames('baseball_mlb');

  // Initialize state
  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    astroData: null,
    games: [],
    nbaGames: [],
    mlbGames: [],
    lunarNodeData: {
      northNode: '',
      southNode: '',
      nextTransitDate: null,
      nextTransitType: null,
      nextTransitSign: null,
      upcomingTransits: []
    }
  });

  // Update state when astroData changes
  useEffect(() => {
    if (astroData) {
      setState(prev => ({
        ...prev,
        loading: false,
        astroData,
        lunarNodeData: {
          northNode: astroData.lunarNodes?.northNode || 'Aries',
          southNode: astroData.lunarNodes?.southNode || 'Libra',
          nextTransitDate: astroData.lunarNodes?.nextTransitDate || null,
          nextTransitType: astroData.lunarNodes?.nextTransitType || null,
          nextTransitSign: astroData.lunarNodes?.nextTransitSign || null,
          upcomingTransits: astroData.lunarNodes?.upcomingTransits || []
        }
      }));
    }
  }, [astroData]);

  // Update state when games change
  useEffect(() => {
    // Only update if we have games or both loading processes are complete
    if ((nbaGames.length > 0 || mlbGames.length > 0) || (!nbaLoading && !mlbLoading)) {
      // Ensure all games have the required astroEdge and astroInfluence properties
      const processedNbaGames = (nbaGames || []).map(game => {
        // Ensure home_team and away_team are properly typed
        const homeTeam = typeof game.home_team === 'string' ? 
          { id: '', name: game.home_team, wins: 0, losses: 0 } : 
          game.home_team;
        
        const awayTeam = typeof game.away_team === 'string' ?
          { id: '', name: game.away_team, wins: 0, losses: 0 } :
          game.away_team;

        return {
          ...game,
          home_team: homeTeam,
          away_team: awayTeam,
          astroEdge: game.astroEdge ?? 0,
          astroInfluence: game.astroInfluence ?? 'Neutral',
        };
      });
      
      const processedMlbGames = (mlbGames || []).map(game => {
        // Ensure home_team and away_team are properly typed
        const homeTeam = typeof game.home_team === 'string' ? 
          { id: '', name: game.home_team, wins: 0, losses: 0 } : 
          game.home_team;
        
        const awayTeam = typeof game.away_team === 'string' ?
          { id: '', name: game.away_team, wins: 0, losses: 0 } :
          game.away_team;

        return {
          ...game,
          home_team: homeTeam,
          away_team: awayTeam,
          astroEdge: game.astroEdge ?? 0,
          astroInfluence: game.astroInfluence ?? 'Neutral',
        };
      });

      setState(prev => ({
        ...prev,
        nbaGames: processedNbaGames,
        mlbGames: processedMlbGames,
        games: [...processedNbaGames, ...processedMlbGames],
        loading: nbaLoading || mlbLoading,
        error: nbaError || mlbError || prev.error,
      }));
    }
  }, [nbaGames, mlbGames, nbaLoading, mlbLoading, nbaError, mlbError]);

  // Handle error state
  useEffect(() => {
    if (astroError || nbaError || mlbError) {
      setState(prev => ({
        ...prev,
        error: astroError || nbaError || mlbError,
        loading: false,
      }));
    }
  }, [astroError, nbaError, mlbError]);

  // Handle loading state
  if (state.loading || astroLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle error state
  if (state.error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4">
          <div className="text-red-500 text-xl mb-4">Error loading data</div>
          <p className="text-muted-foreground">{state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Destructure state for easier access
  const { astroData: safeAstroData, games, lunarNodeData } = state;

  // Initialize base data with defaults
  const baseData: AstroData = {
    moon: safeAstroData?.moon || { phase: '', sign: '', icon: '' },
    sun: safeAstroData?.sun || { sign: '', icon: '' },
    mercury: safeAstroData?.mercury || { retrograde: false, sign: '' },
    aspects: {
      ...defaultAspects,
      ...(safeAstroData?.aspects || {})
    } as AspectRecord,
    elements: {
      ...defaultElements,
      ...(safeAstroData?.elements || {})
    },
    currentHour: safeAstroData?.currentHour || { ruler: '', influence: '' },
    lunarNodes: {
      ...safeAstroData?.lunarNodes || {
        northNode: '',
        southNode: '',
        nextTransitDate: null,
        nextTransitType: null,
        nextTransitSign: null,
        upcomingTransits: []
      }
    },
    celestialEvents: safeAstroData?.celestialEvents || [],
    next_event: safeAstroData?.next_event || defaultEvent
  };

  // Default signs if not provided
  // Default signs if not provided
  const defaultSigns = {
    moon: 'Aries',
    sun: 'Aries',
    mercury: 'Taurus',
    venus: 'Gemini',
    mars: 'Cancer',
    jupiter: 'Leo',
    saturn: 'Virgo',
    uranus: 'Libra',
    neptune: 'Scorpio',
    pluto: 'Sagittarius'
  } as const;

  // Helper function to get specific astro data with defaults
  const getAstroData = (key: string, defaultValue: any) => {
    const astroData = state.astroData;
    if (!astroData) return defaultValue;
    
    // Handle nested properties using dot notation
    if (key.includes('.')) {
      const parts = key.split('.');
      let value: any = astroData;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return defaultValue;
      }
      return value;
    }
    
    // Handle specific keys
    switch(key) {
      case 'elements':
        return astroData.elements || defaultValue;
      case 'moonPhase':
        return astroData.moon?.phase || defaultValue;
      case 'moonSign':
        return astroData.moon?.sign || defaultValue;
      case 'sunSign':
        return astroData.sun?.sign || defaultValue;
      case 'sunIcon':
        return astroData.sun?.icon || defaultValue;
      case 'mercuryRetrograde':
        return astroData.mercury?.retrograde || defaultValue;
      case 'mercurySign':
        return astroData.mercury?.sign || defaultValue;
      case 'northNode':
        return astroData.lunarNodes?.northNode || defaultValue;
      case 'southNode':
        return astroData.lunarNodes?.southNode || defaultValue;
      case 'planetaryHour':
        return astroData.currentHour?.ruler || defaultValue;
      case 'aspects':
        return astroData.aspects || defaultValue;
      default:
        return defaultValue;
    }
  };

  // Calculate astro edge for a game
  const calculateAstroEdge = (game: any): number => {
    try {
      // Use default astro data with safe access
      const astroData = {
        moon_phase: typeof state.astroData?.moon?.phase === 'number' ? state.astroData.moon.phase : 0.5,
        moon_sign: state.astroData?.moon?.sign || 'Aries',
        sun_sign: state.astroData?.sun?.sign || 'Aries',
        mercury_sign: state.astroData?.mercury?.sign || 'Aries',
        venus_sign: state.astroData?.venusSign || 'Aries',
        mars_sign: state.astroData?.marsSign || 'Aries',
        jupiter_sign: state.astroData?.jupiterSign || 'Aries',
        saturn_sign: state.astroData?.saturnSign || 'Aries',
        mercury_retrograde: state.astroData?.mercury?.retrograde || false,
        aspects: {
          sun_mars: state.astroData?.aspects?.sunMars || null,
          sun_saturn: state.astroData?.aspects?.sunSaturn || null,
          sun_jupiter: state.astroData?.aspects?.sunJupiter || null
        }
      };
      
      // Simple implementation - can be enhanced with actual calculations
      let score = 50; // Start with neutral score
      
      // Example: Adjust score based on moon phase
      if (astroData.moon_phase > 0.7 || astroData.moon_phase < 0.3) {
        score += 10; // Favor new and full moons
      }
      
      // Add some variation based on team names
      try {
        const getTeamName = (team: any): string => {
          if (!team) return '';
          if (typeof team === 'string') return team;
          return team.name || '';
        };
        
        const homeTeamName = getTeamName(game.home_team);
        const awayTeamName = getTeamName(game.away_team);
        
        if (homeTeamName && awayTeamName) {
          const homeTeamHash = homeTeamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const awayTeamHash = awayTeamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          score += (homeTeamHash - awayTeamHash) % 10; // Smaller impact on astro edge
        }
      } catch (e) {
        console.warn('Error processing team names for astro edge:', e);
      }
      
      // Example: Favor certain signs
      const favoredSigns = ['Aries', 'Leo', 'Sagittarius'];
      if (favoredSigns.includes(astroData.sun_sign)) {
        score += 5;
      }
      
      // Ensure score is within 0-100 range
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating astro edge:', error);
      return 50; // Return neutral score on error
    }
  };

  // Calculate astrological impact for each game
  const calculateGameImpact = (game: any): number => {
    try {
      // Start with a base score of 50 (neutral)
      let score = 50;
      // Get team names, handling both string and Team object cases
      const getTeamName = (team: any): string => {
        if (!team) return 'Team';
        if (typeof team === 'string') return team;
        return team.name || 'Team';
      };
      const homeTeamName = getTeamName(game.home_team);
      const awayTeamName = getTeamName(game.away_team);
      // Simple hash of team names for consistent but pseudo-random scoring
      const homeTeamHash = homeTeamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const awayTeamHash = awayTeamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      // Add some variation based on team names (0-20 points)
      score += (homeTeamHash - awayTeamHash) % 21;
      // Consider game time if available
      if (game.start_time) {
        try {
          const gameTime = new Date(game.start_time);
          if (!isNaN(gameTime.getTime())) { // Check if date is valid
            const hour = gameTime.getHours();
            // Slight preference for evening games (6 PM - 11 PM)
            if (hour >= 18 && hour < 23) {
              score += 5;
            }
          }
        } catch (e) {
          console.warn('Invalid date format for game time:', game.start_time);
        }
      }
      // Ensure score is within 0-100 range
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating game impact:', error);
      return 50; // Return neutral score on error
    }
  };

  // Process games with astrological data
  const processGamesWithAstro = (games: any[]) => {
    if (!games || !Array.isArray(games)) return [];
    
    return games.map(game => {
      try {
        const astroEdge = calculateAstroEdge(game);
        const impact = calculateGameImpact(game);
        
        return {
          ...game,
          astroEdge,
          astroInfluence: getAstroInfluence(astroEdge, impact)
        };
      } catch (error) {
        console.error('Error processing game:', game, error);
        return {
          ...game,
          astroEdge: 50, // Neutral score on error
          astroInfluence: 'Neutral astrological influence'
        };
      }
    });
  };
  
  // Initialize games with astro data
  const gamesWithAstro = processGamesWithAstro(state.games);
  
  // Get astrological influence description based on score and impact
  const getAstroInfluence = (astroEdge: number, impact: number): string => {
    if (astroEdge >= 70 && impact >= 70) return 'Strong positive astrological influence';
    if (astroEdge >= 70 && impact <= 30) return 'Strong but conflicting astrological signals';
    if (astroEdge <= 30 && impact <= 30) return 'Strong negative astrological influence';
    if (astroEdge <= 30 && impact >= 70) return 'Challenging but potentially rewarding';
    if (astroEdge >= 60) return 'Favorable astrological conditions';
    if (astroEdge <= 40) return 'Challenging astrological conditions';
    return 'Neutral astrological influence';
  };
  
  // Destructure lunar node data
  const { northNode, southNode, upcomingTransits } = state.astroData?.lunarNodes || {
    northNode: 'Gemini',
    southNode: 'Sagittarius',
    upcomingTransits: []
  };

  // Helper function to convert Dashboard AstroData to astroFormula AstroData format
  const convertAstroDataFormat = (dashboardAstroData: any): any => {
    // Ensure moon_phase is always a number
    let moonPhase = 0.5; // Default value
    if (dashboardAstroData.moon?.phase !== undefined) {
      if (typeof dashboardAstroData.moon.phase === 'number') {
        moonPhase = dashboardAstroData.moon.phase;
      } else if (typeof dashboardAstroData.moon.phase === 'string') {
        // Try to parse string to number if possible
        const parsed = parseFloat(dashboardAstroData.moon.phase);
        if (!isNaN(parsed)) {
          moonPhase = parsed;
        }
      }
    }
    
    return {
      moon_phase: moonPhase,
      moon_sign: dashboardAstroData.moon?.sign || 'Aries',
      sun_sign: dashboardAstroData.sun?.sign || 'Aries',
      mercury_sign: dashboardAstroData.mercury?.sign || 'Aries',
      venus_sign: dashboardAstroData.venusSign || 'Aries',
      mars_sign: dashboardAstroData.marsSign || 'Aries',
      jupiter_sign: dashboardAstroData.jupiterSign || 'Aries',
      saturn_sign: dashboardAstroData.saturnSign || 'Aries',
      mercury_retrograde: dashboardAstroData.mercury?.retrograde || false,
      aspects: {
        sun_mars: dashboardAstroData.aspects?.sunMars || null,
        sun_saturn: dashboardAstroData.aspects?.sunSaturn || null,
        sun_jupiter: dashboardAstroData.aspects?.sunJupiter || null
      }
    };
  };

  // Calculate astrological impact for players
  const calculatePlayerImpact = async (players: any[], astroData: any, gameDate: Date) => {
    try {
      // Convert players to the expected format for astro formula
      const formattedPlayers = players.map(player => ({
        id: player.id || '',
        name: player.name || 'Unknown',
        birth_date: player.birthDate || new Date().toISOString().split('T')[0],
        sport: player.sport || 'basketball',
        win_shares: player.winShares || 0
      }));

      // Convert astroData to the format expected by calculateAstrologicalImpact
      const formulaAstroData = convertAstroDataFormat(astroData);
      
      const impact = await calculateAstrologicalImpact(
        formattedPlayers,
        formulaAstroData as any,
        gameDate.toISOString()
      );

      // Ensure the impact is within 0-100 range
      return Math.max(0, Math.min(100, Number(impact) || 0));
    } catch (error) {
      console.error('Error in calculateAstroEdge:', error);
      return 0;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* NBA Games Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">NBA Games</h2>
          <p className="text-muted-foreground">
            Upcoming NBA matchups with astrological insights
          </p>

          {state.nbaGames.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {state.nbaGames.slice(0, 3).map((game) => {
                  // Ensure game has all required properties
                  const gameWithAstro = {
                    ...game,
                    // Ensure required properties exist
                    id: game.id || `nba-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    home_team_id: game.home_team_id || '',
                    away_team_id: game.away_team_id || '',
                    home_team: game.home_team || 'Home Team',
                    away_team: game.away_team || 'Away Team',
                    start_time: game.start_time || new Date().toISOString(),
                    // Calculate astro data if not present
                    astroEdge: game.astroEdge || calculateAstroEdge(game),
                    astroInfluence: game.astroInfluence || 'Neutral astrological influence',
                    // Add default values for optional properties
                    status: game.status || 'scheduled',
                    league: game.league || 'NBA',
                    sport: game.sport || 'basketball_nba'
                  };
                  return <GameCard key={gameWithAstro.id} game={gameWithAstro} astroEdge={gameWithAstro.astroEdge} />;
                })}
              </div>
              <div className="flex justify-center mt-4">
                <Link to="/upcoming-games/nba" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  View All NBA Games →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-muted-foreground">No upcoming NBA games found.</p>
            </div>
          )}
        </div>

        {/* MLB Games Section */}
        <div className="space-y-4 mt-8">
          <h2 className="text-2xl font-bold tracking-tight">MLB Games</h2>
          <p className="text-muted-foreground">
            Upcoming MLB matchups with astrological insights
          </p>

          {state.mlbGames.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {state.mlbGames.slice(0, 3).map((game) => {
                  // Ensure game has all required properties
                  const gameWithAstro = {
                    ...game,
                    // Ensure required properties exist
                    id: game.id || `mlb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    home_team_id: game.home_team_id || '',
                    away_team_id: game.away_team_id || '',
                    home_team: game.home_team || 'Home Team',
                    away_team: game.away_team || 'Away Team',
                    start_time: game.start_time || new Date().toISOString(),
                    // Calculate astro data if not present
                    astroEdge: game.astroEdge || calculateAstroEdge(game),
                    astroInfluence: game.astroInfluence || 'Neutral astrological influence',
                    // Add default values for optional properties
                    status: game.status || 'scheduled',
                    league: game.league || 'MLB',
                    sport: game.sport || 'baseball_mlb'
                  };
                  return <GameCard key={gameWithAstro.id} game={gameWithAstro} astroEdge={gameWithAstro.astroEdge} />;
                })}
              </div>
              <div className="flex justify-center mt-4">
                <Link to="/upcoming-games/mlb" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  View All MLB Games →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-muted-foreground">No upcoming MLB games found.</p>
            </div>
          )}
        </div>

        {/* Celestial Insights Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Celestial Insights</h2>
          <p className="text-muted-foreground">
            Current astrological influences that may impact today's games and betting opportunities
          </p>

          {/* Elemental Balance - Full Width */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <CardTitle className="text-lg">Elemental Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 rounded-full overflow-hidden bg-gray-800 flex">
                  {Object.entries(getAstroData('elements', { fire: 25, earth: 25, air: 25, water: 25 })).map(([element, value]) => (
                    <div 
                      key={element}
                      className={`h-full ${
                        element === 'fire' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 
                        element === 'earth' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                        element === 'air' ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 
                        'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                      style={{ width: `${value}%` }}
                      data-tooltip-id="element-tooltip"
                      data-tooltip-content={`${element.charAt(0).toUpperCase() + element.slice(1)}: ${value}%`}
                    />
                  ))}
                  <Tooltip id="element-tooltip" />
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {Object.entries(getAstroData('elements', { fire: 25, earth: 25, air: 25, water: 25 })).map(([element, value]) => (
                    <div 
                      key={element} 
                      className="flex items-center gap-1"
                    >
                      <span className={`inline-block w-3 h-3 rounded-sm ${
                        element === 'fire' ? 'bg-gradient-to-br from-red-500 to-orange-500' : 
                        element === 'earth' ? 'bg-gradient-to-br from-amber-500 to-yellow-500' :
                        element === 'air' ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 
                        'bg-gradient-to-br from-blue-600 to-indigo-600'
                      }`} />
                      <span className="font-medium text-white/90">
                        {element.charAt(0).toUpperCase() + element.slice(1)}
                      </span>
                      <span className="text-white/60 ml-auto">
                        {String(value)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-center pt-2">
                {getElementalInfluence(getAstroData('elements', { fire: 25, earth: 25, air: 25, water: 25 }))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Moon Phase & Influence */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Moon Phase & Influence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getAstroData('moonPhase', 'Loading...')}</span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-800/40 text-blue-200">
                    {getAstroData('moonSign', '')} • {getMoonInfluence(getAstroData('moonPhase', '') as string, getAstroData('moonSign', '') as string)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {String(getMoonInfluence(
                    getAstroData('moonPhase', '') as string, 
                    getAstroData('moonSign', '') as string
                  ) || '')}
                </div>
              </CardContent>
            </Card>

            {/* Retrograde Status */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 19V5m7 7H5" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Retrograde Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {getAstroData('mercuryRetrograde', false) ? 'Mercury Retrograde' : 'Mercury Direct'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getAstroData('mercuryRetrograde', false) 
                      ? 'bg-red-800/40 text-red-200' 
                      : 'bg-green-800/40 text-green-200'
                  }`}>
                    {getMercuryInfluence(getAstroData('mercuryRetrograde', false), getAstroData('mercurySign', ''))}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getMercuryInfluence(getAstroData('mercuryRetrograde', false), getAstroData('mercurySign', ''))}
                </div>
              </CardContent>
            </Card>

            {/* Aspect Grid */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Aspect Grid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(getAstroData('aspects', {})).map(([aspect, value]) => (
                  value && (
                    <div key={aspect} className="flex justify-between text-sm">
                      <span className="capitalize">
                        {aspect.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={
                        ['square', 'opposition'].includes(value as string) 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }>
                        {String(value || '')}
                      </span>
                    </div>
                  )
                ))}
                <div className="text-xs text-muted-foreground">
                  {getAspectAdvice(getAstroData('aspects', {}))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Transits */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 12h18M12 3v18" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Daily Transits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {getAstroData('planetaryHour', 'Calculating...')} Hour
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-purple-800/40 text-purple-200">
                    {getPlanetaryHourInfluence(getAstroData('planetaryHour', ''))}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {String(getPlanetaryHourInfluence(getAstroData('planetaryHour', '')) || '')}
                </div>
              </CardContent>
            </Card>



            {/* Planetary Hours */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 8v4l2 2" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Planetary Hour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">North Node in {getAstroData('northNode', 'Aries')}</span>
                  <span className="text-xs px-2 py-1 rounded bg-cyan-800/40 text-cyan-200">Karmic Path</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getLunarNodeInfluence(getAstroData('northNode', 'Aries'), getAstroData('southNode', 'Libra'))}
                </div>
              </CardContent>
            </Card>

            {/* Lunar Nodes */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 2v20M2 12h20" strokeWidth="2" />
                  </svg>
                </span>
                <CardTitle className="text-lg">Lunar Nodes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {/* Current Nodes */}
                  <div className="p-2 rounded-lg bg-pink-900/30 border border-pink-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                        <span className="text-sm font-medium text-white">
                          North Node in {getAstroData('northNode', 'Aries')}
                        </span>
                      </div>
                      <span className="text-xs text-pink-200">
                        Current
                      </span>
                    </div>
                  </div>
                  
                  {/* Upcoming Transits */}
                  {getAstroData('lunarNodes.upcomingTransits', []).map((transit, index) => {
                    const transitDate = new Date(transit.date);
                    const isCurrent = new Date() <= transitDate && new Date() >= new Date(transitDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-2 rounded-lg ${isCurrent ? 'bg-pink-900/30 border border-pink-800' : 'bg-gray-800/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-pink-400' : 'bg-pink-400/50'}`}></div>
                            <span className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                              {transit.type === 'north' ? 'North' : 'South'} Node enters {transit.sign}
                            </span>
                          </div>
                          <span className={`text-xs ${isCurrent ? 'text-pink-200' : 'text-gray-400'}`}>
                            {transitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {isCurrent && (
                          <div className="mt-1 text-xs text-pink-200">
                            Currently in transition
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground pt-1">
                  {getLunarNodeInfluence(northNode, southNode)}
                </div>
              </CardContent>
            </Card>

            {/* Meteor Showers & Celestial Events */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M2 12l10 10 10-10" strokeWidth="2" /><path d="M12 2v20" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Celestial Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Sun in {getAstroData('sunSign', 'Loading...')} {getAstroData('sunIcon', '')}</span>
                  <span className="text-xs px-2 py-1 rounded bg-teal-800/40 text-teal-200">
                    {getSunSignQuality(getAstroData('sunSign', ''))}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getSunSignInfluence(getAstroData('sunSign', ''))}
                </div>
              </CardContent>
            </Card>

            {/* Astrological Forecast */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.42 1.42M6.34 17.66l-1.42 1.42m12.02 0l-1.42-1.42M6.34 6.34L4.92 4.92" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Astrological Forecast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Current Planetary Alignments</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Sun in Taurus</span>
                      <span className="text-amber-400">Stable</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mercury in Gemini</span>
                      <span className="text-green-400">Favorable</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Venus in Aries</span>
                      <span className="text-amber-400">Neutral</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mars in Aquarius</span>
                      <span className="text-green-400">Strong</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <h3 className="font-medium mb-2">Today's Key Aspect</h3>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-amber-400 font-medium">Jupiter Trine Moon</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Favorable for team sports and strategic plays. Look for underdogs with strong team dynamics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Utility functions for astrological influences

function getMoonInfluence(phase: string, sign: string): string {
  const phaseInfluences: Record<string, string> = {
    'New Moon': 'New beginnings and fresh starts. Good for setting new betting strategies.',
    'Waxing Crescent': 'Building energy. Good for gradually increasing bet sizes.',
    'First Quarter': 'Challenges may arise. Be decisive with your betting choices.',
    'Waxing Gibbous': 'Refinement needed. Review and adjust your betting strategies.',
    'Full Moon': 'Peak energy. Expect volatility and potential upsets.',
    'Waning Gibbous': 'Gratitude and sharing. Good for cashing out winnings.',
    'Last Quarter': 'Release and let go. Time to cut losses on underperforming strategies.',
    'Waning Crescent': 'Rest and reflection. Good for reviewing past bets.'
  };

  const signInfluences: Record<string, string> = {
    'Aries': 'Bold, aggressive plays favored.',
    'Taurus': 'Steady, reliable bets preferred.',
    'Gemini': 'Quick changes and adaptability needed.',
    'Cancer': 'Intuition is strong. Trust your gut feelings.',
    'Leo': 'Confidence is high. Go for big plays.',
    'Virgo': 'Attention to detail pays off. Analyze carefully.',
    'Libra': 'Balance is key. Consider both sides carefully.',
    'Scorpio': 'Deep analysis reveals hidden opportunities.',
    'Sagittarius': 'Luck favors the bold. Take calculated risks.',
    'Capricorn': 'Disciplined, strategic approaches work best.',
    'Aquarius': 'Innovative strategies may surprise.',
    'Pisces': 'Intuition is strong. Watch for subtle patterns.'
  };

  return `${phaseInfluences[phase] || ''} ${signInfluences[sign] || ''}`.trim();
}

function getMercuryInfluence(isRetrograde: boolean, sign: string): string {
  if (isRetrograde) {
    return 'Mercury is retrograde in ' + sign + '. Expect miscommunications and unexpected changes. Double-check all information before placing bets.';
  }
  return 'Mercury is direct in ' + sign + '. Clear communication and smooth decision-making. Good for strategic bets.';
}

function getAspectAdvice(aspects: Record<string, string | null>): string {
  const advice: string[] = [];
  
  if (aspects.sunMars === 'square' || aspects.sunMars === 'opposition') {
    advice.push('Tension in play - be cautious with aggressive bets');
  } else if (aspects.sunMars === 'trine' || aspects.sunMars === 'sextile') {
    advice.push('Strong energy for decisive action - good for confident bets');
  }

  if (aspects.sunJupiter === 'trine' || aspects.sunJupiter === 'sextile') {
    advice.push('Luck is favored - good time for higher risk/reward plays');
  }

  if (aspects.sunSaturn === 'square' || aspects.sunSaturn === 'opposition') {
    advice.push('Restrictions possible - be disciplined with bankroll management');
  }

  return advice.length > 0 
    ? advice.join('. ') + '.' 
    : 'No major aspects affecting betting conditions.';
}

function getPlanetaryHourInfluence(planet: string): string {
  const influences: Record<string, string> = {
    'Sun': 'Confidence and vitality are high. Good for bold moves and leadership positions.',
    'Moon': 'Intuition is strong. Trust your gut feelings about games.',
    'Mercury': 'Communication and analysis are favored. Good for research and strategy.',
    'Venus': 'Harmony and value are highlighted. Look for good odds and fair matchups.',
    'Mars': 'Energy and aggression are high. Good for high-stakes, competitive bets.',
    'Jupiter': 'Luck and expansion are favored. Good for parlays and long shots.',
    'Saturn': 'Discipline and structure are key. Focus on bankroll management.'
  };
  return influences[planet] || 'Neutral influence. Proceed with standard strategies.';
}

function getElementalInfluence(elements: { fire: number; earth: number; air: number; water: number }): string {
  const maxElement = Object.entries(elements).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  const influences: Record<string, string> = {
    'fire': 'High energy and action. Favorable for aggressive, high-stakes betting.',
    'earth': 'Practical and stable. Focus on consistent, reliable betting strategies.',
    'air': 'Intellectual and communicative. Good for analytical approaches and live betting.',
    'water': 'Intuitive and emotional. Trust your instincts but beware of biases.'
  };
  
  return influences[maxElement] || 'Balanced elements. No strong directional influence.';
}

function getLunarNodeInfluence(northNode: string, southNode: string): string {
  return `North Node in ${northNode} (karmic direction) and South Node in ${southNode} (karmic past). ` +
         `Focus on embracing ${northNode} energy and releasing ${southNode} tendencies in your betting approach.`;
}

function getSunSignQuality(sign: string): string {
  const qualities: Record<string, string> = {
    'Aries': 'Cardinal Fire',
    'Taurus': 'Fixed Earth',
    'Gemini': 'Mutable Air',
    'Cancer': 'Cardinal Water',
    'Leo': 'Fixed Fire',
    'Virgo': 'Mutable Earth',
    'Libra': 'Cardinal Air',
    'Scorpio': 'Fixed Water',
    'Sagittarius': 'Mutable Fire',
    'Capricorn': 'Cardinal Earth',
    'Aquarius': 'Fixed Air',
    'Pisces': 'Mutable Water'
  };
  return qualities[sign] || '';
}

function getSunSignInfluence(sign: string): string {
  const influences: Record<string, string> = {
    'Aries': 'Bold, direct action is favored. Look for aggressive plays and early leads.',
    'Taurus': 'Steady, reliable strategies work best. Focus on consistent performers.',
    'Gemini': 'Versatility and quick thinking are assets. Good for live betting and in-game adjustments.',
    'Cancer': 'Emotional intelligence is key. Pay attention to home/away dynamics.',
    'Leo': 'Confidence and showmanship shine. Favor favorites and star players.',
    'Virgo': 'Attention to detail pays off. Look for undervalued opportunities.',
    'Libra': 'Balance and fairness are highlighted. Consider both sides carefully.',
    'Scorpio': 'Intensity and transformation. Look for games with high stakes or rivalries.',
    'Sagittarius': 'Optimism and luck are favored. Good for long shots and parlays.',
    'Capricorn': 'Discipline and strategy win. Focus on fundamentals and track records.',
    'Aquarius': 'Unexpected outcomes possible. Look for innovative strategies or underdogs.',
    'Pisces': 'Intuition is strong. Trust your instincts but verify with research.'
  };
  return influences[sign] || '';
}

export default Dashboard;
