import React from "react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Activity, Globe, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
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
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showAllPlanets, setShowAllPlanets] = React.useState(false);
  
  // Convert planets object to array
  const planetEntries = Object.entries(planets);
  
  // For mobile: 2 planets per page
  const planetsPerPage = 2;
  const totalPages = Math.ceil(planetEntries.length / planetsPerPage);
  
  // For desktop: show all planets in 5-column grid
  const visiblePlanets = showAllPlanets 
    ? planetEntries 
    : planetEntries.slice(0, 10); // 2 rows of 5 by default
    
  // For mobile: get current page's planets
  const startIndex = (currentPage - 1) * planetsPerPage;
  const currentPlanets = planetEntries.slice(startIndex, startIndex + planetsPerPage);
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
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100">
          <h5 className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
            <Globe className="h-4 w-4 mr-1.5 text-blue-500 flex-shrink-0" />
            <span>Planet Positions</span>
          </h5>
          {/* Desktop View - 5 column grid */}
          <div className="hidden sm:grid grid-cols-5 gap-1.5 sm:gap-2">
            {visiblePlanets.map(([planet, data]) => {
              const sign = data?.sign || 'Unknown';
              const elementColor = getElementColor(sign);
              const planetIcon = getPlanetIcon(planet, 12);
              return (
                <div 
                  key={planet} 
                  className="bg-slate-50 p-1.5 sm:p-2 rounded-lg border border-slate-100 hover:shadow-md transition-shadow duration-200 active:scale-95"
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                    <span className="flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4">
                      {planetIcon}
                    </span>
                    <span className="text-xs sm:text-sm font-medium capitalize text-slate-700 truncate">
                      {planet}
                    </span>
                  </div>
                  <div className={`${elementColor} text-white text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center justify-between`}>
                    <span className="truncate">{sign}</span>
                    <span className="ml-1 whitespace-nowrap">
                      {typeof data?.degree === 'number' ? data.degree.toFixed(1) + '°' : 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })}
            {planetEntries.length === 0 && (
              <div className="col-span-full text-center text-slate-500 py-4 text-sm">
                No planetary data available
              </div>
            )}
          </div>
          
          {/* Mobile View - Same as desktop but with pagination */}
          <div className="sm:hidden">
            <div className="grid grid-cols-2 gap-1.5 max-w-[240px] mx-auto">
              {currentPlanets.map(([planet, data]) => {
                const sign = data?.sign || 'Unknown';
                const elementColor = getElementColor(sign);
                const planetIcon = getPlanetIcon(planet, 12);
                return (
                  <div 
                    key={planet} 
                    className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 hover:shadow-md transition-shadow duration-200 active:scale-95"
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                      <span className="flex-shrink-0 h-3 w-3 sm:h-4 sm:w-4">
                        {planetIcon}
                      </span>
                      <span className="text-xs sm:text-sm font-medium capitalize text-slate-700 truncate">
                        {planet}
                      </span>
                    </div>
                    <div className={`${elementColor} text-white text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center justify-between`}>
                      <span className="truncate">{sign}</span>
                      <span className="ml-1 whitespace-nowrap">
                        {typeof data?.degree === 'number' ? data.degree.toFixed(1) + '°' : 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="text-xs font-medium text-slate-600">
                  {currentPage} / {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Show More/Less for Desktop */}
          <div className="hidden sm:block">
            {planetEntries.length > 10 && (
              <button
                onClick={() => setShowAllPlanets(!showAllPlanets)}
                className="mt-2 flex items-center justify-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors mx-auto"
              >
                {showAllPlanets ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp className="ml-1 h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Show All {planetEntries.length} Planets</span>
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </>
                )}
              </button>
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
