import React from 'react';

interface MoonPhaseInfoCardProps {
  moonPhase?: {
    nextFullMoon?: string;
  };
  moonData?: {
    degree?: number;
    minute?: number;
  };
}

export const MoonPhaseInfoCard: React.FC<MoonPhaseInfoCardProps> = ({
  moonPhase,
  moonData,
}) => {
  return (
    <>
      <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
        <div className="text-[10px] uppercase text-slate-500 font-medium mb-0.5 truncate">
          Next Full Moon
        </div>
        <div className="font-semibold text-indigo-700 text-sm">
          {moonPhase?.nextFullMoon 
            ? new Date(moonPhase.nextFullMoon).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: '2-digit'
              })
            : '—'}
        </div>
      </div>
      <div className="bg-white p-2 rounded-lg border border-slate-100 flex flex-col">
        <div className="text-[10px] uppercase text-slate-500 font-medium mb-0.5 truncate">
          Zodiac Degree
        </div>
        <div className="font-semibold text-indigo-700 text-sm">
          {moonData?.degree ? `${Math.floor(moonData.degree)}°` : '—'}
        </div>
      </div>
    </>
  );
};

export default MoonPhaseInfoCard;
