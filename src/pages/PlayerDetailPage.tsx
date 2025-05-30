import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui';

import { StatCard } from '@/components/ui/stat-card';

// Icons
import {
  FaArrowLeft,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaChartArea,
  FaRuler,
  FaInfoCircle,
  FaFire,
  FaBolt,
  FaLeaf,
  FaWater,
  FaBasketballBall,
  FaRunning,
  FaArrowUp,
  FaArrowDown,
  FaWeight,
  FaBirthdayCake
} from 'react-icons/fa';

import {
  GiBaseballGlove,
  GiBaseballBat,
  GiPodiumWinner,
  GiBasketballJersey,
  GiWeight as GiWeightIcon,
} from 'react-icons/gi';

import {
  BsGraphUp,
  BsLightningCharge,
  BsGraphDown,
  BsInfoCircle,
} from 'react-icons/bs';

import {
  RiTeamLine,
  RiPhoneFindLine,
} from 'react-icons/ri';

import {
  MdOutlineSportsBaseball,
  MdOutlineShowChart,
  MdOutlineSportsBasketball,
} from 'react-icons/md';

// Mock API functions
const getPlayerById = async (id: string) => {
  // Mock implementation
  return {
    id,
    player_full_name: 'John Doe',
    player_first_name: 'John',
    player_last_name: 'Doe',
    player_primary_position: 'P',
    player_jersey_number: '42',
    team_id: '1',
    stats_batting_details: {
      battingAvg: 0.275,
      homeruns: 25,
      runsBattedIn: 85,
      stolenBases: 12
    },
    stats_pitching_details: {
      era: 3.50,
      strikeouts: 150,
      walks: 45,
      saves: 30
    },
    player_height: 72, // in inches
    player_weight: 210, // in lbs
    player_birth_date: '1990-01-01',
    player_debut_date: '2015-04-01'
  };
};

const getTeamById = async (id: string) => {
  // Mock implementation
  return {
    id,
    name: 'Astro Team',
    logo_url: 'https://via.placeholder.com/100',
    city: 'Houston',
    abbreviation: 'AST'
  };
};

// Mock calculateImpactScore function
const calculateImpactScore = (stats: any) => {
  // Simple mock calculation
  if (!stats) return 0;
  let score = 0;
  if (stats.battingAvg) score += stats.battingAvg * 100;
  if (stats.homeruns) score += stats.homeruns * 2;
  if (stats.runsBattedIn) score += stats.runsBattedIn * 0.5;
  if (stats.stolenBases) score += stats.stolenBases;
  return Math.min(Math.round(score), 100);
};

interface StatItem {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

interface StatGroup {
  title: string;
  stats: StatItem[];
  overview?: {
    title: string;
    description: string;
  };
}

interface FieldingStatGroup {
  label: string;
  value: string | number;
  tooltip?: string;
}

interface FieldingStats {
  catcher?: FieldingStatGroup[];
  firstBase?: FieldingStatGroup[];
  secondBase?: FieldingStatGroup[];
  thirdBase?: FieldingStatGroup[];
  shortstop?: FieldingStatGroup[];
  outfield?: FieldingStatGroup[];
}

interface AstroData {
  sign: string;
  element: string;
  compatibility: string;
  influence: string;
}

interface PlayerStats {
  battingAvg?: number;
  homeruns?: number;
  runsBattedIn?: number;
  stolenBases?: number;
  era?: number;
  strikeouts?: number;
  walks?: number;
  saves?: number;
  caughtStealing?: number;
  stolenBasesAllowed?: number;
}

interface FieldingStats {
  caughtStealing?: number;
  stolenBasesAllowed?: number;
  // Add other fielding stats as needed
}

const PlayerDetailPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadingAstroData, setLoadingAstroData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [impactScore, setImpactScore] = useState<number>(0);
  const [consistency, setConsistency] = useState<number>(0);
  const [clutchPerformance, setClutchPerformance] = useState<number>(0);
  const [fieldingRating, setFieldingRating] = useState<number>(0);
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [pitchTypes, setPitchTypes] = useState<any[]>([]);
  const [statGroups, setStatGroups] = useState<StatGroup[]>([]);
  const [fieldingStatGroups, setFieldingStatGroups] = useState<any[]>([]);
  const [astroData, setAstroData] = useState<AstroData | null>(null);
  const [calculatedImpactScore, setCalculatedImpactScore] = useState<number>(0);
  
  // Refs for scrollable sections
  const astroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>('astro');

  const params = useParams();
  const navigate = useNavigate();

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleBack = () => {
    navigate('/players');
  };

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!params.playerId) {
          throw new Error('Player ID is required');
        }

        const playerData = await getPlayerById(params.playerId);
        const teamData = await getTeamById(playerData.team_id);

        setPlayer(playerData);
        setTeam(teamData);

        // Calculate metrics
        const stats = playerData.stats_batting_details || {};
        setImpactScore(calculateImpactScore(stats));
        setConsistency(Math.random() * 100); // Replace with actual calculation
        setClutchPerformance(Math.random() * 100); // Replace with actual calculation
        setFieldingRating(Math.random() * 100); // Replace with actual calculation

        // Calculate years of experience
        if (playerData.player_debut_date) {
          const debut = new Date(playerData.player_debut_date);
          const today = new Date();
          const years = today.getFullYear() - debut.getFullYear();
          setYearsExperience(years);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player data');
        toast.error('Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [params.playerId]);

  // Generate mock astro data for player
  const generatePlayerAstroData = (): AstroData => {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const elements = ['Fire', 'Earth', 'Air', 'Water'];
    const compatibilities = ['Excellent', 'Good', 'Average', 'Challenging'];
    const influences = ['High', 'Medium', 'Low'];
    
    return {
      sign: signs[Math.floor(Math.random() * signs.length)],
      element: elements[Math.floor(Math.random() * elements.length)],
      compatibility: compatibilities[Math.floor(Math.random() * compatibilities.length)],
      influence: influences[Math.floor(Math.random() * influences.length)]
    };
  };

  // Fetch team data when player data is loaded
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!player?.team_id) return;
      
      try {
        const teamData = await getTeamById(player.team_id);
        setTeam(teamData);
      } catch (err) {
        console.error('Failed to fetch team data:', err);
      }
    };

    if (player?.team_id) {
      fetchTeamData();
    }
  }, [player?.team_id]);

  useEffect(() => {
    if (!player) return;
    
    const updatePitchTypes = () => {
      if (!player.stats_batting_details) return;
      
      const s = player.stats_batting_details;
      const newPitchTypes = [
        { label: '4S', value: s.batter4SeamFastballs || 0, tooltip: '4-Seam Fastballs' },
        { label: '2S', value: s.batter2SeamFastballs || 0, tooltip: '2-Seam Fastballs' },
        { label: 'SI', value: s.batterSinkers || 0, tooltip: 'Sinkers' },
        { label: 'CT', value: s.batterCutters || 0, tooltip: 'Cutters' },
        { label: 'SL', value: s.batterSliders || 0, tooltip: 'Sliders' },
        { label: 'CB', value: s.batterCurveballs || 0, tooltip: 'Curveballs' },
        { label: 'CH', value: s.batterChangeups || 0, tooltip: 'Changeups' },
        { label: 'SP', value: s.batterSplitters || 0, tooltip: 'Splitters' },
      ].filter(p => p.value > 0);
      
      setPitchTypes(newPitchTypes);
    };
    
    updatePitchTypes();
  }, [player]);

  useEffect(() => {
    if (!player) return;
    
    const updateStatGroups = () => {
      if (!player.stats_batting_details) return;
      
      const newStatGroups: StatGroup[] = [
        {
          title: 'Overview',
          overview: {
            title: 'Player Overview',
            description: 'Key performance indicators and metrics'
          },
          stats: [
            { label: 'Games Played', value: player.stats_batting_details?.gamesPlayed || 0, icon: <FaChartLine /> },
            { label: 'At Bats', value: player.stats_batting_details?.atBats || 0, icon: <FaChartBar /> },
            { label: 'Hits', value: player.stats_batting_details?.hits || 0, icon: <FaChartPie /> },
            { label: 'Runs', value: player.stats_batting_details?.runs || 0, icon: <FaRunning /> }
          ]
        },
        // Add more stat groups as needed
      ];
      
      setStatGroups(prevGroups => [...prevGroups, ...newStatGroups]);
    };
    
    updateStatGroups();
  }, [player]);

  useEffect(() => {
    if (!player) return;
    
    const calculateImpactScore = () => {
      if (!player.stats_batting_details) return 0;
      
      const s = player.stats_batting_details;
      let score = 0;
      
      if (s.battingAvg !== undefined) score += s.battingAvg * 100;
      if (s.homeruns !== undefined) score += s.homeruns * 2;
      if (s.runsBattedIn !== undefined) score += s.runsBattedIn * 0.5;
      if (s.batterOnBasePlusSluggingPct !== undefined) score += s.batterOnBasePlusSluggingPct * 50;
      if (s.stolenBases !== undefined) score += s.stolenBases * 0.5;
      
      score = Math.max(0, Math.min(100, score));
      return Math.round(score);
    };
    
    setCalculatedImpactScore(calculateImpactScore());
  }, [player]);

  useEffect(() => {
    if (!player) return;
    
    // Mock function to calculate caught stealing percentage
    const calculateCaughtStealingPct = (stats: FieldingStats): string => {
      const caught = stats.caughtStealing || 0;
      const allowed = stats.stolenBasesAllowed || 0;
      const total = caught + allowed;
      return total > 0 ? `${((caught / total) * 100).toFixed(1)}%` : '0.0%';
    };
    
    const updateFieldingStatGroups = () => {
      if (!player.stats_fielding_details) return;
      
      const newFieldingStatGroups: any[] = [
        {
          title: 'Fielding Overview',
          overview: {
            title: 'Fielding Performance',
            description: 'Defensive metrics and statistics'
          },
          stats: [
            { label: 'Fielding %', value: '0.980', icon: <GiBaseballGlove /> },
            { label: 'Putouts', value: player.stats_fielding?.putouts || 0, icon: <GiBaseballGlove /> },
            { label: 'Assists', value: player.stats_fielding?.assists || 0, icon: <GiBaseballGlove /> },
            { label: 'Errors', value: player.stats_fielding?.errors || 0, icon: <GiBaseballGlove /> }
          ]
        }
      ];
      
      setFieldingStatGroups(prev => [...prev, ...newFieldingStatGroups]);
    };
    
    updateFieldingStatGroups();
  }, [player]);

  useEffect(() => {
    if (!player) return;
    
    const generateAstroData = async () => {
      setLoadingAstroData(true);
      
      try {
        const birthDate = player.player_birth_date;
        const birthCity = player.player_birth_city || 'Unknown';
        const birthState = player.player_birth_state || '';
        const birthCountry = player.player_birth_country || 'USA';
        
        const astroChartData = await generatePlayerAstroData(
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
    };
    
    generateAstroData();
  }, [player]);

  const handleScroll = () => {
    if (!astroRef.current || !statsRef.current || !analysisRef.current) return;
    
    const scrollPosition = window.scrollY + 100; // 100px offset for header
    
    const astroPosition = astroRef.current.offsetTop;
    const statsPosition = statsRef.current.offsetTop;
    const analysisPosition = analysisRef.current.offsetTop;
    
    if (scrollPosition >= astroPosition && scrollPosition < statsPosition) {
      setActiveSection('astro');
    } else if (scrollPosition >= statsPosition && scrollPosition < analysisPosition) {
      setActiveSection('stats');
    } else if (scrollPosition >= analysisPosition) {
      setActiveSection('analysis');
    }
  };
  
  // Mock function to get sign element
  const getSignElement = (sign: string): string => {
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
    return elements[sign] || 'Unknown';
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
                  <a 
                    href={`/teams/${team.id}`}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-8 h-8" />
                    ) : null}
                    {team.name || team.abbreviation}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getPositionLabel = (position: string | null | undefined): string => {
    const positionLabels: Record<string, string> = {
      'P': 'Pitcher',
      'C': 'Catcher',
      '1B': 'First Base',
      '2B': 'Second Base',
      '3B': 'Third Base',
      'SS': 'Shortstop',
      'LF': 'Left Field',
      'CF': 'Center Field',
      'RF': 'Right Field',
      'DH': 'Designated Hitter'
    };
    return position ? (positionLabels[position] || position) : 'Unknown';
  };

  const getSignColor = (sign: string): string => {
    const colors: Record<string, string> = {
      'Aries': 'bg-red-100 text-red-800',
      'Taurus': 'bg-green-100 text-green-800',
      'Gemini': 'bg-yellow-100 text-yellow-800',
      'Cancer': 'bg-blue-100 text-blue-800',
      'Leo': 'bg-orange-100 text-orange-800',
      'Virgo': 'bg-emerald-100 text-emerald-800',
      'Libra': 'bg-pink-100 text-pink-800',
      'Scorpio': 'bg-purple-100 text-purple-800',
      'Sagittarius': 'bg-indigo-100 text-indigo-800',
      'Capricorn': 'bg-gray-100 text-gray-800',
      'Aquarius': 'bg-cyan-100 text-cyan-800',
      'Pisces': 'bg-teal-100 text-teal-800'
    };
    return colors[sign] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getElementalInfluence = (element: string): string => {
    const influences: Record<string, string> = {
      'fire': 'High energy and competitive drive',
      'earth': 'Consistent and reliable performance',
      'air': 'Strategic thinking and adaptability',
      'water': 'Intuitive and emotionally aware'
    };
    return influences[element] || 'Balanced influence';
  };

  const getElementalDescription = (element: string): string => {
    const descriptions: Record<string, string> = {
      'fire': 'Brings intensity and passion to the game',
      'earth': 'Provides stability and consistency',
      'air': 'Enhances strategy and mental game',
      'water': 'Adds emotional intelligence and intuition'
    };
    return descriptions[element] || 'Brings unique qualities to the game';
  };

  const getElementalSynergy = (): string => {
    // This would be calculated based on the player's chart
    return 'Balanced elemental composition suggests well-rounded abilities';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="container mx-auto py-8 px-4">
        {/* Error state */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading player data: {error}</p>
          </div>
        )}

        {/* Success state */}
        {player && team && (
          <div className="space-y-8">
            {/* Player Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => window.history.back()}>
                  <FaArrowLeft className="mr-2" />
                  Back to Players
                </Button>
                <div className="flex items-center">
                  <img
                    src={team.logo_url}
                    alt={`${team.name} logo`}
                    className="w-12 h-12 rounded-full border-2 border-primary"
                  />
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold">{player.player_full_name || `${player.player_first_name} ${player.player_last_name}`}</h1>
                    <p className="text-muted-foreground">#{player.player_jersey_number} • {getPositionLabel(player.player_primary_position)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline">
                  <RiPhoneFindLine className="mr-2" />
                  Player Bio
                </Button>
                <Button variant="outline">
                  <MdOutlineShowChart className="mr-2" />
                  Career Stats
                </Button>
              </div>
            </div>

            {/* Player Stats Tabs */}
            <Tabs defaultValue="season" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="season">Season</TabsTrigger>
                <TabsTrigger value="career">Career</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="season" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Batting</CardTitle>
                      <CardDescription>Season batting statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <StatCard
                          label="Batting Avg"
                          value={player.stats_batting_details?.battingAvg}
                          icon={<FaChartLine />}
                        />
                        <StatCard
                          label="Home Runs"
                          value={player.stats_batting_details?.homeruns}
                          icon={<FaFire />}
                        />
                        <StatCard
                          label="RBIs"
                          value={player.stats_batting_details?.runsBattedIn}
                          icon={<FaBolt />}
                        />
                        <StatCard
                          label="Stolen Bases"
                          value={player.stats_batting_details?.stolenBases}
                          icon={<FaLeaf />}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pitching</CardTitle>
                      <CardDescription>Season pitching statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <StatCard
                          label="ERA"
                          value={player.stats_pitching_details?.era}
                          icon={<FaChartBar />}
                        />
                        <StatCard
                          label="Strikeouts"
                          value={player.stats_pitching_details?.strikeouts}
                          icon={<FaArrowUp />}
                        />
                        <StatCard
                          label="Walks"
                          value={player.stats_pitching_details?.walks}
                          icon={<FaArrowDown />}
                        />
                        <StatCard
                          label="Saves"
                          value={player.stats_pitching_details?.saves}
                          icon={<GiPodiumWinner />}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="career" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Career Batting</CardTitle>
                      <CardDescription>Career batting statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <StatCard
                          label="Career Avg"
                          value={player.stats_batting_details?.battingAvg}
                          icon={<FaChartLine />}
                        />
                        <StatCard
                          label="Career HRs"
                          value={player.stats_batting_details?.homeruns}
                          icon={<FaFire />}
                        />
                        <StatCard
                          label="Career RBIs"
                          value={player.stats_batting_details?.runsBattedIn}
                          icon={<FaBolt />}
                        />
                        <StatCard
                          label="Career SBs"
                          value={player.stats_batting_details?.stolenBases}
                          icon={<FaLeaf />}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Career Pitching</CardTitle>
                      <CardDescription>Career pitching statistics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <StatCard
                          label="Career ERA"
                          value={player.stats_pitching_details?.era}
                          icon={<FaChartBar />}
                        />
                        <StatCard
                          label="Career Ks"
                          value={player.stats_pitching_details?.strikeouts}
                          icon={<FaArrowUp />}
                        />
                        <StatCard
                          label="Career BBs"
                          value={player.stats_pitching_details?.walks}
                          icon={<FaArrowDown />}
                        />
                        <StatCard
                          label="Career SVs"
                          value={player.stats_pitching_details?.saves}
                          icon={<GiPodiumWinner />}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Metrics</CardTitle>
                      <CardDescription>Advanced statistical analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <StatCard
                          label="Impact Score"
                          value={impactScore}
                          icon={<FaChartPie />}
                        />
                        <StatCard
                          label="Consistency"
                          value={consistency}
                          icon={<FaChartArea />}
                        />
                        <StatCard
                          label="Clutch Performance"
                          value={clutchPerformance}
                          icon={<GiPodiumWinner />}
                        />
                        <StatCard
                          label="Fielding Rating"
                          value={fieldingRating}
                          icon={<GiBaseballGlove />}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Physical Metrics</CardTitle>
                      <CardDescription>Physical attributes and measurements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <StatCard
                          label="Height"
                          value={`${player.player_height ? `${Math.floor(player.player_height / 12)}'${player.player_height % 12}"` : 'Unknown'}`}
                          icon={<FaRuler />}
                        />
                        <StatCard
                          label="Weight"
                          value={`${player.player_weight ? `${player.player_weight} lbs` : 'Unknown'}`}
                          icon={<FaWeight />}
                        />
                        <StatCard
                          label="Age"
                          value={`${calculateAge(player.player_birth_date) || 'Unknown'} years`}
                          icon={<FaBirthdayCake />}
                        />
                        <StatCard
                          label="Experience"
                          value={`${yearsExperience || 'Unknown'} years`}
                          icon={<FaChartLine />}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PlayerDetailPage;
