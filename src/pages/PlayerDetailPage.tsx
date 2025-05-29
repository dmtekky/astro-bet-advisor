import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectType, CelestialBody, ElementalBalance, ModalBalance } from '@/types/astrology';
import { BarChart, RadarChart, LineChart, PieChart } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generatePlayerAstroData } from '@/lib/playerAstroService';
import { useToast } from '@/components/ui/use-toast';

import { calculateImpactScore } from '../utils/calculateImpactScore';
// Types
interface BattingStats {
  atBats?: number;
  runs?: number;
  hits?: number;
  secondBaseHits?: number;
  thirdBaseHits?: number;
  homeruns?: number;
  earnedRuns?: number; 
  unearnedRuns?: number; 
  runsBattedIn?: number;
  batterWalks?: number;
  batterSwings?: number;
  batterStrikes?: number;
  batterStrikesFoul?: number;
  batterStrikesMiss?: number;
  batterStrikesLooking?: number;
  batterTagOuts?: number;
  batterForceOuts?: number;
  batterPutOuts?: number;
  batterGroundBalls?: number;
  batterFlyBalls?: number;
  batterLineDrives?: number;
  batter2SeamFastballs?: number;
  batter4SeamFastballs?: number;
  batterCurveballs?: number;
  batterChangeups?: number;
  batterCutters?: number;
  batterSliders?: number;
  batterSinkers?: number;
  batterSplitters?: number;
  batterStrikeouts?: number;
  stolenBases?: number;
  caughtBaseSteals?: number;
  batterStolenBasePct?: number;
  battingAvg?: number;
  batterOnBasePct?: number;
  batterSluggingPct?: number;
  batterOnBasePlusSluggingPct?: number;
  batterIntentionalWalks?: number;
  hitByPitch?: number;
  batterSacrificeBunts?: number;
  batterSacrificeFlies?: number;
  totalBases?: number;
  extraBaseHits?: number;
  batterDoublePlays?: number;
  batterTriplePlays?: number;
  batterGroundOuts?: number;
  batterFlyOuts?: number;
  batterGroundOutToFlyOutRatio?: number;
  pitchesFaced?: number;
  plateAppearances?: number;
  leftOnBase?: number;
  gamesPlayed?: number;
}

interface FieldingStats {
  gamesPlayed?: number;
  gamesStarted?: number;
  inningsPlayed?: number;
  assists?: number;
  putOuts?: number;
  errors?: number;
  fieldingPct?: number;
  rangeFactorPerGame?: number;
  rangeFactorPerNineInnings?: number;
  doublePlaysByPosition?: number;
  triplePlaysByPosition?: number;
  outfieldAssists?: number;
  pickoffs?: number;
  passedBalls?: number;
  wildPitches?: number;
  catcherInterferences?: number;
  stolenBasesAllowed?: number;
  caughtStealing?: number;
  throwingErrors?: number;
  tagsApplied?: number;
  forceOuts?: number;
  runnersPicked?: number;
  blockedBalls?: number;
}

interface Player {
  id: string;
  player_id?: string;
  player_first_name?: string;
  player_last_name?: string;
  player_full_name?: string;
  player_primary_position?: string;
  player_jersey_number?: string | number;
  player_birth_date?: string;
  player_birth_city?: string;
  player_birth_state?: string;
  player_birth_country?: string;
  player_height?: number;
  player_weight?: number;
  player_official_image_src?: string;
  player_current_team_id?: string;
  player_current_team_abbreviation?: string;
  stats_batting_details?: BattingStats;
  stats_fielding_details?: FieldingStats;
  stats_pitching_details?: any;
  impact_score?: number;
  astro_influence_score?: number;
  [key: string]: any;
}

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo_url?: string;
  city: string;
  primary_color?: string;
  secondary_color?: string;
}

interface AstroChartData {
  date: string;
  planets: Record<string, CelestialBody>;
  moonPhase: {
    name: string;
    value: number;
    illumination: number;
  };
  houses: Record<string, {
    sign: string;
    degree: number;
  }>;
  signs: Record<string, {
    name: string;
    element: string;
    modality: string;
    symbol: string;
  }>;
  aspects: Array<{
    bodies: [string, string];
    type: AspectType;
    orb: number;
    aspect: string;
    influence: string;
  }>;
  elements: ElementalBalance;
  modalities: ModalBalance;
  sunSign: string;
  moonSign: string;
  ascendant: string;
  dominantPlanets: Array<{
    planet: string;
    score: number;
    interpretation: string;
    type: string;
    influence: string;
    interpretation?: string;
  }>;
  astroWeather: string;
}

// Helper functions
const formatBirthDate = (date: string | undefined): string => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getPositionLabel = (position: string | undefined): string => {
  if (!position) return 'Unknown';
  
  const positionMap: Record<string, string> = {
    'P': 'Pitcher',
    'C': 'Catcher',
    '1B': 'First Baseman',
    '2B': 'Second Baseman',
    '3B': 'Third Baseman',
    'SS': 'Shortstop',
    'LF': 'Left Fielder',
    'CF': 'Center Fielder',
    'RF': 'Right Fielder',
    'DH': 'Designated Hitter',
    'OF': 'Outfielder',
    'IF': 'Infielder',
    'UT': 'Utility Player'
  };
  
  return positionMap[position] || position;
};

const getSignColor = (sign: string): string => {
  const colors: Record<string, string> = {
    'Aries': '#FF4136',
    'Taurus': '#2ECC40',
    'Gemini': '#FFDC00',
    'Cancer': '#B10DC9',
    'Leo': '#FF851B',
    'Virgo': '#7FDBFF',
    'Libra': '#F012BE',
    'Scorpio': '#111111',
    'Sagittarius': '#0074D9',
    'Capricorn': '#85144b',
    'Aquarius': '#39CCCC',
    'Pisces': '#01FF70',
    'Unknown': '#AAAAAA'
  };
  
  return colors[sign] || colors['Unknown'];
};

// Helper functions for Elemental Balance
const getElementalInfluence = (element: string, percentage: number): string => {
  if (percentage > 30) return 'Strong Influence';
  if (percentage > 20) return 'Moderate Influence';
  if (percentage > 10) return 'Mild Influence';
  return 'Minimal Influence';
};

const getElementalDescription = (element: string, percentage: number, playerName: string): string => {
  const elementTitles = {
    fire: { title: 'Fire', emoji: '🔥' },
    earth: { title: 'Earth', emoji: '🌍' },
    air: { title: 'Air', emoji: '💨' },
    water: { title: 'Water', emoji: '💧' }
  };

  const { title, emoji } = elementTitles[element as keyof typeof elementTitles] || { title: element, emoji: '✨' };
  const influence = getElementalInfluence(element, percentage);
  
  const descriptions: Record<string, Record<string, string>> = {
    fire: {
      'Strong Influence': `${playerName} has a powerful Fire presence (${Math.round(percentage)}%), bringing intense energy, passion, and competitive drive to the game. This makes ${playerName} a natural leader with a strong will to win.`,
      'Moderate Influence': `With a solid Fire influence (${Math.round(percentage)}%), ${playerName} shows good initiative and enthusiasm. They have the spark to take charge when needed and inspire teammates.`,
      'Mild Influence': `A modest Fire influence (${Math.round(percentage)}%) gives ${playerName} just enough competitive edge without being overly aggressive.`,
      'Minimal Influence': `Minimal Fire (${Math.round(percentage)}%) suggests ${playerName} may need to work on their assertiveness and competitive drive.`
    },
    earth: {
      'Strong Influence': `A strong Earth presence (${Math.round(percentage)}%) gives ${playerName} exceptional reliability, consistency, and practical skills. They're the rock of the team, always delivering solid performances.`,
      'Moderate Influence': `With balanced Earth energy (${Math.round(percentage)}%), ${playerName} shows good discipline and work ethic. They understand the fundamentals and execute them well.`,
      'Mild Influence': `A touch of Earth (${Math.round(percentage)}%) provides some stability, but ${playerName} may need to focus more on consistency.`,
      'Minimal Influence': `Minimal Earth (${Math.round(percentage)}%) suggests ${playerName} might struggle with consistency or attention to detail.`
    },
    air: {
      'Strong Influence': `With strong Air influence (${Math.round(percentage)}%), ${playerName} has excellent strategic thinking, communication skills, and adaptability. They can quickly analyze situations and adjust their game.`,
      'Moderate Influence': `A good balance of Air (${Math.round(percentage)}%) gives ${playerName} solid mental agility and the ability to understand complex plays.`,
      'Mild Influence': `Some Air influence (${Math.round(percentage)}%) provides basic strategic thinking abilities, but ${playerName} may need to work on quick decision-making.`,
      'Minimal Influence': `Limited Air (${Math.round(percentage)}%) suggests ${playerName} may need to focus more on the mental aspects of the game.`
    },
    water: {
      'Strong Influence': `A powerful Water influence (${Math.round(percentage)}%) gives ${playerName} exceptional intuition, emotional intelligence, and the ability to read the game on a deeper level.`,
      'Moderate Influence': `With balanced Water (${Math.round(percentage)}%), ${playerName} shows good instincts and the ability to connect with teammates on and off the field.`,
      'Mild Influence': `Some Water influence (${Math.round(percentage)}%) provides basic intuition, but ${playerName} may need to trust their instincts more.`,
      'Minimal Influence': `Minimal Water (${Math.round(percentage)}%) suggests ${playerName} may need to work on emotional awareness and team chemistry.`
    }
  };

  return `${emoji} ${descriptions[element]?.[influence] || `${title} influence (${Math.round(percentage)}%): This element affects ${playerName}'s playing style.`}`;
};

const getElementalSynergy = (elements: ElementalBalance, playerName: string): string => {
  const elementPercentages = Object.entries(elements)
    .map(([element, data]) => ({
      element,
      percentage: data.percentage,
      influence: getElementalInfluence(element, data.percentage)
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const primaryElement = elementPercentages[0];
  const secondaryElement = elementPercentages[1];
  
  const elementPairs: Record<string, Record<string, string>> = {
    fire: {
      earth: "This combination creates a powerful drive (Fire) with practical execution (Earth).",
      air: "This pairing brings dynamic energy (Fire) with strategic thinking (Air).",
      water: "This mix combines passion (Fire) with intuition (Water), creating emotional intensity.",
      fire: "A dominant Fire presence indicates strong willpower and competitive spirit."
    },
    earth: {
      fire: "Practical skills (Earth) combined with drive (Fire) make for reliable performance.",
      air: "This blend of practicality (Earth) and intellect (Air) creates a thoughtful, strategic approach.",
      water: "Sensitivity (Water) meets practicality (Earth) for a grounded, intuitive style.",
      earth: "Strong Earth indicates consistency and reliability above all else."
    },
    air: {
      fire: "Quick thinking (Air) meets action (Fire) for dynamic, adaptable play.",
      earth: "Strategic thinking (Air) combines with practicality (Earth) for smart, effective play.",
      water: "This pairing creates excellent communication (Air) and intuition (Water).",
      air: "Strong Air suggests a highly analytical and communicative approach."
    },
    water: {
      fire: "Intuition (Water) and passion (Fire) create deep emotional engagement.",
      earth: "Emotional intelligence (Water) meets practicality (Earth) for balanced performance.",
      air: "This combination brings emotional depth (Water) and mental agility (Air).",
      water: "Strong Water indicates deep intuition and emotional awareness."
    }
  };

  let synergyText = `${playerName}'s elemental balance shows `;
  
  if (primaryElement.percentage > 40) {
    synergyText += `a strong emphasis on ${primaryElement.element} energy, `;
    synergyText += `indicating ${playerName} brings ${primaryElement.element}-related strengths to their game. `;
  } else {
    synergyText += `a relatively balanced elemental composition, `;
    synergyText += `with ${primaryElement.element} (${Math.round(primaryElement.percentage)}%) and ${secondaryElement.element} (${Math.round(secondaryElement.percentage)}%) being most prominent. `;
  }

  // Add specific synergy note if we have a pair
  if (primaryElement && secondaryElement) {
    const primaryKey = primaryElement.element as keyof typeof elementPairs;
    const secondaryKey = secondaryElement.element as keyof typeof elementPairs[typeof primaryKey];
    
    if (elementPairs[primaryKey]?.[secondaryKey]) {
      synergyText += elementPairs[primaryKey][secondaryKey];
    }
  }

  // Add overall assessment
  const totalScore = Object.values(elements).reduce((sum, el) => sum + (el.percentage * (el.score || 1)), 0) / 
    Object.values(elements).reduce((sum, el) => sum + (el.percentage > 0 ? 1 : 0), 1);
  
  if (totalScore > 30) {
    synergyText += ` This is a powerful elemental combination that gives ${playerName} significant advantages in their playing style.`;
  } else if (totalScore > 20) {
    synergyText += ` This balanced elemental profile supports consistent performance and adaptability.`;
  } else {
    synergyText += ` This elemental distribution suggests ${playerName} may need to develop certain aspects of their game to reach their full potential.`;
  }

  return synergyText;
};

// Main component
const PlayerDetailPage = () => {
  const { toast } = useToast();
  const { playerId, teamId } = useParams<{ playerId: string; teamId: string }>();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [astroData, setAstroData] = useState<AstroChartData | null>(null);
  const [loadingAstroData, setLoadingAstroData] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [activeBattingTab, setActiveBattingTab] = useState<string>('overview');
  const [activeFieldingTab, setActiveFieldingTab] = useState<string>('overview');

  const overviewRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const astroRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // Define stat group type
  interface StatItem {
    label: string;
    value: string;
    tooltip?: string;
  }
  
  type StatGroup = Record<string, StatItem[]>;
  
  // Batting stats formatting logic
  const s = player?.stats_batting_details;
  const formatPct = (val?: number) => val ? val.toFixed(3).slice(1) : '.000';
  const formatCount = (val?: number) => val?.toString() || '0';
  
  // Initialize batting stat groups
  const statGroups: StatGroup = Object.create(null);
  
  // Initialize fielding stat groups
  const fieldingStatGroups: StatGroup = Object.create(null);
  
  // Initialize pitch types array
  const pitchTypes = [
    { label: '4S', value: s?.batter4SeamFastballs, tooltip: '4-Seam Fastballs' },
    { label: '2S', value: s?.batter2SeamFastballs, tooltip: '2-Seam Fastballs' },
    { label: 'SI', value: s?.batterSinkers, tooltip: 'Sinkers' },
    { label: 'CT', value: s?.batterCutters, tooltip: 'Cutters' },
    { label: 'SL', value: s?.batterSliders, tooltip: 'Sliders' },
    { label: 'CB', value: s?.batterCurveballs, tooltip: 'Curveballs' },
    { label: 'CH', value: s?.batterChangeups, tooltip: 'Changeups' },
    { label: 'SP', value: s?.batterSplitters, tooltip: 'Splitters' },
  ].filter(p => p.value !== undefined);
  
  // Process batting stats
  if (s) {
    statGroups.overview = [
      { label: 'AVG', value: formatPct(s.battingAvg), tooltip: 'Batting Average' },
      { label: 'OBP', value: formatPct(s.batterOnBasePct), tooltip: 'On-Base %' },
      { label: 'SLG', value: formatPct(s.batterSluggingPct), tooltip: 'Slugging %' },
      { label: 'OPS', value: formatPct(s.batterOnBasePlusSluggingPct), tooltip: 'OPS' },
      { label: 'PA', value: formatCount(s.plateAppearances), tooltip: 'Plate Appearances' },
      { label: 'AB', value: formatCount(s.atBats), tooltip: 'At Bats' },
      { label: 'H', value: formatCount(s.hits), tooltip: 'Hits' },
      { label: 'HR', value: formatCount(s.homeruns), tooltip: 'Home Runs' },
      { label: 'RBI', value: formatCount(s.runsBattedIn), tooltip: 'Runs Batted In' },
      { label: 'R', value: formatCount(s.runs), tooltip: 'Runs Scored' },
      { label: 'BB', value: formatCount(s.batterWalks), tooltip: 'Walks' },
      { label: 'K', value: formatCount(s.batterStrikeouts), tooltip: 'Strikeouts' },
    ];

    statGroups.advanced = [
      { label: '2B', value: formatCount(s.secondBaseHits), tooltip: 'Doubles' },
      { label: '3B', value: formatCount(s.thirdBaseHits), tooltip: 'Triples' },
      { label: 'TB', value: formatCount(s.totalBases), tooltip: 'Total Bases' },
      { label: 'XBH', value: formatCount(s.extraBaseHits), tooltip: 'Extra Base Hits' },
      { label: 'HBP', value: formatCount(s.hitByPitch), tooltip: 'Hit By Pitch' },
      { label: 'SAC', value: formatCount(s.batterSacrificeBunts), tooltip: 'Sac Bunts' },
      { label: 'SF', value: formatCount(s.batterSacrificeFlies), tooltip: 'Sac Flies' },
    ];
    
    // Add plate discipline stats if available
    if (s.batterSwings !== undefined || s.batterStrikes !== undefined) {
      statGroups.plateDiscipline = [
        { label: 'Swings', value: formatCount(s.batterSwings), tooltip: 'Total Swings' },
        { label: 'Strikes', value: formatCount(s.batterStrikes), tooltip: 'Strikes Seen' },
        { label: 'Fouls', value: formatCount(s.batterStrikesFoul), tooltip: 'Foul Balls' },
        { label: 'Whiffs', value: formatCount(s.batterStrikesMiss), tooltip: 'Swinging Strikes' },
        { label: 'Looking', value: formatCount(s.batterStrikesLooking), tooltip: 'Called Strikes' },
        { label: 'Pitches', value: formatCount(s.pitchesFaced), tooltip: 'Pitches Faced' },
      ];
    }
    
    // Add batted ball stats if available
    if (s.batterGroundBalls !== undefined || s.batterLineDrives !== undefined) {
      statGroups.battedBall = [
        { label: 'GB', value: formatCount(s.batterGroundBalls), tooltip: 'Ground Balls' },
        { label: 'FB', value: formatCount(s.batterFlyBalls), tooltip: 'Fly Balls' },
        { label: 'LD', value: formatCount(s.batterLineDrives), tooltip: 'Line Drives' },
        { label: 'GO/AO', value: formatCount(s.batterGroundOutToFlyOutRatio), tooltip: 'Ground Out to Fly Out Ratio' },
      ];
    }
  }
  
  // Helper function to calculate caught stealing percentage
  const calculateCaughtStealingPct = (stats: FieldingStats): string => {
    if (stats.caughtStealing !== undefined && stats.stolenBasesAllowed !== undefined && 
        stats.caughtStealing > 0 && stats.stolenBasesAllowed > 0) {
      return formatPct(stats.caughtStealing / (stats.caughtStealing + stats.stolenBasesAllowed));
    }
    return '.000';
  };
  
  // Process fielding stats
  const f = player?.stats_fielding_details;
  if (f) {
    // Add overview fielding stats
    fieldingStatGroups.overview = [
      { label: 'Games', value: formatCount(f.gamesPlayed), tooltip: 'Games Played' },
      { label: 'FLD%', value: formatPct(f.fieldingPct), tooltip: 'Fielding Percentage' },
      { label: 'PO', value: formatCount(f.putOuts), tooltip: 'Put Outs' },
      { label: 'A', value: formatCount(f.assists), tooltip: 'Assists' },
      { label: 'E', value: formatCount(f.errors), tooltip: 'Errors' },
      { label: 'DP', value: formatCount(f.doublePlaysByPosition), tooltip: 'Double Plays' },
    ];

    // Add detailed defensive stats if available
    if (f.inningsPlayed !== undefined) {
      fieldingStatGroups.defensive = [
        { label: 'Games', value: formatCount(f.gamesPlayed), tooltip: 'Games Played' },
        { label: 'GS', value: formatCount(f.gamesStarted), tooltip: 'Games Started' },
        { label: 'Inn', value: formatCount(f.inningsPlayed), tooltip: 'Innings Played' },
        { label: 'PO', value: formatCount(f.putOuts), tooltip: 'Put Outs' },
        { label: 'A', value: formatCount(f.assists), tooltip: 'Assists' },
        { label: 'E', value: formatCount(f.errors), tooltip: 'Errors' },
        { label: 'DP', value: formatCount(f.doublePlaysByPosition), tooltip: 'Double Plays' },
        { label: 'TP', value: formatCount(f.triplePlaysByPosition), tooltip: 'Triple Plays' },
        { label: 'FLD%', value: formatPct(f.fieldingPct), tooltip: 'Fielding Percentage' },
      ];
    }
    
    // Add range stats if available
    if (f.rangeFactorPerGame !== undefined || f.rangeFactorPerNineInnings !== undefined) {
      fieldingStatGroups.range = [
        { label: 'RF/G', value: formatPct(f.rangeFactorPerGame), tooltip: 'Range Factor per Game' },
        { label: 'RF/9', value: formatPct(f.rangeFactorPerNineInnings), tooltip: 'Range Factor per 9 Innings' },
        { label: 'OF Assists', value: formatCount(f.outfieldAssists), tooltip: 'Outfield Assists' },
        { label: 'Tags', value: formatCount(f.tagsApplied), tooltip: 'Tags Applied' },
        { label: 'Force', value: formatCount(f.forceOuts), tooltip: 'Force Outs' },
        { label: 'TE', value: formatCount(f.throwingErrors), tooltip: 'Throwing Errors' },
      ];
    }
    
    // Add catcher stats if available
    if (f.passedBalls !== undefined || f.stolenBasesAllowed !== undefined) {
      fieldingStatGroups.catcher = [
        { label: 'PB', value: formatCount(f.passedBalls), tooltip: 'Passed Balls' },
        { label: 'SBA', value: formatCount(f.stolenBasesAllowed), tooltip: 'Stolen Bases Allowed' },
        { label: 'CS', value: formatCount(f.caughtStealing), tooltip: 'Caught Stealing' },
        { 
          label: 'CS%', 
          value: calculateCaughtStealingPct(f),
          tooltip: 'Caught Stealing Percentage' 
        },
        { label: 'PK', value: formatCount(f.pickoffs), tooltip: 'Pickoffs' },
        { label: 'CI', value: formatCount(f.catcherInterferences), tooltip: 'Catcher Interferences' },
      ];
    }
  }

  // Calculate Impact Score
  const calculateImpactScore = (): number => {
    if (!player) return 0;
    let score = 0;
    const s = player.stats_batting_details;
    const f = player.stats_fielding_details;

    if (s) {
      if (s.battingAvg !== undefined) score += s.battingAvg * 100;
      if (s.homeruns !== undefined) score += s.homeruns * 2;
      if (s.runsBattedIn !== undefined) score += s.runsBattedIn * 0.5;
      if (s.batterOnBasePlusSluggingPct !== undefined) score += s.batterOnBasePlusSluggingPct * 50;
      if (s.stolenBases !== undefined) score += s.stolenBases * 0.5;
    }

    if (f) {
      if (f.fieldingPct !== undefined) score += f.fieldingPct * 20;
      if (f.assists !== undefined) score += f.assists * 0.3;
      if (f.putOuts !== undefined) score += f.putOuts * 0.1;
      if (f.doublePlaysByPosition !== undefined) score += f.doublePlaysByPosition * 0.5;
      if (f.errors !== undefined) score -= f.errors * 1.5;
    }

    score = Math.max(0, Math.min(100, score));
    return Math.round(score);
  };

  // Calculate astro influence based on astrological data
  const calculateAstroInfluence = (): number => {
    if (!astroData) return 0;
    
    let influence = 50; // Start with neutral
    
    // Adjust based on astro weather
    if (astroData.astroWeather === 'Favorable') {
      influence += 15;
    } else if (astroData.astroWeather === 'Challenging') {
      influence -= 15;
    }

    // Adjust based on dominant planets
    if (astroData.dominantPlanets && astroData.dominantPlanets.length > 0) {
      astroData.dominantPlanets.forEach(planetInfo => {
        if (planetInfo.type === 'Benefic' && typeof planetInfo.score === 'number') {
          influence += (planetInfo.score / 10);
        } else if (planetInfo.type === 'Malefic' && typeof planetInfo.score === 'number') {
          influence -= (planetInfo.score / 10);
        }
      });
    }

    // Adjust based on elemental balance
    if (astroData.elements) {
      if ((astroData.elements.fire?.percentage || 0) > 40) influence += 5;
      if ((astroData.elements.water?.percentage || 0) < 10) influence -= 5;
    }
    
    influence = Math.max(0, Math.min(100, influence));
    return Math.round(influence);
  };

  // Memoized values for scores - calculate for DB update only
  const calculatedImpactScore = useMemo(() => {
    if (!player) return 0;
    const stats_batting_hits = player.stats_batting_hits ?? player.stats_batting_details?.hits ?? 0;
    const stats_batting_runs = player.stats_batting_runs ?? player.stats_batting_details?.runs ?? 0;
    const stats_fielding_assists = player.stats_fielding_assists ?? player.stats_fielding_details?.assists ?? 0;
    return calculateImpactScore({ stats_batting_hits, stats_batting_runs, stats_fielding_assists });
  }, [player]);
  
  const calculatedAstroInfluenceScore = useMemo(() => calculateAstroInfluence(), [player, astroData]);

  // Effect to update DB if calculated scores differ from DB values, then refetch player
  useEffect(() => {
    // Always run if player is loaded and has an id
    if (!player || !player.id) return;
    const updatePlayerScoresInDb = async () => {
      // Always calculate scores on initial load
      const impactScore = calculatedImpactScore;
      const astroScore = calculatedAstroInfluenceScore;
      
      // Always update on first load or if values differ
      let needsUpdate = false;
      const updatePayload: any = {};
      
      if (typeof impactScore === 'number' && !isNaN(impactScore) && 
          (player.impact_score === undefined || player.impact_score === null || impactScore !== player.impact_score)) {
        updatePayload.impact_score = impactScore;
        needsUpdate = true;
      }
      
      if (typeof astroScore === 'number' && !isNaN(astroScore) && 
          (player.astro_influence_score === undefined || player.astro_influence_score === null || astroScore !== player.astro_influence_score)) {
        updatePayload.astro_influence_score = astroScore;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log('Updating player scores:', updatePayload);
        const { error: updateError } = await supabase
          .from('baseball_players')
          .update(updatePayload)
          .eq('id', player.id);
          
        if (updateError) {
          console.error('Error updating scores:', updateError);
          toast({
            title: 'Error updating player scores',
            description: updateError.message,
            variant: 'destructive',
          });
        } else {
          console.log('Successfully updated scores');
          // Refetch player from DB
          const { data: updatedPlayer, error: fetchError } = await supabase
            .from('baseball_players')
            .select('*')
            .eq('id', player.id)
            .single();
            
          if (!fetchError && updatedPlayer) {
            console.log('Refetched player with scores:', updatedPlayer.impact_score, updatedPlayer.astro_influence_score);
            setPlayer(updatedPlayer);
          } else if (fetchError) {
            console.error('Error refetching player:', fetchError);
          }
        }
      } else {
        console.log('No score updates needed');
      }
    };
    
    updatePlayerScoresInDb();
    // eslint-disable-next-line
  }, [calculatedImpactScore, calculatedAstroInfluenceScore, player?.id, supabase, toast]);

  // Effect to fetch player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) {
        console.error('No playerId provided');
        setError('Player ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // console.log('Fetching player with ID:', playerId);
        
        let queryId = playerId;
        if (playerId && playerId.toString().startsWith('player_')) {
          queryId = playerId.toString().replace('player_', '');
        }
        
        type PlayerQueryResult = {
          data: Player[] | null;
          error: any;
        };
        
        let playerQuery: PlayerQueryResult = await supabase
          .from('baseball_players')
          .select('*')
          .eq('player_id', queryId) as unknown as PlayerQueryResult;
          
        if (!playerQuery.data || playerQuery.data.length === 0) {
          playerQuery = await supabase
            .from('baseball_players')
            .select('*')
            .eq('id', queryId) as unknown as PlayerQueryResult;
        }
        
        if (playerQuery.error) {
          console.error('Error fetching player:', playerQuery.error);
          setError(`Failed to load player: ${playerQuery.error.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
        
        let playerData = playerQuery.data && playerQuery.data.length > 0 ? playerQuery.data[0] : null;
        
        if (playerData && typeof playerData.stats_fielding_details === 'string') {
          try {
            playerData.stats_fielding_details = JSON.parse(playerData.stats_fielding_details);
          } catch (e) {
            playerData.stats_fielding_details = null;
          }
        }

        if (!playerData) {
          setError(`Player with ID ${queryId} not found`);
          setLoading(false);
          return;
        }

        // Debug: Log the fetched player object
        console.log('Fetched player:', playerData);

        if (playerData.stats_batting_details && typeof playerData.stats_batting_details === 'string') {
          try {
            playerData.stats_batting_details = JSON.parse(playerData.stats_batting_details);
            // console.log('Parsed stats_batting_details:', playerData.stats_batting_details);
          } catch (e) {
            console.error('Error parsing stats_batting_details:', e);
          }
        }
        
        setPlayer(playerData);
        
        if (teamId) {
          const teamQuery = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();
            
          if (teamQuery.data) {
            setTeam(teamQuery.data);
          }
        }
        
      } catch (err: any) {
        console.error('Error in fetchPlayerData:', err);
        setError(`Failed to load player: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId, teamId, supabase, toast]); // Added supabase and toast to dependencies as they are used indirectly via setError

  // Generate astrological data using the player's birth information
  useEffect(() => {
    if (player && player.player_birth_date) {
      setLoadingAstroData(true);
      setError(null);
      
      try {
        // Extract birth information
        const birthDate = player.player_birth_date;
        const birthCity = player.player_birth_city || 'Unknown';
        const birthState = player.player_birth_state || '';
        const birthCountry = player.player_birth_country || 'USA';
        
        // Generate astrological data
        const astroChartData = generatePlayerAstroData(
          birthDate,
          { city: birthCity, state: birthState, country: birthCountry }
        );
        
        setAstroData(astroChartData);
      } catch (err) {
        console.error('Error generating astro data:', err);
        setError(`Failed to generate astrological data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoadingAstroData(false);
      }
    }
  }, [player]);
  
  // Handle scroll events to update active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      const sections = [
        { ref: overviewRef, id: 'overview' },
        { ref: statsRef, id: 'stats' },
        { ref: astroRef, id: 'astro' },
        { ref: analysisRef, id: 'analysis' }
      ];
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current && section.ref.current.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to section function
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Render player header
  const renderPlayerHeader = () => {
    if (!player) return null;
    
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-32 h-32 overflow-hidden rounded-full border-4 border-gray-200">
            {player.player_official_image_src ? (
              <img 
                src={player.player_official_image_src} 
                alt={player.player_full_name || `${player.player_first_name} ${player.player_last_name}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {player.player_full_name || `${player.player_first_name || ''} ${player.player_last_name || ''}`}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {player.player_primary_position && (
                    <Badge variant="outline" className="text-sm">
                      {getPositionLabel(player.player_primary_position)}
                    </Badge>
                  )}
                  {player.player_jersey_number && (
                    <Badge variant="outline" className="text-sm">
                      #{player.player_jersey_number}
                    </Badge>
                  )}
                  {team && (
                    <Badge 
                      className="text-sm" 
                      style={{ 
                        backgroundColor: team.primary_color || '#1e40af',
                        color: '#ffffff'
                      }}
                    >
                      {team.name || team.abbreviation}
                    </Badge>
                  )}
                  {astroData && (
                    <Badge 
                      className="text-sm" 
                      style={{ 
                        backgroundColor: getSignColor(astroData.sunSign),
                        color: '#ffffff'
                      }}
                    >
                      {astroData.sunSign}
                    </Badge>
                  )}
                </div>
              </div>
              
              {team && (
                <div className="mt-4 md:mt-0">
                  <Link 
                    to={`/teams/${team.id}`}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-8 h-8" />
                    ) : null}
                    {team.name || team.abbreviation}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add StatCard component with Tooltip support
  const StatCard = ({ 
    label, 
    value, 
    tooltipLabel, 
    highlight = false 
  }: { 
    label: string; 
    value: string | number; 
    tooltipLabel?: string; 
    highlight?: boolean 
  }) => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`p-3 border rounded-lg text-center cursor-default ${ // Added cursor-default for TooltipTrigger
              highlight 
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'
            } transition-colors duration-150 ease-in-out`}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</div>
            <div 
              className={`text-lg font-semibold mt-1 ${ // Adjusted font size for value
                highlight 
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-800 dark:text-gray-100'
              }`}
            >
              {value}
            </div>
          </div>
        </TooltipTrigger>
        {tooltipLabel && (
          <TooltipContent className="bg-gray-900 text-white px-2 py-1 rounded text-xs shadow-lg">
            <p>{tooltipLabel}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-lg">Loading player details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
              <Link to="/" className="text-red-700 font-medium underline mt-2 inline-block">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return page content
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-4">
          <Link to={`/teams/${teamId}`} className="text-blue-600 hover:underline flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Team
          </Link>
        </div>
        
        {player && renderPlayerHeader()}
        
        {/* Navigation Tabs */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800 mb-8">
          <div className="flex space-x-1 overflow-x-auto pb-1">
            {[
              { id: 'overview', label: 'Overview', ref: overviewRef },
              { id: 'stats', label: 'Statistics', ref: statsRef },
              { id: 'astro', label: 'Astrology', ref: astroRef },
              { id: 'analysis', label: 'Impact Analysis', ref: analysisRef },
            ].map(({ id, label, ref }) => (
              <button
                key={id}
                onClick={() => scrollToSection(ref)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeSection === id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Overview Section */}
        <section ref={overviewRef} id="overview" className="mb-16 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Player Summary</CardTitle>
                <CardDescription>Key information about {player?.player_first_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name</span>
                    <span className="font-medium">{player?.player_full_name || `${player?.player_first_name || ''} ${player?.player_last_name || ''}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position</span>
                    <span className="font-medium">{player?.player_primary_position ? getPositionLabel(player.player_primary_position) : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jersey Number</span>
                    <span className="font-medium">#{player?.player_jersey_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Birth Date</span>
                    <span className="font-medium">{player?.player_birth_date ? formatBirthDate(player.player_birth_date) : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Birth Place</span>
                    <span className="font-medium">
                      {player?.player_birth_city ? [
                        player.player_birth_city,
                        player.player_birth_state,
                        player.player_birth_country
                      ].filter(Boolean).join(', ') : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Height</span>
                    <span className="font-medium">{player?.player_height ? `${Math.floor(player.player_height / 12)}'${player.player_height % 12}"` : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight</span>
                    <span className="font-medium">{player?.player_weight ? `${player.player_weight} lbs` : 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Player Impact Analysis */}
          {player?.impact_score !== undefined && (
            <div className="mt-8">
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Player Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Game Impact Score */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-2">Game Impact Score</h3>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-900/30"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{(player?.impact_score ?? calculatedImpactScore) ?? 0}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            This score represents {player?.player_first_name || 'the player'}'s overall impact on the game based on batting and fielding performance metrics.
                          </p>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Key factors: Batting average, power, run production, and fielding efficiency
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Astrological Influence */}
                    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-2">Astrological Influence</h3>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <div className="absolute inset-0 rounded-full bg-purple-100 dark:bg-purple-900/30"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {/* If astro_influence_score is missing from DB, show calculated value. Make sure this column exists in Supabase! */}
<span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{(player?.astro_influence_score ?? calculatedAstroInfluenceScore) ?? 0}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            This score indicates how strongly astrological factors may influence {player?.player_first_name || 'the player'}'s performance in upcoming games.
                          </p>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Key factors: Current planetary positions, elemental balance, and dominant planets
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Astrological Profile Overview */}
          {astroData && (
            <div className="mt-12">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl opacity-20 blur-3xl"></div>
                <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-purple-100 dark:bg-purple-900/30 rounded-full opacity-50"></div>
                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                          Astrological Profile
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Cosmic insights for {player?.player_first_name}'s performance
                        </CardDescription>
                      </div>
                      <div className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                        {astroData.astroWeather} Conditions
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    {/* Big Three */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Sun Sign */}
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                            style={{ 
                              background: `linear-gradient(135deg, ${getSignColor(astroData.sunSign)}, ${getSignColor(astroData.sunSign)}99)`
                            }}
                          >
                            {astroData.sunSign.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Sun Sign</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{astroData.sunSign}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Ego & Vitality</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {astroData.sunSign} energy brings {astroData.sunSign.toLowerCase()} traits to {player?.player_first_name}'s core identity and playing style.
                          </p>
                        </div>
                      </div>
                      
                      {/* Moon Sign */}
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                            style={{ 
                              background: `linear-gradient(135deg, ${getSignColor(astroData.moonSign)}, ${getSignColor(astroData.moonSign)}99)`
                            }}
                          >
                            {astroData.moonSign.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Moon Sign</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{astroData.moonSign}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Emotions & Instincts</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {astroData.moonSign} influence affects {player?.player_first_name}'s emotional responses and intuitive playmaking.
                          </p>
                        </div>
                      </div>
                      
                      {/* Ascendant */}
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                            style={{ 
                              background: `linear-gradient(135deg, ${getSignColor(astroData.ascendant)}, ${getSignColor(astroData.ascendant)}99)`
                            }}
                          >
                            {astroData.ascendant.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Ascendant</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{astroData.ascendant}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">First Impressions</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {astroData.ascendant} rising shapes how {player?.player_first_name} presents themselves on and off the field.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Astro Weather & Elements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Astro Weather */}
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Current Astro Weather
                        </h3>
                        <div className={`p-4 rounded-lg ${
                          astroData.astroWeather === 'Favorable' ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30' : 
                          astroData.astroWeather === 'Challenging' ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30' : 
                          'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h4 className={`text-lg font-semibold ${
                              astroData.astroWeather === 'Favorable' ? 'text-green-800 dark:text-green-300' : 
                              astroData.astroWeather === 'Challenging' ? 'text-red-800 dark:text-red-300' : 
                              'text-yellow-800 dark:text-yellow-300'
                            }`}>
                              {astroData.astroWeather} Conditions
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              astroData.astroWeather === 'Favorable' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 
                              astroData.astroWeather === 'Challenging' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                            }`}>
                              {astroData.astroWeather === 'Favorable' ? 'Positive' : astroData.astroWeather === 'Challenging' ? 'Challenging' : 'Neutral'}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {astroData.astroWeather === 'Favorable' ? 
                                `The stars are aligning favorably for ${player?.player_first_name}. Current cosmic conditions enhance performance and decision-making.` : 
                                astroData.astroWeather === 'Challenging' ? 
                                `Cosmic influences suggest some challenges ahead. ${player?.player_first_name} may need to work harder to overcome current astrological aspects.` :
                                `The cosmic weather is neutral. This is a good time for ${player?.player_first_name} to focus on fundamentals and preparation.`
                              }
                            </p>
                            
                            {player?.player_birth_city && player.player_birth_country && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Location: {player.player_birth_city}, {player.player_birth_country}</span>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Last updated: {new Date().toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    {/* Full-width Elemental Balance Section */}
                    <div className="col-span-2 bg-white dark:bg-gray-800/50 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Left side: Visualization */}
                        <div className="w-full md:w-1/3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Elemental Balance
                          </h3>
                          
                          <div className="space-y-6">
                            {/* Main Elemental Bar */}
                            <div className="space-y-2">
                              <div className="flex w-full h-8 rounded-lg overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
                                {Object.entries(astroData.elements).map(([element, data]) => {
                                  const percentage = data.percentage || 0;
                                  const width = `${percentage}%`;
                                  const bgColor = 
                                    element === 'fire' ? 'from-red-500 to-red-600' :
                                    element === 'earth' ? 'from-yellow-600 to-yellow-700' :
                                    element === 'air' ? 'from-blue-400 to-blue-500' : 'from-purple-500 to-purple-600';
                                  
                                  return (
                                    <div 
                                      key={element}
                                      className={`h-full bg-gradient-to-r ${bgColor} relative flex items-center justify-center transition-all duration-500 ease-in-out`}
                                      style={{ width }}
                                      title={`${element.charAt(0).toUpperCase() + element.slice(1)}: ${Math.round(percentage)}%`}
                                    >
                                      {percentage > 10 && (
                                        <span className="text-xs font-bold text-white drop-shadow-md px-1">
                                          {Math.round(percentage)}%
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Legend */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.entries(astroData.elements).map(([element, data]) => {
                                  const percentage = data.percentage || 0;
                                  const bgColor = 
                                    element === 'fire' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    element === 'earth' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
                                    element === 'air' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-purple-500 to-purple-600';
                                  
                                  return (
                                    <div key={element} className="flex items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800/50">
                                      <div className={`w-4 h-4 ${bgColor} rounded-full mr-2`}></div>
                                      <div>
                                        <span className="text-sm font-medium capitalize dark:text-gray-200">{element}</span>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">{Math.round(percentage)}%</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Elemental Breakdown */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Elemental Composition</h4>
                              <div className="space-y-2">
                                {Object.entries(astroData.elements)
                                  .sort(([,a], [,b]) => (b.percentage || 0) - (a.percentage || 0))
                                  .map(([element, data]) => (
                                    <div key={element} className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="font-medium capitalize dark:text-gray-200">{element}</span>
                                        <span className="font-mono">{Math.round(data.percentage || 0)}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                        <div 
                                          className={`h-full rounded-full ${
                                            element === 'fire' ? 'bg-red-500' :
                                            element === 'earth' ? 'bg-yellow-600' :
                                            element === 'air' ? 'bg-blue-400' : 'bg-purple-500'
                                          }`} 
                                          style={{ width: `${data.percentage || 0}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right side: Detailed Explanation */}
                        <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-6 md:pt-0 md:pl-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            How Elements Influence {player?.player_first_name}'s Game
                          </h3>
                          
                          <div className="space-y-6">
                            {/* Fire Element */}
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-red-800 dark:text-red-200 flex items-center">
                                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                  Fire: {Math.round(astroData.elements.fire.percentage || 0)}%
                                </h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                                  {getElementalInfluence('fire', astroData.elements.fire.percentage || 0)}
                                </span>
                              </div>
                              <p className="text-sm text-red-700 dark:text-red-300">
                                {getElementalDescription('fire', astroData.elements.fire.percentage || 0, player?.player_first_name || 'The player')}
                              </p>
                            </div>
                            
                            {/* Earth Element */}
                            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center">
                                  <div className="w-3 h-3 bg-yellow-600 rounded-full mr-2"></div>
                                  Earth: {Math.round(astroData.elements.earth.percentage || 0)}%
                                </h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                                  {getElementalInfluence('earth', astroData.elements.earth.percentage || 0)}
                                </span>
                              </div>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                {getElementalDescription('earth', astroData.elements.earth.percentage || 0, player?.player_first_name || 'The player')}
                              </p>
                            </div>
                            
                            {/* Air Element */}
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                                  Air: {Math.round(astroData.elements.air.percentage || 0)}%
                                </h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                  {getElementalInfluence('air', astroData.elements.air.percentage || 0)}
                                </span>
                              </div>
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                {getElementalDescription('air', astroData.elements.air.percentage || 0, player?.player_first_name || 'The player')}
                              </p>
                            </div>
                            
                            {/* Water Element */}
                            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                  Water: {Math.round(astroData.elements.water.percentage || 0)}%
                                </h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                                  {getElementalInfluence('water', astroData.elements.water.percentage || 0)}
                                </span>
                              </div>
                              <p className="text-sm text-purple-700 dark:text-purple-300">
                                {getElementalDescription('water', astroData.elements.water.percentage || 0, player?.player_first_name || 'The player')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Elemental Synergy */}
                      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Elemental Synergy</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {getElementalSynergy(astroData.elements, player?.player_first_name || 'The player')}
                        </p>
                      </div>
                      </div>
                    </div>
                    
                    {/* Dominant Planets */}
                    {astroData.dominantPlanets && astroData.dominantPlanets.length > 0 && (
                      <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          Dominant Planetary Influences
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {astroData.dominantPlanets.slice(0, 3).map((planet, index) => (
                            <div key={index} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700/50">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-300">
                                  <span className="text-lg font-bold">{planet.planet.charAt(0)}</span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{planet.planet}</h4>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                                    {planet.type}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                {planet.influence}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </section>
        
        {/* Statistics Section */}
        <section ref={statsRef} id="stats" className="mb-8 scroll-mt-24">
          <div className="flex flex-col space-y-6">
            {/* Batting Stats Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Batting Statistics</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {player?.stats_batting_details ? (
                  <div className="batting-stats-tabs p-4">
                    <div className="tab-buttons flex gap-2 mb-4 overflow-x-auto pb-2">
                      {Object.keys(statGroups).map(tab => (
                        <button
                          key={tab}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                            activeBattingTab === tab 
                              ? 'bg-blue-600 text-white shadow' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveBattingTab(tab)}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {statGroups[activeBattingTab]?.map((stat, index) => (
                        <div 
                          key={stat.label} 
                          className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                          <span 
                            className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
                            title={stat.tooltip}
                          >
                            {stat.label}
                          </span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No batting statistics available
                  </div>
                )}
                
                {/* Pitch Types Section - Show if any pitch type data exists */}
                {pitchTypes && pitchTypes.length > 0 && (
                  <div className="mt-4 p-4 border-t">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pitch Types Faced</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {pitchTypes.map((pitch, i) => (
                        <div key={i} className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{pitch.label}</span>
                          <span className="text-sm font-bold">{pitch.value}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{pitch.tooltip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Fielding Stats Card */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fielding Statistics</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {player?.stats_fielding_details ? (
                  <div className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {fieldingStatGroups.overview?.map((stat, index) => (
                        <div 
                          key={stat.label} 
                          className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-2"
                        >
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {stat.label}
                          </span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Defensive Stats */}
                    {fieldingStatGroups.defensive?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Defensive Stats</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {fieldingStatGroups.defensive.map((stat) => (
                            <div 
                              key={stat.label} 
                              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-2"
                            >
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {stat.label}
                              </span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {stat.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Range Stats */}
                    {fieldingStatGroups.range?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Range Stats</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {fieldingStatGroups.range.map((stat) => (
                            <div 
                              key={stat.label} 
                              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-2"
                            >
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {stat.label}
                              </span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {stat.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Catcher Stats */}
                    {fieldingStatGroups.catcher?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Catcher Stats</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {fieldingStatGroups.catcher.map((stat) => (
                            <div 
                              key={stat.label} 
                              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 py-2"
                            >
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {stat.label}
                              </span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {stat.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    No fielding statistics available
                  </div>
                )}
              </CardContent>
            </Card>
            
          </div>
        </section>
        
        {/* Astrology Section */}
        <section ref={astroRef} id="astro" className="mb-16 scroll-mt-24">
          <Card>
            <CardHeader>
              <CardTitle>Astrological Analysis</CardTitle>
              <CardDescription>Astrological insights for {player?.player_first_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Astrology content will be displayed here.</p>
            </CardContent>
          </Card>
        </section>
        
        {/* Impact Analysis Section */}
        <section ref={analysisRef} id="analysis" className="mb-16 scroll-mt-24">
          <Card>
            <CardHeader>
              <CardTitle>Impact Analysis</CardTitle>
              <CardDescription>Performance impact analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Impact analysis content will be displayed here.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default PlayerDetailPage;
