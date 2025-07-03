import React, { useRef, useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NatalChartProps, AstroChartInstance } from '../utils/types';
import { formatAstroChartData } from '../utils/chartUtils';
import ChartLoading from './ChartLoading';
import ChartError from './ChartError';
import ChartPlaceholder from './ChartPlaceholder';

// Import AstroChart directly
import AstroChart from '@astrodraw/astrochart';

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
  const astroChartRef = useRef<AstroChartInstance | null>(null);

  useEffect(() => {
    console.log('%c[NatalChart] Direct Import Logic Active', 'color: #00ff00; font-weight: bold;', 'Received astroData:', astroData);

    if (!containerRef.current || !astroData || !astroData.planets) {
      console.log('Missing required data for chart initialization');
      return;
    }

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

    const initializeChart = () => {
      try {
        // AstroChart should always be available now since we're importing it directly
        console.log('Initializing chart with direct import...');

        const chartSize = Math.min(container.offsetWidth, container.offsetHeight);
        const chartSettings = {
          COLORS: {
            bkg: null,
            text: '#f8fafc',      // Light gray for general text
            accent: '#f59e0b',    // Brand orange
            accentLight: '#fbbf24', // Lighter orange
            grid: '#334155',      // Medium gray for grid lines
            // Aspect colors - adjusted for cosmic orange and white theme
            aspects: {
              stroke: {
                conjunction: '#f59e0b', // Orange
                opposition: '#fbbf24', // Lighter Orange
                trine: '#f8fafc',      // White
                square: '#94a3b8',     // Gray
                sextile: '#60a5fa',    // Blue for contrast, or another shade of orange/white
              }
            },
          },
          ASPECTS: {
            conjunction: { degree: 0, orbit: 8, display: true, color: '#f59e0b' }, // Orange
            opposition: { degree: 180, orbit: 8, display: true, color: '#fbbf24' }, // Lighter Orange
            trine: { degree: 120, orbit: 8, display: true, color: '#f8fafc' },      // White
            square: { degree: 90, orbit: 8, display: true, color: '#94a3b8' },     // Gray
            sextile: { degree: 60, orbit: 6, display: true, color: '#60a5fa' }    // Blue for contrast
          },
          SHOW_ASPECTS: true,
          SHOW_POINTS: true,
          SHOW_DIGNITIES: true
        };

        // Create the chart instance
        astroChartRef.current = new AstroChart('natal-chart-astro', chartSize, chartSize, chartSettings);

        // Format data for AstroChart
        const chartData = formatAstroChartData(astroData);
        console.log('Data formatted for AstroChart:', chartData);

        // Render the chart
        astroChartRef.current.radix(chartData);

        console.log('AstroChart successfully initialized and rendered');
        console.log('Rendering AstroChart with data:', chartData);
        console.log('Geo data from astroData:', {
          latitude: astroData.latitude,
          longitude: astroData.longitude,
          location: astroData.location
        });
      } catch (err) {
        console.error('Error initializing AstroChart:', err);
      }
    };

    // Initialize chart immediately since we have direct access to AstroChart
    initializeChart();

    // Cleanup function
    return () => {      
      if (astroChartRef.current) {
        console.log('[NatalChart] Cleaning up AstroChart instance');
        astroChartRef.current = null;
      }

      if (container.querySelector('#natal-chart-astro')) {
        container.querySelector('#natal-chart-astro')?.remove();
      }
    };
  }, [astroData]);

  // Render appropriate state based on props
  if (isLoading === true) {
    return <ChartLoading />;
  }

  if (error) {
    return <ChartError error={error} message="Failed to load chart" actionText="Retry" onAction={() => {}} />;
  }

  if (!astroData || !astroData.planets) {
    return <ChartPlaceholder />;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div 
        ref={containerRef} 
        className="relative z-10 aspect-square w-full"
        style={{ minHeight: '300px' }}
      />
      
      {/* Download/Share Buttons */}
      <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-700/50 w-full">
        <button 
          onClick={onDownload}
          disabled={isDownloading}
          className="px-4 py-2 text-sm flex items-center gap-2 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
        {onShare && (
          <button 
            onClick={onShare}
            className="px-4 py-2 text-sm flex items-center gap-2 text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        )}
      </div>
    </div>
  );
};

export default NatalChart;
