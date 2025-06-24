import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getZodiacColorScheme, getZodiacSign } from '@/utils/zodiacUtils';
import { Star, Crown, Medal, Trophy } from 'lucide-react';

export interface PlayerCardProps {
  id: string;
  player_id: string;
  full_name: string;
  headshot_url?: string | null;
  team_id?: string | null;
  birth_date?: string | null;
  primary_number?: string | number | null;
  primary_position?: string | null;
  impact_score?: number | null;
  astro_influence?: number | null;
  astro_influence_score?: number | null;
  teamAverageAstroInfluence?: number | null;
  linkPath?: string;
  className?: string;
}

// Threshold for high astro score (0-100 scale)
const HIGH_ASTRO_THRESHOLD = 75;

const PlayerCardNew: React.FC<PlayerCardProps> = ({
  id,
  player_id,
  full_name,
  headshot_url,
  birth_date,
  primary_number,
  primary_position,
  impact_score = 0,
  astro_influence = 0,
  astro_influence_score,
  teamAverageAstroInfluence = 0,
  linkPath,
  className,
}) => {
  // Get zodiac sign from birth date
  const zodiacSign = birth_date ? getZodiacSign(birth_date) : null;
  const colors = getZodiacColorScheme(zodiacSign);

  // Use astro_influence_score if available, otherwise fall back to astro_influence
  const effectiveAstroInfluence = astro_influence_score ?? astro_influence ?? 0;
  
  // Determine if player has high or above average astro influence
  const isHighAstro = effectiveAstroInfluence >= HIGH_ASTRO_THRESHOLD;
  const isAboveAverage = effectiveAstroInfluence >= 60 && effectiveAstroInfluence < HIGH_ASTRO_THRESHOLD;
  const showAstroBadge = isHighAstro || isAboveAverage;
  
  const navigate = useNavigate();
  
  // Handle card click to navigate to player details
  const handleCardClick = () => {
    if (linkPath) {
      navigate(linkPath);
    }
  };

  // Format scores with 1 decimal place
  const formattedImpactScore = (impact_score || 0).toFixed(1);
  const formattedAstroInfluence = effectiveAstroInfluence.toFixed(1);

  // Get the appropriate icon based on astro influence level
  const getAstroIcon = () => {
    if (effectiveAstroInfluence >= 90) return <Trophy className="h-4 w-4 text-yellow-400" />;
    if (effectiveAstroInfluence >= 80) return <Crown className="h-4 w-4 text-purple-400" />;
    if (effectiveAstroInfluence >= 70) return <Medal className="h-4 w-4 text-blue-400" />;
    return <Star className="h-4 w-4 text-gray-400" />;
  };

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      } 
    },
    hover: { 
      y: -8,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  // Fallback avatar component when no player image is available
  const FallbackAvatar = () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-30 h-30 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
        <span className="text-3xl font-bold text-white/90">
          {full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
        </span>
      </div>
    </div>
  );

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const fallback = target.nextSibling as HTMLElement;
    if (fallback) {
      fallback.classList.remove('hidden');
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onClick={handleCardClick}
      className={`relative w-[300px] sm:w-[330px] h-[540px] rounded-xl overflow-hidden bg-white cursor-pointer group transition-all duration-300 flex-shrink-0 shadow-sm
        ${isHighAstro 
          ? 'border border-purple-300 hover:border-purple-400 hover:shadow-purple-100' 
          : isAboveAverage 
          ? 'border border-blue-300 hover:border-blue-400 hover:shadow-blue-100' 
          : 'border border-gray-200 hover:border-gray-300 hover:shadow-gray-100'}
        hover:scale-[1.03] hover:shadow-lg ${className}`}
      aria-label={`Player card for ${full_name}`}
    >
      {/* ===== PLAYER IMAGE SECTION ===== */}
      <div className="relative w-full h-[360px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Player Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-1">
          {full_name && (
            <div className="text-left">
              <div 
                className="text-7xl font-normal tracking-tight leading-none font-['Anton']"
                style={{
                  background: 'linear-gradient(45deg, #4F46E5 0%, #7C3AED 25%, #EC4899 50%, #F59E0B 75%, #10B981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% auto',
                  animation: 'gradient 5s ease infinite',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                  lineHeight: '0.9',
                  letterSpacing: '-0.03em'
                }}
              >
                {full_name.split(' ')[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
        {/* Zodiac Sign Badge - Top Right */}
        {zodiacSign && (
          <div 
            className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-md text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border border-gray-100"
            aria-label={`Zodiac sign: ${zodiacSign}`}
          >
            {zodiacSign}
          </div>
        )}
        
        {/* COSMIC EDGE Badge - Top Left */}
        {showAstroBadge && (
          <div className="absolute top-2 left-2 z-10 flex items-center">
            <span className={`text-base animate-pulse ${isHighAstro ? 'text-purple-300' : 'text-blue-300'}`}>✧</span>
            <div 
              className={`px-2 py-1 rounded-md text-xs font-medium tracking-wider shadow-lg transform -rotate-2 mx-0.5
                ${isHighAstro 
                  ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white border border-purple-300' 
                  : 'bg-gradient-to-r from-blue-700 to-blue-500 text-white border border-blue-300'}`}
              aria-label="Cosmic Edge"
              style={{
                boxShadow: isHighAstro 
                  ? '0 2px 8px rgba(168, 85, 247, 0.4)' 
                  : '0 2px 8px rgba(59, 130, 246, 0.4)',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontSize: '0.7rem',
                lineHeight: '1'
              }}
            >
              COSMIC EDGE
            </div>
            <span className={`text-base animate-pulse ${isHighAstro ? 'text-purple-300' : 'text-blue-300'}`}>✧</span>
          </div>
        )}
        
        {/* Player Image with Hover Effect */}
        <div className="relative w-full h-full overflow-hidden bg-gray-100">
          {headshot_url ? (
            <>
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={headshot_url}
                  alt={`${full_name} headshot`}
                  className="min-w-full min-h-full w-auto h-auto object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  loading="lazy"
                  onError={handleImageError}
                  style={{
                    objectPosition: 'center 20%',
                  }}
                />
              </div>
              <div className="hidden w-full h-full">
                <FallbackAvatar />
              </div>
            </>
          ) : (
            <FallbackAvatar />
          )}
          
          {/* Subtle gradient overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>

      {/* ===== PLAYER INFO SECTION ===== */}
      <div className="p-4 bg-white">
        <div className="flex justify-between items-start">
          {full_name && full_name.split(' ').length > 1 && (
            <h3 
              className="text-[1.75rem] font-light font-['Anton'] tracking-wide text-gray-900"
              style={{
                marginTop: '-0.25rem',
                lineHeight: '1',
                letterSpacing: '0.05em',
                color: '#000000',
                fontWeight: 300
              }}
            >
              {full_name.split(' ').slice(1).join(' ').toUpperCase()}
            </h3>
          )}
          <div className="flex items-center space-x-2">
            {primary_position && (
              <span 
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap
                  ${isHighAstro 
                    ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                    : isAboveAverage 
                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                    : 'bg-gray-50 text-gray-700 border border-gray-100'}`}
                aria-label={`Position: ${primary_position}`}
              >
                {primary_position}
              </span>
            )}
            {primary_number && (
              <span 
                className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 whitespace-nowrap"
                aria-label={`Jersey number: ${primary_number}`}
              >
                #{primary_number}
              </span>
            )}
          </div>
        </div>

        {/* Impact Score Meter */}
        <div className="mt-2 mb-5">
          <div className="flex justify-between items-center text-xs mb-1">
            <div className="flex items-center">
              <span className="font-medium text-gray-600">Impact Score</span>
              <div className="ml-1.5 flex items-center">
                <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.329-.43-.616-.952-.84-1.466-.224-.514-.4-1.142-.46-1.946a1.01 1.01 0 00-.007-.14z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-gray-800">{formattedImpactScore}</span>
              <span className="text-gray-400 text-[10px] ml-1">/100</span>
            </div>
          </div>
          <div 
            className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden"
            role="meter"
            aria-valuenow={impact_score || 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Impact score: ${formattedImpactScore} out of 100`}
          >
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${Math.min(impact_score || 0, 100)}%`,
                background: `linear-gradient(90deg, 
                  hsl(120, 60%, 85%) 0%, 
                  hsl(120, 60%, 50%) 50%, 
                  hsl(120, 100%, 20%) 100%)`,
                backgroundSize: '200% 100%',
                backgroundPosition: `${100 - (impact_score || 0)}% 0%`
              }}
            />
          </div>

        </div>

        {/* Astro Influence Meter */}
        <div className="mb-5">
          <div className="flex justify-between items-center text-xs mb-1">
            <div className="flex items-center">
              <span className="font-medium text-gray-600">Astro Influence</span>
              <div className="ml-1.5 flex items-center">
                {getAstroIcon()}
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-bold text-gray-800">{formattedAstroInfluence}</span>
              <span className="text-gray-400 text-[10px] ml-1">/100</span>
            </div>
          </div>
          <div 
            className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden"
            role="meter"
            aria-valuenow={effectiveAstroInfluence}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Astro influence: ${formattedAstroInfluence} out of 100`}
          >
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out
                ${isHighAstro 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : isAboveAverage 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-400' 
                  : 'bg-gray-400'}`}
              style={{ width: `${Math.min(effectiveAstroInfluence, 100)}%` }}
            />
          </div>

        </div>
        

      </div>

      {/* ===== PERFORMANCE INDICATOR - ELITE ONLY ===== */}
      {impact_score && impact_score >= 80 && (
        <div 
          className="absolute bottom-0 left-0 right-0 pt-2 pb-2 px-4 border-t border-gray-100 bg-white/90 backdrop-blur-sm"
          aria-label="Elite performance indicator"
        >
          <div className="flex justify-between items-center text-[11px] sm:text-xs">
            <span className="text-gray-500 font-medium tracking-wide">PERFORMANCE</span>
            <div className="flex items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-bold">
                ELITE
              </span>
              <div 
                className="ml-1.5 w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PlayerCardNew;
