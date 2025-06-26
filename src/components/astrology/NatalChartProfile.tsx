import React, { useState, useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { motion } from 'framer-motion';
import zodiacGlyphs from '@/data/zodiacGlyphs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';

// Register Chart.js components
Chart.register(...registerables);

interface BirthDataProps {
  date: string;
  time: string;
  timeUnknown: boolean;
  city: string;
}

interface NatalChartProfileProps {
  birthData?: BirthDataProps;
}

const NatalChartProfile: React.FC<NatalChartProfileProps> = ({ birthData: propBirthData }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalBirthData, setInternalBirthData] = useState<BirthDataProps>({ date: '', time: '', timeUnknown: false, city: '' });
  const actualBirthData = propBirthData || internalBirthData;
  const [planetCounts, setPlanetCounts] = useState<number[] | null>(null);
  const [planetsPerSign, setPlanetsPerSign] = useState<Record<string, string[]>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchPlanetaryPositions = async () => {
      if (!actualBirthData.date) return;

      try {
        const response = await fetch('/api/astrology/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: actualBirthData.date,
            time: actualBirthData.time,
            city: actualBirthData.city
          })
        });

        if (!response.ok) throw new Error('Failed to fetch planetary positions');

        const data = await response.json();
        // Count planets in each sign
        const counts = new Array(12).fill(0);
        const planetsBySign: Record<string, string[]> = {};
        
        data.planets.forEach((planet: { name: string, sign: string }) => {
          const signIndex = signToIndex(planet.sign);
          if (signIndex !== -1) counts[signIndex]++;
          
          if (!planetsBySign[planet.sign]) {
            planetsBySign[planet.sign] = [];
          }
          planetsBySign[planet.sign].push(planet.name);
        });
        
        setPlanetCounts(counts);
        setPlanetsPerSign(planetsBySign);
      } catch (error) {
        console.error('Error fetching planetary positions:', error);
        // Fallback to mock data
        setPlanetCounts([3, 0, 2, 1, 1, 0, 2, 1, 0, 1, 1, 1]);
        setPlanetsPerSign({
          'Aries': ['Mars', 'Sun', 'Mercury'],
          'Gemini': ['Venus', 'Jupiter'],
          'Cancer': ['Moon'],
          'Leo': ['Saturn'],
          'Libra': ['Uranus', 'Neptune'],
          'Scorpio': ['Pluto'],
          'Capricorn': ['Chiron'],
          'Aquarius': ['Lilith'],
          'Pisces': ['Node']
        });
      }
    };

    fetchPlanetaryPositions();
  }, [actualBirthData]);

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
    if (chartRef.current && planetCounts) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const newChartInstance = new Chart(ctx, {
          type: 'polarArea',
          data: {
            labels: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
            datasets: [{
              label: 'Zodiac Signs',
              data: planetCounts,
              backgroundColor: (context) => {
                const value = context.dataset.data[context.dataIndex] as number;
                const minStrength = 0;
                const maxStrength = Math.max(...planetCounts);
                const normalized = (value - minStrength) / (maxStrength - minStrength);
                
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
            plugins: {
              legend: { display: false },
              title: { 
                display: true, 
                text: 'Planetary Count', 
                color: 'white',
                font: { size: 16 }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const signIndex = context.dataIndex;
                    const sign = context.chart.data.labels?.[signIndex] || '';
                    const count = context.dataset.data[signIndex] as number;
                    return `${sign}: ${count} planet${count !== 1 ? 's' : ''}`;
                  },
                  afterLabel: (context) => {
                    const signIndex = context.dataIndex;
                    const sign = context.chart.data.labels?.[signIndex] || '';
                    const planets = planetsPerSign[sign] || [];
                    return planets.length > 0 
                      ? `Planets: ${planets.join(', ')}` 
                      : 'No planets';
                  }
                },
                backgroundColor: 'rgba(10, 15, 40, 0.9)',
                titleColor: '#d1d5db',
                bodyColor: '#e5e7eb',
                borderColor: 'rgba(125, 100, 255, 0.5)',
                borderWidth: 1,
                padding: 12,
                displayColors: false
              }
            },
            scales: {
              r: {
                beginAtZero: true,
                grid: { 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  lineWidth: 1,
                  circular: true 
                },
                ticks: { 
                  color: 'white', 
                  backdropColor: 'rgba(0, 0, 0, 0.5)', 
                  backdropPadding: 4 
                },
                pointLabels: { 
                  display: true, 
                  color: 'white', 
                  font: { 
                    size: 12, 
                    weight: 'bold' 
                  }, 
                  backdropColor: 'rgba(0, 0, 0, 0.7)', 
                  backdropPadding: 4 
                },
                angleLines: { 
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineWidth: 2 
                }
              }
            },
            animation: {
              animateRotate: true,
              animateScale: true,
              duration: 2000,
              onProgress: (context) => {
                const chart = context.chart;
                chart.ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
                chart.ctx.shadowBlur = 10;
                chart.ctx.shadowOffsetX = 0;
                chart.ctx.shadowOffsetY = 0;
              }
            },
            onHover: (event, elements) => {
              if (chartRef.current) {
                chartRef.current.style.cursor = elements.length ? 'pointer' : 'default';
              }
            }
          }
        });
        chartInstanceRef.current = newChartInstance;
      }
    }
  }, [planetCounts, planetsPerSign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (propBirthData) return; // Don't handle changes if using prop data
    
    const { name, value, type, checked } = e.target;
    setInternalBirthData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDownload = () => {
    if (!containerRef.current) return;
    
    setIsDownloading(true);
    
    // Get the parent container that has the full chart
    const chartContainer = containerRef.current.closest('.relative.p-4.rounded-lg.overflow-hidden') as HTMLElement;
    if (!chartContainer) return;
    
    // Add a small delay to ensure everything is rendered
    setTimeout(() => {
      const captureElement = (element: HTMLElement) => {
        return html2canvas(element, {
          backgroundColor: null,
          scale: 2,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          width: element.offsetWidth,
          height: element.offsetHeight,
          useCORS: true,
          logging: true,
          allowTaint: true,
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          x: 0,
          y: 0,
          onclone: (clonedDoc) => {
            // Ensure the cloned element is visible for capture
            const clonedContainer = clonedDoc.querySelector('.relative.p-4.rounded-lg.overflow-hidden') as HTMLElement;
            if (clonedContainer) {
              clonedContainer.style.overflow = 'visible';
              clonedContainer.style.position = 'static';
            }
          }
        });
      };
      
      captureElement(chartContainer).then(canvas => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Add watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Full Moon Odds', canvas.width/2, canvas.height - 30);
      }
      
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'natal-chart.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
      }).catch(error => {
        console.error('Error capturing chart:', error);
        setIsDownloading(false);
      });
    });
  };

  const handleShare = async () => {
    if (!containerRef.current) return;
    
    setIsDownloading(true);
    try {
      // Get the parent container that has the full chart
      const chartContainer = containerRef.current.closest('.relative.p-4.rounded-lg.overflow-hidden') as HTMLElement;
      if (!chartContainer) return;
      
      const captureElement = (element: HTMLElement) => {
        return html2canvas(element, {
          backgroundColor: null,
          scale: 2,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          width: element.offsetWidth,
          height: element.offsetHeight,
          useCORS: true,
          logging: true,
          allowTaint: true,
          scrollX: -window.scrollX,
          scrollY: -window.scrollY,
          x: 0,
          y: 0,
          onclone: (clonedDoc) => {
            // Ensure the cloned element is visible for capture
            const clonedContainer = clonedDoc.querySelector('.relative.p-4.rounded-lg.overflow-hidden') as HTMLElement;
            if (clonedContainer) {
              clonedContainer.style.overflow = 'visible';
              clonedContainer.style.position = 'static';
            }
          }
        });
      };
      
      const canvas = await captureElement(chartContainer);
      
      // Add watermark
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Full Moon Odds', canvas.width/2, canvas.height - 30);
      }
      
      const image = canvas.toDataURL('image/png');
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], 'natal-chart.png', { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Natal Chart',
          files: [file]
        });
      } else {
        // Fallback to download
        const link = document.createElement('a');
        link.href = image;
        link.download = 'natal-chart.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const generateAspectLines = (counts: number[]): JSX.Element[] => {
    const strongSigns = counts
      .map((count, i) => ({count, index: i}))
      .filter(item => item.count > 1)
      .sort((a, b) => b.count - a.count);
    
    const lines: JSX.Element[] = [];
    
    for (let i = 0; i < Math.min(strongSigns.length, 4); i++) {
      for (let j = i + 1; j < Math.min(strongSigns.length, 4); j++) {
        const angle1 = strongSigns[i].index * 30;
        const angle2 = strongSigns[j].index * 30;
        const diff = Math.abs(angle1 - angle2);
        
        // Only draw aspects for significant angular relationships
        if ([0, 30, 60, 90, 120, 150, 180].includes(diff % 180)) {
          const x1 = 50 + 40 * Math.cos((angle1 - 90) * Math.PI / 180);
          const y1 = 50 + 40 * Math.sin((angle1 - 90) * Math.PI / 180);
          const x2 = 50 + 40 * Math.cos((angle2 - 90) * Math.PI / 180);
          const y2 = 50 + 40 * Math.sin((angle2 - 90) * Math.PI / 180);
          
          lines.push(
            <line 
              key={`${i}-${j}`}
              x1={x1} 
              y1={y1} 
              x2={x2} 
              y2={y2} 
              stroke="rgba(255, 215, 0, 0.7)" 
              strokeWidth="0.5" 
              strokeDasharray={diff % 30 === 0 ? '0' : '2,2'}
            />
          );
        }
      }
    }
    
    return lines;
  };

  const signToIndex = (sign: string): number => {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs.indexOf(sign);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {!propBirthData && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="date"
                value={actualBirthData.date}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time of Birth</label>
              <input
                type="time"
                name="time"
                value={actualBirthData.time}
                onChange={handleInputChange}
                disabled={actualBirthData.timeUnknown}
                className="w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-100"
              />
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="timeUnknown"
                  name="timeUnknown"
                  checked={actualBirthData.timeUnknown}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="timeUnknown" className="text-sm text-slate-700">I don't know my birth time</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Place of Birth</label>
              <input
                type="text"
                name="city"
                value={actualBirthData.city}
                onChange={handleInputChange}
                placeholder="City, Country"
                className="w-full p-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Generate Chart
            </button>
          </div>
        </form>
      )}
      
      {!planetCounts ? (
        <div className="relative p-4 rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative p-4 rounded-lg overflow-hidden"
          style={{
            background: 'radial-gradient(circle at center, #0c1445 0%, #05071f 100%)',
          }}
        >
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-800 border-slate-700 text-white">
                  <p>This natal chart shows the number of planets in each zodiac sign at your birth time. The length of each bar represents the planetary density in that sign.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant="outline" 
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleDownload()}
              disabled={isDownloading}
              className="text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button 
              variant="outline" 
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleShare()}
              disabled={isDownloading}
              className="text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600"
            >
              Share
            </Button>
          </div>
          
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
                  opacity: Math.random() * 0.7 + 0.3
                }}
              />
            ))}
          </div>

          <div ref={containerRef} className="relative z-10 group w-full" style={{ minHeight: '500px' }}>
            {/* Constellation patterns */}
            <div className="absolute inset-0 z-0 opacity-20">
              {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map((sign, index) => {
                const angle = (index * 30) - 15; // 30° per sign
                const radius = 40; // % from center
                return (
                  <div 
                    key={sign}
                    className="absolute text-white text-opacity-30"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}%) rotate(-${angle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: zodiacGlyphs[sign] }} />
                  </div>
                );
              })}
            </div>

            <canvas ref={chartRef} className="relative z-20 transition-all duration-500 ease-in-out" />
            
            {/* Aspect lines */}
            {planetCounts && (
              <div className="absolute inset-0 z-10">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute top-0 left-0">
                  {generateAspectLines(planetCounts)}
                </svg>
              </div>
            )}
            
            {/* Contextual help */}
            <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded">
                Hover segments for details
              </div>
            </div>
            
            {/* Depth effect */}
            <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] pointer-events-none z-20"></div>
          </div>

          {/* Custom Strength Legend */}
          <div className="mt-6 p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 relative z-10">
            <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              Planetary Count
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Sparse</span>
              <div className="flex-grow h-4 mx-4 rounded-full overflow-hidden">
                <div 
                  className="h-full w-full"
                  style={{ 
                    background: 'linear-gradient(to right, rgba(100, 115, 255, 0.8), rgba(180, 80, 220, 0.8), rgba(255, 105, 180, 0.8))' 
                  }}
                />
              </div>
              <span className="text-sm text-slate-300">Dense</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NatalChartProfile;
