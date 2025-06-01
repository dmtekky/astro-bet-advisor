import React from 'react';
import { motion } from 'framer-motion';
import { getZodiacColorScheme, getZodiacSign } from '@/utils/zodiacUtils';
import { Zap, Sparkles, Star } from 'lucide-react'; // Icons for scores

export interface PlayerCardProps {
  id: string;
  player_id: string; // From baseball_players
  full_name: string;
  headshot_url?: string | null;
  team_id?: string | null; // For context, if needed
  birth_date?: string | null;
  primary_number?: string | number | null;
  primary_position?: string | null;
  impact_score?: number | null;
  astro_influence?: number | null;
  teamAverageAstroInfluence?: number | null; // Added to determine glow effect
  // No need to pass zodiac_sign explicitly if birth_date is available
  linkPath?: string; // For navigation if the card is clickable
  // Add any other fields from baseball_players you need
  // e.g., jersey_number, status, team_abbreviation etc.
}

const PlayerCardNew: React.FC<PlayerCardProps> = ({
  id,
  player_id,
  full_name,
  headshot_url,
  birth_date,
  primary_number,
  primary_position,
  impact_score = 0,
  astro_influence = 0, // Default to 0 if not provided
  teamAverageAstroInfluence = 0, // Default average
  linkPath,
}) => {
  const actualZodiacSign = getZodiacSign(birth_date);
  const colors = getZodiacColorScheme(actualZodiacSign);

  // Determine if the card should glow if astro_influence is above team average.
  const shouldGlow = (astro_influence || 0) > (teamAverageAstroInfluence || 0);

  const formattedImpactScore = (impact_score || 0).toFixed(1);
  const formattedAstroInfluence = (astro_influence || 0).toFixed(1);

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    hover: { scale: 1.03, boxShadow: `0px 10px 20px -5px ${colors.accent}40` }, // Subtle shadow with accent color
  };

  const FallbackAvatar = () => (
    <div 
      className="w-full h-full flex items-center justify-center rounded-full"
      style={{ background: `linear-gradient(135deg, ${colors.accent}40, ${colors.accent}80)` }}
    >
      <span className="text-4xl font-bold" style={{ color: colors.text === 'text-white' ? 'white' : colors.accent }}>
        {full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
      </span>
    </div>
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={`relative flex flex-col rounded-xl shadow-lg overflow-hidden cursor-pointer 
                  w-64 h-96 border-2 ${shouldGlow ? 'shadow-2xl' : ''}`}
      style={{
        background: `linear-gradient(180deg, ${colors.accent}1A 0%, ${colors.bg.split(' ')[0].replace('bg-gradient-to-br', '').replace('from-', '')} 30%)`,
        borderColor: shouldGlow ? colors.accent : `${colors.accent}80`,
        '--glow-color': colors.accent, // For potential CSS glow variable usage
      } as React.CSSProperties}
      // onClick={() => linkPath && navigate(linkPath)} // Add navigation if needed
    >
      {shouldGlow && (
        <>
          <div 
            className="absolute inset-0 rounded-xl opacity-40 animate-pulse"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${colors.accent}33 0%, transparent 70%)`,
              zIndex: 0,
            }}
          />
          <div 
            className="absolute -inset-1 rounded-xl opacity-60 blur-md animate-pulse"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${colors.accent}55 0%, transparent 60%)`,
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Card Content - Ensure it's above the glow effect */}
      <div className="relative z-10 flex flex-col flex-grow p-4">
        {/* Header: Player Name, Number, Position */}
        <div className="mb-3 text-center">
          <h3 className="text-xl font-bold truncate" style={{ color: colors.text }}>
            {full_name || 'Player Name'}
          </h3>
          <div className="flex justify-center items-baseline space-x-2 text-sm" style={{ color: `${colors.text}B3` }}>
            {primary_number && <span>#{primary_number}</span>}
            {primary_position && <span>{primary_position}</span>}
          </div>
        </div>

        {/* Player Image Section */}
        <div className="relative w-36 h-36 mx-auto mb-4 rounded-full overflow-hidden border-4 shadow-md"
             style={{ borderColor: colors.accent, background: `${colors.accent}1A` }}>
          {headshot_url ? (
            <img
              src={headshot_url}
              alt={`${full_name} headshot`}
              className="w-full h-full object-cover"
              onError={(e) => { 
                (e.target as HTMLImageElement).style.display = 'none'; 
                (e.target as HTMLImageElement).nextSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {/* Fallback Avatar conditionally rendered or always present and hidden/shown */}
          <div className={`w-full h-full ${headshot_url ? 'hidden' : ''}`}> 
            <FallbackAvatar />
          </div>
        </div>

        {/* Scores Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: `${colors.accent}26`}}>
            <div className="flex items-center text-xs font-semibold mb-0.5" style={{ color: `${colors.text}CC`}}>
              <Star className="w-3 h-3 mr-1" style={{ color: colors.accent }} />
              IMPACT
            </div>
            <div className="text-2xl font-bold" style={{ color: colors.text }}>
              {formattedImpactScore}
            </div>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: `${colors.accent}26`}}>
            <div className="flex items-center text-xs font-semibold mb-0.5" style={{ color: `${colors.text}CC`}}>
              <Sparkles className="w-3 h-3 mr-1" style={{ color: colors.accent }} />
              ASTRO
            </div>
            <div className="text-2xl font-bold" style={{ color: colors.text }}>
              {formattedAstroInfluence}
            </div>
          </div>
        </div>

        {/* Zodiac Sign Badge at the bottom center */}
        <div className="mt-auto flex justify-center">
          <div 
            className="px-4 py-1.5 rounded-full text-sm font-bold shadow-md flex items-center justify-center capitalize"
            style={{
              backgroundColor: colors.accent,
              color: colors.text === 'text-white' || colors.text === 'text-slate-100' ? 'white' : '#1E293B', // Dark text for light accents
            }}
          >
            {actualZodiacSign}
          </div>
        </div>
      </div>

      {/* Decorative bottom bar using gradient */}
      <div className="h-1.5 w-full" style={{ background: colors.gradient }} />
    </motion.div>
  );
};

export default PlayerCardNew;
