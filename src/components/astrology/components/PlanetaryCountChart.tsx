import React, { useRef, useEffect, useState } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlanetaryCountChartProps } from '../utils/types';
import { ZODIAC_SIGNS } from '../utils/types';
import { cleanupChartInstance } from '../utils/chartUtils';
import ChartLoading from './ChartLoading';
import ChartError from './ChartError';
import ChartPlaceholder from './ChartPlaceholder';

/**
 * Component for rendering the planetary count chart using Chart.js
 */
export const PlanetaryCountChart: React.FC<PlanetaryCountChartProps> = ({
  planetCounts,
  planetsPerSign = null,
  isLoading,
  error,
  onDownload,
  onShare,
  isDownloading,
  className = ''
}) => {
  // Convert planetCounts from object format to array format if needed
  const normalizedPlanetCounts = React.useMemo(() => {
    console.log('Planet counts received:', planetCounts);
    
    if (!planetCounts) return null;
    
    // If planetCounts is already an array, use it directly
    if (Array.isArray(planetCounts)) {
      return planetCounts;
    }
    
    // If planetCounts is an object, convert it to an array based on ZODIAC_SIGNS order
    if (typeof planetCounts === 'object') {
      return ZODIAC_SIGNS.map(sign => planetCounts[sign] || 0);
    }
    
    return null;
  }, [planetCounts]);
  
  // Normalize planetsPerSign to ensure it's in the expected format
  const normalizedPlanetsPerSign = React.useMemo(() => {
    console.log('Planets per sign received:', planetsPerSign);
    
    if (!planetsPerSign) return null;
    
    // Ensure planetsPerSign is in the expected format
    if (typeof planetsPerSign === 'object' && !Array.isArray(planetsPerSign)) {
      // Check if values are arrays of strings
      const isValid = Object.values(planetsPerSign).every(value => 
        Array.isArray(value) && value.every(item => typeof item === 'string')
      );
      
      if (isValid) return planetsPerSign;
    }
    
    return null;
  }, [planetsPerSign]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize and cleanup Chart.js instance
  useEffect(() => {
    if (!chartRef.current || !normalizedPlanetCounts || !normalizedPlanetsPerSign) return;

    // Destroy existing chart instance if it exists
    cleanupChartInstance(chartInstanceRef.current);
    chartInstanceRef.current = null;

    try {
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      const config: ChartConfiguration = {
        type: 'doughnut',
        data: {
          labels: ZODIAC_SIGNS,
          datasets: [{
            label: 'Zodiac Signs',
            data: normalizedPlanetCounts,
            backgroundColor: (context) => {
              const value = context.dataset.data[context.dataIndex] as number;
              const minStrength = 0;
              const maxStrength = Math.max(...normalizedPlanetCounts);
              const normalized = (value - minStrength) / (maxStrength - minStrength || 1);
              
              // Cosmic gradient: deep blue -> purple -> magenta
              const r = Math.floor(100 + 155 * normalized);
              const g = Math.floor(115 - 35 * normalized);
              const b = Math.floor(255 - 75 * normalized);
              return `rgba(${r}, ${g}, ${b}, 0.9)`;
            },
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                title: (tooltipItems) => {
                  const index = tooltipItems[0].dataIndex;
                  return ZODIAC_SIGNS[index];
                },
                label: (tooltipItem) => {
                  const index = tooltipItem.dataIndex;
                  const count = tooltipItem.raw as number;
                  const sign = ZODIAC_SIGNS[index];
                  
                  // Get planets in this sign
                  const planets = normalizedPlanetsPerSign[sign] || [];
                  
                  if (planets.length === 0) {
                    return `No planets in ${sign}`;
                  }
                  
                  return [
                    `${count} planet${count !== 1 ? 's' : ''} in ${sign}:`,
                    ...planets.map(planet => `• ${planet}`)
                  ];
                }
              }
            },
            legend: {
              display: false
            }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              console.log(`Clicked on ${ZODIAC_SIGNS[index]}`);
            }
          },
          onHover: (event, elements) => {
            if (chartRef.current) {
              chartRef.current.style.cursor = elements.length ? 'pointer' : 'default';
            }
          }
        }
      };

      chartInstanceRef.current = new Chart(ctx, config);
    } catch (error) {
      console.error('Error creating planetary count chart:', error);
    }

    // Cleanup on unmount
    return () => {
      cleanupChartInstance(chartInstanceRef.current);
      chartInstanceRef.current = null;
    };
  }, [normalizedPlanetCounts, normalizedPlanetsPerSign]);

  // Render appropriate state
  if (isLoading) {
    return <ChartLoading />;
  }

  if (error) {
    return <ChartError />;
  }

  if (!normalizedPlanetCounts || !normalizedPlanetsPerSign) {
    console.log('Rendering placeholder due to missing data');
    return <ChartPlaceholder />;
  }

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`} ref={containerRef}>
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
              <p>This chart shows the distribution of planets across zodiac signs at your birth time. Hover over segments to see which planets are in each sign.</p>
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

      <div className="relative z-10 aspect-square">
        <canvas ref={chartRef} />
      </div>
      
      <div className="mt-4 text-center text-sm text-slate-300">
        <p>Planetary Distribution in Zodiac Signs</p>
      </div>
    </div>
  );
};

export default PlanetaryCountChart;
