import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartLoadingProps {
  timeout?: number; // Timeout in milliseconds
  onRetry?: () => void;
}

/**
 * Loading state component for chart components with timeout handling
 */
export const ChartLoading: React.FC<ChartLoadingProps> = ({ 
  timeout = 15000, // Default 15 seconds timeout
  onRetry 
}) => {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    // Set a timeout to show an error message if loading takes too long
    const timeoutId = setTimeout(() => {
      setIsTimedOut(true);
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [timeout]);

  if (isTimedOut) {
    return (
      <div className="w-full">
        <div className="relative p-4 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/80 to-red-900/80 backdrop-blur-sm border border-slate-700/30 shadow-lg">
          <div className="absolute inset-0 bg-[url('/cosmic-bg.webp')] bg-cover opacity-20 mix-blend-overlay"></div>

          <div className="flex flex-col items-center justify-center py-12 relative z-10">
            <AlertTriangle className="h-10 w-10 text-amber-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-4">Loading Timed Out</h3>
            <p className="text-slate-300 mb-6 text-center">We're having trouble calculating your astrological data. This could be due to server load or incomplete birth information.</p>
            {onRetry && (
              <Button onClick={onRetry} variant="secondary">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
