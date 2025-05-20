import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatGameTime } from '@/utils/dateUtils';
import { AstrologicalData, Game } from '@/types';
import { Team } from '@/types';



interface GameCardProps {
  game: Game & {
    astroEdge?: number;
    astroInfluence?: string;
  };
  astroData?: AstrologicalData;
  loading?: boolean;
  error?: Error | null;
  homeTeam: Team;
  awayTeam: Team;
  defaultLogo: string;
}

const GameCard: React.FC<GameCardProps> = ({ game, astroData, loading, error, homeTeam, awayTeam, defaultLogo }) => {
  // Create display names (City Name if available, otherwise just name)
  const homeTeamName = homeTeam.city 
    ? `${homeTeam.city} ${homeTeam.name}`
    : homeTeam.name;
    
  const awayTeamName = awayTeam.city 
    ? `${awayTeam.city} ${awayTeam.name}`
    : awayTeam.name;

  // Calculate a contrasting text color based on background
  const getContrastColor = (hexColor: string | undefined) => {
    if (!hexColor) return 'white';
    
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance - standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const textColor = getContrastColor(homeTeam.primary_color);

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: homeTeam.primary_color || '#1E40AF',
        borderRadius: '0.75rem',
        boxShadow: `0 4px 12px -2px rgba(${parseInt(homeTeam.primary_color?.slice(1, 3) || '30', 16)}, ${parseInt(homeTeam.primary_color?.slice(3, 5) || '64', 16)}, ${parseInt(homeTeam.primary_color?.slice(5, 7) || '175', 16)}, 0.15)`,
        background: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      {/* Header with gradient */}
      <div 
        className="relative px-4 py-2 border-b overflow-hidden"
        style={{
          background: `linear-gradient(to right, ${homeTeam.primary_color || '#1E40AF'}, ${homeTeam.secondary_color || '#3B82F6'})`
        }}
      >
        {/* Texture overlay */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.8' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Header content */}
        <div className="relative flex justify-between items-center">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
            {game.league || 'Game'}
          </span>
          <span className="text-xs font-medium" style={{ color: textColor }}>
            {formatGameTime(game.start_time)}
          </span>
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="p-4 space-y-4">
          {/* Home Team */}
          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 shadow-inner"
            style={{
              boxShadow: `0 4px 12px -2px rgba(${parseInt(homeTeam.primary_color?.slice(1, 3) || '30', 16)}, ${parseInt(homeTeam.primary_color?.slice(3, 5) || '64', 16)}, ${parseInt(homeTeam.primary_color?.slice(5, 7) || '175', 16)}, 0.2)`
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" 
                style={{
                  background: 'radial-gradient(circle at 30% 30%, white, #f5f5f5)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)'
                }}
              >
                <img 
                  src={homeTeam.logo_url || defaultLogo} 
                  alt={`${homeTeam.name} logo`}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = defaultLogo;
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {homeTeamName}
                </p>
                {homeTeam.wins !== undefined && homeTeam.losses !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {homeTeam.wins}-{homeTeam.losses}
                  </p>
                )}
              </div>
            </div>
            
            <div className="ml-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Odds</div>
                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {typeof game.odds === 'number' ? `+${game.odds}` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative px-2 bg-white dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400">
              VS
            </div>
          </div>

          {/* Away Team */}
          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 shadow-inner"
            style={{
              boxShadow: `0 4px 12px -2px rgba(${parseInt(awayTeam.primary_color?.slice(1, 3) || '30', 16)}, ${parseInt(awayTeam.primary_color?.slice(3, 5) || '64', 16)}, ${parseInt(awayTeam.primary_color?.slice(5, 7) || '175', 16)}, 0.2)`
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" 
                style={{
                  background: 'radial-gradient(circle at 30% 30%, white, #f5f5f5)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)'
                }}
              >
                <img 
                  src={awayTeam.logo_url || defaultLogo} 
                  alt={`${awayTeam.name} logo`}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = defaultLogo;
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {awayTeamName}
                </p>
                {awayTeam.wins !== undefined && awayTeam.losses !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {awayTeam.wins}-{awayTeam.losses}
                  </p>
                )}
              </div>
            </div>
            
            <div className="ml-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Odds</div>
                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {typeof game.oas === 'number' ? `+${game.oas}` : '—'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Game Info */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Start Time</span>
              <span className="font-medium">{formatGameTime(game.start_time)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameCard;
