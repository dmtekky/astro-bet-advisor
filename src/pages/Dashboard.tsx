import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import GameCard from '@/components/GameCard';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { useTeams } from '@/hooks/useTeams';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Calendar, BarChart2, TrendingUp, Activity, ChevronRight, Sun, Moon, Info, Star } from 'lucide-react';
import { useAstroData } from '@/hooks/useAstroData';
import type { Team } from '@/types';
import type { Game } from '@/types';
import { calculateSportsPredictions, predictGameOutcome } from '@/utils/sportsPredictions';
import type { ModalBalance, ElementalBalance, ZodiacSign, AspectType, MoonPhase, CelestialBody, Aspect } from '@/types/astrology';
import type { GamePredictionData } from '@/types/gamePredictions';
import { createDefaultCelestialBody } from '@/types/gamePredictions';

// Extend the Team interface to include additional properties used in the component
interface ExtendedTeam extends Omit<Team, 'logo' | 'logo_url' | 'external_id'> {
  logo_url?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  record?: string;
  wins?: number;
  losses?: number;
  external_id?: string | number;
}

// Helper type for aspect influence
interface AspectInfluence {
  description: string;
  strength: number;
  area?: string[];
}

// Type definitions
interface AstrologyInfluence {
  name: string;
  impact: number;
  description: string;
  icon?: React.ReactNode;
}

interface ElementsDistribution {
  fire: number;
  earth: number;
  water: number;
  air: number;
}

// Constants
const MLB_LEAGUE_KEY = 'baseball_mlb';
const DEFAULT_LOGO = '/images/default-team-logo.png';

import AstroDisclosure from '@/components/AstroDisclosure';

const Dashboard: React.FC = () => {
  // State for today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Fetch teams and games data
  const { 
    teams, 
    teamMap, 
    teamByExternalId, 
    loading: teamsLoading, 
    error: teamsError 
  } = useTeams(MLB_LEAGUE_KEY);
  
  const { 
    games, 
    loading: gamesLoading, 
    error: gamesError 
  } = useUpcomingGames({ sport: 'baseball_mlb', limit: 12 });

  // Fetch astrological data
  const { 
    astroData, 
    loading: astroLoading, 
    error: astroError 
  } = useAstroData(selectedDate);

  // Add this useEffect to log the astroData when it changes
  useEffect(() => {
    if (astroData) {
      console.log('AstroData from API:', {
        date: astroData.date,
        sidereal: astroData.sidereal,
        sunSign: astroData.sunSign,
        elements: astroData.elements,
        moonPhase: astroData.moonPhase,
        planets: Object.keys(astroData.planets || {}),
        aspects: astroData.aspects?.length,
        interpretations: Object.keys(astroData.interpretations?.planets || {})
      });
    }
  }, [astroData]);

  // Add this useEffect to log the astroData when it changes
  useEffect(() => {
    if (astroData) {
      console.log('astroData:', JSON.stringify({
        // Only include the most relevant parts to avoid console clutter
        date: astroData.date,
        sidereal: astroData.sidereal,
        sunSign: astroData.sunSign,
        planets: {
          sun: astroData.planets?.sun,
          moon: astroData.planets?.moon
        },
        moonPhase: astroData.moonPhase,
        elements: astroData.elements,
        modalities: astroData.modalities,
        astroWeather: astroData.astroWeather,
        interpretations: {
          planets: Object.keys(astroData.interpretations?.planets || {})
        },
        aspects: astroData.aspects?.length
      }, null, 2));
    }
  }, [astroData]);

  // State for astrological influences
  const [astroInfluences, setAstroInfluences] = useState<AstrologyInfluence[]>([]);
  const [elementsDistribution, setElementsDistribution] = useState<ElementsDistribution>({
    fire: 0,
    earth: 0,
    water: 0,
    air: 0
  });

  // Calculate loading and error states
  const isLoading = astroLoading || gamesLoading || teamsLoading;
  const error = astroError || gamesError || teamsError;

  // Extract sun sign data for easy access
  const sunSign = astroData?.sunSign || 'Unknown';
  const sunDegree = astroData?.planets?.sun?.degree || 0;
  const sunMinute = astroData?.planets?.sun?.minute || 0;

  // Group games by date
  const groupedGames = useMemo(() => 
    games ? groupGamesByDate(games) : [], 
    [games]
  );

  // Format date for display
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Type alias for astroData from the hook, used by the transformer
  type HookAstroData = ReturnType<typeof useAstroData>['astroData'];

  // Standalone transformer function
  const transformHookDataToGamePredictionData = (hookData: HookAstroData): GamePredictionData | null => {
    if (!hookData) return null;

    const observerData = hookData.observer || { latitude: 0, longitude: 0, timezone: 'UTC' };

    const planetsData: Record<string, CelestialBody> = {};
    let sunBody: CelestialBody | undefined;
    let moonBody: CelestialBody | undefined;

    if (hookData.planets) {
      for (const key in hookData.planets) {
        const p = hookData.planets[key];
        if (!p) continue; // Skip if planet data is null or undefined

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
        planetsData[key.toLowerCase()] = celestialBody; // Ensure consistent casing for keys
        if (key.toLowerCase() === 'sun') sunBody = celestialBody;
        if (key.toLowerCase() === 'moon') moonBody = celestialBody;
      }
    }

    const finalSunData = sunBody || createDefaultCelestialBody('Sun', (hookData.planets?.sun?.sign as ZodiacSign) || 'Aries');
    const finalMoonData = moonBody || createDefaultCelestialBody('Moon', (hookData.planets?.moon?.sign as ZodiacSign) || 'Aries');
    
    const moonPhaseData: MoonPhase = {
      name: hookData.moonPhase?.phase || 'New Moon',
      value: (hookData.moonPhase as any)?.angle ?? (hookData.moonPhase as any)?.value ?? 0,
      illumination: hookData.moonPhase?.illumination ?? 0,
      angle: (hookData.moonPhase as any)?.angle ?? 0, 
      emoji: (hookData.moonPhase as any)?.emoji || '',
    };

    const validAspectTypes: AspectType[] = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
    const aspectsData: Aspect[] = (hookData.aspects || []).map(hookAspect => {
      const aspectType = hookAspect.type.toLowerCase() as AspectType;
      return {
        from: hookAspect.planets[0],
        to: hookAspect.planets[1],
        type: aspectType,
        orb: hookAspect.orb,
        influence: { 
          description: (hookAspect as any).interpretation || (hookAspect as any).influence?.description || 'General influence',
          strength: (hookAspect as any).influence?.strength ?? 0.5,
          area: (hookAspect as any).influence?.area ?? [],
        },
        exact: Math.abs(hookAspect.orb) < 1, 
      };
    }).filter(aspect => validAspectTypes.includes(aspect.type));
    
    const gamePredictionInput: GamePredictionData = {
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
      elements: hookData.elements || {
        fire: { score: 0, planets: [] },
        earth: { score: 0, planets: [] },
        water: { score: 0, planets: [] },
        air: { score: 0, planets: [] },
      },
      modalities: hookData.modalities as ModalBalance | undefined,
      houses: hookData.houses as any, 
      patterns: hookData.patterns as any, 
      dignities: hookData.dignities as any, 
    };
    return gamePredictionInput;
  };

  // Get sports predictions from astrological data
  const sportsPredictions = useMemo(() => {
    if (!astroData) return null;
    const transformedData = transformHookDataToGamePredictionData(astroData);
    return calculateSportsPredictions(transformedData);
  }, [astroData, transformHookDataToGamePredictionData]);

  // Create a memoized function to get game-specific predictions
  const getGamePrediction = useCallback(
    (game: Game, homeTeam?: Team, awayTeam?: Team) => {
      const rawAstro = gameAstroData[game.id];
      if (!rawAstro) {
        console.warn(`No astro data for game ${game.id} in getGamePrediction`);
        return null;
      }
      // Ensure rawAstro is treated as HookAstroData, which might be AstroData | null | undefined
      const transformedAstro = transformHookDataToGamePredictionData(rawAstro as HookAstroData);
      if (!transformedAstro) {
        console.warn(`Failed to transform astro data for game ${game.id}`);
        return null;
      }
      return predictGameOutcome(transformedAstro, game, homeTeam, awayTeam);
    },
    [gameAstroData, transformHookDataToGamePredictionData]
  );

  // Helper function to find a team with proper type casting
  const findTeam = (teamId: string): Team | undefined => {
    const team = teamMap?.[teamId] as ExtendedTeam | undefined;
    if (!team) return undefined;
    
    const teamData: Team = {
      id: team.id || teamId,
      name: team.name || 'Unknown Team',
      abbreviation: team.abbreviation || team.name?.substring(0, 3).toUpperCase() || 'TBD',
      logo_url: team.logo_url || team.logo || DEFAULT_LOGO,
      sport: 'baseball_mlb' 
    };
    // Add external_id if it exists
    if (team.external_id !== undefined) {
      (teamData as any).external_id = String(team.external_id);
    }
    
    // Add optional properties if they exist
    if (team.city) teamData.city = team.city;
    
    return teamData;
  };

  // Process astrological data when it's available
  useEffect(() => {
    if (astroData && !astroLoading) {
      console.log('AstroData received:', astroData);
      
      // Initialize element scores
      let fireScore = 0;
      let earthScore = 0;
      let waterScore = 0;
      let airScore = 0;
      
      // Process elements from astroData
      if (astroData.elements) {
        const elements = astroData.elements as any;
        
        if (typeof elements.fire === 'number') {
          fireScore = elements.fire || 0;
          earthScore = elements.earth || 0;
          waterScore = elements.water || 0;
          airScore = elements.air || 0;
        } else if (elements.fire && typeof elements.fire === 'object') {
          fireScore = elements.fire.score || 0;
          earthScore = elements.earth?.score || 0;
          waterScore = elements.water?.score || 0;
          airScore = elements.air?.score || 0;
        }
      }
      
      // Only update if we have valid element data
      const totalElements = fireScore + earthScore + waterScore + airScore;
      if (totalElements > 0) {
        setElementsDistribution({
          fire: Math.round((fireScore / totalElements) * 100),
          earth: Math.round((earthScore / totalElements) * 100),
          water: Math.round((waterScore / totalElements) * 100),
          air: Math.round((airScore / totalElements) * 100)
        });
      }

      // Format astrological influences
      const influences: AstrologyInfluence[] = [];
      
      // Always use the API's sign property for the Sun in sidereal mode
      let sunSign = '';
      let isSidereal = false;
      
      if (astroData.planets?.sun?.sign) {
        sunSign = astroData.planets.sun.sign;
        isSidereal = Boolean(astroData.sidereal);
      }
      // Fallback to positions array if planets.sun is missing
      else if (astroData.positions) {
        const sunPosition = astroData.positions.find((p: any) => p.planet?.toLowerCase() === 'sun');
        if (sunPosition) {
          sunSign = sunPosition.sign;
          isSidereal = true;
        }
      }
      // Fallback to sun object
      else if (astroData.sun?.sign) {
        sunSign = astroData.sun.sign;
        isSidereal = Boolean(astroData.sidereal);
      }
      
      console.log('UI Sun sign:', sunSign, 'astroData.planets.sun:', astroData.planets?.sun);
      
      // Sun Position is now handled in a dedicated, visually distinct panel below the Moon & Void Status panel. Remove from influences.
      
      // Add moon phase influence if available
      const moonPhase = astroData.moon?.phase_name || (astroData.planets?.moon as any)?.phase_name;
      if (moonPhase) {
        influences.push({
          name: 'Lunar Influence',
          impact: 0.7,
          description: `${moonPhase} Moon ${getMoonPhaseImpact(moonPhase)}`,
          icon: <Moon className="h-5 w-5 text-slate-400" />
        });
      }
      
      // Add retrograde planets if any
      const retrogradePlanets = [];
      if (astroData.planets) {
        Object.entries(astroData.planets).forEach(([planet, data]: [string, any]) => {
          if (data?.retrograde) {
            retrogradePlanets.push(planet);
          }
        });
      }
      
      if (retrogradePlanets.length > 0) {
        const planetNames = retrogradePlanets.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
        influences.push({
          name: 'Retrograde Planets',
          impact: 0.6,
          description: `${planetNames} ${retrogradePlanets.length > 1 ? 'are' : 'is'} retrograde, which may affect ${retrogradePlanets.length > 1 ? 'their' : 'its'} related aspects of the game`,
          icon: <Info className="h-5 w-5 text-orange-500" />
        });
      }
      
      // Add dominant element influence if we have element data
      if (totalElements > 0) {
        const elementScores = { fire: fireScore, earth: earthScore, air: airScore, water: waterScore };
        const dominantEntry = Object.entries(elementScores).sort((a, b) => b[1] - a[1])[0];
        
        if (dominantEntry && dominantEntry[1] > 0) {
          const [dominantElement, score] = dominantEntry as [keyof ElementsDistribution, number];
          influences.push({
            name: 'Dominant Element',
            impact: Math.min(0.9, 0.5 + (score / totalElements)),
            description: `Strong ${dominantElement} influence (${Math.round((score / totalElements) * 100)}%) affects player ${getElementImpact(dominantElement)}`,
            icon: <Activity className="h-5 w-5 text-indigo-500" />
          });
        }
      }
      
      setAstroInfluences(influences);
    }
  }, [astroData]);

  // Helper functions for astrological descriptions
  function getSunSignImpact(sign: string): string {
    const impacts: Record<string, string> = {
      'Aries': 'assertive and competitive',
      'Taurus': 'consistent and determined',
      'Gemini': 'adaptable and strategic',
      'Cancer': 'intuitive and defensive',
      'Leo': 'confident and dominant',
      'Virgo': 'analytical and precise',
      'Libra': 'balanced and fair',
      'Scorpio': 'intense and tactical',
      'Sagittarius': 'optimistic and risk-taking',
      'Capricorn': 'disciplined and methodical',
      'Aquarius': 'innovative and unpredictable',
      'Pisces': 'intuitive and fluid'
    };
    return impacts[sign] || 'influential';
  }

  function getMoonPhaseImpact(phase: string): string {
    const impacts: Record<string, string> = {
      'New Moon': 'suggests fresh strategies and new beginnings',
      'Waxing Crescent': 'brings building momentum and growing confidence',
      'First Quarter': 'favors decisive action and breakthrough moments',
      'Waxing Gibbous': 'enhances skill refinement and preparation',
      'Full Moon': 'amplifies performance intensity and visibility',
      'Waning Gibbous': 'supports teamwork and collaborative efforts',
      'Last Quarter': 'indicates strategic adjustments and reassessment',
      'Waning Crescent': 'suggests introspection and renewal'
    };
    return impacts[phase] || 'influences game dynamics';
  }

  function getElementImpact(element: string): string {
    const impacts: Record<string, string> = {
      'fire': 'aggression and risk-taking',
      'earth': 'endurance and reliability',
      'air': 'strategy and communication',
      'water': 'intuition and flow'
    };
    return impacts[element.toLowerCase()] || 'performance';
  }

  function getSunElement(sign: string): string {
    const elements: Record<string, string> = {
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
    return elements[sign] || '—';
  }

  function getSunSportsInfluences(astroData: any): { text: string; color: string }[] {
    const influences: { text: string; color: string }[] = [];
    
    if (!astroData) return influences;
    
    // Use the sunSign property directly from the API response
    if (astroData.sunSign) {
      const sign = astroData.sunSign;
      const element = getSunElement(sign);

      influences.push({
        text: `The Sun in ${sign} brings ${getSunSignImpact(sign)} energy to today's games`,
        color: element === 'Fire' ? 'bg-red-500' : element === 'Earth' ? 'bg-green-500' : element === 'Air' ? 'bg-sky-300' : 'bg-indigo-500'
      });
    }

    if (astroData.planets?.sun?.degree !== undefined) {
      const degree = Math.round(astroData.planets.sun.degree);
      influences.push({
        text: `The Sun is at ${degree}°, which may indicate ${getDegreeImpact(degree)} performance`,
        color: 'bg-orange-500'
      });
    }

    return influences;
  }

  function getDegreeImpact(degree: number): string {
    const impacts: Record<string, string> = {
      '0-10': 'strong start',
      '11-20': 'building momentum',
      '21-30': 'peak performance'
    };
    const range = Object.keys(impacts).find((r) => {
      const [start, end] = r.split('-').map((n) => parseInt(n));
      return degree >= start && degree <= end;
    });
    return impacts[range] || 'variable';
  }

  // Update the daily recommendation to use real data
  const dailyRecommendation = useMemo(() => {
    if (!astroData) return '';
    
    if (sportsPredictions?.prediction) {
      return sportsPredictions.prediction;
    }
    
    // Fallback to element-based recommendation if no specific prediction
    const dominantElement = Object.entries(elementsDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as keyof ElementsDistribution;
    
    let recommendation = "Today's celestial influences suggest " + 
      (dominantElement === 'fire' ? 'an aggressive playing style could be advantageous. ' :
       dominantElement === 'earth' ? 'teams with strong fundamentals may excel. ' :
       dominantElement === 'air' ? 'strategic and adaptive play could be key. ' :
       'teams that trust their intuition might have an edge. ');
    
    if (astroData.moon?.phase_name) {
      recommendation += getMoonPhaseImpact(astroData.moon.phase_name);
    }
    
    return recommendation;
  }, [astroData, elementsDistribution, sportsPredictions]);

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen w-full"
        style={{
          background: 'linear-gradient(135deg, #4338ca20 0%, #6366f110 100%)',
        }}
      >
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Star className="h-6 w-6 mr-2 text-yellow-500 fill-yellow-400" />
                Astro Plays
              </h1>
              <p className="text-slate-500 mt-1">{formattedDate}</p>
            </div>
            <Badge variant="outline" className="bg-white/50 backdrop-blur-sm px-3 py-1 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Daily Forecast</span>
            </Badge>
          </div>

          {/* Main Content */}
          {isLoading ? (
            // Loading state for games and teams
            <div className="space-y-8">
              <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-64 rounded-xl" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-48 rounded-xl" />
                </CardContent>
              </Card>
            </div>
          ) : error ? (
            // Error state
            <Alert variant="destructive" className="bg-white/70 backdrop-blur-sm">
              <AlertDescription>
                {error.message || 'An error occurred while loading data. Please try again later.'}
              </AlertDescription>
            </Alert>
          ) : (
            // Content when data is loaded
            <div className="space-y-8">
              {/* Upcoming Games Section */}
              <section>
                <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                        Upcoming Games
                      </CardTitle>
                      <Badge variant="outline" className="text-xs font-medium">
                        MLB
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-10">
                      {groupedGames.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <p>No upcoming games scheduled.</p>
                        </div>
                      ) : (
                        groupedGames.slice(0, 3).map(({ date, games: dateGames }) => (
                          <div key={date.toString()} className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                                {formatGameDate(date.toString())}
                              </h3>
                              <span className="text-sm text-slate-500">
                                {dateGames.length} {dateGames.length === 1 ? 'game' : 'games'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {dateGames.map((game) => {
                                console.log('[Dashboard] Game ID:', game.id);
                                console.log('[Dashboard] Game Object:', game);
                                
                                // Extract team data from the game object (from nested relations)
                                const homeTeamData = typeof game.home_team === 'object' ? game.home_team : findTeam(game.home_team);
                                const awayTeamData = typeof game.away_team === 'object' ? game.away_team : findTeam(game.away_team);
                                
                                // Use our memoized function to get game prediction
                                const gamePrediction = getGamePrediction(game, homeTeamData, awayTeamData);
                                
                                // Create a clean game object with all necessary fields
                                const gameWithPrediction = {
                                  ...game,
                                  // Ensure we're using the team IDs, not the full team objects
                                  home_team: homeTeamData?.id || game.home_team,
                                  away_team: awayTeamData?.id || game.away_team,
                                  astroPrediction: gamePrediction?.prediction,
                                  homeEdge: gamePrediction?.homeWinProbability,
                                  moonPhase: gamePrediction?.moonPhase,
                                  sunSign: gamePrediction?.sunSign,
                                  dominantElement: gamePrediction?.dominantElement,
                                  confidence: gamePrediction?.confidence
                                };
                                
                                return (
                                  <GameCard
                                    key={game.id}
                                    game={gameWithPrediction}
                                    homeTeam={homeTeamData}
                                    awayTeam={awayTeamData}
                                    defaultLogo={DEFAULT_LOGO}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Astrological Insights Section */}
              <section>
                <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold flex items-center">
                        <Star className="h-5 w-5 mr-2 text-indigo-600" />
                        Sidereal Astrological Insights
                      </CardTitle>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help">
                              <Info className="h-3.5 w-3.5 mr-1" />
                              Today's Influence
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-80 text-sm">
                              These sidereal astrological insights show the actual positions of celestial bodies
                              in the sky. Unlike tropical astrology, sidereal positions account for the precession
                              of the equinoxes and match what you see with telescopes.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Elements Distribution - now at the top as a full-width bar */}
                      <div className="space-y-4 bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700/50 shadow-lg">
                        <div className="flex items-center justify-between">
                          <h3 className="text-md font-medium text-slate-100 flex items-center">
                            <BarChart2 className="h-4 w-4 mr-2 text-indigo-400" />
                            Elements Distribution
                          </h3>
                          <span className="text-xs font-medium text-slate-300 bg-slate-700/50 px-2 py-1 rounded-full border border-slate-600/50">
                            Today's Energy
                          </span>
                        </div>
                        
                        <div className="relative">
                          <div className="w-full bg-slate-700/50 rounded-full shadow-inner border border-slate-600/30 flex h-4 overflow-hidden relative">
                            {/* Background glow effect */}
                            <div 
                              className="absolute inset-0 w-full h-full rounded-full"
                              style={{
                                background: `linear-gradient(
                                  90deg,
                                  rgba(239, 68, 68, 0.15) 0%,
                                  rgba(16, 185, 129, 0.15) 33%,
                                  rgba(56, 189, 248, 0.15) 66%,
                                  rgba(99, 102, 241, 0.15) 100%
                                )`,
                                filter: 'blur(4px)'
                              }}
                            />
                            
                            {/* Individual bars with new gradient styling */}
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                              style={{ 
                                width: `${elementsDistribution.fire}%`,
                                clipPath: 'polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0% 100%)'
                              }}
                            />
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                              style={{ 
                                width: `${elementsDistribution.earth}%`,
                                marginLeft: '-8px',
                                clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0% 100%)'
                              }}
                            />
                            <div
                              className="h-full bg-gradient-to-r from-sky-400 to-sky-300 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                              style={{ 
                                width: `${elementsDistribution.air}%`,
                                marginLeft: '-8px',
                                clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0% 100%)'
                              }}
                            />
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                              style={{ 
                                width: `${elementsDistribution.water}%`,
                                marginLeft: '-8px',
                                clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0% 100%)',
                                borderTopRightRadius: '9999px',
                                borderBottomRightRadius: '9999px'
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Legend below the bar */}
                        <div className="grid grid-cols-4 gap-1.5 mt-3">
                          {[
                            { 
                              name: 'Fire', 
                              color: 'bg-gradient-to-r from-red-500 to-red-400',
                              glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
                              value: elementsDistribution.fire 
                            },
                            { 
                              name: 'Earth', 
                              color: 'bg-gradient-to-r from-green-500 to-green-400',
                              glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]',
                              value: elementsDistribution.earth 
                            },
                            { 
                              name: 'Air', 
                              color: 'bg-gradient-to-r from-sky-400 to-sky-300',
                              glow: 'shadow-[0_0_8px_rgba(56,189,248,0.6)]',
                              value: elementsDistribution.air 
                            },
                            { 
                              name: 'Water', 
                              color: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
                              glow: 'shadow-[0_0_8px_rgba(99,102,241,0.6)]',
                              value: elementsDistribution.water 
                            }
                          ].map((item) => (
                            <div key={item.name} className="flex flex-col items-center">
                              <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-slate-700/30 border border-slate-600/30">
                                <div className={`h-3 w-3 rounded-sm ${item.color} ${item.glow}`}></div>
                                <span className="text-xs font-medium text-slate-200">
                                  {item.name}
                                </span>
                                <span className="text-xs font-semibold text-white ml-auto">
                                  {item.value}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Today's Analysis Card */}
                      <Card className="border-slate-200/70 bg-gradient-to-br from-indigo-50/80 to-slate-50/80 backdrop-blur-sm overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-600"></div>
                        <CardContent className="pt-6 pb-5">
                          <div className="flex items-start">
                            <div className="p-2 bg-indigo-100 rounded-lg mr-3 mt-0.5">
                              <TrendingUp className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800 flex items-center">
                                Today's Astrological Analysis
                              </h4>
                              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                                {dailyRecommendation || 'Analyzing today\'s celestial patterns...'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sun Position Panel - visually distinct */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="mt-4"
                      >
                        <Card className="relative overflow-visible border-0 shadow-xl bg-gradient-to-br from-yellow-50/90 to-amber-100/80 backdrop-blur-lg">
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[96%] h-1.5 rounded-b-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 blur-sm opacity-80 animate-pulse" />
                          <CardHeader className="pb-2 flex flex-row items-center gap-2">
                            <Sun className="h-7 w-7 text-amber-500 drop-shadow-lg animate-spin-slow" />
                            <div className="flex-1 flex items-center">
                              <CardTitle className="text-lg font-bold text-amber-700 tracking-wide flex items-center gap-2">
                                Sun in {sunSign || '—'}
                                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-700 text-xs font-semibold shadow">
                                  {getSunElement(sunSign || '')}
                                </span>
                                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5 shadow">
                                  {sunDegree !== undefined
                                    ? `${Math.round(sunDegree)}° ${sunMinute}'`
                                    : '—'}
                                </span>
                              </CardTitle>
                            </div>
                          </CardHeader>
                          {sunSign && (
                            <p className="text-sm text-amber-800 mt-1 pl-9">
                              The Sun in {sunSign} brings {getSunSignImpact(sunSign)} energy to today's games
                            </p>
                          )}
                          <CardContent className="pt-0 pb-4">
                            <div className="mt-2 space-y-2">
                              {getSunSportsInfluences(astroData).map((influence, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${influence.color} shadow`} />
                                  <span className="text-sm text-amber-900 font-medium drop-shadow-sm">
                                    {influence.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        {/* Celestial Influences Panel */}
                        <div className="space-y-6">
                          <h3 className="text-md font-medium text-slate-900 flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-indigo-500" />
                            Celestial Influences
                          </h3>
                          <div className="space-y-4">
                            {astroInfluences.length === 0 ? (
                              <div className="text-center py-4 text-slate-500">
                                <p>No astrological data available for today.</p>
                              </div>
                            ) : (
                              astroInfluences.map((influence, index) => (
                                <Card key={index} className="bg-white/70 border-slate-200/70">
                                  <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5">
                                        {influence.icon}
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-slate-900">{influence.name}</h4>
                                        <p className="text-sm text-slate-600 mt-1">{influence.description}</p>
                                        <div className="mt-2">
                                          <Progress 
                                            value={influence.impact * 100} 
                                            className="h-1.5 bg-slate-100"
                                          />
                                          <p className="text-xs text-slate-500 mt-1 text-right">{Math.round(influence.impact * 100)}% Impact</p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>

                          {/* Moon & Void Status Panel */}
                          {(astroData?.moonPhase || astroData?.moon_phase || astroData?.voidMoon || astroData?.void_of_course_moon) && (
                            <Card className="bg-white/70 border-slate-200/70">
                              <CardHeader>
                                <h4 className="font-medium text-slate-900 flex items-center">
                                  <Moon className="h-4 w-4 mr-2 text-indigo-400" />
                                  Moon & Void Status
                                </h4>
                              </CardHeader>
                              <CardContent className="pt-2 space-y-2">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="text-xs text-slate-500">Phase</div>
                                    <div className="font-semibold text-slate-800">
                                      {astroData?.moonPhase?.phase || astroData?.moon_phase?.phase_name || '—'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500">Illumination</div>
                                    <div className="font-semibold text-slate-800">
                                      {astroData?.moonPhase?.illumination !== undefined
                                        ? `${Math.round(astroData.moonPhase.illumination * 100)}%`
                                        : astroData?.moon_phase?.illumination !== undefined
                                          ? `${Math.round(astroData.moon_phase.illumination * 100)}%`
                                          : '—'}
                                    </div>
                                  </div>
                                  {astroData?.voidMoon?.isVoid !== undefined || astroData?.void_of_course_moon?.is_void !== undefined ? (
                                    <div>
                                      <div className="text-xs text-slate-500">Void of Course</div>
                                      <div className="font-semibold text-slate-800">
                                        {(astroData?.voidMoon?.isVoid ?? astroData?.void_of_course_moon?.is_void) ? 'Yes' : 'No'}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                                {astroData?.voidMoon?.isVoid || astroData?.void_of_course_moon?.is_void ? (
                                  <div className="text-xs text-amber-700 mt-1">
                                    Void from {astroData?.voidMoon?.start || astroData?.void_of_course_moon?.start || '—'} to {astroData?.voidMoon?.end || astroData?.void_of_course_moon?.end || '—'}
                                  </div>
                                ) : null}
                              </CardContent>
                            </Card>
                          )}

                          {/* Modalities Distribution Panel (optional) */}
                          {astroData?.modalities && (
                            <Card className="bg-white/70 border-slate-200/70">
                              <CardHeader>
                                <h4 className="font-medium text-slate-900 flex items-center">
                                  <BarChart2 className="h-4 w-4 mr-2 text-indigo-400" />
                                  Modalities Distribution
                                </h4>
                              </CardHeader>
                              <CardContent className="pt-2 space-y-2">
                                {['cardinal', 'fixed', 'mutable'].map((mod) => (
                                  <div key={mod} className="flex justify-between items-center">
                                    <span className="capitalize text-sm text-slate-700">{mod}</span>
                                    <span className="text-xs text-slate-500">
                                      {astroData.modalities[mod]?.score ?? 0}%
                                    </span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {/* Planetary Interpretations Panel */}
                          {astroData?.interpretations?.planets && Object.keys(astroData.interpretations.planets).length > 0 && (
                            <Card className="bg-white/70 border-slate-200/70">
                              <CardHeader>
                                <h4 className="font-medium text-slate-900 flex items-center">
                                  <Sun className="h-4 w-4 mr-2 text-amber-400" />
                                  Planetary Interpretations
                                </h4>
                              </CardHeader>
                              <CardContent className="pt-2 space-y-2">
                                {Object.entries(astroData.interpretations.planets).map(([planet, interp]) => (
                                  <div key={planet} className="mb-2">
                                    <span className="font-semibold text-indigo-700 mr-2 capitalize">{planet}:</span>
                                    <span className="text-sm text-slate-700">{interp}</span>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}

                          {/* Aspects & Influences Panel */}
                          {astroData?.aspects && astroData.aspects.length > 0 && (
                            <Card className="bg-white/70 border-slate-200/70">
                              <CardHeader>
                                <h4 className="font-medium text-slate-900 flex items-center">
                                  <Star className="h-4 w-4 mr-2 text-indigo-600" />
                                  Aspects & Influences
                                </h4>
                              </CardHeader>
                              <CardContent className="pt-2 space-y-2">
                                {astroData.aspects.map((aspect, idx) => (
                                  <div key={idx} className="mb-2">
                                    <span className="font-semibold text-indigo-700 mr-2">
                                      {aspect.planets.join(' ')} {aspect.type} ({aspect.angle}°)
                                    </span>
                                    <span className="text-sm text-slate-700">{aspect.influence}</span>
                                    {aspect.interpretation && (
                                      <div className="text-xs text-slate-500 mt-1">{aspect.interpretation}</div>
                                    )}
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Daily Recommendation */}
                          <Card className="mt-6 bg-gradient-to-br from-indigo-50 to-slate-50 border-slate-200/70">
                            <CardContent className="pt-6">
                              <h4 className="font-medium text-slate-900 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
                                Today's Analysis
                              </h4>
                              <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                                {dailyRecommendation || 'Loading astrological insights...'}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 justify-center">
                    <p className="text-xs text-slate-500">
                      Data updated at {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · 
                      <span className="text-indigo-600 font-medium ml-1">Auto-refreshing</span>
                    </p>
                  </CardFooter>
                </Card>
              </section>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
