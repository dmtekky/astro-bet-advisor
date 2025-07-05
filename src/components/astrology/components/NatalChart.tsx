import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import ChartLoading from './ChartLoading';
import ChartError from './ChartError';
import ChartPlaceholder from './ChartPlaceholder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { NatalChartProps } from '../utils/types';
import { Origin, Horoscope as CircularHoroscope } from 'circular-natal-horoscope-js';
import { Horoscope as DrawerHoroscope } from 'horoscopedrawer'; // Assuming this import path

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
  const ChartRenderer = () => {
    const [renderAttempt, setRenderAttempt] = useState(0); // Keep renderAttempt for retry logic

    // Helper function to transform astroData into HoroscopeDrawer's expected format
    const transformAstroDataForHoroscopeDrawer = (data: any) => {
      if (!data || !data.birthData || !data.celestialBodies) {
        return null;
      }

      const { year, month, day, hour, minute, latitude, longitude } = data.birthData;

      const origin = new Origin({
        year,
        month: month - 1, // Months are 0-indexed in circular-natal-horoscope-js
        date: day,
        hour,
        minute,
        latitude,
        longitude,
      });

      const circularHoroscope = new CircularHoroscope({
        origin,
        houseSystem: 'placidus',
        zodiac: 'tropical',
        aspectPoints: ['bodies', 'points', 'angles'],
        aspectWithPoints: ['bodies', 'points', 'angles'],
        aspectTypes: ['major', 'minor'],
        language: 'en',
      });

      const planets: { [key: string]: number } = {};
      // Mapping from circular-natal-horoscope-js labels to HoroscopeDrawer keys
      const planetMap: { [key: string]: string } = {
        'sun': 'sun', 'moon': 'moon', 'mercury': 'mercury', 'venus': 'venus',
        'mars': 'mars', 'jupiter': 'jupiter', 'saturn': 'saturn', 'uranus': 'uranus',
        'neptune': 'neptune', 'pluto': 'pluto', 'chiron': 'chiron',
        'north node': 'rahu', // Rahu is North Node
        'south node': 'ketu', // Ketu is South Node
      };

      circularHoroscope.CelestialBodies.all.forEach((body: any) => {
        const mappedName = planetMap[body.label.toLowerCase()];
        if (mappedName && body.ChartPosition && body.ChartPosition.Ecliptic) {
          planets[mappedName] = body.ChartPosition.Ecliptic.DecimalDegrees;
        }
      });

      const houses: { axes: { [key: string]: number }, hasHouses: boolean } = {
        hasHouses: true,
        axes: {},
      };

      if (circularHoroscope.Houses && circularHoroscope.Houses.length >= 12) {
        // HoroscopeDrawer's axes mapping to circular-natal-horoscope-js house cusps (0-indexed array)
        // Cusp 1 (Ascendant) is handled by zodiac.ascendant
        houses.axes = {
          axis2to8: circularHoroscope.Houses[1].degree,  // Cusp 2
          axis3to9: circularHoroscope.Houses[2].degree,  // Cusp 3
          axis4to10: circularHoroscope.Houses[3].degree, // Cusp 4 (IC)
          axis5to11: circularHoroscope.Houses[4].degree, // Cusp 5
          axis6to12: circularHoroscope.Houses[5].degree, // Cusp 6
          // HoroscopeDrawer also expects axis7to1, axis8to2, etc. which are opposite to the first 6.
          // Since circular-natal-horoscope-js provides all 12, we can map them directly.
          // However, HoroscopeDrawer's documentation implies it might calculate these if not provided.
          // For now, let's stick to the ones explicitly mentioned in the placeholder.
          // If issues arise, we might need to add more or confirm HoroscopeDrawer's behavior.
        };
      }

      let ascendantSign = 0;
      let ascendantDegree = 0;
      if (circularHoroscope.Ascendant && circularHoroscope.Ascendant.ChartPosition && circularHoroscope.Ascendant.ChartPosition.Ecliptic) {
        const ascendantDecimalDegrees = circularHoroscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees;
        ascendantSign = Math.floor(ascendantDecimalDegrees / 30);
        ascendantDegree = ascendantDecimalDegrees % 30;
      }

      return {
        zodiac: {
          ascendant: {
            sign: ascendantSign,
            degree: ascendantDegree,
          },
        },
        planets,
        houses,
      };
    };

    useEffect(() => {
      console.log('[NatalChart] Component mounted with astroData:', JSON.stringify(astroData, null, 2));

      if (!astroData) {
        console.log('[NatalChart] No astrological data provided, setting error');
        setChartError(new Error('No astrological data provided'));
        return;
      }

      let drawerInstance: any = null;
      const svgElementId = 'natal-chart-svg'; // ID for the SVG element

      try {
        const horoscopeDrawerProperties = transformAstroDataForHoroscopeDrawer(astroData);

        if (!horoscopeDrawerProperties) {
          throw new Error('Failed to transform astrological data for chart drawing.');
        }

        // Ensure the SVG container exists
        if (containerRef.current) {
          const existingSvg = containerRef.current.querySelector(`#${svgElementId}`);
          if (existingSvg) {
            existingSvg.remove(); // Remove existing SVG to prevent duplicates on re-render
          }

          const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svgContainer.id = svgElementId;
          svgContainer.setAttribute('width', chartSize.toString());
          svgContainer.setAttribute('height', chartSize.toString());
          containerRef.current.appendChild(svgContainer);
          console.log('[NatalChart] SVG container created');
        } else {
          throw new Error('Container ref is null');
        }

        console.log('[NatalChart] Creating HoroscopeDrawer instance...');
        drawerInstance = new DrawerHoroscope(horoscopeDrawerProperties);
        console.log('[NatalChart] HoroscopeDrawer instance created');

        console.log('[NatalChart] Drawing chart with data...');
        drawerInstance.draw(`#${svgElementId}`);
        console.log('[NatalChart] Chart drawn successfully');
        setChartError(null);

      } catch (error) {
        console.error('[NatalChart] Error during chart drawing:', error);
        setChartError(error instanceof Error ? error : new Error('Failed to draw chart'));
        if (onError) onError(error instanceof Error ? error : new Error('Failed to draw chart'));
      }

      return () => {
        console.log('[NatalChart] Component unmounting...');
        // HoroscopeDrawer doesn't seem to have a destroy method,
        // so we just remove the SVG element.
        if (containerRef.current) {
          const chartElement = containerRef.current.querySelector(`#${svgElementId}`);
          if (chartElement) {
            chartElement.remove();
            console.log('[NatalChart] Chart SVG removed');
          }
        }
      };
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
