import React from 'react';
import { Link } from 'react-router-dom';
import { FiMoon, FiSun, FiWind, FiDroplet, FiStar } from 'react-icons/fi';

// Simplified Elemental Balance component
export const SimplifiedElementalBalance: React.FC<{ elementalBalance?: Record<string, number> }> = ({ 
  elementalBalance = { fire: 0, earth: 0, air: 0, water: 0 } 
}) => {
  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Elemental Balance</h3>
      <div className="flex justify-between">
        <div className="flex items-center text-red-500 dark:text-red-400">
          <FiSun className="mr-1" /> {elementalBalance.fire || 0}
        </div>
        <div className="flex items-center text-green-500 dark:text-green-400">
          <FiDroplet className="mr-1" /> {elementalBalance.water || 0}
        </div>
        <div className="flex items-center text-yellow-500 dark:text-yellow-400">
          <FiWind className="mr-1" /> {elementalBalance.air || 0}
        </div>
        <div className="flex items-center text-brown-500 dark:text-yellow-700">
          <FiStar className="mr-1" /> {elementalBalance.earth || 0}
        </div>
      </div>
    </Link>
  );
};

// Simplified Lunar Status Card component
interface MoonPhaseObject {
  name?: string;
  value?: number;
  illumination?: number;
  nextFullMoon?: Date;
  ageInDays?: number;
  phaseType?: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
}

export const SimplifiedLunarStatusCard: React.FC<{ 
  moonPhase?: string | MoonPhaseObject, 
  moonSign?: string 
}> = ({ 
  moonPhase = "Unknown", 
  moonSign = "Unknown" 
}) => {
  // Handle both string and object moonPhase
  const phaseName = typeof moonPhase === 'string' 
    ? moonPhase 
    : moonPhase?.name || moonPhase?.phaseType || "Unknown";
  
  // Format illumination percentage if available
  const illumination = typeof moonPhase !== 'string' && moonPhase?.illumination 
    ? `(${Math.round(moonPhase.illumination * 100)}%)` 
    : '';

  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Moon Phase</h3>
      <div className="flex items-center justify-center">
        <FiMoon className="text-indigo-600 dark:text-indigo-400 mr-2" />
        <span className="text-gray-700 dark:text-gray-300">
          {phaseName} {illumination} {moonSign !== "Unknown" ? `in ${moonSign}` : ''}
        </span>
      </div>
    </Link>
  );
};

// Define the aspect interface based on the console log error
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

// Simplified Key Planetary Influences component
export const SimplifiedKeyPlanetaryInfluences: React.FC<{ aspects: any[] }> = ({ aspects }) => {
  // Extract and format key planetary influences
  const influences = useMemo(() => {
    if (!aspects || !Array.isArray(aspects) || aspects.length === 0) {
      return ['Sun in Aries', 'Moon in Taurus', 'Mercury in Gemini']; // Default fallback
    }

    return aspects.slice(0, 3).map(aspect => {
      try {
        // Handle different data structures
        if (aspect && typeof aspect === 'object') {
          if (aspect.planet && aspect.sign) {
            // Original format
            return `${aspect.planet} in ${aspect.sign}`;
          } else if (aspect.planet1 && aspect.planet2) {
            // Format with planet1 and planet2
            const aspectType = aspect.aspect ? ` ${aspect.aspect} ` : ' aspects ';
            return `${aspect.planet1}${aspectType}${aspect.planet2}`;
          } else if (aspect.planets && Array.isArray(aspect.planets) && aspect.planets.length >= 2) {
            // Format with planets array
            const planet1 = typeof aspect.planets[0] === 'string' ? aspect.planets[0] : 'Planet';
            const planet2 = typeof aspect.planets[1] === 'string' ? aspect.planets[1] : 'Planet';
            return `${planet1} ${aspect.type || 'aspects'} ${planet2}`;
          }
          return 'Planetary aspect'; // Generic object
        }
        return 'Aspect'; // Unknown format
      } catch (error) {
        console.error('Error formatting aspect:', error);
        return 'Aspect'; // Fallback on error
      }
    });
  }, [aspects]);
  
  // Default influences if none provided
  const defaultItems = [
    { key: 'sun', text: 'Sun in Aries' },
    { key: 'mercury', text: 'Mercury in Taurus' },
    { key: 'venus', text: 'Venus in Gemini' }
  ];

  // Format influences into display items
  const displayItems = influences.map((influence, index) => ({
    key: `influence-${index}`,
    text: influence
  }));

  const itemsToDisplay = displayItems.length > 0 ? displayItems : defaultItems;

  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Key Influences</h3>
      <ul className="space-y-1">
        {itemsToDisplay.map((item, index) => (
          <li key={item.key || index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
            <FiStar className="text-yellow-500 mr-1" />
            {item.text}
          </li>
        ))}
      </ul>
    </Link>
  );
};
