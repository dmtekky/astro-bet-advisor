import React from 'react';
import PlayerCardNew from '../PlayerCardNew';
import { Skeleton } from '@/components/ui/skeleton';

// Import the Player interface from useTopPlayers
type Player = ReturnType<typeof import('@/hooks/useTopPlayers')>['players'][number];

interface TopPlayersCarouselProps {
  players?: Player[];
  loading?: boolean;
  error?: Error | null;
}

const TopPlayersCarousel: React.FC<TopPlayersCarouselProps> = ({ 
  players = [], 
  loading = false,
  error = null 
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Players This Week</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
              <Skeleton className="w-full aspect-[3/4] rounded-md mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Error loading top players. Please try again later.</p>
      </div>
    );
  }

  if (!loading && (!players || players.length === 0)) {
    return null;
  }

  // Calculate average astro influence for the team
  const teamAverageAstroInfluence = players.length > 0 
    ? players.reduce((sum, player) => sum + (player.astro_influence_score || 0), 0) / players.length 
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Players This Week</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {players.slice(0, 6).map((player) => (
          <div key={player.id} className="h-full">
            <PlayerCardNew
              key={player.id}
              id={player.id}
              player_id={player.player_id}
              full_name={player.full_name}
              first_name={player.first_name}
              last_name={player.last_name}
              headshot_url={player.headshot_url || undefined}
              team_id={player.team_id || undefined}
              team_abbreviation={player.team_abbreviation || undefined}
              birth_date={player.birth_date || undefined}
              primary_number={player.primary_number?.toString()}
              primary_position={player.primary_position}
              position={player.position}
              impact_score={player.impact_score}
              astro_influence={player.astro_influence_score}
              astro_influence_score={player.astro_influence_score}
              teamAverageAstroInfluence={teamAverageAstroInfluence}
              linkPath={`/players/${player.id}`} // Default to MLB path
              stats={{
                batting: {
                  hits: player.stats_batting_hits,
                  homeRuns: player.stats_batting_homeruns,
                  runs: player.stats_batting_runs,
                  rbi: player.stats_batting_runs_batted_in,
                  avg: player.stats_batting_avg
                },
                fielding: {
                  assists: player.stats_fielding_assists,
                  errors: player.stats_fielding_errors
                },
                games: {
                  played: player.stats_games_played
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPlayersCarousel;
