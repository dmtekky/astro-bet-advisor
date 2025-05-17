import React from 'react';
import { Zap, Moon, Sun, Droplet, Thermometer, Wind, CloudRain, Cloud, SunMoon, Cloudy } from 'lucide-react';

const ASTRO_EVENTS = [
  { 
    id: 'moon_phase', 
    name: 'Moon Phase', 
    value: 75, 
    color: 'bg-purple-500',
    icon: <Moon className="h-4 w-4 text-purple-500" />,
    description: 'Waxing Gibbous - Strong emotional influence'
  },
  { 
    id: 'moon_sign', 
    name: 'Moon Sign', 
    value: 60, 
    color: 'bg-blue-500',
    icon: <Moon className="h-4 w-4 text-blue-500" />,
    description: 'In Cancer - Heightened intuition'
  },
  { 
    id: 'mercury_virgo', 
    name: 'Mercury in Virgo', 
    value: 45, 
    color: 'bg-green-500',
    icon: <Zap className="h-4 w-4 text-green-500" />,
    description: 'Analytical thinking enhanced'
  },
  { 
    id: 'venus_gemini', 
    name: 'Venus in Gemini', 
    value: 30, 
    color: 'bg-yellow-500',
    icon: <Droplet className="h-4 w-4 text-yellow-500" />,
    description: 'Social and communicative energy'
  },
  { 
    id: 'mars_pisces', 
    name: 'Mars in Pisces', 
    value: 65, 
    color: 'bg-red-500',
    icon: <Thermometer className="h-4 w-4 text-red-500" />,
    description: 'Intuitive action and creativity'
  },
  { 
    id: 'jupiter_cancer', 
    name: 'Jupiter in Cancer', 
    value: 55, 
    color: 'bg-indigo-500',
    icon: <Wind className="h-4 w-4 text-indigo-500" />,
    description: 'Emotional growth and expansion'
  },
  { 
    id: 'mercury_retrograde', 
    name: 'Mercury Retrograde', 
    value: 85, 
    color: 'bg-pink-500',
    icon: <CloudRain className="h-4 w-4 text-pink-500" />,
    description: 'Communication challenges likely'
  },
  { 
    id: 'sun_mars', 
    name: 'Sun-Mars Transit', 
    value: 40, 
    color: 'bg-orange-500',
    icon: <Sun className="h-4 w-4 text-orange-500" />,
    description: 'Strong willpower and energy'
  },
  { 
    id: 'sun_saturn', 
    name: 'Sun-Saturn Transit', 
    value: 25, 
    color: 'bg-gray-500',
    icon: <Cloud className="h-4 w-4 text-gray-500" />,
    description: 'Time for discipline and structure'
  },
  { 
    id: 'sun_jupiter', 
    name: 'Sun-Jupiter Transit', 
    value: 70, 
    color: 'bg-amber-500',
    icon: <SunMoon className="h-4 w-4 text-amber-500" />,
    description: 'Opportunities for growth and luck'
  },
];

function AstroStatus() {
  // Calculate overall astrological score (average of all events)
  const overallScore = Math.round(
    ASTRO_EVENTS.reduce((sum, event) => sum + event.value, 0) / ASTRO_EVENTS.length
  );

  // Determine overall status color
  const getStatusColor = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const statusColor = getStatusColor(overallScore);
  const statusText = overallScore >= 70 ? 'Favorable' : overallScore >= 40 ? 'Neutral' : 'Challenging';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Astrological Status</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}>
            {statusText} Conditions
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Astro Score</span>
            <span className="text-lg font-bold">{overallScore}<span className="text-sm text-gray-500">/100</span></span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${overallScore >= 70 ? 'bg-green-500' : overallScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${overallScore}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 -mr-2">
          {ASTRO_EVENTS.map((event) => (
            <div key={event.id} className="group relative p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  {event.icon}
                  <span className="font-medium text-gray-800">{event.name}</span>
                </div>
                <span className="font-semibold">{event.value}<span className="text-xs text-gray-400">/100</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div 
                  className={`h-2 rounded-full ${event.color}`}
                  style={{ width: `${event.value}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{event.description}</p>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <span className="text-white text-sm font-medium">View details</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default AstroStatus;
