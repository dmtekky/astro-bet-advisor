import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Activity } from 'lucide-react';

interface PlanetData {
  name: string;
  [key: string]: any;
}

interface TransformedAspect {
  planets?: PlanetData[];
  type?: string;
  influence?: number | string;
  interpretation?: string;
  [key: string]: any;
}

interface Planet {
  name: string;
  sign?: string;
  degree?: number;
  retrograde?: boolean;
  speed?: number;
  [key: string]: any;
}

interface SimplifiedKeyPlanetaryInfluencesProps {
  aspects?: TransformedAspect[];
  planets?: Record<string, Planet>;
}

const SimplifiedKeyPlanetaryInfluences: React.FC<SimplifiedKeyPlanetaryInfluencesProps> = ({ 
  aspects = [],
  planets = {} 
}) => {
  // Debug the aspects data structure
  React.useEffect(() => {
    console.log('SimplifiedKeyPlanetaryInfluences - Raw aspects data:', aspects);
  }, [aspects]);
  
  // Filter out aspects with missing data - IDENTICAL to dashboard component logic
  const validAspects = useMemo(() => {
    const filtered = aspects
      .filter(aspect => aspect.planets && aspect.planets.length >= 2 && aspect.planets[0] && aspect.planets[1])
      .sort((a, b) => {
        const influenceA = typeof a.influence === 'string' ? parseInt(a.influence.toString()) : (a.influence || 0);
        const influenceB = typeof b.influence === 'string' ? parseInt(b.influence.toString()) : (b.influence || 0);
        return influenceB - influenceA;
      });
    
    console.log('SimplifiedKeyPlanetaryInfluences - Filtered aspects data:', filtered);
    return filtered;
  }, [aspects]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold text-indigo-600 mb-2 flex items-center">
        <Globe className="h-5 w-5 mr-2 text-blue-500" /> Key Planetary Aspects
      </h3>
      
      {validAspects.length === 0 ? (
        <p className="text-sm text-gray-600 mb-4">No significant planetary aspects at this time.</p>
      ) : (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-blue-700 flex items-center">
            <Activity className="h-4 w-4 mr-1.5 text-blue-500" />
            Prominent Aspects
          </h5>
          
          <div className="space-y-3">
            {validAspects.slice(0, 5).map((aspect, index) => {
              // EXACTLY matching dashboard component's planet name extraction
              const influenceValue = aspect.influence ? parseInt(aspect.influence.toString()) : 0;
              const strengthClass = influenceValue > 70 ? 'text-green-600' : 
                                  influenceValue > 40 ? 'text-amber-600' : 'text-red-600';
              
              // Planet naming IDENTICAL to dashboard component
              const planet1Name = aspect.planets?.[0]?.name || 'Unknown';
              const planet2Name = aspect.planets?.[1]?.name || 'Unknown';
              
              return (
                <div key={index} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-slate-700">{planet1Name}</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        {aspect.type || 'aspect'}
                      </span>
                      <span className="text-slate-700">{planet2Name}</span>
                    </div>
                    <span className={`text-sm font-bold ${strengthClass}`}>
                      {aspect.influence ? aspect.influence.toString().replace('%', '') : '0'}%
                    </span>
                  </div>
                  
                  {aspect.interpretation && (
                    <p className="text-xs text-gray-600 mt-1">{aspect.interpretation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <Link to="/dashboard" className="text-indigo-500 hover:underline text-sm block mt-3">
        View Full Astrology Dashboard
      </Link>
    </div>
  );
};

export default SimplifiedKeyPlanetaryInfluences;
