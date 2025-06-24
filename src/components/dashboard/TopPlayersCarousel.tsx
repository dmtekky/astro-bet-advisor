import React from 'react';
import PlayerCardNew, { PlayerCardProps } from '../PlayerCardNew';
import { Skeleton } from '@/components/ui/skeleton';

// Extend the PlayerCardProps to include any additional fields we need
interface PlayerCardData extends Omit<PlayerCardProps, 'astro_influence'> {
  astro_influence_score: number;
  teamAverageAstroInfluence?: number;
}

interface TopPlayersCarouselProps {
  players?: PlayerCardData[];
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
    <div className="relative w-full max-w-[1440px] mx-auto">
      {/* Mobile & Tablet: Horizontal scroll with snap points */}
      <div className="lg:hidden">
        <div className="relative w-full" style={{ height: 'fit-content' }}>
          <div className="flex space-x-4 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 -mb-24">
            {players.slice(0, 6).map((player) => ({
              ...player,
              astro_influence: player.astro_influence_score
            })).map((player) => (
              <div key={player.id} className="flex-shrink-0 w-[40%] snap-center">
                <div style={{ 
                  transform: 'scale(0.6)',
                  transformOrigin: 'top center',
                  margin: '0 -20% -40px',
                  padding: '0 0 20px'
                }}>
                  <PlayerCardNew {...player} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Desktop: Grid layout */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-2 pt-4" style={{ marginBottom: '-160px' }}>
          {players.slice(0, 6).map((player) => ({
            ...player,
            astro_influence: player.astro_influence_score
          })).map((player) => (
            <div key={player.id} className="flex justify-center">
              <div style={{ 
                transform: 'scale(0.6) translateY(16px)', 
                transformOrigin: 'top center' 
              }}>
                <PlayerCardNew {...player} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopPlayersCarousel;
