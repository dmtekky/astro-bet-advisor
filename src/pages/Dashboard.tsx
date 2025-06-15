import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import GameCard from '@/components/GameCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import { useAstroData } from '@/hooks/useAstroData';
import { useTeams } from '@/hooks/useTeams';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import { useFeaturedArticle } from '@/hooks/useFeaturedArticle';
import { useGamePredictions } from '@/hooks/useGamePredictions';
import { GamePredictions } from '@/features/dashboard/components/GamePredictions/GamePredictions';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { getElementsDistribution, getElementalInterpretation } from '@/utils/elementsAnalysis';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Sun, 
  Moon, 
  Info, 
  Activity, 
  Zap, 
  BarChart, 
  BarChart2, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  Newspaper, 
  ArrowRight, 
  Star 
} from 'lucide-react';
import { 
  MoonPhaseInfoCard, 
  VoidMoonStatus, 
  LunarTechnicalAnalysis, 
  PlanetaryInfluences, 
  DailyAstroTip 
} from '@/features/dashboard/components/astro';
import ArticleSection from '@/features/dashboard/components/ArticleSection';
import UpcomingGames from '@/features/dashboard/components/UpcomingGames';
import { calculateSportsPredictions, predictGameOutcome } from '@/utils/sportsPredictions';
import type { Team } from '@/types';
import type { Game } from '@/types';
import type { 
  ModalBalance, 
  ElementalBalance, 
  ZodiacSign, 
  AspectType, 
  MoonPhaseInfo, 
  CelestialBody, 
  Aspect 
} from '@/types/astrology';
import { transformAstroData } from '@/utils/astroTransform';
import type { GamePredictionData } from '@/types/gamePredictions';
import type { Article } from '../types/news';
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
import { Sport } from '@/types';

const MLB_LEAGUE_KEY: Sport = 'mlb';
const DEFAULT_LOGO = '/images/default-team-logo.svg';

import AstroDisclosure from '@/components/AstroDisclosure';

const Dashboard: React.FC = () => {
  // Fetch the featured article using custom hook
  const { article: featuredArticle, isLoading: isLoadingArticle, error: articleError } = useFeaturedArticle();
  // State for today's date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Fetch teams and games data
  const { 
    teams, 
    teamMap, 
    teamByExternalId, 
    loading: teamsLoading, 
    error: teamsError,
    resolvedLeagueId: mlbLeagueId, // Rename for clarity
    isLeagueResolutionComplete: isMlbLeagueResolutionComplete
  } = useTeams(MLB_LEAGUE_KEY);
  
  // Fetch upcoming games only when MLB league ID resolution is complete
  const { 
    games, 
    loading: gamesLoading, 
    error: gamesError 
  } = useUpcomingGames({
    sport: MLB_LEAGUE_KEY, 
    limit: 12,
    // Only pass leagueId if resolution is complete and ID is available
    leagueId: isMlbLeagueResolutionComplete ? mlbLeagueId : null,
    // Disable hook if resolution is not complete and we are targeting MLB
    disabled: MLB_LEAGUE_KEY && !isMlbLeagueResolutionComplete 
  });

  // Get astro data
  const { astroData, isLoading: astroLoading, error: astroError } = useAstroData(selectedDate);
  
  // Get game predictions using the new hook
  const { 
    transformedData = null, 
    sportsPredictions = null, 
    getGamePrediction,
    isLoading: predictionsLoading = true
  } = useGamePredictions(astroData) || {};
  
  // Alias for backward compatibility with proper null check
  const predictionData = transformedData || null;

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

  // Get the current moon phase data from the transformed data
  const currentMoonPhase = useMemo(() => ({
    phase: transformedData?.moonPhase?.name || 'New Moon',
    illumination: transformedData?.moonPhase?.illumination ?? 0,
    ageInDays: transformedData?.moonPhase?.ageInDays ?? 0,
    nextFullMoon: transformedData?.moonPhase?.nextFullMoon || new Date(Date.now() + 29.53 * 24 * 60 * 60 * 1000),
    phaseType: transformedData?.moonPhase?.phaseType || 'new'
  }), [transformedData]);

  // State for astrological influences
  const [astroInfluences, setAstroInfluences] = useState<AstrologyInfluence[]>([]);
  
  // Get element distribution from transformed data with safe defaults
  const elementsDistribution = useMemo(() => {
    // Default distribution if no data is available
    const defaultDistribution = { fire: 25, earth: 25, water: 25, air: 25 };
    
    // If no transformed data, return defaults
    if (!transformedData) {
      console.log('No transformedData available, using default distribution');
      return defaultDistribution;
    }
    
    // Log the available data for debugging
    console.log('Transformed data elements:', {
      hasElements: !!transformedData.elements,
      elementKeys: transformedData.elements ? Object.keys(transformedData.elements) : 'none',
      elements: transformedData.elements ? {
        fire: transformedData.elements.fire,
        earth: transformedData.elements.earth,
        water: transformedData.elements.water,
        air: transformedData.elements.air
      } : 'no elements'
    });
    
    // Safely get percentage values with defaults
    const getElementPercentage = (element: string) => {
      const value = transformedData?.elements?.[element as keyof typeof transformedData.elements]?.percentage;
      return typeof value === 'number' ? value : 25; // Default to 25 if not a number
    };
    
    // Calculate distribution
    const dist = {
      fire: getElementPercentage('fire'),
      earth: getElementPercentage('earth'),
      water: getElementPercentage('water'),
      air: getElementPercentage('air')
    };
    
    // Log final distribution for debugging
    console.log('Final elementsDistribution:', dist);
    return dist;
  }, [transformedData]);

  // Get elemental interpretation from sports predictions if available
  const elementalInterpretation = useMemo(() => {
    if (sportsPredictions?.prediction) {
      return sportsPredictions.prediction;
    }
    
    if (!elementsDistribution) return 'No elemental analysis available';
    return getElementalInterpretation(elementsDistribution);
  }, [elementsDistribution, sportsPredictions]);

  // Navigation
  const navigate = useNavigate();
  
  // Handle navigation to upcoming games page
  const handleSeeMoreGames = () => {
    navigate('/upcoming-games');
  };

  // Calculate loading and error states
  const isLoading = astroLoading || gamesLoading || teamsLoading || predictionsLoading;
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
  
  // Transform astro data for predictions (keeping this for backward compatibility)
  const transformHookDataToGamePredictionData = useCallback((hookData: any) => {
    if (!hookData) return null;
    try {
      return transformAstroData(hookData);
    } catch (error) {
      console.error('Error transforming astro data:', error);
      return null;
    }
  }, []);
  
  // Log transformed data for debugging
  useEffect(() => {
    if (transformedData) {
      console.log('Transformed astro data:', transformedData);
    } else {
      console.log('No transformed data available');
    }
  }, [transformedData]);

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
    if (team.primary_color) teamData.primary_color = team.primary_color;
    if (team.secondary_color) teamData.secondary_color = team.secondary_color;
    
    return teamData;
  };

  // Process astrological data when it's available
  useEffect(() => {
    if (astroData && !astroLoading && transformedData) {
      console.log('AstroData received:', astroData);
      
      // Initialize with empty elements object if not present
      const elementScores = {
        fire: { score: 0, percentage: transformedData.elements?.fire?.percentage ?? 25 },
        earth: { score: 0, percentage: transformedData.elements?.earth?.percentage ?? 25 },
        water: { score: 0, percentage: transformedData.elements?.water?.percentage ?? 25 },
        air: { score: 0, percentage: transformedData.elements?.air?.percentage ?? 25 }
      };
      
      const fireScore = elementScores.fire.score || 0;
      const earthScore = elementScores.earth.score || 0;
      const waterScore = elementScores.water.score || 0;
      const airScore = elementScores.air.score || 0;
      
      const totalElements = fireScore + earthScore + waterScore + airScore || 1;

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
      const degree = Math.floor(astroData.planets.sun.degree);
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
    return `${Math.floor(degrees)}°${minutes ? ` ${minutes}'` : ''}`;
  }

  // Helper function to get moon aspect message based on phase and sign with sports focus
  const getMoonAspectMessage = (moonPhaseData: MoonPhaseInfo | undefined, moonSign: ZodiacSign | undefined): string => {
    if (!moonPhaseData) return 'Analyzing lunar influences on sports performance';

    const { name: phaseName, value: phaseValue, illumination } = moonPhaseData;

    // Determine if waxing or waning based on value; names can sometimes be ambiguous or vary by source
    // Standard phase values: New=0, FQ=0.25, Full=0.5, LQ=0.75, New=1 (or 0 again)
    // Waxing: (0, 0.5), Waning: (0.5, 1)
    const isWaxing = phaseValue > 0 && phaseValue < 0.5;
    const isWaning = phaseValue > 0.5 && phaseValue < 1;

    let description = `Current lunar phase (${phaseName}, ${Math.round(illumination * 100)}% illuminated) `;

    if (isWaxing) {
      description += 'favors teams building momentum. ';
      description += 'Look for squads that improve as the game progresses. ';
      if (illumination > 0.7) { // Closer to Full Moon within waxing period
        description += 'Peak performance conditions expected. ';
      }
    } else if (isWaning) {
      description += 'may benefit experienced teams. ';
      description += 'Watch for veteran players making key plays. ';
      if (illumination < 0.3) { // Closer to New Moon within waning period
        description += 'Potential for unexpected outcomes increases. ';
      }
    } else if (phaseName === 'Full Moon' || Math.abs(phaseValue - 0.5) < 0.05) { // Check name or close value
      description = 'Peak intensity conditions (Full Moon). Expect high-energy performances ';
      description += 'and potential for standout individual efforts. ';
    } else if (phaseName === 'New Moon' || phaseValue < 0.05 || phaseValue > 0.95) { // Check name or close value
      description = 'Fresh start energy (New Moon). Underdogs may surprise, ';
      description += 'and new strategies could prove effective. ';
    }

    if (moonSign) {
      const signStrengths: Record<string, {traits: string, sports: string}> = {
        'Aries': { traits: 'aggressive play, strong starts, physicality', sports: 'football, hockey, sprinting' },
        'Taurus': { traits: 'endurance, consistency, strong defense', sports: 'baseball, golf, wrestling' },
        'Gemini': { traits: 'quick thinking, adaptability, fast breaks', sports: 'basketball, tennis, soccer midfielders' },
        'Cancer': { traits: 'team chemistry, home advantage, emotional plays', sports: 'team sports, swimming, water polo' },
        'Leo': { traits: 'leadership, clutch performances, showmanship', sports: 'basketball, gymnastics, figure skating' },
        'Virgo': { traits: 'precision, technical skills, strategy', sports: 'baseball, golf, figure skating' },
        'Libra': { traits: 'teamwork, fair play, balanced attack', sports: 'basketball, tennis doubles, volleyball' },
        'Scorpio': { traits: 'intensity, comebacks, mental toughness', sports: 'boxing, martial arts, football defense' },
        'Sagittarius': { traits: 'risk-taking, long shots, adventurous play', sports: 'basketball, horse racing, archery' },
        'Capricorn': { traits: 'discipline, strong defense, late-game strength', sports: 'football, weightlifting, cycling' },
        'Aquarius': { traits: 'unconventional strategies, surprise plays', sports: 'basketball, soccer, extreme sports' },
        'Pisces': { traits: 'creativity, intuition, fluid movement', sports: 'soccer, swimming, figure skating' }
      };
      
      const signData = signStrengths[moonSign] || { traits: 'competitive edge', sports: 'various sports' };
      description += `\n\n${moonSign} Influence:\n`;
      description += `• Strengths: ${signData.traits}\n`;
      description += `• Favors: ${signData.sports}`;
    }
    
    return description;
  };

  // Helper function to get color class for element
  const getElementColor = (element: keyof ElementsDistribution): string => {
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
    console.log('Calculating dailyRecommendation with astroData:', astroData);
    if (!astroData) {
      console.log('No astroData available, returning empty string');
      return '';
    }
    
    if (sportsPredictions?.prediction) {
      console.log('Using sports prediction:', sportsPredictions.prediction);
      return sportsPredictions.prediction;
    }
    
    // Fallback to element-based recommendation if no specific prediction
    const dominantElement = Object.entries(elementsDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as keyof ElementsDistribution;
    
    console.log('Dominant element:', dominantElement);
    
    let recommendation = "Today's celestial influences suggest " + 
      (dominantElement === 'fire' ? 'an aggressive playing style could be advantageous. ' :
       dominantElement === 'earth' ? 'teams with strong fundamentals may excel. ' :
       dominantElement === 'air' ? 'strategic and adaptive play could be key. ' :
       'teams that trust their intuition might have an edge. ');
    
    if (astroData.moon?.phase_name) {
      console.log('Moon phase:', astroData.moon.phase_name);
      recommendation += getMoonPhaseImpact(astroData.moon.phase_name);
    } else {
      console.log('No moon phase data available');
    }
    
    console.log('Final recommendation:', recommendation);
    return recommendation;
  }, [astroData, elementsDistribution, sportsPredictions]);

  // Animation variants
  const featuredArticleVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
    },
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -5,
      transition: { duration: 0.2 }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {featuredArticle && <ArticleSection article={featuredArticle} />}

      {/* Main Dashboard Content Starts Here */}
      <motion.div 
        variants={container} 
        initial="hidden"   
        animate="show"     
        exit="hidden"     
        className="space-y-8"
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 space-y-8">

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
            <div className="grid grid-cols-1 gap-8">
              {/* Upcoming Games Section (Full width) */}
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
                <UpcomingGames 
                  gameGroups={groupedGames}
                  isLoading={gamesLoading}
                  onViewAllGames={handleSeeMoreGames}
                  findTeam={findTeam}
                  renderGamePrediction={(game) => (
                    <GamePredictions 
                      game={game}
                      astroData={astroData}
                      getGamePrediction={getGamePrediction}
                      transformHookDataToGamePredictionData={transformHookDataToGamePredictionData}
                    />
                  )}
                />
              </motion.div>

              {/* Astrological Insights Section */}
              <motion.div variants={slideUp} initial="hidden" animate="show" className="mt-12">
                <div className="flex items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Astrological Insights</h2>
                  <span className="ml-3 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </span>
                </div>
                {/* Elemental Balance Full-Width Card */}
                <motion.div variants={fadeIn} initial="hidden" animate="show" className="w-full mb-8 border border-slate-200/50 bg-white/70 backdrop-blur-sm shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                      Elemental Balance
                    </CardTitle>
                    <CardDescription className="text-slate-600">Distribution of planetary energies by element.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full flex items-center mt-2 mb-4">
                      {/* Segmented horizontal bar for elements */}
                      <div className="flex w-full h-6 rounded-full overflow-hidden border border-slate-200">
                        <div className="h-full" style={{width: `${elementsDistribution.fire}%`, background: 'linear-gradient(90deg, #f87171 60%, #fbbf24 100%)'}} title={`Fire: ${elementsDistribution.fire}%`} />
                        <div className="h-full" style={{width: `${elementsDistribution.earth}%`, background: 'linear-gradient(90deg, #34d399 60%, #a7f3d0 100%)'}} title={`Earth: ${elementsDistribution.earth}%`} />
                        <div className="h-full" style={{width: `${elementsDistribution.water}%`, background: 'linear-gradient(90deg, #60a5fa 60%, #818cf8 100%)'}} title={`Water: ${elementsDistribution.water}%`} />
                        <div className="h-full" style={{width: `${elementsDistribution.air}%`, background: 'linear-gradient(90deg, #f472b6 60%, #a78bfa 100%)'}} title={`Air: ${elementsDistribution.air}%`} />
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between text-sm font-medium text-slate-700">
                      <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{background: '#f87171'}}></span>fire {elementsDistribution.fire}%</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{background: '#34d399'}}></span>earth {elementsDistribution.earth}%</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{background: '#60a5fa'}}></span>water {elementsDistribution.water}%</span>
                      <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{background: '#f472b6'}}></span>air {elementsDistribution.air}%</span>
                    </div>
                    {elementsDistribution && (elementsDistribution.fire + elementsDistribution.earth + elementsDistribution.water + elementsDistribution.air > 0) && (
                      <div className="mt-4 pt-4 border-t border-slate-200/60">
                        <p className="text-sm text-slate-600">
                        {elementalInterpretation}
                      </p>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
                {/* Other astrology cards below */}
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(astroLoading && !astroData) ? (
                  // Skeletons for Astro section
                  <>
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-56 rounded-xl md:col-span-2" />
                  </>
                ) : astroData ? (
                  // Actual Astro content
                  <>
                    <motion.div variants={item} className="border border-slate-200/50 bg-white/50 backdrop-blur-sm md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                          <Sun className="h-3.25 w-3.25 mr-2 text-yellow-500" /> Solar Influence
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          The Sun is in {sunSign} ({formatDegreesMinutes(sunDegree, sunMinute)}), {astroData.sidereal ? 'Sidereal' : 'Tropical'}. Element: {getSunElement(sunSign)}.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-2">
                        {/* Sun Visualization Section */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl shadow-sm">
                          <div className="flex flex-col items-center md:flex-row-reverse md:items-start">
                            <div className="relative w-36 h-36 md:w-42 md:h-42 lg:w-48 lg:h-48 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-300 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-0 md:-mr-4 lg:-mr-6 flex-shrink-0 border-[10px] border-yellow-400/80 shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
                              {/* Sun visualization */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Sun className="h-20.8 w-20.8 md:h-26 md:w-26 text-yellow-400 drop-shadow-lg animate-pulse" />
                                <div className="absolute w-full h-full rounded-full" style={{
                                  boxShadow: '0 0 80px 30px rgba(252, 211, 77, 0.4)',
                                  pointerEvents: 'none',
                                  background: 'radial-gradient(circle at 60% 40%, rgba(253, 230, 138, 0.3), transparent 60%)'
                                }} />
                              </div>
                            </div>
                            <div className="text-center md:text-left flex-1">
                              <h4 className="text-2xl font-bold text-yellow-700 mb-1">
                                Sun Position
                              </h4>
                              <p className="text-sm text-yellow-600 mb-2">
                                {sunSign} ({formatDegreesMinutes(sunDegree, sunMinute)})
                              </p>
                              <div className="inline-block bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
                                Element: {getSunElement(sunSign)}
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-yellow-50 shadow-sm mb-4">
                                <p className="text-base text-slate-700 leading-relaxed">
                                  {getSunSportsInfluences(astroData)[0]?.text || 'The Sun’s current sign sets the tone for vitality and momentum.'}
                                </p>
                              </div>
                              {/* Sun Details */}
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                  <div className="text-xs uppercase text-slate-500 font-medium mb-1">Sun Sign</div>
                                  <div className="font-semibold text-yellow-700">{sunSign}</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                  <div className="text-xs uppercase text-slate-500 font-medium mb-1">Zodiac Degree</div>
                                  <div className="font-semibold text-yellow-700">
                                    {sunDegree ? `${Math.floor(sunDegree)}°` : '—'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Solar Influence Details */}
                        <div className="bg-white p-4 rounded-lg border border-yellow-100 shadow-sm">
                          <h5 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center"><Sun className="h-2.5 w-2.5 mr-1 text-yellow-400" /> Solar Influence Insights</h5>
                          <ul className="list-disc pl-5 space-y-1">
                            {getSunSportsInfluences(astroData).map((influence, index) => (
                              <li key={`sun-influence-${index}`} className="text-sm text-slate-700">{influence.text}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </motion.div>

                    <motion.div variants={item} className="border border-slate-200/50 bg-white/50 backdrop-blur-sm hover:shadow-md transition-shadow duration-300 md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                          <Moon className="h-5 w-5 mr-2 text-indigo-500" /> Lunar & Void Status
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          {astroData.voidMoon ? (astroData.voidMoon.isVoid ? ' • Void of Course' : ' • Not Void of Course') : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-2">
                        {/* Moon Phase Section with Visualization */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm">
                          <div className="flex flex-col items-center md:flex-row md:items-start">
                            <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-6 flex-shrink-0 border-[10px] border-indigo-600/90 shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
                              {/* Moon phase visualization */}
                              <div 
                                className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 rounded-full transition-all duration-1000 ease-in-out" 
                                style={{
                                  clipPath: `inset(0 ${50 - (astroData.moonPhase?.illumination || 0) * 50}% 0 0)`,
                                  opacity: 0.95,
                                  boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.8)'
                                }}
                              >
                                {/* Add some subtle craters */}
                                <div className="absolute w-4 h-4 bg-slate-200/30 rounded-full top-1/3 left-1/4"></div>
                                <div className="absolute w-5 h-5 bg-slate-300/40 rounded-full top-2/3 left-1/2"></div>
                                <div className="absolute w-3 h-3 bg-slate-200/50 rounded-full top-1/4 left-3/4"></div>
                                <div className="absolute w-6 h-6 bg-slate-300/30 rounded-full top-3/4 left-1/3"></div>
                                <div className="absolute w-3.5 h-3.5 bg-slate-200/40 rounded-full top-1/5 left-1/2"></div>
                              </div>
                              {/* Glow effect */}
                              <div 
                                className="absolute inset-0 rounded-full"
                                style={{
                                  boxShadow: '0 0 60px 15px rgba(99, 102, 241, 0.4)',
                                  pointerEvents: 'none',
                                  background: 'radial-gradient(circle at 30% 30%, rgba(199, 210, 254, 0.3), transparent 60%)'
                                }}
                              />
                            </div>
                            <div className="text-center md:text-left flex-1">
                              <h4 className="text-2xl font-bold text-indigo-800 mb-1">
                                Moon Phase
                              </h4>
                              <p className="text-sm text-indigo-600 mb-2">
                                {astroData.moonPhase?.name || 'Current phase unknown'}
                              </p>
                              <div className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
                                {astroData.moonPhase?.illumination !== null && astroData.moonPhase?.illumination !== undefined
                                  ? `🌕 ${Math.round((astroData.moonPhase.illumination) * 100)}% Illuminated`
                                  : '🌑 Illumination unknown'}
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-indigo-50 shadow-sm mb-4">
                                <p className="text-base text-slate-700 leading-relaxed">
                                  {astroData.moonPhase?.name && getMoonPhaseImpact(astroData.moonPhase.name)}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                                  <div className="text-[10px] uppercase text-slate-500 font-medium mb-0.5 truncate">Moon Sign</div>
                                  <div className="font-semibold text-indigo-700 text-sm truncate">
                                    {astroData.planets?.moon?.sign || 'Unknown'}
                                  </div>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                                  <div className="text-[10px] uppercase text-slate-500 font-medium mb-0.5 truncate">Next Full Moon</div>
                                  <div className="font-semibold text-indigo-700 text-sm">
                                    {astroData.moonPhase?.nextFullMoon 
                                      ? new Date(astroData.moonPhase.nextFullMoon).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric',
                                          year: '2-digit'
                                        })
                                      : '—'}
                                  </div>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
                                  <div className="text-[10px] uppercase text-slate-500 font-medium mb-0.5 truncate">Zodiac Degree</div>
                                  <div className="font-semibold text-indigo-700 text-sm">
                                    {astroData.planets?.moon?.degree ? `${Math.floor(astroData.planets.moon.degree)}°` : '—'}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Void of Course Status */}
                              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                                <div className="p-3 border-b border-amber-100">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-slate-800 flex items-center text-sm">
                                      <div className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${astroData.voidMoon?.isVoid ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                      Void of Course Status
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${astroData.voidMoon?.isVoid ? 'bg-red-100 text-red-800' : 'bg-red-50 text-red-700'}`}>
                                      {astroData.voidMoon?.isVoid ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="p-3">
                                  <p className="text-sm text-slate-700 mb-2">
                                    {astroData.voidMoon?.isVoid 
                                      ? `Moon is void of course until ${new Date(astroData.voidMoon.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                      : getMoonAspectMessage(astroData.moonPhase, astroData.planets?.moon?.sign as ZodiacSign | undefined)}
                                  </p>
                                  
                                  {astroData.voidMoon?.isVoid && (
                                    <div className="space-y-3 mt-3">
                                      <div>
                                        <div className="w-full bg-amber-100 rounded-full h-1.5 mb-1">
                                          <div 
                                            className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                                            style={{
                                              width: `${Math.max(5, Math.min(100, (new Date().getTime() - new Date(astroData.voidMoon.start).getTime()) / (new Date(astroData.voidMoon.end).getTime() - new Date(astroData.voidMoon.start).getTime()) * 100))}%`
                                            }}
                                          />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-amber-700">
                                          <span>Started: {new Date(astroData.voidMoon.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          <span>Ends: {new Date(astroData.voidMoon.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                      </div>
                                      
                                      <div className={`p-2 rounded-lg border text-xs ${astroData.voidMoon.isVoid ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <p className={`font-medium mb-1 ${astroData.voidMoon.isVoid ? 'text-red-800' : 'text-slate-700'}`}>
                                          {astroData.voidMoon.isVoid 
                                            ? '⚠️ Void of Course Moon'
                                            : '✓ Strong Lunar Aspects'}
                                        </p>
                                        <p className={astroData.voidMoon.isVoid ? 'text-red-700' : 'text-slate-600'}>
                                          {astroData.voidMoon.isVoid
                                            ? 'The moon is not making any major aspects. Game outcomes may be more unpredictable during this period.'
                                            : getMoonAspectMessage(astroData.moonPhase, astroData.planets?.moon?.sign as ZodiacSign | undefined)}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Technical Measurement */}
                        <div className="bg-white p-3 rounded-md border border-slate-200">
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                            <Activity className="h-4 w-4 mr-1 text-slate-400" /> Lunar Technical Analysis
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Moon Speed</span>
                                <span>{astroData.planets?.moon?.speed ? `${Math.abs(astroData.planets.moon.speed).toFixed(2)}°/day` : 'Unknown'}</span>
                              </div>
                              <Progress 
                                value={astroData.planets?.moon?.speed ? Math.min(Math.abs(astroData.planets.moon.speed) / 15 * 100, 100) : 50} 
                                className="h-2"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Lunar Sign Position</span>
                                <span>{astroData.planets?.moon?.degree ? `${Math.floor(astroData.planets.moon.degree)}°${astroData.planets.moon.minute ? ` ${astroData.planets.moon.minute}'` : ''}` : 'Unknown'}</span>
                              </div>
                              <Progress 
                                value={astroData.planets?.moon?.degree ? (astroData.planets.moon.degree / 30) * 100 : 50} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>

                    <motion.div variants={item} className="border border-slate-200/50 bg-white/50 backdrop-blur-sm md:col-span-2">
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
                    </motion.div>

                    <motion.div variants={item} className="border border-slate-200/50 bg-white/50 backdrop-blur-sm md:col-span-2">
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
                    </motion.div>
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
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
