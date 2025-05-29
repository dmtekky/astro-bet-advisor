import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, BarChart2, Users, Clock, Calendar, MapPin } from 'lucide-react';
import type { Game, Team, Player, PlayerSeasonStats } from '@/types';

interface DetailedGame extends Game {
  home_team: Team | null;
  away_team: Team | null;
  venue: any | null;
  league: any | null;
}

interface PlayerWithStats extends Player {
  stats?: PlayerSeasonStats | null;
  impactScore?: number;
}

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<DetailedGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [homePlayers, setHomePlayers] = useState<PlayerWithStats[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerWithStats[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch game details
  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!gameId) return;
      
      try {
        setLoading(true);
        
        // Fetch game with team details
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select(`
            *,
            home_team:home_team_id(*),
            away_team:away_team_id(*),
            venue:venue_id(*)
          `)
          .eq('id', gameId)
          .single();
          
        if (gameError) throw gameError;
        if (!gameData) throw new Error('Game not found');
        
        setGame(gameData as unknown as DetailedGame);
        
        // Fetch players for both teams
        await fetchTeamRosters(
          gameData.home_team_id,
          gameData.away_team_id
        );
        
      } catch (error) {
        console.error('Error fetching game details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId]);
  
  // Fetch team rosters with player stats
  const fetchTeamRosters = async (homeTeamId: string, awayTeamId: string) => {
    try {
      // Fetch home team players with stats
      const { data: homePlayersData } = await supabase
        .from('players')
        .select(`
          *,
          stats:player_season_stats(season, games_played, batting_average, home_runs, rbi, wins, era, strikeouts)
        `)
        .eq('team_id', homeTeamId)
        .order('name');
      
      // Fetch away team players with stats
      const { data: awayPlayersData } = await supabase
        .from('players')
        .select(`
          *,
          stats:player_season_stats(season, games_played, batting_average, home_runs, rbi, wins, era, strikeouts)
        `)
        .eq('team_id', awayTeamId)
        .order('name');
      
      // Process and set players with impact scores
      if (homePlayersData) {
        const processedHomePlayers = homePlayersData.map(player => ({
          ...player,
          stats: player.stats?.[0] || null,
          impactScore: calculatePlayerImpactScore(player.stats?.[0])
        }));
        setHomePlayers(processedHomePlayers);
      }
      
      if (awayPlayersData) {
        const processedAwayPlayers = awayPlayersData.map(player => ({
          ...player,
          stats: player.stats?.[0] || null,
          impactScore: calculatePlayerImpactScore(player.stats?.[0])
        }));
        setAwayPlayers(processedAwayPlayers);
      }
      
    } catch (error) {
      console.error('Error fetching team rosters:', error);
    }
  };
  
  // Calculate player impact score based on stats
  const calculatePlayerImpactScore = (stats?: PlayerSeasonStats | null): number => {
    if (!stats) return 0;
    
    let score = 0;
    
    // Hitting stats
    if (stats.batting_average) score += stats.batting_average * 100;
    if (stats.home_runs) score += stats.home_runs * 5;
    if (stats.rbi) score += stats.rbi * 2;
    
    // Pitching stats
    if (stats.wins) score += stats.wins * 2;
    if (stats.era !== undefined) score += (5 - Math.min(stats.era, 5)) * 3; // Lower ERA is better
    if (stats.strikeouts) score += stats.strikeouts * 0.5;
    
    return parseFloat(score.toFixed(1));
  };
  
  // Format date and time
  const formatGameDateTime = (dateString: string) => {
    if (!dateString) return 'TBD';
    
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (e) {
      return { date: 'TBD', time: '' };
    }
  };
  
  // Get top players by impact score
  const getTopPlayers = (players: PlayerWithStats[], count: number = 3) => {
    return [...players]
      .sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0))
      .slice(0, count);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Games
        </Button>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
          <p className="text-muted-foreground">The requested game could not be found.</p>
        </div>
      </div>
    );
  }
  
  const { home_team, away_team } = game;
  const gameDateTime = formatGameDateTime(game.start_time || game.game_date);
  const topHomePlayers = getTopPlayers(homePlayers);
  const topAwayPlayers = getTopPlayers(awayPlayers);
  
  return (
    <div className="bg-gradient-to-b from-background to-muted/20 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 hover:bg-accent/50 transition-colors"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> 
          Back to Games
        </Button>
        
        {/* Game Header */}
        <div className="bg-card rounded-xl shadow-sm border mb-8 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {game.league_name || 'Game Details'}
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center justify-center md:justify-start">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {gameDateTime.date} • {gameDateTime.time}
                </p>
                {game.venue?.name && (
                  <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center md:justify-start">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    {game.venue.name}
                  </p>
                )}
              </div>
              
              <div className="bg-muted/50 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                  game.status === 'scheduled' ? 'bg-yellow-500' : 
                  game.status === 'in_progress' ? 'bg-green-500' : 
                  'bg-gray-500'
                }`}></span>
                {game.status === 'scheduled' ? 'Upcoming' : 
                 game.status === 'in_progress' ? 'Live' : 
                 game.status?.replace('_', ' ').toLowerCase() || 'Scheduled'}
              </div>
            </div>
            
            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-12 my-8">
              {/* Home Team */}
              <div className="flex flex-col items-center">
                <Link 
                  to={`/teams/${home_team?.id}`} 
                  className="block w-24 h-24 md:w-32 md:h-32 relative group transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm group-hover:blur-md -z-10"></div>
                  <Avatar className="w-full h-full transition-transform duration-300 group-hover:scale-110">
                    <AvatarImage 
                      src={home_team?.logo_url || '/team-placeholder.svg'} 
                      alt={`${home_team?.name} logo`} 
                      className="object-contain transition-all duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/team-placeholder.svg';
                      }}
                    />
                    <AvatarFallback className="group-hover:bg-primary/10 transition-colors duration-300">
                      {home_team?.name?.charAt(0) || 'H'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <h2 className="text-xl font-bold text-center">
                  <Link to={`/teams/${home_team?.id}`} className="hover:underline">
                    {home_team?.name || 'TBD'}
                  </Link>
                </h2>
                <p className="text-muted-foreground text-sm">
                  {home_team?.record || '0-0'}
                </p>
                
                {game.home_score !== undefined && (
                  <div className="mt-2 text-3xl font-bold">
                    {game.home_score}
                  </div>
                )}
              </div>
              
              {/* VS */}
              <div className="flex flex-col items-center justify-center my-4 md:my-0">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center">
                  <span className="text-2xl font-bold">VS</span>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {gameDateTime.time}
                  </p>
                </div>
              </div>
              
              {/* Away Team */}
              <div className="flex flex-col items-center">
                <Link 
                  to={`/teams/${away_team?.id}`} 
                  className="block w-24 h-24 md:w-32 md:h-32 relative group transition-all duration-300 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm group-hover:blur-md -z-10"></div>
                  <Avatar className="w-full h-full transition-transform duration-300 group-hover:scale-110">
                    <AvatarImage 
                      src={away_team?.logo_url || '/team-placeholder.svg'} 
                      alt={`${away_team?.name} logo`} 
                      className="object-contain transition-all duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/team-placeholder.svg';
                      }}
                    />
                    <AvatarFallback className="group-hover:bg-primary/10 transition-colors duration-300">
                      {away_team?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <h2 className="text-xl font-bold text-center">
                  <Link to={`/teams/${away_team?.id}`} className="hover:underline">
                    {away_team?.name || 'TBD'}
                  </Link>
                </h2>
                <p className="text-muted-foreground text-sm">
                  {away_team?.record || '0-0'}
                </p>
                
                {game.away_score !== undefined && (
                  <div className="mt-2 text-3xl font-bold">
                    {game.away_score}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="players" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Players
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="p-6 pt-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Players */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Players</CardTitle>
                    <CardDescription>Key players to watch in this matchup</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-3 flex items-center">
                          <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                          {home_team?.name || 'Home Team'}
                        </h3>
                        <div className="space-y-3">
                          {topHomePlayers.length > 0 ? (
                            topHomePlayers.map((player) => (
                              <div key={player.id} className="flex items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage src={player.image} alt={player.name} />
                                  <AvatarFallback>
                                    {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                                  </p>
                                </div>
                                {player.stats?.home_runs !== undefined && (
                                  <div className="text-right">
                                    <p className="font-medium">{player.stats.home_runs} HR</p>
                                    <p className="text-xs text-muted-foreground">
                                      {player.stats.batting_average ? player.stats.batting_average.toFixed(3) : '.000'} AVG
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No player data available</p>
                          )}
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div>
                        <h3 className="font-medium mb-3 flex items-center">
                          <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                          {away_team?.name || 'Away Team'}
                        </h3>
                        <div className="space-y-3">
                          {topAwayPlayers.length > 0 ? (
                            topAwayPlayers.map((player) => (
                              <div key={player.id} className="flex items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarImage src={player.image} alt={player.name} />
                                  <AvatarFallback>
                                    {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                                  </p>
                                </div>
                                {player.stats?.home_runs !== undefined && (
                                  <div className="text-right">
                                    <p className="font-medium">{player.stats.home_runs} HR</p>
                                    <p className="text-xs text-muted-foreground">
                                      {player.stats.batting_average ? player.stats.batting_average.toFixed(3) : '.000'} AVG
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No player data available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Game Details */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Game Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span>{gameDateTime.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span>{gameDateTime.time}</span>
                        </div>
                        {game.venue?.name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Venue</span>
                            <span>{game.venue.name}</span>
                          </div>
                        )}
                        {game.venue?.city && game.venue?.state && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location</span>
                            <span>{game.venue.city}, {game.venue.state}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Odds */}
                  {(game.home_odds || game.away_odds) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Betting Odds</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <Link to={`/teams/${home_team?.id}`} className="font-medium hover:underline">
                            {home_team?.name || 'Home'}
                          </Link>
                            <span className="font-bold">{game.home_odds ? `+${game.home_odds}` : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <Link to={`/teams/${away_team?.id}`} className="font-medium hover:underline">
                            {away_team?.name || 'Away'}
                          </Link>
                            <span className="font-bold">{game.away_odds ? `+${game.away_odds}` : '-'}</span>
                          </div>
                          {(game.spread || game.over_under) && (
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                              {game.spread && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Spread</p>
                                  <p className="font-medium">{game.spread > 0 ? `+${game.spread}` : game.spread}</p>
                                </div>
                              )}
                              {game.over_under && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Over/Under</p>
                                  <p className="font-medium">{game.over_under}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="players" className="p-6 pt-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Home Team Players */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/teams/${home_team?.id}`} className="hover:underline">
                        {home_team?.name || 'Home Team'}
                      </Link> Players
                    </CardTitle>
                    <CardDescription>Starting lineup and key players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {homePlayers.length > 0 ? (
                      <div className="space-y-3">
                        {homePlayers.map((player) => (
                          <div key={player.id} className="flex items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={player.image} alt={player.name} />
                              <AvatarFallback>
                                {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{player.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                              </p>
                            </div>
                            {player.stats && (
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {player.stats.games_played || 0} GP
                                </p>
                                {player.stats.batting_average !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.stats.batting_average.toFixed(3)} AVG
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No player data available</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Away Team Players */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/teams/${away_team?.id}`} className="hover:underline">
                        {away_team?.name || 'Away Team'}
                      </Link> Players
                    </CardTitle>
                    <CardDescription>Starting lineup and key players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {awayPlayers.length > 0 ? (
                      <div className="space-y-3">
                        {awayPlayers.map((player) => (
                          <div key={player.id} className="flex items-center p-2 hover:bg-muted/50 rounded-lg transition-colors">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={player.image} alt={player.name} />
                              <AvatarFallback>
                                {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{player.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {player.position} • Impact: {player.impactScore?.toFixed(1) || 'N/A'}
                              </p>
                            </div>
                            {player.stats && (
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {player.stats.games_played || 0} GP
                                </p>
                                {player.stats.batting_average !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.stats.batting_average.toFixed(3)} AVG
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No player data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
