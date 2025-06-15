import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

interface LunarTechnicalAnalysisProps {
  moonData?: {
    speed?: number;
    degree?: number;
    minute?: number;
  };
}

export const LunarTechnicalAnalysis: React.FC<LunarTechnicalAnalysisProps> = ({
  moonData,
}) => {
  return (
    <div className="bg-white p-3 rounded-md border border-slate-200">
      <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
        <Activity className="h-4 w-4 mr-1 text-slate-400" /> Lunar Technical Analysis
      </h4>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Moon Speed</span>
            <span>{moonData?.speed !== undefined 
              ? `${Math.abs(moonData.speed).toFixed(2)}°/day` 
              : 'Unknown'}
            </span>
          </div>
          <Progress 
            value={moonData?.speed !== undefined 
              ? Math.min(Math.abs(moonData.speed) / 15 * 100, 100) 
              : 50} 
            className="h-2"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Lunar Sign Position</span>
            <span>
              {moonData?.degree !== undefined 
                ? `${Math.floor(moonData.degree)}°${moonData.minute ? ` ${moonData.minute}'` : ''}` 
                : 'Unknown'}
            </span>
          </div>
          <Progress 
            value={moonData?.degree !== undefined 
              ? (moonData.degree / 30) * 100 
              : 50} 
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
};

export default LunarTechnicalAnalysis;
