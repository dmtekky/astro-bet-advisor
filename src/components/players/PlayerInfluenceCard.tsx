import React from 'react';
import CircularProgress from '../CircularProgress';

// Import types
import { AstroData } from '../../types/app.types';

// Define interfaces for the component props
interface PlayerInfluenceCardProps {
  player: {
    full_name: string | null;
    astro_influence?: number | null;
    impact_score?: number | string | null;
    [key: string]: any; // Allow additional properties
  };
  astro?: AstroData | null;
}

// Helper function to get influence strength text
const getInfluenceStrength = (score: number): string => {
  if (score >= 80) return 'greatly enhanced';
  if (score >= 60) return 'significantly boosted';
  if (score >= 40) return 'moderately affected';
  if (score >= 20) return 'slightly influenced';
  return 'minimally affected';
};

// Helper function to calculate elemental composition
interface ElementComposition {
  name: string;
  percentage: number;
}

const calculateElementalComposition = (astro: AstroData): ElementComposition[] => {
  const elements = ['Fire', 'Earth', 'Air', 'Water'] as const;
  return elements.map(element => ({
    name: element,
    percentage: Math.round(Math.random() * 30 + 10) // Replace with actual calculation
  }));
};

// Helper function to get element color class
const getElementColorClass = (element: string): string => {
  switch (element) {
    case 'Fire': return 'bg-red-500';
    case 'Earth': return 'bg-yellow-600';
    case 'Air': return 'bg-blue-400';
    case 'Water': return 'bg-blue-600';
    default: return 'bg-gray-400';
  }
};

// Helper function to get element color
const getElementColor = (element: string): string => {
  switch (element) {
    case 'Fire': return '#EF4444';
    case 'Earth': return '#D97706';
    case 'Air': return '#60A5FA';
    case 'Water': return '#2563EB';
    default: return '#9CA3AF';
  }
};

const PlayerInfluenceCard: React.FC<PlayerInfluenceCardProps> = ({ player, astro }) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Astrological Influence Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Astrological Influence</h2>
        <div className="flex flex-col items-center">
          {player.astro_influence !== undefined && player.astro_influence !== null ? (
            <>
              <CircularProgress 
                value={player.astro_influence} 
                size={160}
                strokeWidth={12}
                showDescription={true}
              >
                <span className="text-3xl font-bold">
                  {Math.round(player.astro_influence)}%
                </span>
                <span className="text-sm text-gray-500 mt-1">Astro Influence</span>
              </CircularProgress>
              <p className="mt-2 text-sm text-gray-600 max-w-xs text-center">
                {player.full_name?.split(' ')[0]}'s performance may be {getInfluenceStrength(player.astro_influence)} by today's celestial alignments.
              </p>
            </>
          ) : (
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-yellow-700">Astrological influence data not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Player Impact Card */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h2 className="text-2xl font-semibold mb-3 text-gray-800">Player Impact</h2>
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <p className="text-lg">Overall Impact:</p>
            {player.impact_score !== undefined && player.impact_score !== null ? (
              <span className="font-bold text-blue-600 text-xl">
                {typeof player.impact_score === 'number' ? player.impact_score.toFixed(1) : player.impact_score}
              </span>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </div>
          {player.impact_score !== undefined && player.impact_score !== null && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ 
                  width: `${Math.min(
                    (typeof player.impact_score === 'number' 
                      ? player.impact_score 
                      : parseFloat(player.impact_score) || 0) * 10, 
                    100
                  )}%` 
                }}
              ></div>
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Impact score represents the player's overall contribution based on statistical performance and astrological alignment.
          </p>

          {/* Elemental Composition Section */}
          {astro && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Elemental Composition</h3>
              <div className="relative h-6 rounded-full bg-gray-100 shadow-inner overflow-hidden">
                <div className="absolute inset-0 flex">
                  {calculateElementalComposition(astro).map((element, index, array) => (
                    <div 
                      key={element.name}
                      className={`h-full relative ${getElementColorClass(element.name)}`}
                      style={{
                        width: `${element.percentage}%`,
                        marginLeft: index === 0 ? '0' : '-1px',
                        zIndex: array.length - index
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      {element.percentage > 12 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-overlay">
                          {element.percentage}% {element.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {calculateElementalComposition(astro).map(element => (
                  <div key={element.name} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-sm mr-2 shadow-sm"
                      style={{ backgroundColor: getElementColor(element.name) }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {element.name} <span className="text-gray-500">{element.percentage}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PlayerInfluenceCard;
