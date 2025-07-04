import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import ChartLoading from './ChartLoading';
import ChartError from './ChartError';
import ChartPlaceholder from './ChartPlaceholder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { NatalChartProps } from '../utils/types';
import { formatAstroChartData } from '../utils/chartUtils';

// Create a client-only component wrapper
const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) return null;
  return <>{children}</>;
};

/**
 * NatalChart component for rendering astrological charts using AstroChart library
 */
const NatalChart: React.FC<NatalChartProps> = ({
  astroData,
  width = 600,
  height = 600,
  isLoading = false,
  error = null,
  onDownload,
  onShare,
  isDownloading = false,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartError, setChartError] = useState<Error | null>(error);
  
  // Chart settings
  const chartSize = Math.min(width, height);
  const chartSettings = {
    MARGIN: 100,                // chart margin
    SYMBOL_SCALE: 0.5,          // chart symbol scale
    SYMBOL_AXIS_CORRECTION: 2,  // chart symbol axis correction
    CUSPS_STROKE: '#999',       // chart cusps stroke color
    STROKE: '#000',             // chart stroke color
    SIGNS_COLOR: true,          // chart signs colors
    SHOW_ASPECT_GRID: true,     // chart aspect grid
    SHOW_ASPECTS: true,         // chart aspects
    ASPECTS_WITH_POINTS: true,  // chart aspects with points
    ASPECTS_WITH_CUSPS: false,  // chart aspects with cusps
    CIRCLE_COLOR: '#333',       // chart circle color
    CUSPS_COLOR: '#333',        // chart cusps color
    CIRCLE_ONLY: false,         // chart circle only
    ASPECTS_STROKE: '#333',     // chart aspects stroke color
    ASPECTS_STROKE_WIDTH: 1,    // chart aspects stroke width
    COLOR_BACKGROUND: 'transparent', // chart background color
  };

  // The actual chart renderer that only runs on the client
  const ChartRenderer = () => {
    const [renderAttempt, setRenderAttempt] = useState(0);
    
    useEffect(() => {
      if (!astroData) {
        setChartError(new Error('No astrological data provided'));
        return;
      }
      
      let chartInstance: any = null;
      let isMounted = true;
      
      const initializeChart = async () => {
        try {
          console.log('[NatalChart] Attempting to dynamically import AstroChart...');
          
          // Use a try-catch to handle any import errors
          let AstroChart;
          try {
            const module = await import('@astrodraw/astrochart');
            AstroChart = module.default;
            console.log('[NatalChart] AstroChart module loaded successfully');
          } catch (importError) {
            console.error('[NatalChart] Failed to import AstroChart:', importError);
            throw new Error(`Failed to load AstroChart module: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
          }
          
          if (!isMounted) {
            console.log('[NatalChart] Component unmounted during import, aborting');
            return;
          }
          
          // Create container if it doesn't exist
          if (containerRef.current) {
            const existingChart = containerRef.current.querySelector('#natal-chart-container');
            if (existingChart) {
              existingChart.remove();
            }
            
            const chartContainer = document.createElement('div');
            chartContainer.id = 'natal-chart-container';
            chartContainer.style.width = `${chartSize}px`;
            chartContainer.style.height = `${chartSize}px`;
            containerRef.current.appendChild(chartContainer);
            
            console.log('[NatalChart] Chart container created with ID:', chartContainer.id);
          } else {
            throw new Error('Container ref is null');
          }

          // Format the data for AstroChart
          const chartData = formatAstroChartData(astroData);
          console.log('[NatalChart] Formatted chart data:', chartData);

          // Initialize the chart with the correct arguments
          console.log('[NatalChart] Creating AstroChart instance...');
          chartInstance = new AstroChart(
            'natal-chart-container',
            chartSize,
            chartSize,
            chartSettings
          );
          console.log('[NatalChart] AstroChart instance created');

          // Render the chart with data
          if (chartInstance && typeof chartInstance.radix === 'function') {
            console.log('[NatalChart] Calling radix method with chart data...');
            chartInstance.radix(chartData);
            console.log('[NatalChart] Chart rendered successfully');
            setChartError(null);
          } else {
            throw new Error('AstroChart instance does not have a radix method');
          }
        } catch (error) {
          console.error('[NatalChart] Error initializing AstroChart:', error);
          setChartError(error instanceof Error ? error : new Error('Failed to initialize chart'));
          if (onError) onError(error instanceof Error ? error : new Error('Failed to initialize chart'));
        }
      };

      // Initialize chart
      initializeChart();

      // Cleanup function
      return () => {
        console.log('[NatalChart] Component unmounting, cleaning up...');
        isMounted = false;
        
        if (chartInstance) {
          if (typeof chartInstance.destroy === 'function') {
            try {
              console.log('[NatalChart] Destroying chart instance...');
              chartInstance.destroy();
            } catch (e) {
              console.error('[NatalChart] Error destroying chart:', e);
            }
          }
        }

        // Remove chart container
        if (containerRef.current) {
          const chartElement = containerRef.current.querySelector('#natal-chart-container');
          if (chartElement) {
            console.log('[NatalChart] Removing chart container from DOM');
            chartElement.remove();
          }
        }
      };
    }, [renderAttempt]);

    // Add retry button if there's an error
    if (chartError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/50 text-white">
          <p className="mb-4 text-red-300">{chartError.message}</p>
          <button 
            onClick={() => setRenderAttempt(prev => prev + 1)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      );
    }
    
    return null; // The chart is rendered directly to the DOM
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Download/Share buttons */}
      <div className="absolute top-2 right-2 z-10 flex space-x-2">
        {onDownload && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onDownload}
                  disabled={isDownloading}
                  className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
                  title="Download chart"
                >
                  <Download size={18} className="text-slate-700" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download Chart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {onShare && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onShare}
                  disabled={isDownloading}
                  className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
                  title="Share chart"
                >
                  <Share2 size={18} className="text-slate-700" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share Chart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Chart container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden natal-chart-container"
      >
        <ClientOnly>
          <ChartRenderer />
        </ClientOnly>
        
        {/* Fallback for server-side rendering */}
        <noscript>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
            <p>JavaScript is required to view this chart</p>
          </div>
        </noscript>
      </div>
    </div>
  );
};

export default NatalChart;
