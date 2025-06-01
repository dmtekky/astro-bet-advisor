import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      className={`relative w-72 h-[550px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer group
        ${isHighAstro 
          ? 'border-2 border-purple-500/50' 
          : isAboveAverage 
          ? 'border-2 border-green-500/30' 
          : 'border border-gray-700/50'}`}
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

      {/* Player Image Section - Full Height */}
      <div className="relative w-full h-[380px] bg-gray-800 overflow-hidden">
        {/* Cosmic Edge Badge */}
        {showAstroBadge && (
          <motion.div 
            initial={{ x: -10, y: 0, opacity: 0, rotate: -15 }}
            animate={{ x: 0, y: 16, opacity: 1, rotate: -15 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute left-0 top-0 z-50 origin-bottom-left"
          >
            <div className="relative group">
              {/* Main Badge with Angled Edge */}
              <div className="relative">
                <div className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white text-xs font-extrabold tracking-wider pl-5 pr-6 py-2 flex items-center shadow-xl shadow-indigo-500/40">
                  <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-300" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-white">
                    COSMIC EDGE
                  </span>
                </div>
                {/* Angled Edge */}
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-500 transform -rotate-45 origin-bottom-right"></div>
              </div>
              
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 blur opacity-70 group-hover:opacity-90 transition duration-200 -z-10"></div>
              
              {/* Animated Sparkles */}
              <div className="absolute -top-1 right-3 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 right-7 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </motion.div>
        )}
        
        {/* Zodiac Sign Pill */}
        {zodiacSign && (
          <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
            {zodiacSign}
          </div>
        )}
        {headshot_url ? (
          <>
            <img
              src={headshot_url}
              alt={`${full_name} headshot`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{
                objectPosition: 'center 10%',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={handleImageError}
            />
            <div className="hidden w-full h-full">
              <FallbackAvatar />
            </div>
          </>
        ) : (
          <FallbackAvatar />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent" />
        
        {/* Player Badges */}
        <div className="absolute bottom-3 right-4 flex flex-col items-end space-y-2">
          {/* Player Number */}
          {primary_number && (
            <div className="bg-black/80 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/20 backdrop-blur-sm">
              {primary_number}
            </div>
          )}
          
          {/* Position Badge */}
          {primary_position && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              {primary_position}
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-5 mt-[-40px]">
        {/* Player Name */}
        <div className="mb-2">
          <h3 className="text-xl font-bold text-white truncate">
            {full_name || 'Player Name'}
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Impact Score */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center text-xs font-medium text-gray-400 mb-1">
              <Zap className="w-3 h-3 mr-1.5 text-blue-400" />
              IMPACT
            </div>
            <div className="text-2xl font-bold text-white">
              {formattedImpactScore}
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                style={{ width: `${Math.min(100, Number(formattedImpactScore))}%` }}
              />
            </div>
          </div>

          {/* Astro Score */}
          <div className={`rounded-lg p-3 border ${
            isHighAstro 
              ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30' 
              : 'bg-gray-800/50 border-gray-700/50'
          }`}>
            <div className="flex items-center text-xs font-medium text-gray-400 mb-1">
              {getAstroIcon()}
              <span className="ml-1">ASTRO</span>
            </div>
            <div className={`text-2xl font-bold ${
              isHighAstro 
                ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400' 
                : 'text-white'
            }`}>
              {formattedAstroInfluence}
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" 
                style={{ width: `${Math.min(100, Number(formattedAstroInfluence))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="pt-3 border-t border-gray-700/50">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">PERFORMANCE</span>
            <div className="flex items-center">
              {isHighAstro ? (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-medium">
                    ELITE
                  </span>
                  <div className="ml-2 w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
                </>
              ) : (
                <span className="text-gray-400">STANDARD</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCardNew;
