import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import type { Game } from '@/types';
import type { Team } from '@/types';

interface GameCardProps {
  game: Game;
  homeTeam: Team & { primary_color?: string; secondary_color?: string };
  awayTeam: Team & { primary_color?: string; secondary_color?: string };
  defaultLogo?: string;
}

// Helper function to format game time
const formatGameTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'TBD';
  }
};

const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  homeTeam, 
  awayTeam, 
  defaultLogo = '' 
}) => {
  const getBoxShadow = (color: any) => {
    // Default shadow (blue)
    const defaultShadow = '0 4px 12px -2px rgba(30, 64, 175, 0.2)';
    
    // If color is null/undefined, return default
    if (!color) {
      return defaultShadow;
    }
    
    // If color is an object, try to get the hex value
    let hexColor;
    if (typeof color === 'object') {
      // If it has a hex property
      if (color.hex) {
        hexColor = color.hex;
      } 
      // If it has rgb properties
      else if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
        return `0 4px 12px -2px rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`;
      }
      // If it's an object but we don't know how to handle it
      else {
        return defaultShadow;
      }
    } 
    // If it's already a string
    else if (typeof color === 'string') {
      // If it's a hex color
      if (color.startsWith('#')) {
        hexColor = color;
      } 
      // If it's an rgb/rgba string
      else if (color.startsWith('rgb')) {
        const rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
          return `0 4px 12px -2px rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, 0.2)`;
        }
      }
      // If it's some other string we don't recognize
      return defaultShadow;
    }
    
    // If we have a hex color, parse it
    if (hexColor) {
      try {
        // Remove # if present
        const hex = hexColor.replace('#', '');
        // Parse the hex color (supports both 3 and 6 digit hex)
        const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
        const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
        const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
        
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return `0 4px 12px -2px rgba(${r}, ${g}, ${b}, 0.2)`;
        }
      } catch (e) {
        console.error('Error parsing color:', color, e);
      }
    }
    
    // Fallback to default if anything goes wrong
    return defaultShadow;
  };
  // Create display names with fallbacks
  const homeTeamName = homeTeam?.city 
    ? `${homeTeam.city} ${homeTeam.name || ''}`.trim()
    : homeTeam?.name || 'Home Team';
    
  const awayTeamName = awayTeam?.city 
    ? `${awayTeam.city} ${awayTeam.name || ''}`.trim()
    : awayTeam?.name || 'Away Team';
    
  // Create safe team objects with defaults
  const safeHomeTeam = homeTeam || {
    name: 'Home Team',
    logo_url: defaultLogo,
    record: '0-0',
    primary_color: undefined,
    secondary_color: undefined
  };
  
  const safeAwayTeam = awayTeam || {
    name: 'Away Team',
    logo_url: defaultLogo,
    record: '0-0',
    primary_color: undefined,
    secondary_color: undefined
  };

  // Get box shadow colors with fallbacks
  const homeBoxShadow = getBoxShadow(safeHomeTeam.primary_color);
  const awayBoxShadow = getBoxShadow(safeAwayTeam.primary_color);

  // Get game time
  const gameTime = React.useMemo(() => {
    try {
      if (!game.start_time) return 'TBD';
      const date = new Date(game.start_time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting game time:', e);
      return 'TBD';
    }
  }, [game.start_time]);

  // Calculate text color based on background brightness
  const getTextColor = (bgColor: string | undefined) => {
    // Default to white text
    if (!bgColor) return '#FFFFFF';
    
    try {
      // Convert hex to RGB
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Calculate brightness (perceived luminance)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#FFFFFF';
    } catch (e) {
      console.error('Error calculating text color:', e);
      return '#FFFFFF';
    }
  };
  
  // Get team colors with fallbacks
  const homeTeamColor = homeTeam?.primary_color || '#1E40AF';
  const awayTeamColor = awayTeam?.primary_color || '#1E40AF';
  const homeTextColor = getTextColor(homeTeamColor);
  const awayTextColor = getTextColor(awayTeamColor);
  
  // Debug log for team data
  console.log('GameCard rendering:', {
    gameId: game.id,
    homeTeam: {
      id: homeTeam?.id,
      name: homeTeam?.name,
      logo: homeTeam?.logo_url || homeTeam?.logo,
      colors: {
        primary: homeTeam?.primary_color,
        secondary: homeTeam?.secondary_color,
        text: homeTextColor
      }
    },
    awayTeam: {
      id: awayTeam?.id,
      name: awayTeam?.name,
      logo: awayTeam?.logo_url || awayTeam?.logo,
      colors: {
        primary: awayTeam?.primary_color,
        secondary: awayTeam?.secondary_color,
        text: awayTextColor
      }
    },
    gameTime: game.start_time ? new Date(game.start_time).toLocaleString() : 'TBD'
  });

  return (
    <Link to={`/game/${game.id}`} className="block">
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-800/30 h-full flex flex-col">
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="p-2 sm:p-3 md:p-4 flex-1 flex flex-col">
            {/* Home Team */}
            {homeTeam ? (
              <div 
                className="flex justify-between items-center mb-2 sm:mb-3"
              >
                <div className="flex items-center min-w-0">
                  <div 
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0"
                  >
                    <img 
                      src={homeTeam.logo_url || defaultLogo} 
                      alt={homeTeam.name} 
                      className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultLogo;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm truncate text-gray-900 dark:text-white">
                      {homeTeam.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500">{homeTeam.record || '0-0'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 whitespace-nowrap">
                    Home
                  </span>
                  {game.home_score !== undefined && (
                    <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      {game.home_score}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 text-center text-gray-500">
                Home team information not available
              </div>
            )}

            {/* VS Divider */}
            <div className="relative flex justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
              </div>
              <div className="relative px-2 bg-white dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400">
                VS
              </div>
            </div>

            {/* Away Team */}
            {awayTeam ? (
              <div 
                className="flex justify-between items-center mt-2 sm:mt-3"
              >
                <div className="flex items-center min-w-0">
                  <div 
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-1.5 sm:mr-2 flex-shrink-0"
                  >
                    <img 
                      src={awayTeam.logo_url || defaultLogo} 
                      alt={awayTeam.name} 
                      className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultLogo;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm truncate text-gray-900 dark:text-white">
                      {awayTeam.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500">{awayTeam.record || '0-0'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 whitespace-nowrap">
                    Away
                  </span>
                  {game.away_score !== undefined && (
                    <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      {game.away_score}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 text-center text-gray-500">
                Away team information not available
              </div>
            )}
            {/* Game Info */}
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                <span>Start</span>
                <span className="font-medium">{formatGameTime(game.start_time)}</span>
              </div>
              
              {/* Game Status */}
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Status</span>
                  <span className="font-medium text-green-600 dark:text-green-400 text-[10px] sm:text-xs">
                    {game.status === 'scheduled' ? 'Upcoming' : 
                     game.status === 'in_progress' ? 'Live' : 
                     game.status === 'final' ? 'Final' : 
                     game.status?.replace('_', ' ').toLowerCase() || 'Scheduled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GameCard;
