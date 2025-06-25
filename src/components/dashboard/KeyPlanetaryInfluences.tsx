import React from "react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Activity, Globe } from "lucide-react";
import CosmicWaveProgress from "@/components/CosmicWaveProgress";
import { getElementColor } from "@/utils/astroUtils/index";
import { getPlanetIcon } from "@/utils/astroIcons";
// Using a more flexible type to accommodate the transformed aspects from the Dashboard
interface TransformedAspect {
  planets?: Array<{ name: string; [key: string]: any }>;
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

interface KeyPlanetaryInfluencesProps {
  aspects?: TransformedAspect[];
  planets?: Record<string, Planet>;
}

const KeyPlanetaryInfluences: React.FC<KeyPlanetaryInfluencesProps> = ({
  aspects = [],
  planets = {},
}) => {
  // Filter out aspects with missing data
  const validAspects = aspects.filter(
    (aspect) => aspect.planets && aspect.planets.length >= 2 && aspect.planets[0] && aspect.planets[1]
  );

  return (
    <>
      <CardHeader className="pb-2 px-0 pt-0">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-blue-500" /> Key Planetary Influences
        </CardTitle>
        <CardDescription className="text-slate-600">
          Significant planetary aspects and positions impacting sports performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {/* Prominent Aspects Section */}
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-blue-700 flex items-center">
            <Activity className="h-4 w-4 mr-1.5 text-blue-500" />
            Prominent Aspects
          </h5>
          <div className="space-y-3">
            {validAspects.slice(0, 5).map((aspect, index) => {
              const influenceValue = aspect.influence ? parseInt(aspect.influence.toString()) : 0;
              const strengthClass = influenceValue > 70 ? 'text-green-600' : 
                                  influenceValue > 40 ? 'text-amber-600' : 'text-red-600';
              
              // Safely access planet names
              const planet1Name = aspect.planets?.[0]?.name || 'Unknown';
              const planet2Name = aspect.planets?.[1]?.name || 'Unknown';
              
              return (
                <div key={index} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {getPlanetIcon(planet1Name)}
                      <span className="text-slate-700">{planet1Name}</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{aspect.type || 'aspect'}</span>
                      <span className="text-slate-700">{planet2Name}</span>
                      {getPlanetIcon(planet2Name)}
                    </div>
                    <span className={`text-sm font-bold ${strengthClass}`}>
                      {aspect.influence ? aspect.influence.toString().replace('%', '') : '0'}%
                    </span>
                  </div>
                  <CosmicWaveProgress 
                    value={influenceValue} 
                    startIcon={getPlanetIcon(planet1Name)} 
                    endIcon={getPlanetIcon(planet2Name)}
                    startPlanet={planet1Name.toLowerCase()}
                    endPlanet={planet2Name.toLowerCase()}
                    height={32}
                    className="mt-2"
                  />
                </div>
              );
            })}
            {validAspects.length === 0 && (
              <div className="text-center text-slate-500 py-4">
                No significant aspects available
              </div>
            )}
          </div>
        </div>
        
        {/* Planet Position Visualization */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h5 className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
            <Globe className="h-4 w-4 mr-1.5 text-blue-500" />
            Planet Positions
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {planets && typeof planets === 'object' && Object.entries(planets).map(([planet, data]) => {
              const sign = data?.sign || 'Unknown';
              const elementColor = getElementColor(sign);
              return (
                <div key={planet} className="bg-slate-50 p-2 rounded-lg border border-slate-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {getPlanetIcon(planet)}
                    <span className="text-sm font-medium capitalize text-slate-700">{planet}</span>
                  </div>
                  <div className={`${elementColor} text-white text-xs font-medium px-2 py-1 rounded-md flex items-center justify-between`}>
                    <span>{sign}</span>
                    <span>{typeof data?.degree === 'number' ? data.degree.toFixed(2) + '°' : 'N/A'}</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(planets).length === 0 && (
              <div className="col-span-full text-center text-slate-500 py-4">
                No planetary data available
              </div>
            )}
          </div>
        </div>
        
        {/* Personalized Insight Panel */}
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-blue-700 mb-2">Insights</h5>
          {validAspects.length > 0 ? (
            <div className="space-y-2">
              {validAspects.slice(0, 3).map((aspect, idx) => (
                aspect.interpretation ? (
                  <p key={`insight-${idx}`} className="text-sm text-slate-700">
                    {aspect.interpretation}
                  </p>
                ) : null
              ))}
              {validAspects.length > 3 && (
                <p className="text-xs text-slate-500">
                  +{validAspects.length - 3} more aspects analyzed
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Analyzing planetary positions for insights...
            </p>
          )}
        </div>
      </CardContent>
    </>
  );
};

export default KeyPlanetaryInfluences;
