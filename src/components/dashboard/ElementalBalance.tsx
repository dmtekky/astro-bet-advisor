import React from "react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Flame, Droplets, Wind, Mountain } from "lucide-react";
import { getElementColor, getSignElement } from "@/utils/astroUtils/index";

interface Planet {
  name: string;
  sign?: string;
  degree?: number;
  retrograde?: boolean;
  speed?: number;
  [key: string]: any;
}

interface ElementalBalanceProps {
  planets?: Record<string, Planet>;
}

const ElementalBalance: React.FC<ElementalBalanceProps> = ({ planets = {} }) => {
  // Calculate elemental balance
  const elementalCounts = React.useMemo(() => {
    const counts = {
      fire: 0,
      earth: 0,
      air: 0,
      water: 0,
    };

    if (planets && typeof planets === "object") {
      Object.values(planets).forEach((planet) => {
        if (planet && planet.sign) {
          const element = getSignElement(planet.sign);
          if (element && element.toLowerCase() in counts) {
            counts[element.toLowerCase() as keyof typeof counts] += 1;
          }
        }
      });
    }

    return counts;
  }, [planets]);

  // Calculate total planets with valid signs
  const totalPlanets = React.useMemo(() => {
    return Object.values(elementalCounts).reduce((sum, count) => sum + count, 0);
  }, [elementalCounts]);

  // Calculate percentages
  const elementalPercentages = React.useMemo(() => {
    if (totalPlanets === 0) return { fire: 0, earth: 0, air: 0, water: 0 };
    
    return {
      fire: (elementalCounts.fire / totalPlanets) * 100,
      earth: (elementalCounts.earth / totalPlanets) * 100,
      air: (elementalCounts.air / totalPlanets) * 100,
      water: (elementalCounts.water / totalPlanets) * 100,
    };
  }, [elementalCounts, totalPlanets]);

  // Determine dominant element
  const dominantElement = React.useMemo(() => {
    if (totalPlanets === 0) return null;
    
    const elements = ["fire", "earth", "air", "water"] as const;
    return elements.reduce((max, element) => 
      elementalCounts[element] > elementalCounts[max] ? element : max
    , elements[0]);
  }, [elementalCounts, totalPlanets]);

  // Element icons and descriptions
  const elementInfo = {
    fire: {
      icon: <Flame className="h-5 w-5" />,
      color: "text-red-500",
      bgColor: "bg-red-500",
      lightBgColor: "bg-red-100",
      description: "Energetic, passionate, and action-oriented. Favors aggressive play and high-scoring games.",
    },
    earth: {
      icon: <Mountain className="h-5 w-5" />,
      color: "text-green-600",
      bgColor: "bg-green-600",
      lightBgColor: "bg-green-100",
      description: "Stable, practical, and reliable. Favors defensive strategies and consistent performance.",
    },
    air: {
      icon: <Wind className="h-5 w-5" />,
      color: "text-blue-400",
      bgColor: "bg-blue-400",
      lightBgColor: "bg-blue-100",
      description: "Intellectual, communicative, and adaptable. Favors strategic play and creative tactics.",
    },
    water: {
      icon: <Droplets className="h-5 w-5" />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500",
      lightBgColor: "bg-indigo-100",
      description: "Emotional, intuitive, and sensitive. Favors fluid play and emotional momentum.",
    },
  };

  return (
    <div className="border border-slate-200/50 bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
          <div className="flex space-x-1 mr-2">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
          </div>
          Elemental Balance
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-slate-600">
          Distribution of astrological elements affecting today's games
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-2 sm:py-4">
        {/* Elemental Distribution */}
        <section>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
            Current Elemental Distribution
          </h3>
          
          <div className="bg-gray-200 rounded-full h-6 sm:h-8 overflow-hidden shadow-sm mb-3 sm:mb-4">
            {["fire", "earth", "air", "water"].map((element, index) => {
              const elementPlanets = Object.entries(planets).filter(
                ([_, planet]) => planet?.sign && getSignElement(planet.sign) === element.charAt(0).toUpperCase() + element.slice(1)
              );
              const count = elementPlanets.length;
              const totalPlanets = Object.keys(planets).length || 1;
              const percentage = (count / totalPlanets) * 100;
              const width = `${percentage}%`;
              
              return (
                <div
                  key={element}
                  className={`h-full inline-block transition-all duration-300 ${elementInfo[element].bgColor} ${
                    index === 0 ? 'rounded-l-full' : index === 3 ? 'rounded-r-full' : ''
                  }`}
                  style={{ width }}
                  aria-label={`${element} ${percentage.toFixed(0)}%`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-between text-[10px] xs:text-xs text-slate-600 mb-2">
            {["fire", "earth", "air", "water"].map((element) => {
              const elementPlanets = Object.entries(planets).filter(
                ([_, planet]) => planet?.sign && getSignElement(planet.sign) === element.charAt(0).toUpperCase() + element.slice(1)
              );
              const count = elementPlanets.length;
              const totalPlanets = Object.keys(planets).length || 1;
              const percentage = (count / totalPlanets) * 100;
              
              return (
                <div key={element} className="flex items-center justify-center sm:justify-start">
                  <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded ${elementInfo[element].color} whitespace-nowrap`}>
                    {element.charAt(0).toUpperCase() + element.slice(1)}: {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
          {/* Dominant element display removed as per user request */}
        </section>

        {/* Element Influence */}
        <section className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
            Element Influence Insights
          </h3>
          
          {dominantElement ? (
            <div className={`p-2 sm:p-3 rounded-lg ${elementInfo[dominantElement].lightBgColor}`}>
              <div className="flex items-center mb-1 sm:mb-2">
                <div className={`p-1 sm:p-1.5 rounded-full ${elementInfo[dominantElement].bgColor} text-white mr-2`}>
                  {elementInfo[dominantElement].icon}
                </div>
                <h4 className={`text-sm font-medium ${elementInfo[dominantElement].color}`}>
                  {dominantElement.charAt(0).toUpperCase() + dominantElement.slice(1)} Dominant
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-700">
                {elementInfo[dominantElement].description}
              </p>
            </div>
          ) : (
            <div className="p-2 sm:p-3 rounded-lg bg-slate-50">
              <p className="text-xs sm:text-sm text-slate-700">
                No dominant element detected or insufficient planetary data available.
              </p>
            </div>
          )}

          <div className="mt-3 sm:mt-4">
            <h4 className="text-[10px] xs:text-xs font-medium text-slate-500 mb-1 sm:mb-2">
              Planets by Element
            </h4>
            <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 sm:gap-3">
              {["fire", "earth", "air", "water"].map((element) => (
                <div 
                  key={element} 
                  className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className={`flex items-center justify-center sm:justify-start mb-0.5 sm:mb-1 ${elementInfo[element].color}`}>
                    <span className="text-xs sm:text-sm">{elementInfo[element].icon}</span>
                    <span className="ml-1 text-[10px] xs:text-xs font-medium capitalize">
                      {element}
                    </span>
                  </div>
                  <div className="text-[10px] xs:text-xs text-slate-600 text-center sm:text-left line-clamp-2">
                    {Object.entries(planets)
                      .filter(([_, planet]) => planet?.sign && getSignElement(planet.sign) === element.charAt(0).toUpperCase() + element.slice(1))
                      .map(([name]) => name)
                      .join(", ") || "None"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </CardContent>
    </div>
  );
};

export default ElementalBalance;
