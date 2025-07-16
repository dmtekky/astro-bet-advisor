import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiMoon, FiSun, FiStar, FiWind, FiDroplet } from 'react-icons/fi';
import { getElementColor, getSignElement } from "@/utils/astroUtils/index";

// Simplified Elemental Balance component
interface ElementalBalanceProps {
  elementalBalance?: Record<string, number> | {
    fire: { score: number; planets: string[] };
    earth: { score: number; planets: string[] };
    air: { score: number; planets: string[] };
    water: { score: number; planets: string[] };
  } | any;
}

export const SimplifiedElementalBalance: React.FC<ElementalBalanceProps> = ({ 
  elementalBalance = { fire: 0, earth: 0, air: 0, water: 0 } 
}) => {
  // Process element data to handle different formats
  const processedElements = useMemo(() => {
    const elements = { fire: 0, earth: 0, air: 0, water: 0 };
    
    if (!elementalBalance) return elements;
    
    // Handle complex element structure with score property
    if (elementalBalance.fire && typeof elementalBalance.fire === 'object' && 'score' in elementalBalance.fire) {
      elements.fire = elementalBalance.fire.score || 0;
      elements.earth = elementalBalance.earth?.score || 0;
      elements.air = elementalBalance.air?.score || 0;
      elements.water = elementalBalance.water?.score || 0;
    } 
    // Handle simple number structure
    else if (typeof elementalBalance.fire === 'number') {
      elements.fire = elementalBalance.fire || 0;
      elements.earth = elementalBalance.earth || 0;
      elements.air = elementalBalance.air || 0;
      elements.water = elementalBalance.water || 0;
    }
    
    return elements;
  }, [elementalBalance]);
  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Elemental Balance</h3>
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center">
          <FiSun className="text-red-500 text-xl" />
          <span className="text-sm mt-1">{processedElements.fire}%</span>
          <span className="text-xs text-gray-500">Fire</span>
        </div>
        <div className="flex flex-col items-center">
          <FiDroplet className="text-blue-500 text-xl" />
          <span className="text-sm mt-1">{processedElements.water}%</span>
          <span className="text-xs text-gray-500">Water</span>
        </div>
        <div className="flex flex-col items-center">
          <FiWind className="text-yellow-500 text-xl" />
          <span className="text-sm mt-1">{processedElements.air}%</span>
          <span className="text-xs text-gray-500">Air</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"></div>
          <span className="text-sm mt-1">{processedElements.earth}%</span>
          <span className="text-xs text-gray-500">Earth</span>
        </div>
      </div>
    </Link>
  );
};

// Define Planet interface to match dashboard exactly
interface Planet {
  name: string;
  sign?: string;
  degree?: number;
  retrograde?: boolean;
  speed?: number;
  [key: string]: any;
}

// Updated interface to accept either planets or direct element data
interface ElementInfluenceInsightsProps {
  planets?: Record<string, Planet>;
  elements?: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
}

// Element Influence Insights component - now accepts both planets and elements props
export const ElementInfluenceInsights: React.FC<ElementInfluenceInsightsProps> = ({ planets = {}, elements }) => {
  // Debug data
  console.log('ElementInfluenceInsights received planets:', planets);
  console.log('ElementInfluenceInsights received elements:', elements);
  // Element styling information - exact match to dashboard
  const elementInfo = {
    fire: { 
      color: 'text-red-500', 
      bgColor: 'bg-red-500', 
      lightBgColor: 'bg-red-100', 
      icon: <FiSun />,
      description: "Energetic, passionate, and action-oriented. Favors aggressive play and high-scoring games.",
    },
    earth: { 
      color: 'text-green-600', 
      bgColor: 'bg-green-600', 
      lightBgColor: 'bg-green-100', 
      icon: <FiStar />,
      description: "Stable, practical, and reliable. Favors defensive strategies and consistent performance.",
    },
    air: { 
      color: 'text-blue-400', 
      bgColor: 'bg-blue-400', 
      lightBgColor: 'bg-blue-100', 
      icon: <FiWind />,
      description: "Intellectual, communicative, and adaptable. Favors strategic play and creative tactics.",
    },
    water: { 
      color: 'text-indigo-500', 
      bgColor: 'bg-indigo-500', 
      lightBgColor: 'bg-indigo-100', 
      icon: <FiDroplet />,
      description: "Emotional, intuitive, and sensitive. Favors fluid play and emotional momentum.",
    },
  };
  
  // Calculate elemental balance - handles both planets and direct elements data
  const elementalCounts = useMemo(() => {
    // If elements prop is provided directly, use it
    if (elements) {
      console.log('Using provided elements data:', elements);
      return {
        fire: elements.fire || 0,
        earth: elements.earth || 0,
        air: elements.air || 0,
        water: elements.water || 0,
      };
    }
    
    // Otherwise, initialize with zeros
    const counts = {
      fire: 0,
      earth: 0,
      air: 0,
      water: 0,
    };

    // Try to use planets data if available
    if (planets && typeof planets === "object" && Object.keys(planets).length > 0) {
      // Process planets normally if available
      Object.values(planets).forEach((planet) => {
        if (planet && planet.sign) {
          const element = getSignElement(planet.sign);
          if (element && counts.hasOwnProperty(element)) {
            counts[element]++;
          }
        }
      });
      return counts;
    }
    
    // If neither elements nor planets are available, try to use window.astroData
    const astroData = (window as any).astroData;
    if (astroData && astroData.elements) {
      console.log('Using elements data from window.astroData:', astroData.elements);
      return {
        fire: astroData.elements.fire || 0,
        earth: astroData.elements.earth || 0,
        air: astroData.elements.air || 0,
        water: astroData.elements.water || 0,
      };
    }

    // Return empty counts if no data is available
    return counts;
  }, [planets, elements]);

  // Calculate total planets - EXACT copy from dashboard ElementalBalance.tsx
  const totalElements = useMemo(() => {
    return Object.values(elementalCounts).reduce((sum, count) => sum + count, 0);
  }, [elementalCounts]);

  // Calculate percentages - EXACT copy from dashboard ElementalBalance.tsx
  const elementalPercentages = useMemo(() => {
    if (totalElements === 0) return { fire: 0, earth: 0, air: 0, water: 0 };
    
    return {
      fire: Math.round((elementalCounts.fire / totalElements) * 100),
      earth: Math.round((elementalCounts.earth / totalElements) * 100),
      air: Math.round((elementalCounts.air / totalElements) * 100),
      water: Math.round((elementalCounts.water / totalElements) * 100),
    };
  }, [elementalCounts, totalElements]);

  // Determine dominant element - EXACT copy from dashboard ElementalBalance.tsx
  const dominantElement = useMemo(() => {
    if (totalElements === 0) return null;
    
    const elements = ["fire", "earth", "air", "water"] as const;
    return elements.reduce((max, element) => 
      elementalCounts[element] > elementalCounts[max] ? element : max
    , elements[0]);
  }, [elementalCounts, totalElements]);
  
  // Element insights
  const insights = useMemo(() => {
    switch(dominantElement) {
      case 'fire':
        return 'Passionate, energetic, and action-oriented. Favors aggressive play and quick decisions.';
      case 'earth':
        return 'Grounded, practical, and reliable. Favors steady play and methodical approaches.';
      case 'air':
        return 'Intellectual, communicative, and adaptable. Favors strategic play and mental agility.';
      case 'water':
      default:
        return 'Emotional, intuitive, and sensitive. Favors fluid play and emotional momentum.';
    }
  }, [dominantElement]);
  
  return (
    <Link to="/" className="block">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Element Influence Insights</h3>
      
      {/* Progress bar showing element distribution */}
      <div className="bg-gray-200 rounded-full h-6 overflow-hidden shadow-sm mb-3">
        {["fire", "earth", "air", "water"].map((element, index) => {
          const width = `${elementalPercentages[element as keyof typeof elementalPercentages]}%`;
          
          return (
            <div
              key={element}
              className={`h-full inline-block transition-all duration-300 ${elementInfo[element].bgColor} ${
                index === 0 ? 'rounded-l-full' : index === 3 ? 'rounded-r-full' : ''
              }`}
              style={{ width }}
              aria-label={`${element} ${elementalPercentages[element as keyof typeof elementalPercentages].toFixed(0)}%`}
            />
          );
        })}
      </div>
      
      {/* Element percentages */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
        {["fire", "earth", "air", "water"].map((element) => {
          const count = elementalCounts[element as keyof typeof elementalCounts] || 0;
          const percentage = elementalPercentages[element as keyof typeof elementalPercentages];
          
          return (
            <div key={element} className="flex items-center justify-center">
              <span className={`px-1.5 py-0.5 rounded ${elementInfo[element].color} whitespace-nowrap`}>
                <span className="font-bold">{element.charAt(0).toUpperCase() + element.slice(1)}</span>: {count} ({percentage.toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Dominant element insight */}
      {dominantElement && (
        <div className={`p-3 rounded-lg ${elementInfo[dominantElement].lightBgColor}`}>
          <div className="flex items-center mb-2">
            <div className={`p-1.5 rounded-full ${elementInfo[dominantElement].bgColor} text-white mr-3`}>
              {elementInfo[dominantElement].icon}
            </div>
            <h4 className={`text-sm font-semibold ${elementInfo[dominantElement].color}`}>
              {dominantElement.charAt(0).toUpperCase() + dominantElement.slice(1)} Dominant
            </h4>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">
            {insights}
          </p>
        </div>
      )}
    </Link>
  );
};

// Simplified Lunar Status Card component - using dashboard routing logic
interface MoonPhaseInfo {
  name?: string;
  value?: number;
  illumination?: number;
  nextFullMoon?: Date;
  ageInDays?: number;
  phaseType?: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
  emoji?: string;
  phaseName?: string;
}

interface MoonData {
  sign?: string;
  degree?: number;
  speed?: number;
  minute?: number;
  [key: string]: any;
}

export const SimplifiedLunarStatusCard: React.FC<{ 
  moonPhase?: MoonPhaseInfo, 
  moonData?: MoonData 
}> = ({ 
  moonPhase, 
  moonData 
}) => {
  // Format next full moon date if available
  const nextFullMoon = useMemo(() => {
    if (!moonPhase?.nextFullMoon) return null;
    
    try {
      // Handle both Date object and string formats
      const fullMoonDate = moonPhase.nextFullMoon instanceof Date 
        ? moonPhase.nextFullMoon 
        : new Date(moonPhase.nextFullMoon);
      
      // Check if date is valid
      if (isNaN(fullMoonDate.getTime())) return null;
      
      return fullMoonDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting next full moon date:', e);
      return null;
    }
  }, [moonPhase?.nextFullMoon]);

  // Get moon phase name and illumination
  const phaseName = moonPhase?.name || moonPhase?.phaseName || "Unknown";
  const illumination = moonPhase?.illumination !== undefined 
    ? `${Math.round(moonPhase.illumination * 100)}%` 
    : '';
  
  // Get moon sign
  const moonSign = moonData?.sign || "Unknown";

  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Lunar Status</h3>
      
      <div className="flex items-center mb-3">
        <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-full mr-3">
          <FiMoon className="text-indigo-600 dark:text-indigo-400 text-xl" />
        </div>
        <div>
          <div className="font-medium text-indigo-700 dark:text-indigo-300">{moonPhase?.name || 'Moon Phase'}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">in {moonData?.sign || 'Moon Sign'}</div>
        </div>
      </div>
      
      {/* Next Full Moon */}
      {nextFullMoon && (
        <div className="mt-3 bg-indigo-50 dark:bg-indigo-900 p-2 rounded-md">
          <div className="flex items-center">
            <FiSun className="text-yellow-500 mr-2" />
            <span className="text-indigo-700 dark:text-indigo-300 font-medium">
              Next Full Moon:
            </span>
          </div>
          <div className="ml-6 mt-1 text-gray-700 dark:text-gray-300">
            {nextFullMoon}
          </div>
        </div>
      )}
    </Link>
  );
};

// Define the aspect interface based on dashboard implementation
interface Aspect {
  planet1?: string;
  planet2?: string;
  aspect?: string;
  angle?: number;
  orb?: number;
  strength?: number;
  applying?: boolean;
  interpretation?: string;
}

// Simplified Key Planetary Influences component - using dashboard routing logic without fallbacks
export const SimplifiedKeyPlanetaryInfluences: React.FC<{ aspects: Aspect[] }> = ({ aspects }) => {
  // Helper function to translate aspect type to plain language
  const getAspectExplanation = (aspectType?: string): string => {
    if (!aspectType) return 'interacting with';
    
    const lowerType = aspectType.toLowerCase();
    if (lowerType.includes('conjunction')) return 'joining forces with';
    if (lowerType.includes('trine')) return 'working harmoniously with';
    if (lowerType.includes('sextile')) return 'supporting';
    if (lowerType.includes('square')) return 'creating tension with';
    if (lowerType.includes('opposition')) return 'opposing';
    if (lowerType.includes('quincunx')) return 'adjusting to';
    return 'connecting with';
  };
  
  // Helper function to get simple strength description
  const getStrengthDescription = (orb?: number): string => {
    if (orb === undefined) return 'moderate';
    if (orb < 1) return 'extremely strong';
    if (orb < 3) return 'very strong';
    if (orb < 5) return 'strong';
    if (orb < 7) return 'moderate';
    return 'weak';
  };

  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Planet Connections</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">See how planets influence each other in your chart. Stronger connections have more impact on you.</p>
      
      <ul className="space-y-4">
        {aspects.slice(0, 5).map((aspect, index) => (
          <li key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="font-bold text-indigo-600 mr-1">{aspect.planets?.[0]?.name || aspect.planet1 || 'Planet'}</span>
                <span className="text-gray-700 dark:text-gray-300">is</span>
                <span className="font-medium text-indigo-600 mx-2">{getAspectExplanation(aspect.aspectType)}</span>
                <span className="font-bold text-indigo-600">{aspect.planets?.[1]?.name || aspect.planet2 || 'Planet'}</span>
              </div>
              
              {aspect.applying && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Getting Stronger</span>
              )}
            </div>
            
            <div>
              {aspect.orb !== undefined && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-sm font-medium">
                      Connection Strength: <span className="text-indigo-600">{getStrengthDescription(aspect.orb)}</span>
                    </span>
                  </div>
                  
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${Math.max(5, Math.min(100, 100 - (aspect.orb * 10)))}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Stronger</span>
                    <span>Weaker</span>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      {aspects.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          No planetary connections available
        </div>
      )}
    </Link>
  );
};
