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
export const SimplifiedLunarStatusCard: React.FC<{ moonPhase?: string, moonSign?: string }> = ({ 
  moonPhase = "Unknown", 
  moonSign = "Unknown" 
}) => {
  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Moon Phase</h3>
      <div className="flex items-center justify-center">
        <FiMoon className="text-indigo-600 dark:text-indigo-400 mr-2" />
        <span className="text-gray-700 dark:text-gray-300">{moonPhase} in {moonSign}</span>
      </div>
    </Link>
  );
};

// Simplified Key Planetary Influences component
export const SimplifiedKeyPlanetaryInfluences: React.FC<{ influences?: Array<{ planet: string, sign: string }> }> = ({ 
  influences = [] 
}) => {
  // Default influences if none provided
  const displayInfluences = influences.length > 0 ? influences : [
    { planet: "Sun", sign: "Aries" },
    { planet: "Mercury", sign: "Taurus" },
    { planet: "Venus", sign: "Gemini" }
  ];

  return (
    <Link to="/" className="block p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Key Influences</h3>
      <ul className="space-y-1">
        {displayInfluences.slice(0, 3).map((influence, index) => (
          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
            <FiStar className="text-yellow-500 mr-1" />
            {influence.planet} in {influence.sign}
          </li>
        ))}
      </ul>
    </Link>
  );
};
