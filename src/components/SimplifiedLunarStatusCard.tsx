import React from 'react';
import { Link } from 'react-router-dom';
import { Moon } from 'lucide-react';

interface SimplifiedLunarStatusCardProps {
  moonPhase?: { name?: string; illumination?: number };
}

const SimplifiedLunarStatusCard: React.FC<SimplifiedLunarStatusCardProps> = ({ moonPhase }) => {
  const phaseName = moonPhase?.name || 'Unknown';
  const illumination = moonPhase?.illumination !== undefined ? Math.round(moonPhase.illumination * 100) + '%' : 'N/A';

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold text-indigo-600 mb-2 flex items-center">
        <Moon className="h-5 w-5 mr-2 text-indigo-500" /> Lunar Status
      </h3>
      <p className="text-sm text-gray-600 mb-4">Phase: {phaseName}, Illumination: {illumination}</p>
      <Link to="/" className="text-indigo-500 hover:underline text-sm">Back to Home</Link>
    </div>
  );
};

export default SimplifiedLunarStatusCard;
