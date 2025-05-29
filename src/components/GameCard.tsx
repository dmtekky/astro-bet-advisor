import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatGameTime } from '@/utils/dateUtils';
import { Game } from '@/types';
import { Team } from '@/types';
import { Link } from 'react-router-dom';
import { GameOutcomePrediction, GamePredictionData } from '@/types/gamePredictions';

interface GameCardProps {
  game: Game & {
    astroEdge?: number;
    astroInfluence?: string;
    astroPrediction?: string | GameOutcomePrediction;
    homeEdge?: number;
    moonPhase?: string | { name: string; illumination: number };
    sunSign?: string;
    dominantElement?: string;
    confidence?: number;
    prediction?: GameOutcomePrediction;
  };
  astroData?: GamePredictionData | null;
  loading?: boolean;
  error?: Error | null;
  homeTeam?: Team & { primary_color?: string; secondary_color?: string };
  awayTeam?: Team & { primary_color?: string; secondary_color?: string };
  defaultLogo: string;
}

const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  astroData, 
  loading, 
  error, 
  homeTeam, 
  awayTeam, 
  defaultLogo 
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

  // Calculate a contrasting text color based on background
  const getContrastColor = (hexColor: string | undefined) => {
    if (!hexColor) return 'white';
    
    try {
      // Convert hex to RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      
      // Calculate luminance - standard formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return black or white based on luminance
      return luminance > 0.5 ? 'black' : 'white';
    } catch (e) {
      return 'white';
    }
  };

  // Get text color based on team's primary color
  const textColor = getContrastColor(homeTeam?.primary_color);

  // Extract prediction data
  const prediction = game.prediction || 
    (typeof game.astroPrediction === 'object' ? game.astroPrediction : null);
  
  // Get moon phase data
  const moonPhase = React.useMemo(() => {
    if (typeof game.moonPhase === 'object') {
      return {
        name: game.moonPhase.name,
        illumination: game.moonPhase.illumination
      };
    } else if (astroData?.moonPhase) {
      return {
        name: astroData.moonPhase.name,
        illumination: astroData.moonPhase.illumination
      };
    } else if (astroData?.moon?.phase_name) {
      return {
        name: astroData.moon.phase_name,
        illumination: astroData.moon.illumination || 0
      };
    }
    return null;
  }, [game.moonPhase, astroData]);

  // Get sun sign
  const sunSign = React.useMemo(() => {
    if (game.sunSign) return game.sunSign;
    if (astroData?.sun?.sign) return String(astroData.sun.sign);
    if (astroData?.planets?.sun?.sign) return String(astroData.planets.sun.sign);
    return '';
  }, [game.sunSign, astroData]);

  // Get dominant element
  const dominantElement = React.useMemo(() => {
    if (game.dominantElement) return game.dominantElement;
    if (prediction?.dominantElement) return prediction.dominantElement;
    if (astroData?.elements) {
      const elements = astroData.elements;
      const maxElement = Object.entries(elements).reduce((max, [key, value]) => 
        value.score > max.score ? { key, score: value.score } : max, 
        { key: '', score: -Infinity }
      );
      return maxElement.key || '';
    }
    return '';
  }, [game.dominantElement, prediction, astroData?.elements]);

  // Get confidence level
  const confidence = React.useMemo(() => {
    if (game.confidence !== undefined) return game.confidence;
    if (prediction?.confidence !== undefined) return prediction.confidence;
    return 0.5; // Default confidence
  }, [game.confidence, prediction?.confidence]);

  // Get prediction text
  const predictionText = React.useMemo(() => {
    if (typeof game.astroPrediction === 'string') return game.astroPrediction;
    if (prediction?.prediction) return prediction.prediction;
    if (game.astroInfluence) return game.astroInfluence;
    if (game.homeEdge !== undefined) {
      return `The cosmic alignment ${game.homeEdge > 0.5 ? 'favors the home team' : 
        game.homeEdge < 0.5 ? 'favors the away team' : 'shows a balanced matchup'}.`;
    }
    return 'No cosmic insights available for this game.';
  }, [game.astroPrediction, game.astroInfluence, game.homeEdge, prediction?.prediction]);

  // Calculate win probability
  const homeWinProbability = React.useMemo(() => {
    if (prediction?.homeWinProbability !== undefined) return prediction.homeWinProbability;
    if (game.homeEdge !== undefined) return game.homeEdge;
    return 0.5;
  }, [prediction?.homeWinProbability, game.homeEdge]);

  if (loading) {
    return (
      <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800/90 overflow-hidden">
        <div className="animate-pulse h-64 w-full"></div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800/90 overflow-hidden">
        <CardContent className="p-4 text-center text-red-500">
          Error loading game data
        </CardContent>
      </Card>
    );
  }

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
          <div className="relative flex justify-between items-center">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: textColor }}>
              {game.league_name || game.sport || 'Game'}
            </span>
            <span className="text-xs font-medium" style={{ color: textColor }}>
              {formatGameTime(game.start_time)}
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
              
              {/* Astrological Prediction */}
              {(prediction || game.astroPrediction || game.astroInfluence || game.homeEdge !== undefined) && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">✨ Cosmic Insight</span>
                    <div className="ml-auto flex items-center gap-1">
                      <div 
                        className="h-2.5 bg-gray-200 rounded-full overflow-hidden w-20"
                        title={`Cosmic edge: ${Math.round((homeWinProbability * 100))}% favoring ${homeWinProbability > 0.5 ? 'home' : 'away'} team`}
                      >
                        <div 
                          className={`h-full ${homeWinProbability > 0.5 ? 'bg-indigo-600' : 'bg-purple-600'} dark:bg-indigo-500`} 
                          style={{ 
                            width: `${Math.abs(homeWinProbability - 0.5) * 200}%`, 
                            marginLeft: homeWinProbability > 0.5 ? '50%' : '0' 
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {predictionText}
                  </p>
                  
                  {/* Additional astrological details */}
                  <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-gray-500">
                    <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 p-1 rounded">
                      <span className="text-indigo-500">☽</span>
                      <span>{moonPhase?.name || 'Moon Phase'}</span>
                      {moonPhase?.illumination !== undefined && (
                        <span className="text-[8px] opacity-75">
                          {Math.round(moonPhase.illumination * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 p-1 rounded">
                      <span className="text-orange-500">☉</span>
                      <span>{sunSign || 'Sun Sign'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 p-1 rounded">
                      <span className="text-purple-500">★</span>
                      <span className="capitalize">
                        {dominantElement || 'Elements'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Confidence indicator */}
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Cosmic Confidence:</span>
                    <div className="flex items-center">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-1">
                        <div 
                          className={`h-full ${
                            confidence > 0.75 
                              ? 'bg-green-500' 
                              : confidence > 0.6 
                                ? 'bg-blue-500' 
                                : 'bg-indigo-500'
                          }`} 
                          style={{ 
                            width: `${Math.round(confidence * 100)}%` 
                          }}
                        />
                      </div>
                      <span>{Math.round(confidence * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GameCard;
