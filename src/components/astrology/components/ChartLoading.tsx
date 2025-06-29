import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading state component for chart components
 */
export const ChartLoading: React.FC = () => {
  return (
    <div className="w-full">
      <div className="relative p-4 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/80 to-indigo-900/80 backdrop-blur-sm border border-slate-700/30 shadow-lg">
        <div className="absolute inset-0 bg-[url('/cosmic-bg.webp')] bg-cover opacity-20 mix-blend-overlay"></div>

        <div className="flex flex-col items-center justify-center py-12 relative z-10">
          <Loader2 className="h-10 w-10 text-blue-400 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white mb-4">Loading Your Cosmic Data</h3>
          <p className="text-slate-300 mb-6">Calculating planetary positions and aspects...</p>
          <div className="w-full max-w-xs bg-slate-800/50 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartLoading;
