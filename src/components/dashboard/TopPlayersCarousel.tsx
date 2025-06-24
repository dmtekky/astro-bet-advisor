import React from 'react';
import PlayerCardNew from '../PlayerCardNew';
import { Skeleton } from '@/components/ui/skeleton';

interface Player {
  id: string;
  player_id: string;
  full_name: string;
  headshot_url?: string | null;
  team_id?: string | null;
  birth_date?: string | null;
  primary_number?: string | number | null;
  primary_position?: string | null;
  impact_score?: number | null;
  astro_influence_score: number;
  team_name?: string | null;
  team_logo?: string | null;
}

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
        <h3 className="text-lg font-semibold text-gray-900">Top Players This Week</h3>
        <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[180px] h-[280px] bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <Skeleton className="w-full h-40 rounded-md mb-3" />
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Top Players This Week</h3>
      <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
        {players.slice(0, 6).map((player) => (
          <div key={player.id} className="flex-shrink-0 w-[180px] h-[280px]">
            <PlayerCardNew
              id={player.id}
              player_id={player.player_id}
              full_name={player.full_name}
              headshot_url={player.headshot_url || undefined}
              team_id={player.team_id || undefined}
              birth_date={player.birth_date || undefined}
              primary_number={player.primary_number || undefined}
              primary_position={player.primary_position?.toString() || undefined}
              impact_score={player.impact_score || 0}
              astro_influence={player.astro_influence_score} // Use astro_influence_score for astro_influence prop
              astro_influence_score={player.astro_influence_score}
              teamAverageAstroInfluence={0} // Add missing required prop
              linkPath={`/players/${player.id}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPlayersCarousel;
