import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

interface SimplifiedKeyPlanetaryInfluencesProps {
  aspects?: Array<{ type?: string; influence?: number }>;
}

const SimplifiedKeyPlanetaryInfluences: React.FC<SimplifiedKeyPlanetaryInfluencesProps> = ({ aspects = [] }) => {
  const majorAspect = aspects.find(aspect => aspect.influence && aspect.influence > 50) || { type: 'No major aspect', influence: 0 };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold text-indigo-600 mb-2 flex items-center">
        <Globe className="h-5 w-5 mr-2 text-blue-500" /> Key Influences
      </h3>
      <p className="text-sm text-gray-600 mb-4">Aspect: {majorAspect.type}, Influence: {majorAspect.influence}%</p>
      <Link to="/" className="text-indigo-500 hover:underline text-sm">Back to Home</Link>
    </div>
  );
};

export default SimplifiedKeyPlanetaryInfluences;
