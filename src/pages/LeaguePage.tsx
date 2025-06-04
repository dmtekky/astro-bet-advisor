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
import { Game, Team as TeamType, Sport } from '@/types'; // Import our main types

// Extend the base Team type with additional database fields
interface Team extends Omit<TeamType, 'external_id'> {
  // Override external_id to be number to match the database schema
  external_id: number;
  // Add database-specific fields
  is_active: boolean | null;
  last_updated: string | null;
  league_id: string;
  full_name: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_capacity: number | null;
  venue_surface: string | null;
  venue_zip: string | null;
  venue_latitude: number | null;
  venue_longitude: number | null;
  // Ensure sport is included from the league context
  sport: Sport;
}
import { Database } from '@/types/database.types'; // For raw DB types if needed

// League ID mapping for database queries
const LEAGUE_ID_MAP: Record<string, string> = {
  mlb: '6b78d3c9-d104-4f15-a985-4e9953258c3b', // MLB UUID from the database
  nba: '8d91bd64-4609-47cf-abc1-17a2057a612d', // NBA UUID from the database
  nfl: '5eb41c0c-d9c4-4ea3-9254-c60bddac1777', // NFL UUID from the database
  nhl: '7fc9bf67-39e2-4b59-aaf1-0dcb53ca75e2', // NHL UUID from the database
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
        
        // Fetch teams from database with all required fields
        const teamsResult = await supabase
          .from('teams')
          .select(`
            id, name, abbreviation, logo_url, city, 
            primary_color, secondary_color, full_name, 
            external_id, is_active, last_updated, league_id,
            venue_name, venue_city, venue_state, venue_capacity,
            venue_surface, venue_zip, venue_latitude, venue_longitude
          `)
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
          // Transform team data to match the Team interface
          const transformedTeams = teamsResult.data.map(team => ({
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            logo_url: team.logo_url || null,
            city: team.city,
            primary_color: team.primary_color || null,
            secondary_color: team.secondary_color || null,
            sport: leagueId as Sport, // Use the current league as the sport
            external_id: team.external_id,
            is_active: team.is_active ?? true,
            last_updated: team.last_updated || null,
            league_id: team.league_id,
            full_name: team.full_name || team.name,
            venue_name: team.venue_name || null,
            venue_city: team.venue_city || null,
            venue_state: team.venue_state || null,
            venue_capacity: team.venue_capacity || null,
            venue_surface: team.venue_surface || null,
            venue_zip: team.venue_zip || null,
            venue_latitude: team.venue_latitude || null,
            venue_longitude: team.venue_longitude || null
          }));
          
          setTeams(transformedTeams);
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
      <div className="space-y-6 sm:space-y-8">
        {/* League Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-600/5 dark:from-indigo-500/10 dark:to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center mb-2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {LEAGUE_NAMES[leagueId] || 'LEAGUE'}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 mb-2">
                  {LEAGUE_NAMES[leagueId] || 'League'}
                </h1>
                
                <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1.5" />
                    {teams.length} Teams
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    {upcomingGames.length} Upcoming Games
                  </span>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-base max-w-2xl">
                  View team details, schedules, and performance metrics for the {LEAGUE_NAMES[leagueId]?.toLowerCase() || 'league'}. Get insights, stats, and analysis to stay ahead of the game.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Games - Only show if we have games */}
        {upcomingGames.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <Calendar className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Upcoming Games
            </h2>
            
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
              {upcomingGames
                .map((game, idx) => {
                  const homeTeam = teams.find(t => t.id === game.home_team_id);
                  const awayTeam = teams.find(t => t.id === game.away_team_id);
                  
                  // Debug: Log the game and team info for the first few cards
                  if (idx < 5) {
                    console.log('GameCard', {
                      idx,
                      gameId: game.id,
                      homeTeamId: game.home_team_id,
                      awayTeamId: game.away_team_id,
                      homeTeam,
                      awayTeam
                    });
                  }
                  // Skip rendering if we don't have both teams
                  if (!homeTeam || !awayTeam) {
                    console.warn(`Missing team data for game ${game.id}`);
                    return null;
                  }
                  // Convert team types to be compatible with GameCard
                  const toGameCardTeam = (team: Team) => ({
                    ...team,
                    external_id: String(team.external_id),
                    primary_color: team.primary_color || undefined,
                    secondary_color: team.secondary_color || undefined,
                    // Ensure all required TeamType properties are included
                    id: team.id,
                    name: team.name,
                    abbreviation: team.abbreviation,
                    logo_url: team.logo_url || undefined,
                    city: team.city,
                    sport: team.sport
                  } as TeamType & { primary_color?: string; secondary_color?: string });
                  return (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      homeTeam={toGameCardTeam(homeTeam)}
                      awayTeam={toGameCardTeam(awayTeam)}
                      defaultLogo="/placeholder-team.png"
                    />
                  );
                })
                // Filter out any null entries from skipped games
                .filter(Boolean)}
            </div>
          </div>
        )}

        {/* Teams - Only show if we have teams */}
        {teams.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <Users className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Teams
            </h2>
            
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {teams.map((team) => (
                <Link 
                  key={team.id} 
                  to={`/teams/${team.id}`}
                  className="block h-full active:scale-95 transition-transform duration-150"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full flex flex-col"
                  >
                    <Card className="h-full border border-slate-200 dark:border-slate-700 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800/90 group overflow-hidden">
                      <CardContent className="p-2 sm:p-3 md:p-4 flex flex-col items-center h-full">
                        <div className="relative mb-2 sm:mb-3 flex-1 flex items-center justify-center w-full">
                          <div className="relative bg-white/80 dark:bg-slate-600/50 p-1.5 sm:p-2 rounded-full shadow-sm">
                            <img 
                              src={team.logo_url || '/placeholder-team.png'} 
                              alt={team.name}
                              className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-team.png';
                              }}
                              loading="lazy"
                              draggable="false"
                            />
                          </div>
                        </div>
                        <div className="w-full text-center">
                          <p className="text-slate-800 dark:text-white font-medium text-xs sm:text-sm line-clamp-1">
                            {team.name}
                          </p>
                          {team.venue_city && (
                            <div className="mt-1">
                              <Badge 
                                variant="outline" 
                                className="text-[10px] sm:text-xs bg-white/50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                              >
                                {team.venue_city}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {teams.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No teams found for this league</p>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="mt-2"
            >
              Retry Loading Teams
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-16 md:pb-0">
      <DashboardLayout>
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          {renderContent()}
        </div>
      </DashboardLayout>
    </div>
  );
};

export default LeaguePage;
