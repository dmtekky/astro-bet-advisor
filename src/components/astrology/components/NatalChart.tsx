import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import ChartLoading from './ChartLoading.js';
import ChartError from './ChartError.js';
import ChartPlaceholder from './ChartPlaceholder.js';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip.js';
import { NatalChartProps } from '../utils/types.js';
import { Origin, Horoscope } from 'circular-natal-horoscope-js';


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
  
  const chartSize = Math.min(width, height);

  // The actual chart renderer that only runs on the client
  const ChartRenderer = ({ astroData }: { astroData: any }) => {
    const [renderAttempt, setRenderAttempt] = useState(0); // Keep renderAttempt for retry logic

    useEffect(() => {
      console.log('[NatalChart] Component mounted with astroData:', JSON.stringify(astroData, null, 2));

      if (!astroData) {
        console.log('[NatalChart] No astrological data provided');
        setChartError(new Error('No astrological data provided'));
        return;
      }
      const abortController = new AbortController();
      let isMounted = true;
      
      const initializeChart = () => {
        try {
          if (!isMounted || !astroData || !astroData.birthData) {
            console.log('[NatalChart] Component unmounted or no birth data, aborting initialization');
            return;
          }

          const { birthData } = astroData;
          const { year, month, date, hour, minute, latitude, longitude, timezone } = birthData;

          if (
            year === undefined || month === undefined || date === undefined ||
            hour === undefined || minute === undefined ||
            latitude === undefined || longitude === undefined || timezone === undefined
          ) {
            console.log('[NatalChart] Incomplete birth data, setting error');
            setChartError(new Error('Incomplete birth data for chart rendering.'));
            return;
          }

          // Create container if it doesn't exist
          if (containerRef.current) {
            // Remove existing canvas if any
            const existingCanvas = containerRef.current.querySelector('canvas');
            if (existingCanvas) {
              existingCanvas.remove();
            }

            const canvas = document.createElement('canvas');
            canvas.id = 'natal-chart-canvas';
            canvas.width = chartSize;
            canvas.height = chartSize;
            containerRef.current.appendChild(canvas);
            console.log('[NatalChart] Chart canvas created');

            // Initialize CircularNatalHoroscope
            const origin = new Origin({
              year,
              month: month - 1, // Month is 0-indexed in CircularNatalHoroscope
              date,
              hour,
              minute,
              latitude,
              longitude,

            });

            const natalHoroscope = new Horoscope({
              origin: origin,
              houseSystem: "placidus", 
              zodiac: "tropical",      
              aspectPoints: ['bodies', 'points', 'angles'],
              aspectWithPoints: ['bodies', 'points', 'angles'],
              aspectTypes: ["major", "minor"],
              language: 'en'
            });
            console.log('[NatalChart] CircularNatalHoroscope instance created');

            // Draw the horoscope
            // @ts-ignore: draw exists at runtime
(natalHoroscope as any).draw('#' + canvas.id);
            
            console.log('[NatalChart] Chart drawn successfully');
            setChartError(null);

          } else {
            throw new Error('Container ref is null');
          }
        } catch (error) {
          console.error('[NatalChart] Error during initialization:', error);
          setChartError(error instanceof Error ? error : new Error('Failed to initialize chart'));
          if (onError) onError(error instanceof Error ? error : new Error('Failed to initialize chart'));
        }

        return () => {
          console.log('[NatalChart] Component unmounting...');
          isMounted = false;
          if (containerRef.current) {
            const chartElement = containerRef.current.querySelector('#natal-chart-canvas');
            if (chartElement) {
              chartElement.remove();
              console.log('[NatalChart] Chart canvas removed');
            }
          }
        };
      };

      initializeChart(); // Call initializeChart here

    }, [renderAttempt, astroData, chartSize]); // Add chartSize to dependencies

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
          <ChartRenderer astroData={astroData} />
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
