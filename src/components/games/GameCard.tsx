import React from 'react';
import { format } from 'date-fns';
import { Clock, Zap, Star, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Team, Game } from "@/types/dashboard";

interface GameCardProps {
  game: Game & {
    astroEdge?: number;
    astroInfluence?: string;
  };
  homeTeam: Team;
  awayTeam: Team;
  defaultLogo: string;
  className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  homeTeam,
  awayTeam,
  defaultLogo,
  className = '',
}) => {
  // Debug: Log the actual date/time values passed to this card
  console.log('GameCard game_date:', game.game_date, 'game_time_utc:', game.game_time_utc, 'full game:', game);

  // Safely parse the date with validation
  let gameDate: Date;
  try {
    // Use game_date as a full ISO string if present
    if (game.game_date) {
      gameDate = new Date(game.game_date);
    } else if (game.game_time_utc) {
      gameDate = new Date(game.game_time_utc);
    } else if (game.updated_at) {
      gameDate = new Date(game.updated_at);
    } else {
      gameDate = new Date();
    }
    // Final check if the date is valid
    if (isNaN(gameDate.getTime())) {
      console.warn('Invalid game date, using current date as fallback');
      gameDate = new Date();
    }
  } catch (error) {
    console.error('Error parsing game date:', error);
    gameDate = new Date();
  }
  const isLive = game.status === 'in_progress' || game.status === 'in-progress';
  const homePrimaryColor = homeTeam.primary_color || '#6366f1';
  const awayPrimaryColor = awayTeam.primary_color || '#8b5cf6';
  
  // Get team logo or fallback to default
  const getTeamLogo = (team: Team) => {
    if (team.logo_url) return team.logo_url;
    if (team.logo) return team.logo;
    return defaultLogo;
  };

  // Get team record string
  const getTeamRecord = (team: Team): string => {
    if (team.record) return team.record;
    if (team.wins !== undefined && team.losses !== undefined) {
      return `${team.wins}-${team.losses}`;
    }
    return '';
  };

  // Format the game time with validation and timezone handling
  const formatGameTime = (date: Date) => {
    try {
      // Validate date before formatting
      if (isNaN(date.getTime())) {
        return (
          <div className="flex flex-col items-center">
            <div className="text-sm font-medium">TBD</div>
            <div className="text-xs text-muted-foreground">--</div>
          </div>
        );
      }
      
      // Create a date string in the user's local timezone
      const localDate = new Date(date);
      
      // Format the time in 12-hour format with AM/PM
      const timeString = localDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Format the date as "MMM d" (e.g., "May 28")
      const dateString = localDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      return (
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium">{timeString}</div>
          <div className="text-xs text-muted-foreground">{dateString}</div>
        </div>
      );
    } catch (error) {
      console.error('Error formatting game time:', error);
      return (
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium">TBD</div>
          <div className="text-xs text-muted-foreground">--</div>
        </div>
      );
    }
  };

  return (
    <Card className={`w-[360px] flex-shrink-0 bg-white border border-gray-200 hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}>
      {/* Game Status Bar */}
      <div 
        className={`h-1 w-full ${isLive ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
      ></div>
      
      <CardContent className="p-4">
        {/* Game Date & Status */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-600">
              {isNaN(gameDate.getTime()) ? 'Date TBD' : format(gameDate, 'EEE, MMM d')}
            </span>
          </div>
          {isLive ? (
            <Badge variant="destructive" className="h-5 text-[10px] px-1.5 animate-pulse">
              LIVE
            </Badge>
          ) : (
            <span className="text-gray-700">
              {formatGameTime(gameDate)}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center w-2/5">
            <div className="relative group">
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at center, ${homePrimaryColor}15, transparent 70%)`,
                }}
              />
              <img
                src={getTeamLogo(homeTeam)}
                alt={homeTeam.name}
                className="relative z-10 w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultLogo;
                }}
              />
            </div>
            <span className="font-semibold text-center mt-1 text-sm text-gray-800 truncate w-full px-1">
              {homeTeam.name}
            </span>
            {getTeamRecord(homeTeam) && (
              <span className="text-xs text-gray-500">
                {getTeamRecord(homeTeam)}
              </span>
            )}
          </div>

          {/* Game Info */}
          <div className="flex flex-col items-center px-2">
            <div className="text-4xl font-black text-gray-800 mb-2">
              VS
            </div>
            {game.venue?.name && (
              <div className="mt-2 text-xs text-center text-gray-500 max-w-[120px] truncate">
                {game.venue.name}
              </div>
            )}
            
            {/* Add vertical spacing */}
            <div className="h-12"></div>
            
            {game.astroInfluence && (
              <div className="mt-2">
                <Badge 
                  variant="outline" 
                  className="h-6 text-xs px-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 whitespace-nowrap"
                >
                  <Star className="w-3 h-3 mr-1 text-purple-500" />
                  {game.astroInfluence}
                </Badge>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center w-2/5">
            <div className="relative group">
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at center, ${awayPrimaryColor}15, transparent 70%)`,
                }}
              />
              <img
                src={getTeamLogo(awayTeam)}
                alt={awayTeam.name}
                className="relative z-10 w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultLogo;
                }}
              />
            </div>
            <span className="font-semibold text-center mt-1 text-sm text-gray-800 truncate w-full px-1">
              {awayTeam.name}
            </span>
            {getTeamRecord(awayTeam) && (
              <span className="text-xs text-gray-500">
                {getTeamRecord(awayTeam)}
              </span>
            )}
          </div>
        </div>

        {/* Odds & Additional Info */}
        {(game.odds && game.odds.length > 0) && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                {game.odds[0]?.market || 'Odds'}: {game.odds[0]?.outcome} {game.odds[0]?.price > 0 ? '+' : ''}{game.odds[0]?.price}
              </span>
              {game.astroEdge && (
                <Badge variant="secondary" className="h-6 text-xs px-2 bg-blue-50 text-blue-700 border-blue-200">
                  ⚡ {game.astroEdge.toFixed(1)}% Edge
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Carousel Component
type GameCarouselProps = {
  games: Array<{
    id: string;
    home_team: Team;
    away_team: Team;
    [key: string]: any;
  }>;
  defaultLogo: string;
  className?: string;
};

export const GameCarousel: React.FC<GameCarouselProps> = ({ 
  games, 
  defaultLogo, 
  className = '' 
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState(0);
  const [touchEnd, setTouchEnd] = React.useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  // Number of cards to show based on screen size
  const [cardsToShow, setCardsToShow] = React.useState(3);

  React.useEffect(() => {
    const updateCardsToShow = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          setCardsToShow(1);
        } else if (window.innerWidth < 1024) {
          setCardsToShow(2);
        } else {
          setCardsToShow(3);
        }
      }
    };

    // Set initial value
    updateCardsToShow();

    // Add event listener
    window.addEventListener('resize', updateCardsToShow);

    // Clean up
    return () => window.removeEventListener('resize', updateCardsToShow);
  }, []);

  const visibleGames = games.slice(currentIndex, currentIndex + cardsToShow);
  const canGoNext = currentIndex < games.length - cardsToShow;
  const canGoPrev = currentIndex > 0;

  const next = () => {
    if (canGoNext) {
      setCurrentIndex(prev => Math.min(prev + 1, games.length - cardsToShow));
    }
  };

  const prev = () => {
    if (canGoPrev) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      next();
    }
    if (touchStart - touchEnd < -50) {
      prev();
    }
  };

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No upcoming games scheduled
      </div>
    );
  }


  return (
    <div className={`relative ${className}`}>
      {/* Navigation Arrows */}
      {games.length > cardsToShow && (
        <>
          <button
            onClick={prev}
            disabled={!canGoPrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all`}
            aria-label="Previous games"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            disabled={!canGoNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all`}
            aria-label="Next games"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}
      
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="relative w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / cardsToShow)}%)`,
            width: `${(games.length / cardsToShow) * 100}%`
          }}
        >
          {games.map((game) => (
            <div 
              key={game.id} 
              className="flex-shrink-0"
              style={{ width: `${100 / cardsToShow}%` }}
            >
              <div className="px-2">
                <GameCard
                  game={game}
                  homeTeam={game.home_team}
                  awayTeam={game.away_team}
                  defaultLogo={defaultLogo}
                  className="mx-auto"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots Indicator */}
      {games.length > cardsToShow && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil(games.length / cardsToShow) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * cardsToShow)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === Math.floor(currentIndex / cardsToShow) 
                  ? 'bg-blue-600 w-6' 
                  : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
