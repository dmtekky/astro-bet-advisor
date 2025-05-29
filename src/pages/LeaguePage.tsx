import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Users, Trophy, ChevronRight, Info, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Separator } from '@/components/ui/separator';
import GameCard from '@/components/GameCard'; // Import the GameCard component
import { Game, Team, Sport } from '@/types'; // Import our main types
import { Database } from '@/types/database.types'; // For raw DB types if needed

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
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
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
          .select('*, primary_color, secondary_color')
          .eq('league_id', dbLeagueId);
        console.log('[LeaguePage] teams query result:', teamsResult);
        
        // Fetch upcoming games from database
        const upcomingGamesResult = await supabase
          .from('games')
          .select(`
            id, external_id, league_id, home_team_id, away_team_id, venue_id, game_date, game_time_utc, status, home_score, away_score, home_odds, away_odds, spread, over_under, created_at, updated_at,
            leagues:league_id(name, key),
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
          const mappedGames = upcomingGamesResult.data.map((dbGame: any): Game => {
            // Assuming dbGame.home_team and dbGame.away_team are populated by the query
            // And dbGame.leagues is also populated
            // Derive sport from league key
            const sportKeyValue = dbGame.leagues?.key || 'other';
            let sport: Sport = sportKeyValue as Sport;
            
            // Map league key to sport if needed
            if (sportKeyValue === 'mlb' || sportKeyValue === '4424') sport = 'mlb';
            else if (sportKeyValue === 'nba' || sportKeyValue === '4387') sport = 'nba';
            else if (sportKeyValue === 'nfl' || sportKeyValue === '4391') sport = 'nfl';
            else if (sportKeyValue === 'nhl' || sportKeyValue === '4380') sport = 'nhl';
            else if (sportKeyValue?.toLowerCase().includes('soccer')) sport = 'soccer';

            return {
              id: dbGame.id,
              external_id: dbGame.external_id,
              league_id: dbGame.league_id,
              home_team_id: dbGame.home_team_id,
              away_team_id: dbGame.away_team_id,
              venue_id: dbGame.venue_id,
              game_date: dbGame.game_date,
              game_time_utc: dbGame.game_time_utc,
              status: dbGame.status,
              home_score: dbGame.home_score,
              away_score: dbGame.away_score,
              home_odds: dbGame.home_odds,
              away_odds: dbGame.away_odds,
              spread: dbGame.spread,
              over_under: dbGame.over_under,
              // Create odds array for backward compatibility
              odds: [
                dbGame.home_odds ? {
                  market: 'Moneyline',
                  outcome: 'Home',
                  price: dbGame.home_odds
                } : null,
                dbGame.away_odds ? {
                  market: 'Moneyline',
                  outcome: 'Away',
                  price: dbGame.away_odds
                } : null,
                dbGame.spread ? {
                  market: 'Spread',
                  outcome: 'Home',
                  price: dbGame.spread
                } : null,
                dbGame.over_under ? {
                  market: 'Total',
                  outcome: 'Over',
                  price: dbGame.over_under
                } : null
              ].filter(Boolean),
              // the_sports_db_id removed as it doesn't exist in the database schema
              // sport_type removed as it doesn't exist in the database schema
              created_at: dbGame.created_at,
              updated_at: dbGame.updated_at,
              sport: sport,
              start_time: (dbGame.game_date && dbGame.game_time_utc) 
                            ? `${dbGame.game_date}T${dbGame.game_time_utc}` 
                            : dbGame.updated_at || new Date().toISOString(),
              league_name: dbGame.leagues?.name || undefined,
              home_team_name: dbGame.home_team?.name || undefined,
              away_team_name: dbGame.away_team?.name || undefined,
              // Astro fields are not fetched here, GameCard handles undefined
            };
          });
          setUpcomingGames(mappedGames);
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

  const renderContent = () => {
    // Show loading skeleton
    if (loading) {
      return (
        <div className="space-y-8">
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
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="max-w-2xl mx-auto py-8">
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
      );
    }

    return (
      <div className="space-y-8">
        {/* League Header & Astrological Influence */}
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
                    {LEAGUE_EMOJIS[leagueId] || '🏆'}
                  </div>
                  <div>
                    <CardTitle className="text-3xl">{LEAGUE_NAMES[leagueId] || 'League'}</CardTitle>
                    <CardDescription>
                      {teams.length} Teams • {upcomingGames.length} Upcoming Games
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">League Type:</span>
                    <span className="text-sm">Professional</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Season Status:</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Team Count:</span>
                    <span className="text-sm">{teams.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Astrological Influence Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-950 dark:to-purple-900">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[96%] h-1.5 rounded-b-2xl bg-gradient-to-r from-indigo-400 via-purple-300 to-violet-600 blur-sm opacity-80 animate-pulse" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-indigo-500" />
                  Astrological Influence
                </CardTitle>
                <CardDescription>
                  How the stars affect {LEAGUE_NAMES[leagueId]} performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white">
                      {/* You can replace this with real element info */}
                      Element
                    </Badge>
                    <Badge variant="outline">
                      Planet
                    </Badge>
                  </div>
                  <p className="text-sm">
                    This league's style is astrologically influenced by its dominant element and planetary ruler.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Upcoming Games */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Calendar className="mr-2 h-6 w-6" />
            Upcoming Games
          </h2>
          
          {upcomingGames.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingGames.map((game) => {
                const homeTeam = game.home_team || { id: '', name: 'TBD', logo_url: '', primary_color: '#1E40AF', secondary_color: '#3B82F6' };
                const awayTeam = game.away_team || { id: '', name: 'TBD', logo_url: '', primary_color: '#1E40AF', secondary_color: '#3B82F6' };
                
                return (
                  <GameCard
                    key={game.id}
                    game={game}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    defaultLogo="/placeholder-team.png"
                  />
                );
              })}
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
          
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {teams.map((team) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Link to={`/teams/${team.id}`}>
                  <Card className="h-full border border-slate-200 dark:border-slate-700 shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800/90 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                    <CardContent className="p-5 flex flex-col items-center">
                      <div className="relative mb-3">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative bg-white/80 dark:bg-slate-600/50 p-2 rounded-full shadow-sm">
                          <img 
                            src={team.logo_url || '/placeholder-team.png'} 
                            alt={team.name}
                            className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-team.png';
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-slate-800 dark:text-white text-center font-medium text-sm">{team.name}</p>
                      {team.conference && (
                        <Badge variant="outline" className="mt-2 text-xs bg-white/50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                          {team.conference}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {teams.length === 0 && (
            <p className="text-gray-400 text-center py-8">No teams found for this league</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
};

export default LeaguePage;
