import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Mountain, Wind, Droplets } from 'lucide-react';
import { getSignElement } from '@/utils/astroUtils';

interface SimplifiedElementalBalanceProps {
  planets?: Record<string, { sign?: string }>;
}

const SimplifiedElementalBalance: React.FC<SimplifiedElementalBalanceProps> = ({ planets = {} }) => {
  const elementalCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  Object.values(planets).forEach(planet => {
    if (planet.sign) {
      const element = getSignElement(planet.sign)?.toLowerCase();
      if (element && elementalCounts[element as keyof typeof elementalCounts] !== undefined) {
        elementalCounts[element as keyof typeof elementalCounts] += 1;
      }
    }
  });
  const dominantElement = Object.entries(elementalCounts).reduce((a, b) => elementalCounts[a[0] as keyof typeof elementalCounts] > elementalCounts[b[0] as keyof typeof elementalCounts] ? a : b)[0];

  const elementIcons = {
    fire: <Flame className="h-5 w-5 text-red-500" />,
    earth: <Mountain className="h-5 w-5 text-green-600" />,
    air: <Wind className="h-5 w-5 text-blue-400" />,
    water: <Droplets className="h-5 w-5 text-indigo-500" />,
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold text-indigo-600 mb-2">Elemental Balance</h3>
      <p className="text-sm text-gray-600 mb-4">Dominant Element: {dominantElement.charAt(0).toUpperCase() + dominantElement.slice(1)}</p>
      <Link to="/" className="text-indigo-500 hover:underline text-sm">Back to Home</Link>
    </div>
  );
};

export default SimplifiedElementalBalance;
