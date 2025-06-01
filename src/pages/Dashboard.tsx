import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import GameCard from '@/components/GameCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { useTeams } from '@/hooks/useTeams';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useNavigate, Link } from 'react-router-dom';
import { useAstroData } from '@/hooks/useAstroData';
import type { Team } from '@/types';
import type { Game } from '@/types';
import { calculateSportsPredictions, predictGameOutcome } from '@/utils/sportsPredictions';
import type { ModalBalance, ElementalBalance, ZodiacSign, AspectType, MoonPhaseInfo, CelestialBody, Aspect } from '@/types/astrology';
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
const DEFAULT_LOGO = '/images/default-team-logo.png';

import AstroDisclosure from '@/components/AstroDisclosure';

const Dashboard: React.FC = () => {
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>({
    slug: 'ai-astrology-mlb-deep-dive-20250531',
    title: 'AI & Astrology: A New Frontier in MLB Predictions',
    subheading: 'Discover how combining advanced AI with ancient astrological wisdom is changing the game for sports bettors.',
    contentHtml: '<p>Full article content would go here...</p>',
    featureImageUrl: 'https://images.unsplash.com/photo-1580209949904-5046cf9isfa7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80', // Placeholder image
    publishedAt: new Date().toISOString(),
    author: 'AstroBet AI Insights',
    tags: ['MLB', 'AI', 'Astrology', 'Predictions'],
  });
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
  // Helper function to calculate elemental distribution from astroData
  function getElementsDistribution(data: any): ElementsDistribution {
    const distribution: ElementsDistribution = { fire: 0, earth: 0, water: 0, air: 0 };
    if (!data || !data.planets) {
      // Return a default balanced distribution if no data, or handle as preferred
      return { fire: 25, earth: 25, water: 25, air: 25 };
    }

    const signToElement: { [key: string]: keyof ElementsDistribution } = {
      'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
      'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
      'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
      'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water',
    };

    let totalPoints = 0;
    for (const planetKey in data.planets) {
      const planet = data.planets[planetKey];
      if (planet && planet.sign) {
        const element = signToElement[planet.sign];
        if (element) {
          distribution[element]++;
          totalPoints++;
        }
      }
    }

    if (totalPoints === 0) {
      return { fire: 25, earth: 25, water: 25, air: 25 }; // Default if no planets contributed
    }

    // Calculate percentages and round them
    let firePct = Math.round((distribution.fire / totalPoints) * 100);
    let earthPct = Math.round((distribution.earth / totalPoints) * 100);
    let waterPct = Math.round((distribution.water / totalPoints) * 100);
    let airPct = Math.round((distribution.air / totalPoints) * 100);

    // Adjust to ensure sum is 100 due to rounding
    let sumPct = firePct + earthPct + waterPct + airPct;
    if (sumPct !== 100) {
      const diff = 100 - sumPct;
      // A simple way to adjust: add/subtract difference to/from the largest percentage
      const percentages = [{name: 'fire', value: firePct}, {name: 'earth', value: earthPct}, {name: 'water', value: waterPct}, {name: 'air', value: airPct}];
      percentages.sort((a,b) => b.value - a.value);
      if (percentages[0].name === 'fire') firePct += diff;
      else if (percentages[0].name === 'earth') earthPct += diff;
      else if (percentages[0].name === 'water') waterPct += diff;
      else airPct += diff;
    }

    return {
      fire: firePct,
      earth: earthPct,
      water: waterPct,
      air: airPct,
    };
  }

  const elementsDistribution = useMemo(() => getElementsDistribution(astroData), [astroData]);

  function getDynamicElementalInterpretation(distribution: ElementsDistribution): string {
    const { fire, earth, water, air } = distribution;
    const elementsOriginal = [
      { name: 'Fire', value: fire },
      { name: 'Earth', value: earth },
      { name: 'Water', value: water },
      { name: 'Air', value: air },
    ];

    const sortedElements = [...elementsOriginal].sort((a, b) => b.value - a.value);
    const [first, second, third, fourth] = sortedElements;

    const dominantThr = 35;
    const strongThr = 28;
    const lackingThr = 15;
    // const moderateLowThr = 16;
    // const moderateHighThr = 27;

    let interpretation = '';

    // Scenario 1: Two Dominant Elements
    if (first.value >= dominantThr && second.value >= strongThr) {
      if ((first.name === 'Fire' && second.name === 'Air') || (first.name === 'Air' && second.name === 'Fire')) {
        interpretation = "An absolute inferno of Fire meeting a whirlwind of Air! Brace for a spectacle of breathtaking speed, audacious offensive assaults, and genius-level playmaking. Star players will be gunning for legendary status. But this high-wire act courts disaster: expect shocking defensive breakdowns, high-profile errors under pressure, and teams risking burnout. This is a matchup where the scoreboard might explode!";
      } else if ((first.name === 'Fire' && second.name === 'Earth') || (first.name === 'Earth' && second.name === 'Fire')) {
        interpretation = "A titanic clash of raw Firepower against immovable Earth! Expect brutal physicality, where explosive offensive bursts meet ironclad defensive stands. Games could turn on moments of individual brilliance overcoming sheer resilience, or disciplined strategy quelling aggressive onslaughts. Player endurance and the ability to absorb punishment will be paramount.";
      } else if ((first.name === 'Fire' && second.name === 'Water') || (first.name === 'Water' && second.name === 'Fire')) {
        interpretation = "A seething cauldron of Fire and Water! Today's contests will be fought with raw, untamed emotion. Expect simmering rivalries to erupt, with players riding a tidal wave of adrenaline. This volatile brew can forge legendary, clutch moments OR trigger epic meltdowns under the spotlight. Psychological fortitude will be as crucial as physical skill.";
      } else if ((first.name === 'Earth' && second.name === 'Air') || (first.name === 'Air' && second.name === 'Earth')) {
        interpretation = "Strategic Air intellect versus methodical Earth power! This is a chess match on the grandest scale. Expect calculated risks and innovative game plans trying to dismantle disciplined, resilient opponents. Will quick thinking and adaptability outmaneuver sheer persistence, or will relentless pressure expose tactical flaws? Mental toughness meets physical grind.";
      } else if ((first.name === 'Earth' && second.name === 'Water') || (first.name === 'Water' && second.name === 'Earth')) {
        interpretation = "Deep Water intuition flows into formidable Earth structures. Teams might display incredible synergy, turning disciplined defense into fluid, opportunistic attacks. Player instincts combined with unwavering team strategy can create an almost unbreakable force. However, if the emotional Water gets muddied or Earth's foundations crack, it could lead to surprising collapses.";
      } else if ((first.name === 'Air' && second.name === 'Water') || (first.name === 'Water' && second.name === 'Air')) {
        interpretation = "The unpredictable currents of Water meet the strategic gusts of Air! Expect a dazzling display of creative playmaking, where intuitive flashes are backed by intelligent execution. Teams that can 'feel' the game's rhythm while outthinking their opponents will thrive. However, this blend can also lead to over-complication or emotional decisions overriding sound strategy. Genius or chaos could prevail.";
      }
    } 
    // Scenario 2: One Element Clearly Dominant
    else if (first.value >= dominantThr) {
      if (first.name === 'Fire') {
        interpretation = "Pure Fire fuels the arena today! This is where individual brilliance can single-handedly dominate. Expect aggressive, attacking play from the get-go, with teams pushing the tempo relentlessly. Records could be challenged, but so could composure – watch for explosive tempers or costly, overzealous penalties. Underdogs banking on a defensive grind will struggle immensely.";
      } else if (first.name === 'Earth') {
        interpretation = "The relentless power of Earth shapes today's battlefield! Expect a masterclass in defensive discipline, physical dominance, and unwavering resolve. Teams built on solid foundations and methodical execution will grind opponents into submission. Low-scoring, gritty affairs are likely, where every inch is fought for. Flashy plays give way to sheer willpower.";
      } else if (first.name === 'Air') {
        interpretation = "The game will be played at the speed of thought with Air ascendant! Prepare for strategic masterminds to dictate play, with dazzling displays of skill, quick adaptation, and telepathic teamwork. Teams that can out-think and outmaneuver their rivals will soar. However, an over-reliance on intellect can lead to paralysis by analysis or vulnerability to raw, unpredictable power.";
      } else if (first.name === 'Water') {
        interpretation = "A tidal wave of Water energy floods the competition! Intuition, team synergy, and emotional intensity will define victory. Expect players to tap into a collective consciousness, making instinctive, game-changing plays. Momentum will be king, capable of carrying teams to stunning heights or dragging them into despair. Clutch performances under immense pressure are on the cards.";
      }
    }

    // Scenario 3: One Element Lacking (can be an additional insight or primary if no dominant scenario)
    let lackingInterpretation = '';
    if (fourth.value <= lackingThr) {
      const lackingElement = fourth.name;
      if (lackingElement === 'Fire') {
        lackingInterpretation = "A critical lack of Fire could extinguish offensive sparks! Teams might struggle for aggression, killer instinct, and the individual brilliance needed to break deadlocks. Expect cautious play, possibly leading to stalemates or low-energy contests decided by errors rather than daring.";
      } else if (lackingElement === 'Earth') {
        lackingInterpretation = "Dangerously low Earth energy means the very foundation of disciplined play is crumbling! Watch for chaotic execution, a shocking lack of fundamentals, and teams utterly failing to protect a lead. This is prime territory for monumental upsets, as even elite teams might look amateurish.";
      } else if (lackingElement === 'Air') {
        lackingInterpretation = "A deficit in Air could lead to strategic meltdowns! Teams may suffer from poor decision-making, an inability to adapt, and breakdowns in communication. Expect sloppy plays, mental errors, and an inability to exploit opponents' weaknesses. Raw talent alone won't save the day if the game plan is incoherent.";
      } else if (lackingElement === 'Water') {
        lackingInterpretation = "Low Water energy can drain the passion from the game! Teams might lack cohesion, struggle to find rhythm, or fail to connect emotionally with the stakes. Expect mechanical performances, a lack of intuitive plays, and difficulty mounting comebacks when adversity strikes. Resilience will be tested.";
      }
      if (interpretation && lackingInterpretation) {
        interpretation += ` Additionally, ${lackingInterpretation.charAt(0).toLowerCase() + lackingInterpretation.slice(1)}`;
      } else if (lackingInterpretation) {
        interpretation = lackingInterpretation;
      }
    }

    // Scenario 4: Balanced State (if no other strong scenarios hit)
    if (!interpretation && elementsOriginal.every(el => el.value > lackingThr && el.value < dominantThr )) {
       // Check for a more tightly balanced scenario
        const allModerate = elementsOriginal.every(el => el.value >= (lackingThr + 5) && el.value <= (strongThr -3)); // e.g. all between 20-25
        if (allModerate) {
            interpretation = "A truly balanced elemental field means today's victory will be forged by superior all-around execution and strategic genius. No single approach will dominate; teams must be masters of adaptation, exploiting subtle shifts in momentum. This is where coaching prowess and deep rosters shine, potentially leading to a chess match decided by fine margins.";
        } else {
            // General prominent element if not strictly balanced but no other rule hit
            if (first.value >= strongThr) { // A less dominant 'first' element
                let prominentQuality = '';
                switch (first.name) {
                    case 'Fire': prominentQuality = 'aggressive plays and individual efforts'; break;
                    case 'Earth': prominentQuality = 'strong defensive plays and resilience'; break;
                    case 'Air': prominentQuality = 'smart strategies and adaptability'; break;
                    case 'Water': prominentQuality = 'intuitive teamwork and emotional drive'; break;
                }
                interpretation = `While no single element overwhelmingly dominates, ${first.name} provides a significant undercurrent of ${prominentQuality}. Expect this to subtly shape game dynamics, favoring teams that can tap into this leading energy while remaining versatile against other influences.`;
            }
        }
    }

    // Fallback if no specific interpretation was set
    if (!interpretation) {
      interpretation = "Today's unique elemental cocktail creates an unpredictable arena! Elite athletes will need to draw on every ounce of skill, strategy, and instinct. Look for moments where the sheer will to win defies the patterns, and where unexpected heroes can emerge from the complex interplay of energies. Anything can happen!";
    }

    return interpretation;
  }

  // Navigation
  const navigate = useNavigate();
  
  // Handle navigation to upcoming games page
  const handleSeeMoreGames = () => {
    navigate('/upcoming-games');
  };

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
    
    const moonPhaseData: MoonPhaseInfo = {
      name: hookData.moonPhase?.name || 'New Moon',
      value: hookData.moonPhase?.value ?? 0,
      illumination: hookData.moonPhase?.illumination ?? 0,
      nextFullMoon: hookData.moonPhase?.nextFullMoon || new Date(Date.now() + 29.53 * 24 * 60 * 60 * 1000), // Default to ~30 days from now if not available
      ageInDays: hookData.moonPhase?.ageInDays ?? 0,
      phaseType: hookData.moonPhase?.phaseType || 'new'
    };

    const validAspectTypes: AspectType[] = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
    const aspectsData: Aspect[] = (hookData.aspects || []).map(hookAspect => {
      const aspectType = hookAspect.type.toLowerCase() as AspectType;
      // Attempt to find a more specific interpretation if available
      let interpretation = (hookAspect as any).interpretation || (hookData.interpretations?.[`${hookAspect.planets[0]?.name}-${hookAspect.planets[1]?.name}-${hookAspect.type}`] as string);
      // Fallback for general aspect type interpretation if specific one is missing
      if (!interpretation) {
        interpretation = (hookData.interpretations?.[hookAspect.type] as string) || 'General influence';
      }
      // Check for lacking interpretation for specific planets
      let lackingInterpretation = '';
      if (!(hookAspect as any).interpretation && !hookData.interpretations?.[`${hookAspect.planets[0]?.name}-${hookAspect.planets[1]?.name}-${hookAspect.type}`]) {
        lackingInterpretation = `Interpretation for ${hookAspect.planets[0]?.name} ${hookAspect.type} ${hookAspect.planets[1]?.name} is pending.`;
      }
      if (interpretation && lackingInterpretation) {
        interpretation += ` Additionally, ${lackingInterpretation.charAt(0).toLowerCase() + lackingInterpretation.slice(1)}`;
      } else if (lackingInterpretation) {
        interpretation = lackingInterpretation;
      }

      return {
        from: hookAspect.planets[0]?.name || 'Unknown Planet',
        to: hookAspect.planets[1]?.name || 'Unknown Planet',
        type: aspectType,
        orb: hookAspect.orb,
        influence: { 
          description: interpretation,
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
    const transformedData: GamePredictionData | null = transformHookDataToGamePredictionData(astroData);
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
      return predictGameOutcome(game, homeTeam, awayTeam, transformedAstro);
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
    if (team.primary_color) teamData.primary_color = team.primary_color;
    if (team.secondary_color) teamData.secondary_color = team.secondary_color;
    
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
      } // Closes if (astroData.elements)

      const totalElements = fireScore + earthScore + waterScore + airScore;

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
    <DashboardLayout>
      {featuredArticle && (
        <motion.section
          variants={featuredArticleVariant}
          initial="hidden"
          animate="visible"
          className="mb-8 p-6 bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-xl shadow-2xl text-white overflow-hidden relative"
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {featuredArticle.featureImageUrl && (
              <motion.div 
                className="md:w-1/3 w-full h-64 rounded-lg overflow-hidden shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <img 
                  src={featuredArticle.featureImageUrl} 
                  alt={featuredArticle.title} 
                  className="w-full h-full object-cover" 
                />
              </motion.div>
            )}
            <div className="md:w-2/3">
              <Badge variant="secondary" className="mb-2 bg-white/20 text-white backdrop-blur-sm">Featured Insight</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{featuredArticle.title}</h2>
              {featuredArticle.subheading && (
                <p className="text-lg text-indigo-100 dark:text-indigo-200 mb-4">
                  {featuredArticle.subheading}
                </p>
              )}
              <Link 
                to={`/news/${featuredArticle.slug}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white transition-all duration-150 ease-in-out transform hover:scale-105 shadow-md"
              >
                Read Full Story <Star className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
          {/* Optional: subtle background pattern or elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             {/* Example: <Sparkles className="absolute top-5 right-5 w-16 h-16 text-yellow-300" /> */}
          </div>
        </motion.section>
      )}

      {/* Main Dashboard Content Starts Here */}
      <motion.div 
        variants={container} 
        initial="hidden"   
        animate="show"     
        exit="hidden"     
        className="space-y-8"
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
            <div className="grid grid-cols-1 gap-8">
              {/* Upcoming Games Section (Full width) */}
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
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
                          <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                            {group.games.map((game) => {
                              // const homeTeam = findTeam(String(game.home_team_id)); // Replaced by game.home_team
                              // const awayTeam = findTeam(String(game.away_team_id)); // Replaced by game.away_team
                              // Log the raw game data for debugging
                              console.log('Raw game data:', {
                                gameId: game.id,
                                home_team: game.home_team,
                                away_team: game.away_team,
                                home_team_id: game.home_team_id,
                                away_team_id: game.away_team_id,
                                home_team_logo: game.home_team?.logo_url || game.home_team?.logo,
                                away_team_logo: game.away_team?.logo_url || game.away_team?.logo
                              });

                              // Get team data with proper fallbacks
                              const homeTeam = typeof game.home_team === 'string' 
                                ? { id: game.home_team_id, name: 'Home Team' } 
                                : game.home_team || { id: game.home_team_id, name: 'Home Team' };
                              
                              const awayTeam = typeof game.away_team === 'string'
                                ? { id: game.away_team_id, name: 'Away Team' }
                                : game.away_team || { id: game.away_team_id, name: 'Away Team' };
                              
                              console.log('Processed team data:', { homeTeam, awayTeam });

                              const gamePrediction = getGamePrediction(game, homeTeam, awayTeam);
                              
                              // Transform astroData from the hook for the GameCard prop
                              const gameCardAstroData: GamePredictionData | null = astroData
                                ? transformHookDataToGamePredictionData(astroData as HookAstroData)
                                : null;

                              // Merge game data with its prediction and team data for the GameCard
                              const gameWithTeams = {
                                ...game,
                                prediction: gamePrediction ?? undefined, // Ensure undefined if null for type compatibility
                              };

                              // Log the raw team data for debugging
                              console.log('Raw home team data:', homeTeam);
                              console.log('Raw away team data:', awayTeam);

                              // Ensure we have proper team objects with required properties
                              const homeTeamData = {
                                ...(typeof homeTeam === 'string' ? {} : homeTeam || {}),
                                id: game.home_team_id,
                                name: typeof homeTeam === 'string' ? homeTeam : homeTeam?.name || 'Home Team',
                                // Try logo_url first, then logo, then empty string
                                logo_url: typeof homeTeam === 'string' 
                                  ? '' 
                                  : (homeTeam?.logo_url || homeTeam?.logo || ''),
                                // Also include the logo property for backward compatibility
                                logo: typeof homeTeam === 'string'
                                  ? ''
                                  : (homeTeam?.logo || homeTeam?.logo_url || ''),
                                record: typeof homeTeam === 'string' ? '0-0' : homeTeam?.record || '0-0',
                              };

                              const awayTeamData = {
                                ...(typeof awayTeam === 'string' ? {} : awayTeam || {}),
                                id: game.away_team_id,
                                name: typeof awayTeam === 'string' ? awayTeam : awayTeam?.name || 'Away Team',
                                // Try logo_url first, then logo, then empty string
                                logo_url: typeof awayTeam === 'string'
                                  ? ''
                                  : (awayTeam?.logo_url || awayTeam?.logo || ''),
                                // Also include the logo property for backward compatibility
                                logo: typeof awayTeam === 'string'
                                  ? ''
                                  : (awayTeam?.logo || awayTeam?.logo_url || ''),
                                record: typeof awayTeam === 'string' ? '0-0' : awayTeam?.record || '0-0',
                              };

                              console.log('Processed home team data:', homeTeamData);
                              console.log('Processed away team data:', awayTeamData);

                              return (
                                <GameCard
                                  key={game.id}
                                  game={game}
                                  homeTeam={homeTeamData}
                                  awayTeam={awayTeamData}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {games.length === 0 && !gamesLoading ? (
                        <p className="text-center text-slate-500 py-8">No upcoming games scheduled for this league.</p>
                      ) : (
                        <div className="mt-8 mb-2 flex justify-center">
                          <Button 
                            variant="outline" 
                            className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-indigo-500 rounded-full shadow-md group"
                            onClick={handleSeeMoreGames}
                          >
                            <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-500 group-hover:translate-x-0 ease">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                              </svg>
                            </span>
                            <span className="absolute flex items-center justify-center w-full h-full text-indigo-500 transition-all duration-300 transform group-hover:translate-x-full ease">
                              View All Games
                            </span>
                            <span className="relative invisible">View All Games</span>
                          </Button>
                        </div>
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
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {getDynamicElementalInterpretation(elementsDistribution)}
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
    </DashboardLayout>
  );
}

export default Dashboard;
