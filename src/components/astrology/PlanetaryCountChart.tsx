import React, { useRef, useEffect, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Loader2, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';

// Register Chart.js components
Chart.register(...registerables);

interface PlanetaryCountChartProps {
  planetCounts: number[] | null;
  planetsPerSign: Record<string, string[]>;
  isDownloading: boolean;
  onDownload: () => Promise<void>;
  onShare: () => Promise<void>;
}

const PlanetaryCountChart: React.FC<PlanetaryCountChartProps> = ({
  planetCounts,
  planetsPerSign,
  isDownloading,
  onDownload,
  onShare
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean up chart instances on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Create/update chart when planetCounts changes
  useEffect(() => {
    if (!chartRef.current || !planetCounts) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    
    const labels = zodiacSigns.map(sign => ({
      label: sign,
      tooltip: planetsPerSign[sign]?.join(', ') || 'No planets'
    }));

    const newChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: zodiacSigns,
        datasets: [{
          data: planetCounts,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = labels[context.dataIndex];
                return `${label.label}: ${context.raw} planet(s) - ${label.tooltip}`;
              }
            },
            backgroundColor: 'rgba(10, 15, 40, 0.9)',
            titleColor: '#d1d5db',
            bodyColor: '#e5e7eb',
            borderColor: 'rgba(125, 100, 255, 0.5)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 4
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af',
              stepSize: 1
            },
            grid: {
              color: 'rgba(55, 65, 81, 0.5)'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              display: false
            }
          }
        },
        onHover: (event, elements) => {
          const target = event.native?.target as HTMLElement;
          if (target) {
            target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
          }
        }
      }
    });

    chartInstanceRef.current = newChartInstance;
  }, [planetCounts, planetsPerSign]);

  if (!planetCounts) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-slate-800/50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/cosmic-bg.webp')] bg-cover opacity-10 -z-10"></div>
        
        <PieChart className="h-16 w-16 text-slate-600 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-slate-400 mb-2">No Planetary Data Available</h3>
        <p className="text-slate-500 text-center max-w-xs mb-4">
          Birth data is required to generate your planetary distribution chart.
        </p>
        <div className="flex gap-2 items-center text-slate-600 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Waiting for birth data input...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-slate-800/50 overflow-hidden"
      ref={containerRef}
    >
      <div className="absolute inset-0 bg-[url('/cosmic-bg.webp')] bg-cover opacity-10 -z-10"></div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Planetary Count</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownload}
            disabled={isDownloading}
            className="bg-slate-800/50 hover:bg-slate-700/50 text-white border-slate-700"
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShare}
            disabled={isDownloading}
            className="bg-slate-800/50 hover:bg-slate-700/50 text-white border-slate-700"
          >
            Share
          </Button>
        </div>
      </div>

      <div className="h-80 w-full relative">
        <canvas ref={chartRef} />
      </div>

      <div className="mt-4 text-sm text-slate-400 flex items-center">
        <Info className="w-4 h-4 mr-2" />
        <span>Hover over bars to see which planets are in each sign</span>
      </div>
    </motion.div>
  );
};

export default PlanetaryCountChart;
