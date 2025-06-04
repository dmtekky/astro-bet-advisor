import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getZodiacColorScheme, getZodiacSign } from '@/utils/zodiacUtils';
import { Zap, Sparkles, Star, Flame, Target, Award, Crown, Medal, Trophy } from 'lucide-react';

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

  // Fallback avatar component
  const FallbackAvatar = () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
      <span className="text-4xl font-bold text-white/80">
        {full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
      </span>
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
      className={`relative w-[211px] sm:w-[240px] md:w-[253px] h-[340px] sm:h-[437px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer group transition-all duration-300 flex-shrink-0
        ${isHighAstro 
          ? 'border-2 border-purple-500/50 hover:border-purple-500/80' 
          : isAboveAverage 
          ? 'border-2 border-green-500/30 hover:border-green-500/60' 
          : 'border border-gray-700/50 hover:border-gray-600/70'}
        hover:scale-[1.02] hover:shadow-xl`}
      style={{
        '--glow-color': showAstroBadge 
          ? 'rgba(74, 222, 128, 0.6)'
          : 'rgba(99, 102, 241, 0.1)',
        '--glow-size': showAstroBadge ? '40px' : '15px',
        boxShadow: showAstroBadge 
          ? '0 0 50px 8px rgba(74, 222, 128, 0.6)'
          : '0 10px 30px -10px rgba(0, 0, 0, 0.3)'
      } as React.CSSProperties}
    >
      {/* Background Glow Effect */}
      {showAstroBadge && (
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 0%, var(--glow-color), transparent 70%)',
            opacity: 0.8,
            filter: 'blur(35px)',
          }}
        />
      )}

      {/* Player Image Section - Reduced Height on Mobile */}
      <div className="relative w-full h-[200px] sm:h-[260px] bg-gray-800 overflow-hidden">
        {/* Cosmic Edge Badge - Smaller and Repositioned */}
        {showAstroBadge && (
          <motion.div 
            initial={{ x: -8, y: 0, opacity: 0, rotate: -15, scale: 0.9 }}
            animate={{ x: 0, y: 28, opacity: 1, rotate: -15, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute left-0 top-0 z-40 origin-bottom-left"
          >
            <div className="relative group">
              {/* Main Badge with Angled Edge */}
              <div className="relative">
                <div className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white text-[10px] font-extrabold tracking-wider pl-3 pr-4 py-1.5 flex items-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="h-3 w-3 mr-1.5 text-yellow-300" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-white">
                    COSMIC EDGE
                  </span>
                </div>
                {/* Angled Edge - Smaller */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-600 to-blue-500 transform -rotate-45 origin-bottom-right"></div>
              </div>
              
              {/* Glow Effect - Reduced */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-blue-500/50 blur-[2px] opacity-70 group-hover:opacity-90 transition duration-200 -z-10"></div>
              
              {/* Animated Sparkles - Smaller */}
              <div className="absolute -top-0.5 right-2 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping"></div>
              <div className="absolute -bottom-0.5 right-4 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </motion.div>
        )}
        
        {/* Zodiac Sign Pill - Moved slightly down */}
        {zodiacSign && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 bg-black/70 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10">
            {zodiacSign}
          </div>
        )}
        {headshot_url ? (
          <>
            <img
              src={headshot_url}
              alt={`${full_name} headshot`}
              className="object-cover w-full h-full"
              loading="lazy"
              onError={handleImageError}
            />
            <div className="hidden w-full h-full">
              <FallbackAvatar />
            </div>
          </>
        ) : (
          <FallbackAvatar />
        )}
        
        {/* Glow effect overlay */}
        <motion.div
          variants={{
            initial: { opacity: 0 },
            animate: { opacity: isHighAstro ? 0.5 : isAboveAverage ? 0.3 : 0 },
            hover: { opacity: isHighAstro ? 0.7 : isAboveAverage ? 0.5 : 0.2 }
          }}
          className="absolute inset-0 bg-gradient-to-t"
          style={{ 
            background: 'linear-gradient(to bottom, #4a6fa5, #4a6fa5)',
            mixBlendMode: 'screen'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 p-2 sm:p-3 md:p-4 flex flex-col bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
          <div className="mt-auto">
            <div className="relative flex mb-0.5 items-center justify-between">
              <span className="bg-black/60 text-xs font-medium py-0.5 px-2 rounded backdrop-blur-sm">
                {primary_position || 'N/A'}
              </span>
              {primary_number && (
                <div className="bg-black/80 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/20 backdrop-blur-sm">
                  {primary_number}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Content - Compact on mobile */}
      <div className="relative z-10 p-2 sm:p-3 md:p-4 mt-[-20px] sm:mt-[-30px]">
        {/* Player Name */}
        <div className="mb-1 sm:mb-2">
          <h3 className="text-sm sm:text-base md:text-lg font-bold truncate">{full_name}</h3>
        </div>

        {/* Stats Grid - Compact on mobile */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          {/* Impact Score */}
          <div className="bg-gray-800/50 rounded-lg p-1.5 sm:p-2 md:p-3 border border-gray-700/50">
            <div className="flex items-center text-[10px] sm:text-xs font-medium text-gray-400 mb-0.5 sm:mb-1">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 text-blue-400" />
              <span className="hidden xs:inline">IMPACT</span>
              <span className="xs:hidden">IMP</span>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {formattedImpactScore}
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-1 sm:h-1.5 mt-1 sm:mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                style={{ width: `${Math.min(100, Number(formattedImpactScore))}%` }}
              />
            </div>
          </div>

          {/* Astro Score */}
          <div className={`rounded-lg p-1.5 sm:p-2 md:p-3 border ${
            isHighAstro 
              ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30' 
              : 'bg-gray-800/50 border-gray-700/50'
          }`}>
            <div className="flex items-center text-[10px] sm:text-xs font-medium text-gray-400 mb-0.5 sm:mb-1">
              {getAstroIcon()}
              <span className="ml-0.5 sm:ml-1">ASTRO</span>
            </div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${
              isHighAstro 
                ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400' 
                : 'text-white'
            }`}>
              {formattedAstroInfluence}
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-1 sm:h-1.5 mt-1 sm:mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                style={{ width: `${Math.min(100, Number(formattedAstroInfluence))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Performance Indicator - Compact on mobile */}
        <div className="pt-1.5 sm:pt-2 border-t border-gray-700/50">
          <div className="flex justify-between items-center text-[10px] sm:text-xs">
            <span className="text-gray-400">PERF</span>
            <div className="flex items-center">
              {isHighAstro ? (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-medium text-[10px] sm:text-xs">
                    ELITE
                  </span>
                  <div className="ml-1 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
                </>
              ) : (
                <span className="text-gray-400 text-[10px] sm:text-xs">STANDARD</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCardNew;
