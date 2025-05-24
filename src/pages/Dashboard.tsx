import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import GameCard from '@/components/GameCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { useTeams } from '@/hooks/useTeams';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Star,
  Calendar,
  Sun,
  Moon,
  Info,
  Activity,
  Zap,
  BarChart,
  BarChart2,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
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
const MLB_LEAGUE_KEY = 'mlb';
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
  } = useUpcomingGames({ sport: MLB_LEAGUE_KEY, limit: 12 });

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
      console.log('%%%%% CHECKING ASTRODATA IN getGamePrediction:', astroData);
      const rawAstro = astroData;
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
    [astroData, transformHookDataToGamePredictionData]
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

  // Helper function to format degrees and minutes for display
  function formatDegreesMinutes(degrees: number, minutes: number): string {
    return `${Math.round(degrees)}°${minutes ? ` ${minutes}'` : ''}`;
  }

  // Helper function to get color class for element
  function getElementColor(element: keyof ElementsDistribution): string {
    const colors: Record<keyof ElementsDistribution, string> = {
      fire: 'bg-red-500',
      earth: 'bg-green-500',
      air: 'bg-sky-400',
      water: 'bg-indigo-500'
    };
    return colors[element] || 'bg-slate-400';
  }

  // Simple team color palette for game cards
  const teamColorPalette = {
    getTeamColors: (team?: Team) => {
      return {
        primary: team?.primary_color || '#4338ca',
        secondary: team?.secondary_color || '#818cf8',
        text: '#ffffff'
      };
    }
  };

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
          {error ? (
            // Error state: Display a global error message
            <div className="flex items-center justify-center h-64">
              <Alert variant="destructive" className="bg-white/70 backdrop-blur-sm max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error.message || "An unexpected error occurred while loading dashboard data. Please try again later."}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            // No global error, proceed to render the main layout with individual section loading
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upcoming Games Section (lg:col-span-2) */}
              <div className="lg:col-span-2 space-y-8">
                {(gamesLoading && (!games || games.length === 0)) ? (
                  // Skeletons for Games section
                  <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-8 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={`game-skel-${i}`} className="h-64 rounded-xl" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : games && games.length > 0 ? (
                  // Actual Games content
                  <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-semibold text-slate-800">Upcoming Games</CardTitle>
                      <CardDescription>Insights and predictions for upcoming MLB games.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {groupedGames.map((group) => (
                        <div key={group.date.toString()} className="mb-6">
                          <h3 className="text-lg font-semibold text-slate-700 mb-3 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                            {format(group.date, 'EEEE, MMMM d')}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {group.games.map((game) => {
                              const homeTeam = findTeam(String(game.home_team_id));
                              const awayTeam = findTeam(String(game.away_team_id));
                              const gamePrediction = getGamePrediction(game, homeTeam, awayTeam);
                              return (
                                <GameCard 
                                  key={game.id} 
                                  game={game} 
                                  homeTeam={homeTeam}
                                  awayTeam={awayTeam}
                                  prediction={gamePrediction}
                                  astroData={astroData} // Pass full astroData for context
                                  teamColorPalette={teamColorPalette}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {games.length === 0 && !gamesLoading && (
                        <p className="text-center text-slate-500 py-8">No upcoming games scheduled for this league.</p>
                      )}
                    </CardContent>
                  </Card>
                ) : (!gamesLoading && (!games || games.length === 0)) ? (
                  // No games found message
                  <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Upcoming Games</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center text-slate-500 py-8">No upcoming games found.</p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {/* Astrological Insights Section (lg:col-span-1) */}
              <div className="lg:col-span-1 space-y-6">
                {(astroLoading && !astroData) ? (
                  // Skeletons for Astro section
                  <>
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-56 rounded-xl" />
                  </>
                ) : astroData ? (
                  // Actual Astro content
                  <>
                    <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                          <Sun className="h-5 w-5 mr-2 text-yellow-500" /> Solar Influence
                        </CardTitle>
                        <CardDescription>
                          The Sun is in {sunSign} ({formatDegreesMinutes(sunDegree, sunMinute)}), {astroData.sidereal ? 'Sidereal' : 'Tropical'}. Element: {getSunElement(sunSign)}.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {getSunSportsInfluences(astroData).map((influence, index) => (
                          <div key={`sun-influence-${index}`} className="flex items-start space-x-2">
                            <span className={`mt-1 inline-block h-2 w-2 rounded-full ${influence.color}`} />
                            <p className="text-sm text-slate-600">
                              {influence.text}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                          <Moon className="h-5 w-5 mr-2 text-slate-400" /> Lunar & Void Status
                        </CardTitle>
                        <CardDescription>
                          {astroData.moon?.phase_name ? `${astroData.moon.phase_name} Moon. ` : ''}
                          {astroData.moon?.is_void_of_course ? 'Moon is Void of Course.' : 'Moon is not Void of Course.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {astroData.moon?.phase_name && (
                          <div className="flex items-start space-x-2">
                            <Sparkles className="h-4 w-4 mt-0.5 text-purple-500 flex-shrink-0" />
                            <p className="text-sm text-slate-600">
                              {getMoonPhaseImpact(astroData.moon.phase_name)}
                            </p>
                          </div>
                        )}
                        {astroData.moon?.is_void_of_course && (
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-slate-600">
                              Void of Course from {astroData.moon.voc_start ? format(new Date(astroData.moon.voc_start), 'p') : 'N/A'} to {astroData.moon.voc_end ? format(new Date(astroData.moon.voc_end), 'p') : 'N/A'}, next entering {astroData.moon.voc_next_sign}.
                            </p>
                          </div>
                        )}
                        {!astroData.moon?.is_void_of_course && (
                           <div className="flex items-start space-x-2">
                             <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                             <p className="text-sm text-slate-600">The Moon is actively influencing events.</p>
                           </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                          <Zap className="h-5 w-5 mr-2 text-blue-500" /> Key Planetary Influences
                        </CardTitle>
                        <CardDescription>Current significant astrological energies.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {astroInfluences.length > 0 ? (
                          astroInfluences.map((influence, index) => (
                            <div key={`influence-${index}`} className="flex items-start space-x-2">
                              <div className="flex-shrink-0 mt-0.5">
                                {influence.icon || <Activity className="h-5 w-5 text-slate-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700">{influence.name}</p>
                                <p className="text-xs text-slate-500">{influence.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No specific planetary influences highlighted at the moment.</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                          <BarChart className="h-5 w-5 mr-2 text-teal-500" /> Elemental Balance
                        </CardTitle>
                        <CardDescription>Distribution of planetary energies by element.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {Object.keys(elementsDistribution).length > 0 && (elementsDistribution.fire + elementsDistribution.earth + elementsDistribution.water + elementsDistribution.air > 0) ? (
                          <div className="space-y-2">
                            {(Object.keys(elementsDistribution) as Array<keyof ElementsDistribution>).map((element) => (
                              <div key={element} className="flex items-center">
                                <span className="w-16 text-sm capitalize text-slate-600">{element}</span>
                                <div className="flex-1 bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mr-2">
                                  <div 
                                    className={`h-2.5 rounded-full ${getElementColor(element)}`}
                                    style={{ width: `${elementsDistribution[element]}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-slate-500 w-8 text-right">{elementsDistribution[element]}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Elemental balance data is currently unavailable.</p>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" /> Daily Astro Tip
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600">
                          {dailyRecommendation || 'General astrological conditions apply. Stay observant and adaptive.'}
                        </p>
                      </CardContent>
                    </Card>
                  </>
                ) : (!astroLoading && !astroData) ? (
                  // No Astro data message
                  <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Astrological Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center text-slate-500 py-8">Astrological insights are currently unavailable.</p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

export default Dashboard;
