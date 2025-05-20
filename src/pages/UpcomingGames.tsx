import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GameCard from '@/components/GameCard';
import { useTeams } from '@/hooks/useTeams';

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  city?: string;
  abbreviation?: string;
  external_id?: number | string;
  record?: string;
  wins?: number;
  losses?: number;
  primary_color?: string;
  secondary_color?: string;
  [key: string]: any; // For any additional properties
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
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">No Upcoming Games</h1>
        <p className="text-muted-foreground">
          There are no scheduled games in the next 16 days.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Games</h1>
      <div className="flex flex-wrap gap-4 mb-8 items-end">
        <label className="flex flex-col">
          <span className="text-xs mb-1 font-medium text-gray-700 dark:text-gray-300">Filter by Team</span>
          <select 
            value={teamId} 
            onChange={handleTeamChange} 
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
          >
            {teamsWithAll.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-8">
        {currentPageDays.map(({ date, games: dateGames }) => (
          <div key={date.toString()} className="space-y-4">
            <h2 className="text-xl font-semibold">
              {formatGameDate(date.toString())}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  return (team || {
                    id: teamId,
                    external_id: 0,
                    name: teamId,
                    city: '',
                    abbreviation: teamId.substring(0, 3).toUpperCase(),
                    logo_url: DEFAULT_LOGOS[sportType],
                    wins: 0,
                    losses: 0,
                    primary_color: '#1E40AF', // Default blue
                    secondary_color: '#3B82F6' // Default lighter blue
                  }) as Team & { record?: string };
                };
                
                const homeTeam = findTeam(game.home_team_id) as Team & { record?: string };
                const awayTeam = findTeam(game.away_team_id) as Team & { record?: string };
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
      <div className="flex justify-center items-center gap-4 py-8">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={page === 0 || loading}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {page + 1}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!hasMore || loading}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {loading && (
          <div className="flex items-center ml-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingGames;
