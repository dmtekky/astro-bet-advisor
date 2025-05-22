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
import type { Team } from '@/hooks/useTeams';
import type { Game } from '@/types';
import { calculateSportsPredictions, predictGameOutcome } from '@/utils/sportsPredictions';

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

  // DEBUGGING: Print the full astroData and the sun sign used for display
  // (These will appear every render)
  // You can remove these after confirming the bug.
  console.log('DASHBOARD RENDER: FULL astroData:', astroData);
  if (astroData && astroData.planets && astroData.planets.sun) {
    console.log('DASHBOARD RENDER: astroData.planets.sun:', astroData.planets.sun);
  }
  if (astroData?.planets?.sun?.sign) {
    console.log('DASHBOARD RENDER: Sun sign:', astroData.planets.sun.sign);
  }

  // State for astrological influences
  const [astroInfluences, setAstroInfluences] = useState<AstrologyInfluence[]>([]);
  const [elementsDistribution, setElementsDistribution] = useState<ElementsDistribution>({
    fire: 0,
    earth: 0,
    water: 0,
    air: 0
  });

  // Calculate loading and error states
  const isLoading = gamesLoading || teamsLoading || astroLoading;
  const hasError = gamesError || teamsError || astroError;
  const errorMessage = gamesError?.message || teamsError?.message || astroError?.message;

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

  // Get sports predictions from astrological data
  const sportsPredictions = useMemo(() => {
    return calculateSportsPredictions(astroData);
  }, [astroData]);

  // Create a memoized function to get game-specific predictions
  const getGamePrediction = useCallback(
    (game: Game, homeTeam?: Team, awayTeam?: Team) => {
      return predictGameOutcome(game, homeTeam, awayTeam, astroData);
    },
    [astroData]
  );

  // Helper function to find a team
  const findTeam = (teamId: string): Team | undefined => {
    return teamMap?.[teamId];
  };

  // Process astrological data when it's available
  useEffect(() => {
    if (astroData) {
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
      
      if (sunSign) {
        const signText = isSidereal ? `${sunSign} (Sidereal)` : sunSign;
        
        influences.push({
          name: 'Sun Position',
          impact: 0.8,
          description: `The Sun in ${signText} brings ${getSunSignImpact(sunSign)} energy to today's games`,
          icon: <Sun className="h-5 w-5 text-amber-500" />
        });
      }
      
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
            // Loading state
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
          ) : hasError ? (
            // Error state
            <Alert variant="destructive" className="bg-white/70 backdrop-blur-sm">
              <AlertDescription>
                {errorMessage || 'An error occurred while loading data. Please try again later.'}
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
                                const homeTeam = game.home_team ? findTeam(game.home_team) : undefined;
                                const awayTeam = game.away_team ? findTeam(game.away_team) : undefined;
                                
                                // Use our memoized function to get game prediction
                                const gamePrediction = getGamePrediction(game, homeTeam, awayTeam);
                                
                                return (
                                  <GameCard
                                    key={game.id}
                                    game={{
                                      ...game,
                                      astroPrediction: gamePrediction?.prediction,
                                      homeEdge: gamePrediction?.homeWinProbability,
                                      // Pass additional astrological data
                                      moonPhase: gamePrediction?.moonPhase,
                                      sunSign: gamePrediction?.sunSign,
                                      dominantElement: gamePrediction?.dominantElement,
                                      confidence: gamePrediction?.confidence
                                    }}
                                    homeTeam={homeTeam as any} // Type cast to avoid type error
                                    awayTeam={awayTeam as any} // Type cast to avoid type error
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
    <div className="space-y-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200/70 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-slate-800 flex items-center">
          <BarChart2 className="h-4 w-4 mr-2 text-indigo-500" />
          Elements Distribution
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          Today's Energy
        </span>
      </div>
      
      <div className="relative">
        <div className="w-full bg-slate-100/80 rounded-full shadow-inner border border-slate-200/50 flex h-4 overflow-hidden relative">
          {/* Background gradient that blends all colors */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              background: `linear-gradient(
                90deg,
                rgba(239, 68, 68, 0.6) 0%,
                rgba(239, 68, 68, 0.4) 10%,
                rgba(255, 165, 0, 0.4) 20%,
                rgba(16, 185, 129, 0.6) 30%,
                rgba(16, 185, 129, 0.4) 40%,
                rgba(56, 189, 248, 0.6) 50%,
                rgba(56, 189, 248, 0.4) 60%,
                rgba(99, 102, 241, 0.6) 70%,
                rgba(99, 102, 241, 0.4) 80%,
                rgba(99, 102, 241, 0.3) 90%,
                rgba(99, 102, 241, 0.2) 100%
              )`,
              filter: 'saturate(1.3) contrast(1.15) brightness(1.05)',
              mixBlendMode: 'multiply'
            }}
          />
          
          {/* Individual bars with transparency to show through gradient */}
          <div
            className="h-full bg-gradient-to-r from-red-500/90 to-red-500/70 transition-all duration-1000 ease-out"
            style={{ width: `${elementsDistribution.fire}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-green-500/90 to-green-500/70 transition-all duration-1000 ease-out"
            style={{ width: `${elementsDistribution.earth}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-sky-300/90 to-sky-300/70 transition-all duration-1000 ease-out"
            style={{ width: `${elementsDistribution.air}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-indigo-500/90 to-indigo-500/70 transition-all duration-1000 ease-out"
            style={{ width: `${elementsDistribution.water}%` }}
          />
        </div>
      </div>
      
      {/* Legend below the bar */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {[
          { name: 'Fire', color: 'bg-red-500', value: elementsDistribution.fire },
          { name: 'Earth', color: 'bg-green-500', value: elementsDistribution.earth },
          { name: 'Air', color: 'bg-sky-300', value: elementsDistribution.air },
          { name: 'Water', color: 'bg-indigo-500', value: elementsDistribution.water }
        ].map((item) => (
          <div key={item.name} className="flex flex-col items-center">
            <div className="flex items-center">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color} mr-1.5`}></span>
              <span className="text-xs font-medium text-slate-600">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-slate-800">{item.value}%</span>
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
                                          indicatorClassName={`bg-indigo-${Math.round(influence.impact * 10) * 100}`}
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
