import React from 'react';
import { ZodiacSign } from '@/types/astrology';

interface VoidMoonStatusProps {
  voidMoon?: {
    isVoid: boolean;
    start?: string;
    end?: string;
  };
  moonPhase?: any; // Replace with proper type
  moonSign?: ZodiacSign;
  getMoonAspectMessage: (moonPhase: any, sign?: ZodiacSign) => string;
}

export const VoidMoonStatus: React.FC<VoidMoonStatusProps> = ({
  voidMoon,
  moonPhase,
  moonSign,
  getMoonAspectMessage,
}) => {
  if (!voidMoon) return null;

  const isVoid = voidMoon.isVoid;
  
  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100 shadow-sm overflow-hidden">
      <div className="p-3 border-b border-amber-100">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-slate-800 flex items-center text-sm">
            <div className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${isVoid ? 'bg-red-500' : 'bg-green-500'}`}></div>
            Void of Course Status
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isVoid ? 'bg-red-100 text-red-800' : 'bg-red-50 text-red-700'}`}>
            {isVoid ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <div className="p-3">
        <p className="text-sm text-slate-700 mb-2">
          {isVoid && voidMoon.end
            ? `Moon is void of course until ${new Date(voidMoon.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            : getMoonAspectMessage(moonPhase, moonSign)}
        </p>
        
        {isVoid && voidMoon.start && voidMoon.end && (
          <div className="space-y-3 mt-3">
            <div>
              <div className="w-full bg-amber-100 rounded-full h-1.5 mb-1">
                <div 
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(5, Math.min(100, 
                      (new Date().getTime() - new Date(voidMoon.start).getTime()) / 
                      (new Date(voidMoon.end).getTime() - new Date(voidMoon.start).getTime()) * 100
                    ))}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-amber-700">
                <span>Started: {new Date(voidMoon.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span>Ends: {new Date(voidMoon.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            
            <div className={`p-2 rounded-lg border text-xs ${isVoid ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
              <p className={`font-medium mb-1 ${isVoid ? 'text-red-800' : 'text-slate-700'}`}>
                {isVoid 
                  ? '⚠️ Void of Course Moon'
                  : '✓ Strong Lunar Aspects'}
              </p>
              <p className={isVoid ? 'text-red-700' : 'text-slate-600'}>
                {isVoid
                  ? 'The moon is not making any major aspects. Game outcomes may be more unpredictable during this period.'
                  : getMoonAspectMessage(moonPhase, moonSign)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoidMoonStatus;
