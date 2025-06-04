import React, { useState, useRef, useEffect } from 'react';
import { Game, Team } from "@/types/dashboard";
import { GameCard } from './GameCard';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useWindowSize } from '@/hooks/useWindowSize';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const windowSize = useWindowSize();

  // Calculate card width based on screen size
  const getCardWidth = () => {
    if (!windowSize.width) return 336; // Default width
    if (windowSize.width < 640) return windowSize.width * 0.85; // Full width on mobile
    if (windowSize.width < 1024) return windowSize.width * 0.5 - 32; // 2 cards on tablet
    return 336; // 3 cards on desktop
  };

  const [cardWidth, setCardWidth] = useState(getCardWidth());
  const gap = windowSize.width < 640 ? 16 : 32; // Smaller gap on mobile

  // Update card width when window resizes
  useEffect(() => {
    setCardWidth(getCardWidth());
  }, [windowSize.width]);

  // Handle drag end with momentum
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // If we're not dragging enough, snap back to the current position
    if (Math.abs(info.offset.x) < cardWidth * 0.2) {
      controls.start({ x: -currentIndex * (cardWidth + gap), transition: { type: 'spring', bounce: 0.3 } });
      return;
    }

    // Determine direction of swipe
    const direction = info.offset.x < 0 ? 1 : -1;
    let newIndex = currentIndex + direction;

    // Ensure we don't go out of bounds
    newIndex = Math.max(0, Math.min(newIndex, games.length - 1));

    // Update current index and animate to the new position
    setCurrentIndex(newIndex);
    controls.start({ 
      x: -newIndex * (cardWidth + gap),
      transition: { 
        type: 'spring',
        damping: 30,
        stiffness: 300,
        mass: 0.5
      } 
    });
  };

  // Handle touch start to improve responsiveness
  const handleTouchStart = () => {
    setIsDragging(true);
  };

  // Handle touch move to prevent page scroll when swiping
  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  // Add/remove touch move event listener
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
      return () => {
        carousel.removeEventListener('touchmove', handleTouchMove as EventListener);
      };
    }
  }, [isDragging]);

  // Handle window resize
  useEffect(() => {
    controls.start({ x: -currentIndex * (cardWidth + gap) });
  }, [cardWidth, gap, currentIndex, controls]);

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No upcoming games scheduled
      </div>
    );
  }

  // Calculate the total width of the carousel content
  const contentWidth = games.length * (cardWidth + gap) - gap;

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <motion.div 
        ref={carouselRef}
        className="w-full py-4 px-4"
        drag="x"
        dragConstraints={{
          left: -contentWidth + cardWidth,
          right: 0,
        }}
        onDragStart={handleTouchStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        dragElastic={0.1}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <motion.div 
          className="flex"
          style={{
            width: contentWidth,
            gap: `${gap}px`,
          }}
        >
          {games.map((game, index) => (
            <motion.div 
              key={game.id} 
              className="flex-shrink-0"
              style={{
                width: cardWidth,
                scale: currentIndex === index ? 1 : 0.95,
                opacity: currentIndex === index ? 1 : 0.8,
                transition: 'all 0.3s ease',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <GameCard
                game={game}
                homeTeam={game.home_team}
                awayTeam={game.away_team}
                defaultLogo={defaultLogo}
                className="w-full h-full"
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicators */}
      {games.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {games.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                controls.start({ 
                  x: -index * (cardWidth + gap),
                  transition: { 
                    type: 'spring',
                    damping: 30,
                    stiffness: 300,
                    mass: 0.5
                  } 
                });
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-blue-600 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
