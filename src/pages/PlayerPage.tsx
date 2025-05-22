import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Calendar, ChevronLeft, Star, TrendingUp, Activity, BarChart2, Award, Moon, Sun, Info } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAstroData } from '@/hooks/useAstroData';
import AstroDisclosure from '@/components/AstroDisclosure';
import { getZodiacSign } from '@/lib/astroCalc';

// Type definitions
interface Team {
  id: string;
  name: string;
  logo_url: string;
  city: string;
  venue: string;
  conference: string;
  division: string;
  abbreviation: string;
  primary_color: string;
  secondary_color: string;
  league_id: string;
}

interface Player {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  headshot_url?: string;
  primary_position?: string;
  position?: string;
  primary_number?: number;
  jersey_number?: string;
  current_team_id?: string;
  team_id?: string;
  birth_date?: string;
  height?: string;
  weight?: string;
  college?: string;
  draft_year?: number;
  draft_round?: number;
  draft_pick?: number;
  nationality?: string;
  status?: string;
}

interface PlayerStats {
  player_id: string;
  points_per_game?: number;
  rebounds_per_game?: number;
  assists_per_game?: number;
  steals_per_game?: number;
  blocks_per_game?: number;
  field_goal_percentage?: number;
  three_point_percentage?: number;
  free_throw_percentage?: number;
  games_played?: number;
  minutes_per_game?: number;
  batting_average?: number;
  home_runs?: number;
  rbis?: number;
  stolen_bases?: number;
  era?: number;
  wins?: number;
  strikeouts?: number;
  touchdowns?: number;
  passing_yards?: number;
  rushing_yards?: number;
  sacks?: number;
  interceptions?: number;
  goals?: number;
  assists?: number;
  save_percentage?: number;
}

interface AstrologyInfluence {
  name: string;
  impact: number;
  description: string;
  icon?: React.ReactNode;
}

const PlayerPage: React.FC = () => {
  const { playerId, teamId } = useParams<{ playerId: string; teamId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [astroInfluences, setAstroInfluences] = useState<AstrologyInfluence[]>([]);
  const [forecast, setForecast] = useState<string>('');

  // Format player's birthdate
  const formatBirthDate = useCallback((dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // Otherwise, try to parse it
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }, []);

  // Get birth date formatted
  const playerBirthDate = formatBirthDate(player?.birth_date);
  
  // Fetch astrological data using the hook
  const { astroData, loading: loadingAstro, error: astroError } = useAstroData(playerBirthDate || new Date());

  // Helper function to get team/player color styles
  const getPlayerColorStyles = useCallback((player: Player | null, team: Team | null) => {
    // Use team colors if available, otherwise use player-specific colors
    const primaryColor = team?.primary_color || '#4338ca'; // Default to indigo if no team color
    const secondaryColor = team?.secondary_color || '#6366f1';
    
    return {
      primary: primaryColor,
      secondary: secondaryColor,
      gradientBg: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`,
      borderColor: `${primaryColor}40`,
      accentColor: primaryColor,
    };
  }, []);

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  // Fetch player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) {
        setError('Player ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch player details
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId)
          .single();

        if (playerError) {
          console.error('Error fetching player:', playerError);
          setError(playerError.message);
          setLoading(false);
          return;
        }

        setPlayer(playerData);

        // Fetch team details if available
        if (playerData.team_id || playerData.current_team_id) {
          const teamId = playerData.team_id || playerData.current_team_id;
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

          if (!teamError) {
            setTeam(teamData);
          } else {
            console.error('Error fetching team:', teamError);
          }
        }

        // Fetch player stats
        // 'hockey_stats' commented out to avoid 404 errors if the table does not exist
const sportsTables = ['baseball_stats', 'basketball_stats', 'football_stats'];
        
        for (const table of sportsTables) {
          const { data: statsData, error: statsError } = await supabase
            .from(table)
            .select('*')
            .eq('player_id', playerId)
            .limit(1);
          
          if (!statsError && statsData && statsData.length > 0) {
            setPlayerStats(statsData[0]);
            break;
          }
        }
      } catch (err: any) {
        console.error('Error in player page:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId, retryCount]);

  // Process astrological data
  useEffect(() => {
    if (astroData && player) {
      // Format astrological influences
      const influences: AstrologyInfluence[] = [];
      
      // Add sun sign influence
      if (astroData.sun) {
        influences.push({
          name: 'Sun Sign',
          impact: 0.8,
          description: `${player.full_name}'s Sun in ${astroData.sun.sign} ${getSunSignDescription(astroData.sun.sign)}`,
          icon: <Sun className="h-5 w-5 text-amber-500" />
        });
      }
      
      // Add moon phase influence
      if (astroData.moon) {
        influences.push({
          name: 'Moon Phase',
          impact: 0.7,
          description: `${astroData.moon.phase_name} Moon ${getMoonPhaseDescription(astroData.moon.phase_name)}`,
          icon: <Moon className="h-5 w-5 text-slate-400" />
        });
      }
      
      // Add dominant element influence if available
      if (astroData.elements?.dominant) {
        influences.push({
          name: 'Dominant Element',
          impact: 0.6,
          description: `Strong ${astroData.elements.dominant} energy ${getElementDescription(astroData.elements.dominant)}`,
          icon: getElementIcon(astroData.elements.dominant)
        });
      }
      
      // Add retrograde influence if available
      if (astroData.planets?.mercury?.retrograde) {
        influences.push({
          name: 'Mercury Retrograde',
          impact: 0.5,
          description: "Mercury retrograde may affect communication and decision-making",
          icon: <Info className="h-5 w-5 text-orange-500" />
        });
      }
      
      setAstroInfluences(influences);
      
      // Generate forecast
      setForecast(generateForecast(player, astroData));
    }
  }, [astroData, player]);

  // Helper functions for astrological descriptions
  function getSunSignDescription(sign: string): string {
    const descriptions: Record<string, string> = {
      'Aries': 'suggests aggressive play and quick decision-making',
      'Taurus': 'indicates consistency and resilience on the field',
      'Gemini': 'brings versatility and adaptability to various situations',
      'Cancer': 'provides intuitive defense and protective play',
      'Leo': 'brings leadership and spotlight-worthy performances',
      'Virgo': 'offers precision and methodical approach to the game',
      'Libra': 'enables balanced play and fair sportsmanship',
      'Scorpio': 'delivers intensity and strategic depth',
      'Sagittarius': 'creates opportunities through optimistic play',
      'Capricorn': 'ensures disciplined performance and long-term success',
      'Aquarius': 'brings innovative tactics and unexpected plays',
      'Pisces': 'enables intuitive teamwork and fluid movement'
    };
    return descriptions[sign] || 'influences overall playing style';
  }

  function getMoonPhaseDescription(phase: string): string {
    const descriptions: Record<string, string> = {
      'New Moon': 'indicates potential for new beginnings and fresh strategies',
      'Waxing Crescent': 'suggests building momentum and growing confidence',
      'First Quarter': 'brings decisive action and breakthrough moments',
      'Waxing Gibbous': 'indicates refining skills and preparing for peak performance',
      'Full Moon': 'highlights peak performance and maximum visibility',
      'Waning Gibbous': 'suggests sharing experience and mentoring teammates',
      'Last Quarter': 'brings critical assessment and strategic adjustments',
      'Waning Crescent': 'indicates reflection and preparation for renewal'
    };
    return descriptions[phase] || 'influences emotional rhythm';
  }

  function getElementDescription(element: string): string {
    const descriptions: Record<string, string> = {
      'fire': 'enhances passion, energy, and competitive drive',
      'earth': 'provides stability, endurance, and practical execution',
      'air': 'improves communication, strategy, and mental agility',
      'water': 'deepens intuition, emotional awareness, and flow state'
    };
    return descriptions[element.toLowerCase()] || 'influences playing style';
  }

  function getElementIcon(element: string): React.ReactNode {
    switch (element.toLowerCase()) {
      case 'fire':
        return <Activity className="h-5 w-5 text-red-500" />;
      case 'earth':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'air':
        return <TrendingUp className="h-5 w-5 text-sky-400" />;
      case 'water':
        return <BarChart2 className="h-5 w-5 text-blue-500" />;
      default:
        return <Star className="h-5 w-5 text-yellow-500" />;
    }
  }

  function generateForecast(player: Player, astroData: any): string {
    if (!player || !astroData) return '';

    const playerName = player.full_name;
    const position = player.primary_position || player.position || 'player';
    
    let forecast = `${playerName}'s astrological profile shows `;
    
    // Add sun sign influence
    if (astroData.sun?.sign) {
      forecast += `a ${astroData.sun.sign} Sun, which ${getSunSignDescription(astroData.sun.sign)}. `;
    }
    
    // Add moon phase influence
    if (astroData.moon?.phase_name) {
      forecast += `The current ${astroData.moon.phase_name} ${getMoonPhaseDescription(astroData.moon.phase_name)}. `;
    }
    
    // Add element influence
    if (astroData.elements?.dominant) {
      forecast += `With dominant ${astroData.elements.dominant} energy, ${playerName} ${getElementDescription(astroData.elements.dominant)}. `;
    }
    
    // Add aspect influence if available
    if (astroData.aspects && astroData.aspects.length > 0) {
      const significantAspect = astroData.aspects[0];
      forecast += `The ${significantAspect.p1} ${significantAspect.aspect} ${significantAspect.p2} aspect suggests ${getAspectDescription(significantAspect.aspect)}. `;
    }
    
    // Add retrograde mention if applicable
    if (astroData.planets?.mercury?.retrograde) {
      forecast += `With Mercury in retrograde, ${playerName} should focus on clear communication and avoiding mistakes in critical moments. `;
    }
    
    return forecast;
  }

  function getAspectDescription(aspect: string): string {
    const descriptions: Record<string, string> = {
      'Conjunction': 'intense focus and energy concentration',
      'Opposition': 'balance between competing priorities',
      'Trine': 'natural flow and harmonious teamwork',
      'Square': 'overcoming challenges through determination',
      'Sextile': 'opportunities for strategic advantage'
    };
    return descriptions[aspect] || 'notable cosmic influence';
  }

  // Format stat for display with appropriate units
  const formatStat = (value: number | undefined, type: string): string => {
    if (value === undefined) return 'N/A';
    
    if (type.includes('percentage')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    if (type === 'era') {
      return value.toFixed(2);
    }
    
    return value.toFixed(1);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <Skeleton className="h-16 w-16 rounded-full mr-4" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="mt-4 w-fit"
              >
                Retry
              </Button>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  const playerColors = getPlayerColorStyles(player, team);

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8"
      style={{ background: playerColors.gradientBg }}
    >
      <div className="container mx-auto">
        {/* Navigation */}
        <Button 
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          onClick={() => navigate(`/team/${teamId}`)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Team
        </Button>
        
        {/* Player Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center md:items-start mb-12 p-6 bg-white rounded-lg shadow-sm"
          style={{ borderLeft: `4px solid ${playerColors.primary}` }}
        >
          <img 
            src={player?.headshot_url || '/placeholder-player.png'} 
            alt={player?.full_name || 'Player'}
            className="w-32 h-32 mb-4 md:mb-0 md:mr-6 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-player.png';
            }}
          />
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{player?.full_name}</h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start my-3">
              {player?.primary_position && (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                  {player.primary_position || player.position}
                </Badge>
              )}
              {player?.jersey_number && (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                  #{player.jersey_number || player.primary_number}
                </Badge>
              )}
              {team?.name && (
                <Badge 
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: playerColors.primary }}
                >
                  {team.name}
                </Badge>
              )}
            </div>
            
            <div className="text-slate-600 mt-2 space-y-1">
              {player?.birth_date && (
                <p className="flex items-center justify-center md:justify-start">
                  <Calendar className="h-4 w-4 mr-2 opacity-70" />
                  Born: {format(new Date(player.birth_date), 'MMMM d, yyyy')}
                  {playerBirthDate && (
                    <Badge className="ml-2 text-xs bg-slate-100 text-slate-700">
                      {getZodiacSign(new Date(playerBirthDate))}
                    </Badge>
                  )}
                </p>
              )}
              {/* Enhanced Bio Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
  {player?.height && (
    <p className="flex items-center">
      <Activity className="h-4 w-4 mr-2 opacity-70" />
      Height: {player.height}
    </p>
  )}
  {player?.weight && (
    <p className="flex items-center">
      <Activity className="h-4 w-4 mr-2 opacity-70" />
      Weight: {player.weight} lbs
    </p>
  )}
  {player?.nationality && (
    <p className="flex items-center">
      <Award className="h-4 w-4 mr-2 opacity-70" />
      Nationality: {player.nationality}
    </p>
  )}
  {player?.handedness && (
    <p className="flex items-center">
      <BarChart2 className="h-4 w-4 mr-2 opacity-70" />
      Handedness: {player.handedness}
    </p>
  )}
</div>
              {player?.college && (
                <p className="flex items-center justify-center md:justify-start">
                  <Award className="h-4 w-4 mr-2 opacity-70" />
                  {player.college}
                </p>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Player Stats */}
        {playerStats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BarChart2 className="mr-2 h-6 w-6" style={{ color: playerColors.primary }} />
              Statistics
            </h2>
            
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {playerStats.points_per_game !== undefined && (
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500 mb-2">Points Per Game</div>
                    <div className="text-3xl font-bold">{formatStat(playerStats.points_per_game, 'points')}</div>
                  </CardContent>
                </Card>
              )}
              
              {playerStats.rebounds_per_game !== undefined && (
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500 mb-2">Rebounds Per Game</div>
                    <div className="text-3xl font-bold">{formatStat(playerStats.rebounds_per_game, 'rebounds')}</div>
                  </CardContent>
                </Card>
              )}
              
              {playerStats.assists_per_game !== undefined && (
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500 mb-2">Assists Per Game</div>
                    <div className="text-3xl font-bold">{formatStat(playerStats.assists_per_game, 'assists')}</div>
                  </CardContent>
                </Card>
              )}
              
              {playerStats.field_goal_percentage !== undefined && (
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500 mb-2">FG Percentage</div>
                    <div className="text-3xl font-bold">{formatStat(playerStats.field_goal_percentage, 'percentage')}</div>
                  </CardContent>
                </Card>
              )}
              
              {/* Baseball Stats Only, with Tooltips */}
{playerStats.batting_average !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">Batting Average</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.batting_average, 'average')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>Hits divided by at-bats. MLB average ~.250</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}

{playerStats.on_base_percentage !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">OBP</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.on_base_percentage, 'percentage')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>On-base percentage: times reached base per plate appearance</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}

{playerStats.slugging_percentage !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">SLG</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.slugging_percentage, 'percentage')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>Slugging: total bases per at-bat</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}

{playerStats.ops !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">OPS</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.ops, 'number')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>On-base plus slugging</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}

{playerStats.home_runs !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">Home Runs</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.home_runs, 'count')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>Total home runs</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}

{playerStats.rbis !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">RBIs</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.rbis, 'count')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>Runs batted in</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}

{playerStats.stolen_bases !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">Stolen Bases</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.stolen_bases, 'count')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>Total stolen bases</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}

{playerStats.war !== undefined && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="text-sm text-slate-500 mb-2">WAR</div>
            <div className="text-3xl font-bold">{formatStat(playerStats.war, 'number')}</div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>Wins Above Replacement</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
              
              {playerStats.touchdowns !== undefined && (
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500 mb-2">Touchdowns</div>
                    <div className="text-3xl font-bold">{formatStat(playerStats.touchdowns, 'count')}</div>
                  </CardContent>
                </Card>
              )}
              
              {playerStats.passing_yards !== undefined && (
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-sm text-slate-500 mb-2">Passing Yards</div>
                    <div className="text-3xl font-bold">{formatStat(playerStats.passing_yards, 'yards')}</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Enhanced Cosmic Influence */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Star className="mr-2 h-6 w-6" style={{ color: playerColors.primary }} />
            Cosmic Influence
          </h2>
          
          <Card className="bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              {/* Astrological Overview */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Astrological Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Zodiac Wheel */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="font-semibold mb-3 text-center">Zodiac Wheel</h4>
                    <div className="relative w-48 h-48 mx-auto">
                      {/* Zodiac Circle */}
                      <div className="absolute inset-0 rounded-full border-8 border-slate-200"></div>
                      {/* Signs */}
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                        const sign = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                                      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][i];
                        // Determine highlight for Sun, Moon, Ascendant
                        let highlight = '';
                        if (astroData?.sun?.sign === sign) highlight = 'sun';
                        else if (astroData?.moon?.sign === sign) highlight = 'moon';
                        else if (astroData?.ascendant === sign) highlight = 'asc';
                        return (
                          <div 
                            key={sign}
                            className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold border-2 ${
                              highlight === 'sun' ? 'bg-yellow-400 text-black border-yellow-600 shadow-lg' :
                              highlight === 'moon' ? 'bg-indigo-400 text-white border-indigo-600 shadow-lg' :
                              highlight === 'asc' ? 'bg-pink-500 text-white border-pink-700 shadow-lg' :
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                            style={{
                              left: '50%',
                              top: '50%',
                              transform: `rotate(${deg}deg) translate(84px) rotate(-${deg}deg)`,
                              transformOrigin: '0 0',
                            }}
                          >
                            {sign[0]}
                          </div>
                        );
                      })}
                      {/* No player initial in center */}
                    </div>
                    {/* Legend for planet highlights */}
                    <div className="mt-4 flex justify-center gap-6 text-xs text-slate-600">
                      <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-yellow-400 border-2 border-yellow-600"></span>Sun</div>
                      <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-indigo-400 border-2 border-indigo-600"></span>Moon</div>
                    </div>
                  </div>

                  {/* Elemental Balance */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="font-semibold mb-3 text-center">Elemental Balance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: 'Fire', value: astroData?.elements?.fire || 0, color: '#ef4444' },
                        { name: 'Earth', value: astroData?.elements?.earth || 0, color: '#22c55e' },
                        { name: 'Air', value: astroData?.elements?.air || 0, color: '#3b82f6' },
                        { name: 'Water', value: astroData?.elements?.water || 0, color: '#8b5cf6' },
                      ].map((el) => (
                        <div key={el.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{el.name}</span>
                            <span className="font-medium">{Math.round((el.value / 3) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${(el.value / 3) * 100}%`,
                                backgroundColor: el.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Transits */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="font-semibold mb-3 text-center">Current Transits</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Mercury', aspect: 'Trine Mars', effect: 'Enhanced communication' },
                        { name: 'Venus', aspect: 'Square Jupiter', effect: 'Luck in relationships' },
                        { name: 'Mars', aspect: 'Conjunct Sun', effect: 'High energy' },
                      ].map((transit) => (
                        <div key={transit.name} className="flex items-start">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mr-2">
                            {transit.name[0]}
                          </div>
                          <div>
                            <div className="font-medium">{transit.name} {transit.aspect}</div>
                            <div className="text-xs text-slate-500">{transit.effect}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Astrological Forecast */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-xl font-bold mb-3 text-slate-800">Astrological Forecast</h3>
                <p className="text-slate-700 leading-relaxed">
                  {forecast || 'Analyzing cosmic influences...'}
                </p>
              </div>

              {/* Planetary Influences */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Planetary Influences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {astroInfluences.length > 0 ? (
                    astroInfluences.map((influence, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                        style={{ borderLeft: `3px solid ${playerColors.primary}` }}
                      >
                        <div className="flex items-center mb-2">
                          {influence.icon || <Star className="h-5 w-5 mr-2 text-amber-500" />}
                          <h4 className="font-semibold text-slate-800">{influence.name}</h4>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{influence.description}</p>
                        <div className="flex items-center">
                          <div className="w-full bg-slate-100 rounded-full h-2 mr-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${influence.impact * 100}%`,
                                background: `linear-gradient(90deg, ${playerColors.primary}, ${playerColors.secondary || '#6366f1'})`
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            {Math.round(influence.impact * 100)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : loadingAstro ? (
                    <div className="col-span-3 text-center py-6">
                      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-slate-500">Analyzing cosmic influences...</p>
                    </div>
                  ) : astroError ? (
                    <div className="col-span-3 text-center py-6">
                      <p className="text-red-500">
                        {astroError instanceof Error ? astroError.message : 'Error loading astrological data'}
                      </p>
                    </div>
                  ) : (
                    <div className="col-span-3 text-center py-6">
                      <p className="text-slate-500">No astrological data available for this player.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Aspect Grid */}
              {astroData?.aspects?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Key Aspects</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {astroData.aspects.slice(0, 6).map((aspect, i) => (
                      <div 
                        key={i}
                        className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{aspect.p1} {aspect.aspect} {aspect.p2}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                            {aspect.orb.toFixed(1)}°
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {getAspectDescription(aspect.aspect)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      {/* Recent Games Section (Placeholder) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <BarChart2 className="mr-2 h-6 w-6" style={{ color: playerColors.primary }} />
          Recent Games
        </h2>
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Placeholder for recent games chart/list */}
            <div className="text-slate-500">Recent games data coming soon...</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Career Highlights Section (Placeholder) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Award className="mr-2 h-6 w-6" style={{ color: playerColors.primary }} />
          Career Highlights
        </h2>
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Placeholder for career highlights */}
            <div className="text-slate-500">Career highlights coming soon...</div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
};

export default PlayerPage;
