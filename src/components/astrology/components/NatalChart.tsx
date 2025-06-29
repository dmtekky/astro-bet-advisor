import React, { useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NatalChartProps, AstroChartInstance } from '../utils/types';
import { formatAstroChartData } from '../utils/chartUtils';
import ChartLoading from './ChartLoading';
import ChartError from './ChartError';
import ChartPlaceholder from './ChartPlaceholder';

// Declare AstroChart as a global variable since it's loaded via script tag
declare global {
  interface Window {
    AstroChart: any;
  }
}

/**
 * Component for rendering the natal chart using AstroChart library
 */
export const NatalChart: React.FC<NatalChartProps> = ({
  astroData,
  isLoading,
  error,
  onDownload,
  onShare,
  isDownloading
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const astroChartRef = useRef<AstroChartInstance | null>(null);

  // Initialize and cleanup AstroChart instance
  useEffect(() => {
    if (!containerRef.current || !astroData || !astroData.planets) return;

    // Create a dedicated div for AstroChart
    const container = containerRef.current;
    const existingChart = container.querySelector('#natal-chart-astro');
    
    if (existingChart) {
      existingChart.remove();
    }

    const astroChartDiv = document.createElement('div');
    astroChartDiv.id = 'natal-chart-astro';
    astroChartDiv.style.width = '100%';
    astroChartDiv.style.height = '100%';
    astroChartDiv.style.position = 'absolute';
    astroChartDiv.style.top = '0';
    astroChartDiv.style.left = '0';
    astroChartDiv.style.zIndex = '25';
    container.appendChild(astroChartDiv);

    try {
      // Initialize AstroChart with proper settings
      const chartSize = Math.min(container.offsetWidth, container.offsetHeight);
      const chartSettings = {
        COLORS: {
          background: 'transparent',
          aspects: {
            stroke: {
              conjunction: '#FF0000',
              opposition: '#0000FF',
              trine: '#00FF00',
              square: '#FF9900',
              sextile: '#00FFFF',
            }
          },
        },
        ASPECTS: {
          conjunction: { degree: 0, orbit: 8, display: true, color: '#FF0000' },
          opposition: { degree: 180, orbit: 8, display: true, color: '#0000FF' },
          trine: { degree: 120, orbit: 8, display: true, color: '#00FF00' },
          square: { degree: 90, orbit: 8, display: true, color: '#FF9900' },
          sextile: { degree: 60, orbit: 6, display: true, color: '#00FFFF' }
        },
        SHOW_ASPECTS: true,
        SHOW_POINTS: true,
        SHOW_DIGNITIES: true
      };

      // Create the chart instance
      if (window.AstroChart) {
        astroChartRef.current = new window.AstroChart('natal-chart-astro', chartSize, chartSize, chartSettings);

        // Format data for AstroChart
        const chartData = formatAstroChartData(astroData);

        // Render the chart
        astroChartRef.current.radix(chartData);

        // Log for debugging
        console.log('Rendering AstroChart with data:', chartData);
        console.log('Geo data from astroData:', {
          latitude: astroData.latitude,
          longitude: astroData.longitude,
          location: astroData.location
        });
      } else {
        console.error('AstroChart library not loaded');
      }
    } catch (error) {
      console.error('Error initializing AstroChart:', error);
    }

    // Cleanup on unmount
    return () => {
      if (astroChartRef.current && typeof astroChartRef.current.destroy === 'function') {
        try {
          astroChartRef.current.destroy();
        } catch (error) {
          console.error('Error destroying AstroChart:', error);
        }
      }
      
      if (astroChartDiv && astroChartDiv.parentNode) {
        astroChartDiv.parentNode.removeChild(astroChartDiv);
      }
    };
  }, [astroData]);

  // Render appropriate state
  if (isLoading) {
    return <ChartLoading />;
  }

  if (error) {
    return <ChartError />;
  }

  if (!astroData || !astroData.planets) {
    return <ChartPlaceholder />;
  }

  return (
    <div className="natal-chart-container relative p-4 rounded-lg overflow-hidden">
      <div 
        style={{
          background: 'radial-gradient(circle at center, #0c1445 0%, #05071f 100%)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1
        }}
      />
      
      {/* Starry background effect */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `twinkle ${Math.random() * 5 + 3}s infinite ease-in-out`
            }}
          />
        ))}
      </div>

      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-slate-800 border-slate-700 text-white">
              <p>This is your natal chart showing the positions of planets at your birth time. The chart displays planetary aspects and their relationships.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button 
          variant="outline" 
          onClick={onDownload}
          disabled={isDownloading}
          className="text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600"
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onShare}
          disabled={isDownloading}
          className="text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600"
        >
          Share
        </Button>
      </div>

      <div 
        ref={containerRef} 
        className="relative z-10 aspect-square"
        style={{ minHeight: '300px' }}
      >
        <canvas ref={chartRef} className="w-full h-full" />
      </div>
      
      <div className="mt-4 text-center text-sm text-slate-300">
        <p>Natal Chart - {astroData.location || 'Unknown Location'}</p>
      </div>
    </div>
  );
};

export default NatalChart;
