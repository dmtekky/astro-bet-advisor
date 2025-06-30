import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartPlaceholderProps } from '../utils/types';

/**
 * Placeholder component shown when no chart data is available
 */
export const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({
  showForm,
  setShowForm,
  propBirthData
}) => {
  return (
    <div className="w-full h-full">
      <div className="relative p-4 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/80 to-indigo-900/80 backdrop-blur-sm border border-slate-700/30 shadow-lg h-full">
        <div className="absolute inset-0 bg-[url('/cosmic-bg.webp')] bg-cover opacity-20 mix-blend-overlay"></div>

        <div className="flex flex-col items-center justify-center py-12 relative z-10 h-full">
          <div className="bg-slate-800/50 p-4 rounded-full mb-6">
            <Calendar className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Birth Data Required</h3>
          <p className="text-slate-300 mb-6 text-center max-w-xs">
            Your natal chart will appear here once you've entered your birth information.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-xs">
            {[
              { icon: <Calendar className="h-5 w-5 text-blue-400 mb-2" />, label: "Birth Date" },
              { icon: <Clock className="h-5 w-5 text-purple-400 mb-2" />, label: "Birth Time" },
              { icon: <MapPin className="h-5 w-5 text-amber-400 mb-2" />, label: "Birth Place" }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center bg-slate-800/30 p-3 rounded-lg">
                {item.icon}
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPlaceholder;
