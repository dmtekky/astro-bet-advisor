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
    <Link 
      to={`/game/${game.id}`}
      state={{ game }}
      className="block h-full hover:no-underline focus:outline-none"
    >
      <Card 
        className="h-full border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800/90 overflow-hidden hover:shadow-xl transition-all duration-300 group"
        style={{
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: homeTeam?.primary_color || '#1E40AF',
          borderRadius: '0.75rem',
          boxShadow: `0 4px 12px -2px rgba(${parseInt(homeTeam?.primary_color?.slice(1, 3) || '30', 16)}, ${parseInt(homeTeam?.primary_color?.slice(3, 5) || '64', 16)}, ${parseInt(homeTeam?.primary_color?.slice(5, 7) || '175', 16)}, 0.15)`,
          background: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        {/* Header with gradient */}
        <div 
          className="relative px-4 py-2 border-b overflow-hidden"
          style={{
            background: `linear-gradient(to right, ${homeTeam?.primary_color || '#1E40AF'}, ${homeTeam?.secondary_color || '#3B82F6'})`
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
          <div className="relative">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: homeTextColor }}>
              {game.league_name || game.sport || 'Game'}
            </span>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="p-4 space-y-4">
            {/* Home Team */}
            {homeTeam ? (
              <div 
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 shadow-inner"
                style={{ boxShadow: homeBoxShadow }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" 
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, white, #f5f5f5)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)'
                    }}
                  >
                    {homeTeam.logo_url || homeTeam.logo ? (
                      <img 
                        src={homeTeam.logo_url || homeTeam.logo} 
                        alt={`${homeTeam.name || 'Home Team'} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('Failed to load home team logo:', {
                            teamId: homeTeam.id,
                            teamName: homeTeam.name,
                            logoUrl: homeTeam.logo_url,
                            logo: homeTeam.logo,
                            defaultLogo: defaultLogo,
                            currentSrc: target.currentSrc
                          });
                          // Use the default SVG logo as fallback
                          target.src = defaultLogo;
                        }}
                      />
                    ) : (
                      // Use the default SVG directly if no logo is set
                      <img 
                        src={defaultLogo} 
                        alt="Default team logo"
                        className="w-8 h-8 object-contain"
                      />
                    )}
                  </div>
                  <div className="ml-3 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{homeTeam.name || 'Home Team'}</h4>
                    <p className="text-xs text-gray-500">{homeTeam.record || '0-0'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    Home
                  </span>
                  {game.home_score !== undefined && (
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
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
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative px-2 bg-white dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400">
                VS
              </div>
            </div>

            {/* Away Team */}
            {awayTeam ? (
              <div 
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 shadow-inner"
                style={{ boxShadow: awayBoxShadow }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" 
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, white, #f5f5f5)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9)'
                    }}
                  >
                    {awayTeam.logo_url || awayTeam.logo ? (
                      <img 
                        src={awayTeam.logo_url || awayTeam.logo} 
                        alt={`${awayTeam.name || 'Away Team'} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error('Failed to load away team logo:', {
                            teamId: awayTeam.id,
                            teamName: awayTeam.name,
                            logoUrl: awayTeam.logo_url,
                            logo: awayTeam.logo,
                            defaultLogo: defaultLogo,
                            currentSrc: target.currentSrc
                          });
                          // Use the default SVG logo as fallback
                          target.src = defaultLogo;
                        }}
                      />
                    ) : (
                      // Use the default SVG directly if no logo is set
                      <img 
                        src={defaultLogo} 
                        alt="Default team logo"
                        className="w-8 h-8 object-contain"
                      />
                    )}
                  </div>
                  <div className="ml-3 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{awayTeam.name || 'Away Team'}</h4>
                    <p className="text-xs text-gray-500">{awayTeam.record || '0-0'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                    Away
                  </span>
                  {game.away_score !== undefined && (
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
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
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Start Time</span>
                <span className="font-medium">{formatGameTime(game.start_time)}</span>
              </div>
              
              {/* Game Status */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {game.status === 'scheduled' ? 'Upcoming' : 
                     game.status === 'in_progress' ? 'Live' : 
                     game.status === 'final' ? 'Final' : 
                     game.status?.replace('_', ' ').toLowerCase() || 'Scheduled'}
                  </span>
                </div>
                {game.venue && (
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Venue</span>
                    <span className="font-medium">{game.venue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GameCard;
