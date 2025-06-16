import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import type { Game, Team } from '@/types';

// Type definitions for color handling
type ColorValue = string | { hex?: string; r?: number; g?: number; b?: number } | undefined;
type RGB = { r: number; g: number; b: number };

// Extended Team type with required properties for GameCard
interface GameTeam {
  id: string;
  name: string;
  abbreviation: string;
  sport: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  logo: string;
  record: string;
  external_id?: string | number;
  city?: string;
}

interface GameCardProps {
  game: Partial<Game> & { id: string; start_time?: string };
  homeTeam?: Partial<GameTeam>;
  awayTeam?: Partial<GameTeam>;
  defaultLogo?: string;
  children?: React.ReactNode;
}

// Default team data when team is not provided
const DEFAULT_TEAM: GameTeam = {
  id: 'unknown',
  name: 'Team',
  abbreviation: 'TBD',
  sport: 'mlb',
  record: '0-0',
  primary_color: '#1E40AF',
  secondary_color: '#FFFFFF',
  logo_url: '',
  logo: '',
};

// Converts various color formats to RGB
const parseColor = (color: ColorValue): RGB | null => {
  if (!color) return null;

  // Handle hex colors (string starting with #)
  if (typeof color === 'string' && color.startsWith('#')) {
    const hex = color.replace('#', '');
    const bigint = parseInt(hex, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  // Handle RGB object
  if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
    return {
      r: color.r ?? 0,
      g: color.g ?? 0,
      b: color.b ?? 0
    };
  }

  // Handle hex in object
  if (typeof color === 'object' && 'hex' in color && color.hex) {
    return parseColor(color.hex);
  }

  return null;
};

// Calculates brightness of a color (0-255)
const getBrightness = (r: number, g: number, b: number): number => {
  return (r * 299 + g * 587 + b * 114) / 1000;
};

// Determines if text should be light or dark based on background color
const getTextColor = (bgColor: ColorValue): string => {
  const rgb = parseColor(bgColor);
  if (!rgb) return '#FFFFFF';
  
  const brightness = getBrightness(rgb.r, rgb.g, rgb.b);
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

// Generates a box shadow based on team color
const getBoxShadow = (color: ColorValue): string => {
  const defaultShadow = '0 4px 12px -2px rgba(30, 64, 175, 0.2)';
  const rgb = parseColor(color);
  
  if (!rgb) return defaultShadow;
  
  return `0 4px 12px -2px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
};

// Helper function to format game time
const formatGameTime = (dateString?: string): string => {
  try {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC' 
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'TBD';
  }
};

const GameCard: React.FC<GameCardProps> = ({
  game,
  homeTeam: propHomeTeam = {
    abbreviation: 'TBD',
    sport: 'basketball_nba',
    name: 'Team',
    id: 'unknown',
  },
  awayTeam: propAwayTeam = {
    abbreviation: 'TBD',
    sport: 'basketball_nba',
    name: 'Team',
    id: 'unknown',
  },
  defaultLogo = '',
  children
}) => {
  // Ensure we have valid team objects with defaults
  const homeTeam: GameTeam = { ...DEFAULT_TEAM, ...propHomeTeam };
  const awayTeam: GameTeam = { ...DEFAULT_TEAM, ...propAwayTeam };
  
  // Set default logo if not provided
  if (!homeTeam.logo_url && !homeTeam.logo) homeTeam.logo_url = defaultLogo;
  if (!awayTeam.logo_url && !awayTeam.logo) awayTeam.logo_url = defaultLogo;

  // Create display names with fallbacks
  const homeTeamName = homeTeam.city 
    ? `${homeTeam.city} ${homeTeam.name}`.trim()
    : homeTeam.name;
    
  const awayTeamName = awayTeam.city 
    ? `${awayTeam.city} ${awayTeam.name}`.trim()
    : awayTeam.name;
    
  // Get box shadow colors with fallbacks
  const homeBoxShadow = getBoxShadow(homeTeam.primary_color);
  const awayBoxShadow = getBoxShadow(awayTeam.primary_color);

  // Get team colors with fallbacks
  const homeTeamColor = homeTeam.primary_color || DEFAULT_TEAM.primary_color!;
  const awayTeamColor = awayTeam.primary_color || DEFAULT_TEAM.primary_color!;
  const homeTextColor = getTextColor(homeTeamColor);
  const awayTextColor = getTextColor(awayTeamColor);
  
  // Format game time
  const gameTime = formatGameTime(game.start_time);
  
  // Debug log for team data (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.debug('GameCard rendering:', {
      gameId: game?.id || 'unknown',
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        logo: homeTeam.logo_url || homeTeam.logo,
        colors: {
          primary: homeTeam.primary_color,
          secondary: homeTeam.secondary_color,
          text: homeTextColor
        }
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        logo: awayTeam.logo_url || awayTeam.logo,
        colors: {
          primary: awayTeam.primary_color,
          secondary: awayTeam.secondary_color,
          text: awayTextColor
        }
      },
      gameTime: game?.start_time ? new Date(game.start_time).toISOString() : 'TBD'
    });
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-600">
      <Link to={`/game/${game.id}`} className="block h-full">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Home Team */}
            {homeTeam ? (
              <div 
                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 p-1 shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <img 
                      src={homeTeam.logo_url || defaultLogo} 
                      alt={homeTeam.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultLogo;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                      {homeTeam.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{homeTeam.record || '0-0'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 text-center">
                    {game.home_score !== undefined && (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {game.home_score}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center ml-4">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Home</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 text-center text-gray-500">
                Home team information not available
              </div>
            )}

            {/* VS Divider */}
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 py-1 bg-white dark:bg-gray-900 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full">
                  VS
                </span>
              </div>
            </div>

            {/* Away Team */}
            {awayTeam ? (
              <div 
                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 p-1 shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <img 
                      src={awayTeam.logo_url || defaultLogo} 
                      alt={awayTeam.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultLogo;
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                      {awayTeam.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{awayTeam.record || '0-0'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 text-center">
                    {game.away_score !== undefined && (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {game.away_score}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center ml-4">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-300">Away</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 text-center text-gray-500">
                Away team information not available
              </div>
            )}
            {/* Game Info */}
            <div className="mt-6 pt-4 border-t-2 border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold">Start Time</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{formatGameTime(game.start_time)}</span>
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
          {children}
        </CardContent>
      </Link>
    </Card>
  );
};

// Prop type validation - using any type for game prop to avoid TypeScript conflicts
// with the complex Game type from @/types
GameCard.propTypes = {
  game: PropTypes.any.isRequired, // eslint-disable-line @typescript-eslint/no-explicit-any
  homeTeam: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    city: PropTypes.string,
    logo_url: PropTypes.string,
    logo: PropTypes.string,
    primary_color: PropTypes.string,
    secondary_color: PropTypes.string,
    record: PropTypes.string,
    abbreviation: PropTypes.string,
    sport: PropTypes.string,
  }),
  awayTeam: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    city: PropTypes.string,
    logo_url: PropTypes.string,
    logo: PropTypes.string,
    primary_color: PropTypes.string,
    secondary_color: PropTypes.string,
    record: PropTypes.string,
    abbreviation: PropTypes.string,
    sport: PropTypes.string,
  }),
  defaultLogo: PropTypes.string,
};

export default React.memo(GameCard);
