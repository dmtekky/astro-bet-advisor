import React from 'react';
import { Game, Team } from "@/types/dashboard";
import { GameCard } from './GameCard';

// Carousel Component
type GameCarouselProps = {
  games: Array<Game & {
    astroEdge?: number;
    astroInfluence?: string;
    home_team: Team;
    away_team: Team;
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
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="relative w-full overflow-x-auto pb-6 px-4 scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out gap-8"
          style={{
            width: 'max-content',
            padding: '0 20px',
          }}
        >
          {games.map((game, index) => (
            <div 
              key={game.id} 
              className="flex-shrink-0 w-[336px]"
              ref={el => {
                if (index === 0) {
                  // @ts-ignore
                  carouselRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
                }
              }}
            >
              <div className="px-1">
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
      
      {/* Hidden Dots Indicator (kept for future use) */}
      <div className="hidden">
        {games.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {games.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollTo({
                      left: index * (336 + 32), // card width (336px) + gap (32px = 2rem)
                      behavior: 'smooth'
                    });
                  }
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-blue-600 w-6' 
                    : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
