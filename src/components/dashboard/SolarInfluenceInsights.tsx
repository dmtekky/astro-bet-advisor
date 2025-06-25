import React from "react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Sun } from "lucide-react";
// Using props instead of importing these functions

interface SolarInfluenceInsightsProps {
  sun: any;
  getSunSignImpact: (sign: string) => string;
  getSunElement: (sign: string) => string;
  getElementImpact: (element: string) => string;
  getDegreeImpact: (degree: number) => string;
  getSunSportsInfluences: () => { text: string; color: string }[];
  sidereal?: boolean;
  formattedDegree?: string;
}

const SolarInfluenceInsights: React.FC<SolarInfluenceInsightsProps> = ({
  sun,
  getSunSignImpact,
  getSunElement,
  getElementImpact,
  getDegreeImpact,
  getSunSportsInfluences,
  sidereal = false,
  formattedDegree = '0°',
}) => {
  // Get the sun sign and element
  const sunSign = sun?.sign || 'Unknown';
  const sunElement = getSunElement(sunSign);
  
  // Get the sun degree
  const sunDegree = sun?.degree || 0;
  
  // Get the influences
  const influences = getSunSportsInfluences();

  return (
    <>
      <CardHeader className="pb-2 pt-4 px-0 sm:px-6">
        <CardTitle className="text-lg font-semibold text-slate-800">
          <Sun className="h-5 w-5 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2 px-0 sm:px-6">
        {/* Sun Position Visualization */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 sm:p-6 rounded-none sm:rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
            {/* Sun Visualization */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-500 shadow-lg transform hover:scale-105 transition-transform duration-500">
                {/* Glow effect */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: '0 0 30px 8px rgba(251, 191, 36, 0.6)',
                    background: 'radial-gradient(circle at 40% 40%, rgba(252, 211, 77, 0.8), transparent 70%)',
                  }}
                />
              </div>
              {/* Sun rays */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1 h-6 sm:h-8 md:h-10 bg-yellow-400 origin-bottom transform -translate-x-1/2 -translate-y-full"
                  style={{
                    transform: `rotate(${i * 30}deg) translateY(-50%)`,
                    boxShadow: '0 0 8px rgba(251, 191, 36, 0.8)'
                  }}
                />
              ))}
            </div>

            {/* Sun Information */}
            <div className="flex-1 w-full">
              <div className="bg-white p-3 sm:p-4 rounded-lg border border-amber-100 mb-4 w-full">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-md flex flex-col items-center text-center">
                    <div className="text-[10px] sm:text-xs text-amber-700 font-medium mb-0.5 sm:mb-1">Sign</div>
                    <div className="text-sm font-semibold text-amber-800">
                      {sunSign || "-"}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-md flex flex-col items-center text-center">
                    <div className="text-[10px] sm:text-xs text-amber-700 font-medium mb-0.5 sm:mb-1">Element</div>
                    <div className="text-sm font-semibold text-amber-800">
                      {sunElement || "-"}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-md flex flex-col items-center text-center">
                    <div className="text-[10px] sm:text-xs text-amber-700 font-medium mb-0.5 sm:mb-1">Position</div>
                    <div className="text-sm font-semibold text-amber-800">
                      {sunDegree ? `${Math.floor(sunDegree)}°${Math.round((sunDegree % 1) * 60)}'` : "-"}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2 sm:p-3 rounded-md flex flex-col items-center text-center">
                    <div className="text-[10px] sm:text-xs text-amber-700 font-medium mb-0.5 sm:mb-1">Quality</div>
                    <div className="text-sm font-semibold text-amber-800">
                      {sunSign ? (
                        ["Aries", "Cancer", "Libra", "Capricorn"].includes(sunSign)
                          ? "Cardinal"
                          : ["Taurus", "Leo", "Scorpio", "Aquarius"].includes(sunSign)
                          ? "Fixed"
                          : "Mutable"
                      ) : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-white p-4 sm:p-5 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-3">
                  <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg mr-2 sm:mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h5 className="text-sm sm:text-base font-semibold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    Solar Influence Insights
                  </h5>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {influences.map((influence, index) => (
                    <li
                      key={`sun-influence-${index}`}
                      className="text-xs sm:text-sm text-slate-700 leading-relaxed"
                    >
                      <div className="flex items-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0 bg-slate-300"></span>
                        <span>{influence.text}</span>
                      </div>
                    </li>
                  ))}
                  {influences.length === 0 && (
                    <div className="text-center py-4 px-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-sm text-amber-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1 -mt-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Solar influences are currently unavailable.
                      </p>
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default SolarInfluenceInsights;
