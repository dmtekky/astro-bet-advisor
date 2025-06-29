import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Error state component for chart components
 */
export const ChartError: React.FC = () => {
  return (
    <div className="w-full">
      <div className="relative p-4 rounded-lg overflow-hidden bg-gradient-to-br from-red-900/80 to-purple-900/80 backdrop-blur-sm border border-red-500/30 shadow-lg">
        <div className="absolute inset-0 bg-[url('/cosmic-bg.webp')] bg-cover opacity-20 mix-blend-overlay"></div>

        <div className="flex flex-col items-center justify-center py-12 relative z-10">
          <h3 className="text-xl font-bold text-white mb-4">Unable to load chart data</h3>
          <p className="text-red-200 mb-6">There was an error loading your astrological data. Please try again later.</p>
          <Button 
            variant="outline" 
            className="text-white border-red-400 hover:bg-red-700/50"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChartError;
