import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Moon } from 'lucide-react';
import { MoonPhaseInfo } from '@/types/astro';

interface MoonPhaseInfoCardProps {
  moonPhase: MoonPhaseInfo;
  moonSign: string;
  moonDegree: number;
  moonMinute: number;
  voidMoon?: {
    isVoid: boolean;
    startTime: string;
    endTime: string;
    nextSign: string;
  };
}

export const MoonPhaseInfoCard: React.FC<MoonPhaseInfoCardProps> = ({
  moonPhase,
  moonSign,
  moonDegree,
  moonMinute,
  voidMoon
}) => {
  // Helper function to format degrees and minutes for display
  const formatDegreesMinutes = (degrees: number, minutes: number): string => {
    return `${Math.floor(degrees)}°${minutes ? ` ${minutes}'` : ''}`;
  };

  return (
    <div className="border border-slate-200/50 bg-white/50 backdrop-blur-sm hover:shadow-md transition-shadow duration-300 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <Moon className="h-5 w-5 mr-2 text-indigo-500" /> Lunar & Void Status
        </CardTitle>
        <CardDescription className="text-slate-600">
          {voidMoon?.isVoid ? ' • Void of Course' : ' • Not Void of Course'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {/* Moon Phase Section with Visualization */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm">
          <div className="flex flex-col items-center md:flex-row md:items-start">
            <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-6 flex-shrink-0 border-[10px] border-indigo-600/90 shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
              {/* Moon phase visualization */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 rounded-full transition-all duration-1000 ease-in-out" 
                style={{
                  clipPath: `inset(0 ${50 - (moonPhase?.illumination || 0) * 50}% 0 0)`,
                  opacity: 0.95,
                  boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.8)'
                }}
              >
                {/* Add some subtle craters */}
                <div className="absolute w-4 h-4 bg-slate-200/30 rounded-full top-1/3 left-1/4"></div>
                <div className="absolute w-5 h-5 bg-slate-300/40 rounded-full top-2/3 left-1/2"></div>
                <div className="absolute w-3 h-3 bg-slate-200/50 rounded-full top-1/4 left-3/4"></div>
                <div className="absolute w-6 h-6 bg-slate-300/30 rounded-full top-3/4 left-1/3"></div>
                <div className="absolute w-3.5 h-3.5 bg-slate-200/40 rounded-full top-1/5 left-1/2"></div>
              </div>
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: '0 0 60px 15px rgba(99, 102, 241, 0.4)',
                  pointerEvents: 'none',
                  background: 'radial-gradient(circle at 30% 30%, rgba(199, 210, 254, 0.3), transparent 60%)'
                }}
              />
            </div>
            <div className="text-center md:text-left flex-1">
              <h4 className="text-2xl font-bold text-indigo-800 mb-1">
                Moon Phase
              </h4>
              <p className="text-sm text-indigo-600 mb-2">
                {moonPhase?.name || 'Current phase unknown'}
              </p>
              <div className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full mb-3">
                {moonPhase?.illumination ? `${Math.round(moonPhase.illumination * 100)}% Illuminated` : 'Illumination unknown'}
              </div>
              
              {/* Moon Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                  <div className="text-xs uppercase text-slate-500 font-medium mb-1">Moon Sign</div>
                  <div className="font-semibold text-indigo-700">{moonSign}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                  <div className="text-xs uppercase text-slate-500 font-medium mb-1">Zodiac Degree</div>
                  <div className="font-semibold text-indigo-700">
                    {moonDegree ? formatDegreesMinutes(moonDegree, moonMinute) : '—'}
                  </div>
                </div>
              </div>

              {/* Void of Course Moon Status */}
              {voidMoon && (
                <div className={`p-3 rounded-lg border ${
                  voidMoon.isVoid 
                    ? 'bg-red-50 border-red-100' 
                    : 'bg-green-50 border-green-100'
                }`}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-5 w-5 ${
                      voidMoon.isVoid ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {voidMoon.isVoid ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${
                        voidMoon.isVoid ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {voidMoon.isVoid ? 'Void of Course Moon' : 'Moon Not Void of Course'}
                      </h3>
                      <div className="mt-1 text-sm text-slate-600">
                        {voidMoon.isVoid 
                          ? `Void until ${new Date(voidMoon.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${voidMoon.nextSign})`
                          : `Next void: ${new Date(voidMoon.startTime).toLocaleDateString()}`}
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default MoonPhaseInfoCard;
