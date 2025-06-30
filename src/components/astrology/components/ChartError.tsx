import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ChartErrorProps {
  error?: Error;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

/**
 * Error state component for chart components
 */
export const ChartError: React.FC<ChartErrorProps> = ({ 
  error, 
  message, 
  actionText = 'Retry', 
  onAction 
}) => {
  const errorMessage = message || error?.message || 'There was an error loading your astrological data. Please try again later.';
  
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="w-full">
      <div className="relative p-4 rounded-lg overflow-hidden bg-gradient-to-br from-red-900/80 to-purple-900/80 backdrop-blur-sm border border-red-500/30 shadow-lg">
        <div className="absolute inset-0 bg-[url('/cosmic-bg.webp')] bg-cover opacity-20 mix-blend-overlay"></div>

        <div className="flex flex-col items-center justify-center py-12 relative z-10">
          <AlertTriangle className="h-10 w-10 text-red-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-4">Unable to load chart data</h3>
          <p className="text-red-200 mb-6 text-center max-w-md">{errorMessage}</p>
          <Button 
            variant="outline" 
            className="text-white border-red-400 hover:bg-red-700/50"
            onClick={handleAction}
          >
            {actionText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChartError;
