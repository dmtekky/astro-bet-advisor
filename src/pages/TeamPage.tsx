import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, ChevronLeft, Info, Star, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { GameCard } from '@/components/games/GameCard';
import { GameCarousel } from '@/components/games/GameCarousel';

// Type definitions for the component
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
  league?: {
    id: string;
    name: string;
    sport: string;
  };
}

interface Player {
  id: string;
  full_name: string;
  headshot_url?: string;
  primary_position?: string;
  primary_number?: number;
  current_team_id?: string;
  birth_date?: string;
} 

interface Game {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team?: Team;
  away_team?: Team;
  game_time_utc: string;
  venue?: {
    name: string;
    city: string;
  };
  home_score?: number;
  away_score?: number;
  status?: string;
  odds?: Array<{
    market: string;
    outcome: string;
    price: number;
  }>;
}

const TeamPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!teamId) {
      setError('Team ID is missing');
      setLoading(false);
      return;
    }

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch team details
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`*, league:league_id(*)`)
          .eq('id', teamId)
          .single();

        if (teamError) {
          console.error('Error fetching team:', teamError);
          setError(teamError.message);
          setLoading(false);
          return;
        }

        setTeam(teamData);

        // Fetch players on this team
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('current_team_id', teamId)
          .order('primary_number', { ascending: true });
          
        console.log('Players query results:', playersData);

        if (playersError) {
          console.error('Error fetching players:', playersError);
          // Don't set error here, we still want to show the team
        } else {
          setPlayers(playersData || []);
          
          // Determine top players based on position and stats
          // This is a simple algorithm that can be enhanced with actual stats data
          const sortedPlayers = [...(playersData || [])];
          
          // Sort players by importance (can be customized based on sport)
          if (teamData?.league?.sport?.toLowerCase() === 'baseball' || teamData?.league?.name?.toLowerCase().includes('mlb')) {
            // For baseball, prioritize pitchers and power hitters
            sortedPlayers.sort((a, b) => {
              // Prioritize by position and then stats
              const posValue = (pos: string) => {
                const posLower = pos?.toLowerCase();
                if (posLower?.includes('pitcher')) return 1;
                if (posLower?.includes('catcher')) return 2;
                if (posLower?.includes('short')) return 3;
                if (posLower?.includes('first')) return 4;
                if (posLower?.includes('third')) return 5;
                if (posLower?.includes('second')) return 6;
                if (posLower?.includes('outfield')) return 7;
                return 10;
              };
              
              return posValue(a.position) - posValue(b.position);
            });
          } else if (teamData?.league?.sport?.toLowerCase() === 'basketball' || teamData?.league?.name?.toLowerCase().includes('nba')) {
            // For basketball, prioritize key positions
            sortedPlayers.sort((a, b) => {
              const posValue = (pos: string) => {
                const posLower = pos?.toLowerCase();
                if (posLower?.includes('point guard') || posLower?.includes('pg')) return 1;
                if (posLower?.includes('center') || posLower?.includes('c')) return 2;
                if (posLower?.includes('shooting guard') || posLower?.includes('sg')) return 3;
                if (posLower?.includes('power forward') || posLower?.includes('pf')) return 4;
                if (posLower?.includes('small forward') || posLower?.includes('sf')) return 5;
                return 10;
              };
              
              return posValue(a.position) - posValue(b.position);
            });
          } else if (teamData?.league?.sport?.toLowerCase() === 'football' || teamData?.league?.name?.toLowerCase().includes('nfl')) {
            // For football, prioritize quarterback and key positions
            sortedPlayers.sort((a, b) => {
              const posValue = (pos: string) => {
                const posLower = pos?.toLowerCase();
                if (posLower?.includes('quarterback') || posLower?.includes('qb')) return 1;
                if (posLower?.includes('running back') || posLower?.includes('rb')) return 2;
                if (posLower?.includes('wide receiver') || posLower?.includes('wr')) return 3;
                if (posLower?.includes('tight end') || posLower?.includes('te')) return 4;
                if (posLower?.includes('offensive tackle') || posLower?.includes('ot')) return 5;
                return 10;
              };
              
              return posValue(a.position) - posValue(b.position);
            });
          }
          
          // Get top 6 players (or fewer if not enough)
          setTopPlayers(sortedPlayers.slice(0, 6));
        }

        // Fetch upcoming games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            *,
            home_team:home_team_id(*),
            away_team:away_team_id(*)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .gt('game_time_utc', new Date().toISOString())
          .order('game_time_utc', { ascending: true })
          .limit(6);

        if (gamesError) {
          console.error('Error fetching games:', gamesError);
          // Don't set error here, we still want to show the team and players
        } else {
          setUpcomingGames(gamesData || []);
        }
      } catch (err: any) {
        console.error('Error in team page:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Helper function to get color styles with fallback
  const getTeamColorStyles = (team: Team | null) => {
    const primaryColor = team?.primary_color || '#0f172a';
    const secondaryColor = team?.secondary_color || '#64748b';
    
    return {
      primary: primaryColor,
      secondary: secondaryColor,
      gradientBg: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`,
      borderColor: `${primaryColor}40`,
    };
  };

  // Zodiac sign calculation utility
  function getZodiacSign(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

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
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
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

  const teamColors = getTeamColorStyles(team);

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8"
      style={{ background: teamColors.gradientBg }}
    >
      <div className="container mx-auto">
        {/* Navigation */}
        <Button 
          variant="ghost"
          size="sm"
          className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to League
        </Button>
        
        {/* Team Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center md:items-start mb-12 p-6 bg-white rounded-lg shadow-sm"
          style={{ borderLeft: `4px solid ${teamColors.primary}` }}
        >
          <img 
            src={team?.logo_url || '/placeholder-team.png'} 
            alt={team?.name || 'Team'}
            className="w-32 h-32 mb-4 md:mb-0 md:mr-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-team.png';
            }}
          />
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{team?.name}</h1>
            <p className="text-slate-500 mb-2">{team?.city}</p>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start my-3">
              {team?.conference && (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                  {team.conference}
                </Badge>
              )}
              {team?.division && (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                  {team.division}
                </Badge>
              )}
              {team?.league?.name && (
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                  {team.league.name}
                </Badge>
              )}
            </div>
            
            <p className="text-slate-600">
              Home Venue: {team?.venue || 'N/A'}
            </p>
          </div>
        </motion.div>
        
        {/* Top Players */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Star className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
            Top Players
          </h2>
          
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
            {topPlayers.length > 0 ? topPlayers.map(player => (
              <Link to={`/team/${teamId}/player/${player.id}`} key={player.id}>
                <div
                  className="w-full bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col items-center relative"
                  style={{ borderTop: `4px solid ${teamColors.primary}` }}
                >
                  {/* Player Image */}
                  <div className="w-full h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={player.headshot_url || '/placeholder-player.png'}
                      alt={player.full_name}
                      className="h-full w-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/placeholder-player.png';
                      }}
                    />
                  </div>
                  {/* Player Name */}
                  <p className="font-bold text-gray-900 text-center mb-1 mt-3 px-2 truncate w-full">{player.full_name}</p>
                  {/* Zodiac Sign */}
                  <span className="text-xs text-purple-600 mb-2 text-center">{getZodiacSign(player.birth_date)}</span>
                  <div className="flex justify-between w-full px-4 mt-2 mb-4 text-xs text-slate-500">
                    <span>#{player.primary_number || 'N/A'}</span>
                    <span>{player.primary_position || 'N/A'}</span>
                  </div>
                </div>
              </Link>
            )) : (
              <p className="col-span-full text-slate-500 text-center py-10">No player data available</p>
            )}
          </div>
        </motion.div>
        
        {/* Team Insights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Info className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
            Team Insights
          </h2>
          
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-lg bg-slate-50">
                  <h3 className="font-semibold mb-2 text-slate-700">Season Performance</h3>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 mr-3">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{Math.floor(Math.random() * 30) + 50}%</p>
                      <p className="text-sm text-slate-500">Win Rate</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-50">
                  <h3 className="font-semibold mb-2 text-slate-700">Team Strength</h3>
                  <p className="text-sm text-slate-600">
                    {team?.name} has shown exceptional performance in {
                      team?.league?.sport?.toLowerCase() === 'baseball' ? 'pitching and home runs' :
                      team?.league?.sport?.toLowerCase() === 'basketball' ? '3-point shooting and rebounding' :
                      team?.league?.sport?.toLowerCase() === 'football' ? 'rushing and defense' :
                      'key performance metrics'
                    } this season.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-slate-50 md:col-span-2 lg:col-span-1">
                  <h3 className="font-semibold mb-2 text-slate-700">Cosmic Influence</h3>
                  <p className="text-sm text-slate-600">
                    The {team?.name} are currently under the influence of {
                      ['Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'][Math.floor(Math.random() * 5)]
                    }, suggesting favorable conditions for their upcoming games, especially during {
                      ['full moon', 'waxing moon', 'new moon'][Math.floor(Math.random() * 3)]
                    } periods.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Upcoming Games */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Calendar className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
            Upcoming Games
          </h2>
          
          {upcomingGames.length > 0 ? (
            <GameCarousel 
              games={upcomingGames.map(game => ({
                ...game,
                astroInfluence: ['Favorable Moon', 'Rising Mars', 'Jupiter Aligned'][Math.floor(Math.random() * 3)],
                astroEdge: Math.random() * 15 + 5
              }))}
              defaultLogo="/placeholder-team.png"
              className="mt-6"
            />
          ) : (
            <p className="text-center py-8 text-slate-500">No upcoming games scheduled</p>
          )}
        </motion.div>
        
        {/* Team Roster */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="mr-2 h-6 w-6" style={{ color: teamColors.primary }} />
            Team Roster
          </h2>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Player</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Position</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {players.length > 0 ? players.map((player, index) => (
                    <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <img 
                              className="h-10 w-10 rounded-full object-cover"
                              src={player.headshot_url || '/placeholder-player.png'}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-player.png';
                              }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{player.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        #
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {player.primary_position || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/team/${teamId}/player/${player.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No players available for this team
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeamPage;
