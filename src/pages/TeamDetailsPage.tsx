import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  Trophy, 
  ArrowLeft, 
  Star, 
  Activity, 
  TrendingUp, 
  Info
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Types
interface League {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
}

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  league_id: string;
  created_at: string;
  updated_at: string;
  bio?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  website?: string;
  venue?: string;
  championships?: number;
  founding_year?: number;
  league?: League;
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number?: string;
  position?: string;
  height?: string;
  weight?: number;
  birth_date?: string;
  nationality?: string;
  current_team_id: string;
  photo_url?: string;
  bio?: string;
  zodiac_sign?: string;
  created_at: string;
  updated_at: string;
  stats?: any;
}

interface TeamStats {
  wins: number;
  losses: number;
  win_percentage: number;
  points_per_game?: number;
  points_allowed?: number;
  standings_position?: number;
  current_streak?: string;
  last_ten?: string;
}

export default function TeamDetailsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  
  // Format player positions
  const formatPosition = (pos?: string) => {
    if (!pos) return '--';
    
    const positions: Record<string, string> = {
      'PG': 'Point Guard',
      'SG': 'Shooting Guard',
      'SF': 'Small Forward',
      'PF': 'Power Forward',
      'C': 'Center',
      'G': 'Guard',
      'F': 'Forward',
      'QB': 'Quarterback',
      'RB': 'Running Back',
      'WR': 'Wide Receiver',
      'TE': 'Tight End',
      'OL': 'Offensive Line',
      'DL': 'Defensive Line',
      'LB': 'Linebacker',
      'CB': 'Cornerback',
      'S': 'Safety'
    };
    
    return positions[pos] || pos;
  };

  useEffect(() => {
    async function fetchTeamDetails() {
      if (!teamId) return;

      try {
        setLoading(true);
        
        // Fetch team with its league
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            *,
            league:league_id(*)
          `)
          .eq('id', teamId)
          .single();

        if (teamError) throw teamError;
        setTeam(teamData);
        
        if (teamData.league) {
          setLeague(teamData.league);
        }

        // Fetch players in this team
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('current_team_id', teamId)
          .order('last_name');

        if (playersError) throw playersError;
        setPlayers(playersData || []);

        // Fetch team stats - this can be modified based on your actual data model
        const { data: statsData, error: statsError } = await supabase
          .from('team_stats')
          .select('*')
          .eq('team_id', teamId)
          .single();

        if (!statsError) {
          setTeamStats(statsData);
        } else {
          // Create dummy stats if none exist
          setTeamStats({
            wins: Math.floor(Math.random() * 50),
            losses: Math.floor(Math.random() * 30),
            win_percentage: Math.random() * 0.8,
            points_per_game: Math.floor(Math.random() * 40) + 80,
            points_allowed: Math.floor(Math.random() * 30) + 80,
            standings_position: Math.floor(Math.random() * 10) + 1,
            current_streak: 'W3',
            last_ten: '7-3'
          });
        }
        
        // Fetch upcoming games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .gt('start_time', new Date().toISOString())
          .order('start_time')
          .limit(5);
          
        if (!gamesError) {
          setUpcomingGames(gamesData || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching team details:', err);
        setError('Failed to load team details');
      } finally {
        setLoading(false);
      }
    }

    fetchTeamDetails();
  }, [teamId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-3xl mb-4">Error</div>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/teams">Back to Teams</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-2xl mb-4">Team Not Found</div>
          <p className="text-muted-foreground mb-6">The team you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/teams">Back to Teams</Link>
          </Button>
        </div>
      </div>
    );
  }

  const teamName = team.city ? `${team.city} ${team.name}` : team.name;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button & Team header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-2" style={{ borderColor: team.primary_color || '#cbd5e1' }}>
              <AvatarImage src={team.logo} alt={teamName} />
              <AvatarFallback style={{ 
                backgroundColor: team.primary_color || '#f1f5f9',
                color: team.secondary_color || '#1e293b'
              }}>
                {team.abbreviation || teamName.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-3xl font-bold">{teamName}</h1>
              <Badge className="md:ml-2 w-fit" style={{ 
                backgroundColor: team.primary_color || '#3b82f6',
                color: '#ffffff'
              }}>
                {league?.name || team.league_id.toUpperCase()}
              </Badge>
            </div>
            
            {teamStats && (
              <div className="mt-2 flex items-center text-muted-foreground">
                <span className="font-medium">
                  {teamStats.wins}-{teamStats.losses}
                </span>
                <span className="mx-2">•</span>
                <span>
                  {(teamStats.win_percentage * 100).toFixed(1)}% Win Rate
                </span>
                {teamStats.standings_position && (
                  <>
                    <span className="mx-2">•</span>
                    <span>
                      #{teamStats.standings_position} in standings
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="games">Upcoming Games</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.founding_year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Founded</span>
                    <span>{team.founding_year}</span>
                  </div>
                )}
                
                {team.venue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Home Venue</span>
                    <span>{team.venue}</span>
                  </div>
                )}
                
                {team.championships && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Championships</span>
                    <span>{team.championships}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abbreviation</span>
                  <span>{team.abbreviation}</span>
                </div>
                
                {team.bio && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">About</h4>
                      <p className="text-sm text-muted-foreground">{team.bio}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Team Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamStats && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Win Rate</span>
                        <span>{(teamStats.win_percentage * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={teamStats.win_percentage * 100} className="h-2" />
                    </div>
                    
                    {teamStats.points_per_game && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Points Scored</span>
                        <span>{teamStats.points_per_game.toFixed(1)} PPG</span>
                      </div>
                    )}
                    
                    {teamStats.points_allowed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Points Allowed</span>
                        <span>{teamStats.points_allowed.toFixed(1)} PPG</span>
                      </div>
                    )}
                    
                    {teamStats.current_streak && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Streak</span>
                        <span>{teamStats.current_streak}</span>
                      </div>
                    )}
                    
                    {teamStats.last_ten && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last 10 Games</span>
                        <span>{teamStats.last_ten}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Form & Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Recent Performance
              </CardTitle>
              <CardDescription>
                Team performance metrics for the current season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Wins</div>
                  <div className="text-2xl font-bold">{teamStats?.wins || 0}</div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Losses</div>
                  <div className="text-2xl font-bold">{teamStats?.losses || 0}</div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Win %</div>
                  <div className="text-2xl font-bold">
                    {teamStats ? (teamStats.win_percentage * 100).toFixed(1) : '0'}%
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Last 10</div>
                  <div className="text-2xl font-bold">{teamStats?.last_ten || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Roster Tab */}
        <TabsContent value="roster" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team Roster
              </CardTitle>
              <CardDescription>
                {players.length} players currently on the roster
              </CardDescription>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">
                  No players found for this team
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Player</th>
                        <th className="text-left py-3 px-4">#</th>
                        <th className="text-left py-3 px-4">Position</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Height</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Zodiac</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Nationality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <tr key={player.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={player.photo_url} alt={`${player.first_name} ${player.last_name}`} />
                                <AvatarFallback>
                                  {player.first_name[0]}{player.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>{player.first_name} {player.last_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{player.jersey_number || '--'}</td>
                          <td className="py-3 px-4">{formatPosition(player.position)}</td>
                          <td className="py-3 px-4 hidden md:table-cell">{player.height || '--'}</td>
                          <td className="py-3 px-4 hidden md:table-cell">{player.zodiac_sign || '--'}</td>
                          <td className="py-3 px-4 hidden md:table-cell">{player.nationality || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Upcoming Games Tab */}
        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Upcoming Games
              </CardTitle>
              <CardDescription>
                Schedule for upcoming matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingGames.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">
                  No upcoming games scheduled
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingGames.map((game) => (
                    <div key={game.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          {game.home_team_id === teamId ? 
                            `vs ${game.away_team_name || 'Opponent'}` : 
                            `@ ${game.home_team_name || 'Opponent'}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(game.start_time).toLocaleDateString()} at {new Date(game.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {game.venue || 'TBD'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
