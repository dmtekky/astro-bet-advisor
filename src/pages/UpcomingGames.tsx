import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { useTeams } from '@/hooks/useTeams';

// Using types from @/types
import type { Team as TeamType, Sport } from '@/types';

// Define our local Team type that matches what we need
interface Team extends Omit<TeamType, 'external_id' | 'sport'> {
  // Ensure required properties are included
  id: string;
  name: string;
  abbreviation: string; // Required by TeamType
  sport: Sport; // Use the Sport type from @/types
  // Optional properties from TeamType with our additions
  logo_url?: string;
  city?: string;
  record?: string;
  wins?: number;
  losses?: number;
  primary_color?: string;
  secondary_color?: string;
  external_id?: string;
  // Allow any other properties
  [key: string]: any;
}

// Default logos for different sports
const DEFAULT_LOGOS: Record<string, string> = {
  soccer: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  basketball: 'https://cdn-icons-png.flaticon.com/512/33/33682.png',
  football: 'https://cdn-icons-png.flaticon.com/512/1/1322.png',
  baseball: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  hockey: 'https://cdn-icons-png.flaticon.com/512/33/33618.png',
};

const MLB_LEAGUE_KEY = 'mlb';

const UpcomingGames: React.FC = () => {
  const { sport = 'baseball_mlb' } = useParams<{ sport?: string }>();
  const [teamId, setTeamId] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const gamesPerPage = 15; // Show more games per page
  
  // Use the useTeams hook to fetch teams
  const { teams, teamMap, teamByExternalId, loading: teamsLoading, error: teamsError } = useTeams(MLB_LEAGUE_KEY);
  const teamsWithAll = useMemo(() => [
    { id: '', name: 'All Teams' },
    ...teams.map(team => ({
      id: team.id,
      name: team.city ? `${team.city} ${team.name}` : team.name
    }))
  ], [teams]);
  
  const { games, loading, error, hasMore } = useUpcomingGames({
    sport: sport as any,
    limit: gamesPerPage,
    offset: page * gamesPerPage,
    teamId: teamId || undefined,
  });
  
  const groupedGames = groupGamesByDate(games);
  const totalDays = groupedGames.length;
  const maxPages = Math.ceil(totalDays / 3); // Show 3 days per page

  // Get only the days for the current page (3 days per page)
  const currentPageDays = useMemo(() => {
    const startIdx = 0; // Always start from the first day
    const endIdx = Math.min(startIdx + 3, totalDays); // Show up to 3 days
    return groupedGames.slice(startIdx, endIdx);
  }, [groupedGames, totalDays]);

  const handleNextPage = () => {
    if (page < maxPages - 1 || hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTeamId(e.target.value);
    setPage(0); // Reset to first page when changing team filter
  };

  if (error || teamsError) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error?.message || teamsError?.message || 'Failed to load data. Please try again later.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || teamsLoading) {
    return (
      <div className="container px-3 sm:px-4 py-8">
        <div className="animate-pulse space-y-6">
          {/* Header Skeleton */}
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 max-w-xs"></div>
          
          {/* Filter Skeleton */}
          <div className="h-16 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
          
          {/* Game Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="container px-3 sm:px-4 py-12 text-center">
        <div className="max-w-md mx-auto p-6 bg-muted/30 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white">No Upcoming Games</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {teamId 
              ? 'No games scheduled for the selected team.'
              : 'There are no scheduled games in the next 16 days.'
            }
          </p>
          {teamId && (
            <button
              onClick={() => setTeamId('')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Clear filters and show all games
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 px-2 sm:px-0">Upcoming Games</h1>
      
      {/* Filter Section */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm px-2 py-3 -mx-3 sm:mx-0 sm:px-0 sm:static sm:mb-6">
        <div className="max-w-md">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Filter by Team</span>
            <select 
              value={teamId} 
              onChange={handleTeamChange} 
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.city ? `${team.city} ${team.name}` : team.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Games Grid */}
      <div className="space-y-6 sm:space-y-8">
        {currentPageDays.map(({ date, games: dateGames }) => (
          <div key={date.toString()} className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold px-2 sm:px-0">
              {formatGameDate(date.toString())}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dateGames.map((game) => {
                // Use the actual team names from the game data
                const sportType = sport.includes('soccer') ? 'soccer' : 
                                 sport.includes('basketball') ? 'basketball' : 
                                 sport.includes('football') ? 'football' : 
                                 sport.includes('baseball') ? 'baseball' : 
                                 sport.includes('hockey') ? 'hockey' : 'soccer';
                
                // Look up home/away team info from teamMap or teamByExternalId
                const findTeam = (teamId: string) => {
                  // First try to find by UUID
                  if (teamMap[teamId]) {
                    return teamMap[teamId];
                  }
                  
                  // If not found, try to find by external_id (as a fallback)
                  const team = Object.values(teamByExternalId).find(
                    t => t.external_id.toString() === teamId
                  );
                  
                  // If still not found, return a default team object
                  // Convert sportType to Sport type
                const sport = (sportType.includes('soccer') ? 'soccer' :
                  sportType.includes('basketball') ? 'basketball' :
                  sportType.includes('baseball') ? 'baseball_mlb' :
                  sportType.includes('hockey') ? 'icehockey_nhl' :
                  'soccer') as Sport;

                const defaultTeam: Team = {
                  id: teamId,
                  name: teamId,
                  abbreviation: teamId.substring(0, 3).toUpperCase(),
                  sport,
                  external_id: '0',
                  city: '',
                  logo_url: DEFAULT_LOGOS[sportType],
                  wins: 0,
                  losses: 0,
                  primary_color: '#1E40AF', // Default blue
                  secondary_color: '#3B82F6', // Default lighter blue
                  record: '0-0'
                };
                
                  return team || defaultTeam;
                };
                
                // Cast to the expected type with primary and secondary colors
                const homeTeam = findTeam(game.home_team_id) as Team & { primary_color?: string; secondary_color?: string };
                const awayTeam = findTeam(game.away_team_id) as Team & { primary_color?: string; secondary_color?: string };
                const defaultLogo = DEFAULT_LOGOS[sportType] || DEFAULT_LOGOS.soccer;
                
                return (
                  <GameCard 
                    key={game.id}
                    game={game}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    defaultLogo={defaultLogo}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Pagination controls */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 py-3 px-4 -mx-3 sm:mx-0 sm:border-t-0 sm:bg-transparent sm:relative sm:py-6 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
          {page > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={loading}
              className="w-full sm:w-auto justify-center sm:justify-start px-4 py-2 text-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </Button>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400 px-2">
            Page {page + 1}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasMore || loading}
            className="w-full sm:w-auto justify-center sm:justify-start px-4 py-2 text-sm"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center mt-3 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingGames;
