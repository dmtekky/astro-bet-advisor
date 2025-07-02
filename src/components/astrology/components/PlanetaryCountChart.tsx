import React, { useRef, useEffect, useState } from 'react';
import { Chart, ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { PolarArea, getElementAtEvent } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ChartTypeRegistry } from 'chart.js';
import { cleanupChartInstance } from '../utils/chartUtils';
import ChartLoading from './ChartLoading';
import ChartError from './ChartError';
import ChartPlaceholder from './ChartPlaceholder';

// Constants
const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement);

// Types
type PlanetaryCountChartProps = {
  planetCounts: Record<string, number> | null;
  planetsPerSign: Record<string, string[]> | null;
  isLoading?: boolean;
  error?: string | null;
  onDownload?: () => void;
  onShare?: () => void;
  isDownloading?: boolean;
  className?: string;
};

/**
 * Component for rendering the planetary count chart using Chart.js
 */
export const PlanetaryCountChart: React.FC<PlanetaryCountChartProps> = ({
  planetCounts,
  planetsPerSign,
  isLoading = false,
  error = null,
  onDownload,
  onShare,
  isDownloading = false,
  className,
}) => {
  const [tooltip, setTooltip] = useState<{x: number, y: number, sign: string, count: number, planets: string[]} | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

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
  const chartRef = useRef<Chart<'polarArea', number[], string>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Prepare chart data
  const chartData: ChartData<'polarArea', number[], string> = React.useMemo(() => {
    if (!normalizedPlanetCounts || !normalizedPlanetsPerSign) {
      return {
        labels: ZODIAC_SIGNS,
        datasets: [{
          label: 'Planetary Influence',
          data: ZODIAC_SIGNS.map(() => 0.5),
          backgroundColor: ZODIAC_SIGNS.map(() => 'rgba(100, 116, 139, 0.5)'),
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)'
        }]
      };
    }
    
    const displayData = normalizedPlanetCounts.map(value => Math.max(0.5, value));
    
    return {
      labels: ZODIAC_SIGNS,
      datasets: [{
        label: 'Planetary Influence',
        data: displayData,
        backgroundColor: ZODIAC_SIGNS.map((_, index) => {
          const value = normalizedPlanetCounts[index];
          const minStrength = 0;
          const maxStrength = Math.max(...normalizedPlanetCounts);
          const normalized = (value - minStrength) / (maxStrength - minStrength || 1);
          
          // Cosmic gradient: deep blue -> purple -> magenta
          const r = Math.floor(100 + 155 * normalized);
          const g = Math.floor(115 - 35 * normalized);
          const b = Math.floor(255 - 75 * normalized);
          return `rgba(${r}, ${g}, ${b}, 0.9)`;
        }),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)'
      }]
    };
  }, [normalizedPlanetCounts, normalizedPlanetsPerSign]);
  
  const chartOptions: ChartOptions<'polarArea'> = React.useMemo(() => {
    const maxValue = normalizedPlanetCounts 
      ? Math.ceil(Math.max(...normalizedPlanetCounts)) + 0.5 
      : 5; // Default max value if no data
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: maxValue,
          ticks: {
            stepSize: 0.5,
            backdropColor: 'transparent',
            color: '#E2E8F0',
            font: {
              size: 10
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          pointLabels: {
            color: '#E2E8F0',
            font: {
              size: 12
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              if (!normalizedPlanetCounts) return [];
              
              const value = normalizedPlanetCounts[context.dataIndex];
              const sign = ZODIAC_SIGNS[context.dataIndex];
              const planets = normalizedPlanetsPerSign?.[sign] || [];
              
              if (planets.length === 0) {
                return `No planets in ${sign}`;
              }
              
              return [
                `${value} planet${value !== 1 ? 's' : ''} in ${sign}:`,
                ...planets.map(planet => `• ${planet}`)
              ];
            }
          }
        }
      },
      layout: {
        padding: 10
      },
      elements: {
        arc: {
          borderWidth: 1
        }
      },
      onClick: (event: any, elements: any) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          console.log(`Clicked on ${ZODIAC_SIGNS[index]}`);
        }
      },
      onHover: (event: any, elements: any, chart: any) => {
        if (canvasRef.current) {
          canvasRef.current.style.cursor = elements.length ? 'pointer' : 'default';
        }
      }
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
    <div 
      className="relative p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl border border-slate-700/50 shadow-2xl backdrop-blur-sm overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 40%)',
      }}
    >
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

      {/* Title and Pills */}
      <div className="mb-4">
        <div className="relative inline-block mb-3">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
            Planetary Distribution
          </h3>
          <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
        </div>
        
        <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto">
          {ZODIAC_SIGNS.map((sign, index) => {
            const count = normalizedPlanetCounts?.[index] || 0;
            if (count <= 0) return null;
            
            const value = normalizedPlanetCounts?.[index] || 0;
            const minStrength = 0;
            const maxStrength = Math.max(...(normalizedPlanetCounts || [0]));
            const normalized = (value - minStrength) / (maxStrength - minStrength || 1);
            
            // Calculate base color with more opacity for better visibility
            const r = Math.floor(100 + 155 * normalized);
            const g = Math.floor(115 - 35 * normalized);
            const b = Math.floor(255 - 75 * normalized);
            
            // Create a slightly darker shade for gradient
            const r2 = Math.max(0, r - 20);
            const g2 = Math.max(0, g - 20);
            const b2 = Math.max(0, b - 40);
            
            const gradient = `linear-gradient(135deg, rgba(${r},${g},${b},0.9) 0%, rgba(${r2},${g2},${b2},0.9) 100%)`;
            const textColor = normalized > 0.5 ? 'text-white' : 'text-slate-900';
            const planets = normalizedPlanetsPerSign?.[sign] || [];
            
            return (
              <div 
                key={sign} 
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${textColor} shadow-sm cursor-help`}
                style={{
                  background: gradient,
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                    sign,
                    count: value,
                    planets
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                title={`${value} planet${value !== 1 ? 's' : ''} in ${sign}`}
              >
                <span>{sign}</span>
                <span className="font-bold">{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-full" style={{ aspectRatio: '1/1' }}>
        {chartData && chartOptions ? (
          <div className="w-full h-full">
            <PolarArea 
              data={chartData} 
              options={chartOptions} 
              ref={chartRef}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            Loading chart...
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm text-white bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-medium text-slate-200">{tooltip.sign}</div>
          <div className="text-xs text-slate-300">
            {tooltip.count} planet{tooltip.count !== 1 ? 's' : ''}
          </div>
          {tooltip.planets.length > 0 && (
            <div className="mt-1 text-xs text-slate-400">
              {tooltip.planets.join(', ')}
            </div>
          )}
        </div>
      )}
      
      {/* Download/Share Buttons */}
      <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
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

export default PlanetaryCountChart;
