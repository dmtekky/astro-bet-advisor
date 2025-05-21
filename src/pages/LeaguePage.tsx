import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// League ID mapping for database queries
const LEAGUE_ID_MAP: Record<string, string> = {
  mlb: 'c3ae8808-32c1-4f16-8e19-cc2a558b1520', // Correct MLB UUID from your database
  nba: '8d91bd64-4609-47cf-abc1-17a2057a612d', // Correct NBA UUID from your database
  nfl: '5eb41c0c-d9c4-4ea3-9254-c60bddac1777', // Correct NFL UUID from your database
  nhl: '7fc9bf67-39e2-4b59-aaf1-0dcb53ca75e2', // Correct NHL UUID from your database
};

// League display names
const LEAGUE_NAMES: Record<string, string> = {
  nba: 'NBA', 
  mlb: 'MLB', 
  nfl: 'NFL', 
  nhl: 'NHL', 
  soccer: 'Soccer', 
  tennis: 'Tennis', 
  mma: 'MMA', 
  ncaa: 'NCAA', 
  ncaab: 'NCAA Basketball', 
  ncaaf: 'NCAA Football', 
  golf: 'Golf', 
  esports: 'eSports', 
  cfl: 'CFL', 
  boxing: 'Boxing'
};

// League emojis for visual representation
const LEAGUE_EMOJIS: Record<string, string> = {
  nba: '🏀', 
  mlb: '⚾', 
  nfl: '🏈', 
  nhl: '🏒', 
  soccer: '⚽', 
  tennis: '🎾', 
  mma: '🥋', 
  ncaa: '🏈', 
  ncaab: '🏀', 
  ncaaf: '🏈', 
  golf: '⛳', 
  esports: '🎮', 
  cfl: '🏈', 
  boxing: '🥊'
};

const LeaguePage: React.FC = () => {
  const { leagueId: leagueIdParam } = useParams<{ leagueId: string }>();
  
  // Ensure leagueId is a valid value or default to 'nba'
  const leagueId = (leagueIdParam && Object.keys(LEAGUE_NAMES).includes(leagueIdParam)) 
    ? leagueIdParam 
    : 'nba';
  
  // Get the database league ID from the mapping
  const dbLeagueId = LEAGUE_ID_MAP[leagueId];
  
  const [teams, setTeams] = useState<any[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function loadData() {
  // Debug log for troubleshooting
  console.log('[LeaguePage] leagueId:', leagueId, 'dbLeagueId:', dbLeagueId);

      // Defensive: Only fetch if dbLeagueId is valid
      if (!dbLeagueId) {
        setTeams([]);
        setError('Invalid or unsupported league selected.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        
        // Fetch teams from database
        const teamsResult = await supabase
          .from('teams')
          .select('*')
          .eq('league_id', dbLeagueId);
        console.log('[LeaguePage] teams query result:', teamsResult);
        
        // Fetch upcoming games from database
        const upcomingGamesResult = await supabase
          .from('games')
          .select(`
            *,
            home_team:home_team_id(*),
            away_team:away_team_id(*)
          `)
          .gt('game_date', new Date().toISOString()) // Changed from game_time to game_date
          .order('game_date', { ascending: true }) // Changed from game_time to game_date
          .limit(10);
        
        // Process database data
        if (teamsResult.error) {
          console.error('Error fetching teams:', teamsResult.error);
          setError(teamsResult.error.message);
        } else if (teamsResult.data) {
          setTeams(teamsResult.data);
        }
        
        if (upcomingGamesResult.error) {
          console.error('Error fetching games:', upcomingGamesResult.error);
          if (!error) {
            setError(upcomingGamesResult.error.message);
          }
        } else if (upcomingGamesResult.data) {
          setUpcomingGames(upcomingGamesResult.data);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load league data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [dbLeagueId, retryCount]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 sm:p-8">
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <Skeleton className="h-12 w-12 rounded-full mr-4" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          
          <div className="mb-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          </div>
          
          <div>
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 sm:p-8">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 sm:p-8">
      <div className="container mx-auto">
        {/* League Header */}
        <div className="flex items-center mb-8">
          <div className="text-4xl mr-4">{LEAGUE_EMOJIS[leagueId] || '🏆'}</div>
          <div>
            <h1 className="text-3xl font-bold text-white">{LEAGUE_NAMES[leagueId] || 'League'}</h1>
            <p className="text-gray-400">Teams and upcoming games</p>
          </div>
        </div>

        {/* Upcoming Games */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Calendar className="mr-2 h-6 w-6" />
            Upcoming Games
          </h2>
          
          {upcomingGames.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingGames.map((game) => (
                <Card key={game.id} className="bg-gray-800 border-gray-700 text-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-center">
                        <img 
                          src={game.home_team?.logo_url || '/placeholder-team.png'} 
                          alt={game.home_team?.name || 'Home team'}
                          className="h-12 w-12 mx-auto mb-1 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-team.png';
                          }}
                        />
                        <p className="text-sm">{game.home_team?.name || 'TBD'}</p>
                      </div>
                      <div className="text-center px-2">
                        <p className="text-xs text-gray-400">VS</p>
                        <p className="text-xs text-gray-400">
                          {new Date(game.game_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <img 
                          src={game.away_team?.logo_url || '/placeholder-team.png'} 
                          alt={game.away_team?.name || 'Away team'}
                          className="h-12 w-12 mx-auto mb-1 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-team.png';
                          }}
                        />
                        <p className="text-sm">{game.away_team?.name || 'TBD'}</p>
                      </div>
                    </div>
                    {game.venue && (
                      <p className="text-xs text-center text-gray-400 mt-2">
                        @ {game.venue.name}, {game.venue.city}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No upcoming games scheduled</p>
          )}
        </div>

        {/* Teams */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Users className="mr-2 h-6 w-6" />
            Teams
          </h2>
          
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {teams.map((team) => (
              <Link to={`/team/${team.id}`} key={team.id}>
                <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors h-full">
                  <CardContent className="p-4 flex flex-col items-center">
                    <img 
                      src={team.logo_url || '/placeholder-team.png'} 
                      alt={team.name}
                      className="h-16 w-16 mb-2 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-team.png';
                      }}
                    />
                    <p className="text-white text-center font-medium">{team.name}</p>
                    {team.conference && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {team.conference}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {teams.length === 0 && (
            <p className="text-gray-400 text-center py-8">No teams found for this league</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;
