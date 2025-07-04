import React, { useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { NatalChartProps, AstroChartInstance } from '../utils/types';
import { formatAstroChartData } from '../utils/chartUtils';
import ChartLoading from './ChartLoading';
import ChartError from './ChartError';
import ChartPlaceholder from './ChartPlaceholder';

// Define the AstroChart type based on the actual library's API
type AstroChartType = {
  new (elementId: string, width: number, height: number, settings?: any): AstroChartInstance;
};

// Global variable to store the AstroChart module
let AstroChart: AstroChartType | null = null;

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
    // Only run on client side
    if (typeof window === 'undefined') {
      return () => {}; // Return empty cleanup function
    }

    console.log('%c[NatalChart] Initializing chart', 'color: #00ff00; font-weight: bold;', 'Received astroData:', astroData);

    if (!containerRef.current || !astroData || !astroData.planets) {
      console.log('Missing required data for chart initialization');
      return () => {}; // Return empty cleanup function
    }

    const container = containerRef.current;
    
    // Clear any existing chart
    const existingChart = container.querySelector('#natal-chart-astro');
    if (existingChart) {
      container.removeChild(existingChart);
    }

    // Create container for the chart
    const astroChartDiv = document.createElement('div');
    astroChartDiv.id = 'natal-chart-astro';
    astroChartDiv.style.width = '100%';
    astroChartDiv.style.height = '100%';
    astroChartDiv.style.position = 'absolute';
    astroChartDiv.style.top = '0';
    astroChartDiv.style.left = '0';
    astroChartDiv.style.zIndex = '25';
    
    // Append the chart container to the DOM
    container.appendChild(astroChartDiv);

    let chartInstance: AstroChartInstance | null = null;
    
    // Initialize the chart asynchronously
    const initializeChart = async () => {
      try {
        // Ensure AstroChart is loaded
        if (!AstroChart) {
          const module = await import('@astrodraw/astrochart');
          AstroChart = module.default;
        }

        console.log('AstroChart module loaded, initializing chart...');
        
        const chartSize = Math.min(container.offsetWidth, container.offsetHeight);
        const chartSettings = {
          COLORS: {
            bkg: null,
            text: '#f8fafc',
            accent: '#f59e0b',
            accentLight: '#fbbf24',
            grid: '#334155',
            aspects: {
              stroke: {
                conjunction: '#f59e0b',
                opposition: '#fbbf24',
                trine: '#f8fafc',
                square: '#94a3b8',
                sextile: '#60a5fa',
              }
            },
          },
          ASPECTS: {
            conjunction: { degree: 0, orbit: 8, display: true, color: '#f59e0b' },
            opposition: { degree: 180, orbit: 8, display: true, color: '#fbbf24' },
            trine: { degree: 120, orbit: 8, display: true, color: '#f8fafc' },
            square: { degree: 90, orbit: 8, display: true, color: '#94a3b8' },
            sextile: { degree: 60, orbit: 6, display: true, color: '#60a5fa' }
          },
          SHOW_ASPECTS: true,
          SHOW_POINTS: true,
          SHOW_DIGNITIES: true,
          RESPONSIVE: true,
          WIDTH: chartSize,
          HEIGHT: chartSize
        };

        // Format the data for AstroChart
        const chartData = formatAstroChartData(astroData);
        
        // Initialize the chart with the correct arguments
        // AstroChart expects: (elementId, width, height, settings)
        chartInstance = new AstroChart(
          'natal-chart-container',
          chartSize,
          chartSize,
          chartSettings
        );
        
        // Use the radix method to render the chart with data
        if (chartInstance && typeof chartInstance.radix === 'function') {
          chartInstance.radix(chartData);
        } else {
          console.error('AstroChart instance does not have a radix method');
        }
        
        // Store the chart instance in the ref
        astroChartRef.current = chartInstance;
        
      } catch (error) {
        console.error('Error initializing AstroChart:', error);
        // You might want to update an error state here to show an error message
      }
    };

    // Start the initialization
    initializeChart();

    // Cleanup function
    return () => {
      // Remove the chart container if it exists
      if (containerRef.current) {
        const chartElement = containerRef.current.querySelector('#natal-chart-astro');
        if (chartElement && chartElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(chartElement);
        }
      }
      
      // Clean up the chart instance if it exists
      if (chartInstance) {
        // Check if the chart instance has a destroy method
        if (typeof chartInstance.destroy === 'function') {
          try {
            chartInstance.destroy();
          } catch (err) {
            console.error('Error destroying AstroChart instance:', err);
          }
        }
        // Clear the reference
        astroChartRef.current = null;
      }
    };
  }, [astroData]); // Only re-run if astroData changes

  // Handle loading state
  if (isLoading) {
    return <ChartLoading />;
  }

  // Handle error state
  if (error) {
    return <ChartError error={error} onRetry={() => window.location.reload()} />;
  }

  // Handle case when no data is available
  if (!astroData || !astroData.planets) {
    return <ChartPlaceholder />;
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full relative" id="natal-chart-container" />
      
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onDownload}
                disabled={isDownloading}
                className="bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 text-white"
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download Chart</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onShare}
                className="bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 text-white"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share Chart</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default NatalChart;
