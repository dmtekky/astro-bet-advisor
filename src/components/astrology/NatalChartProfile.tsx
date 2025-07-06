import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas/dist/html2canvas.esm.js';
import { Info } from 'lucide-react';
import { NatalChartProfileProps, NatalChartProps, PlanetaryCountChartProps } from '../../types/astrology.js';
import NatalChart from './components/NatalChart.js';
import PlanetaryCountChart from './components/PlanetaryCountChart.js';
import ChartLoading from './components/ChartLoading.js';
import ChartError from './components/ChartError.js';

/**
 * NatalChartProfile component that renders both a natal chart and planetary count chart
 * based on a user's birth data or planetary data.
 */
const NatalChartProfile: React.FC<NatalChartProfileProps> = ({
  birthData,
  natalChartData,
  planetaryCounts,
  planetsPerSign,
  interpretations,
  className = ''
}) => {
  // State for UI controls
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDownloadingPlanets, setIsDownloadingPlanets] = useState<boolean>(false);
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(!natalChartData);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Handle retry logic
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setError(null);
  }, []);

  // Effect to simulate loading completion or detect errors
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        if (!natalChartData) {
          setError(new Error('Astrological profile data not found. Please enter your birth data.'));
        }
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [natalChartData, isLoading, retryCount]);

  if (isLoading) {
    return <ChartLoading onRetry={handleRetry} />;
  }
  
  if (error || !natalChartData) {
    return (
      <ChartError 
        error={error || new Error('Astrological profile data not found. Please enter your birth data.')} 
        actionText="Update Birth Data"
        onAction={handleRetry}
      />
    );
  }
  // Handle download for natal chart
  const handleDownloadNatalChart = useCallback(async () => {
    const natalChartElement = document.querySelector('.natal-chart-container') as HTMLElement;
    if (!natalChartElement) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(natalChartElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      // Add watermark
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Full Moon Odds', canvas.width/2, canvas.height - 30);
      }
      
      const link = document.createElement('a');
      link.download = 'natal-chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading chart:', error);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  // Handle share functionality for the natal chart
  const handleShareNatalChart = useCallback(async () => {
    const natalChartElement = document.querySelector('.natal-chart-container') as HTMLElement;
    if (!natalChartElement) return;

    setIsDownloading(true);
    try {
      if (navigator.share) {
        const canvas = await html2canvas(natalChartElement, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true
        });
        
        const blob = await new Promise<Blob | null>(resolve => {
          canvas.toBlob(blob => resolve(blob), 'image/png');
        });

        if (blob) {
          const file = new File([blob], 'natal-chart.png', { type: 'image/png' });
          await navigator.share({
            title: 'My Natal Chart',
            text: 'Check out my natal chart!',
            files: [file]
          });
        }
      } else {
        // Fallback for browsers that don't support Web Share API
        await handleDownloadNatalChart();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [handleDownloadNatalChart]);

  // Handle download for planetary count chart
  const handleDownloadPlanetaryCount = useCallback(async () => {
    const planetaryCountElement = document.querySelector('.planetary-count-container') as HTMLElement;
    if (!planetaryCountElement) return;

    setIsDownloadingPlanets(true);
    try {
      const canvas = await html2canvas(planetaryCountElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      // Add watermark
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Full Moon Odds', canvas.width/2, canvas.height - 30);
      }
      
      const link = document.createElement('a');
      link.download = 'planetary-count.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading planetary count:', error);
    } finally {
      setIsDownloadingPlanets(false);
    }
  }, []);

  // Handle share functionality for the planetary count chart
  const handleSharePlanetaryCount = useCallback(async () => {
    const planetaryCountElement = document.querySelector('.planetary-count-container') as HTMLElement;
    if (!planetaryCountElement) return;

    setIsDownloadingPlanets(true);
    try {
      if (navigator.share) {
        const canvas = await html2canvas(planetaryCountElement, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true
        });
        
        const blob = await new Promise<Blob | null>(resolve => {
          canvas.toBlob(blob => resolve(blob), 'image/png');
        });

        if (blob) {
          const file = new File([blob], 'planetary-count.png', { type: 'image/png' });
          await navigator.share({
            title: 'My Planetary Count',
            text: 'Check out my planetary count chart!',
            files: [file]
          });
        }
      } else {
        // Fallback for browsers that don't support Web Share API
        await handleDownloadPlanetaryCount();
      }
    } catch (error) {
      console.error('Error sharing planetary count:', error);
    } finally {
      setIsDownloadingPlanets(false);
    }
  }, [handleDownloadPlanetaryCount]);

  return (
    <div className={`p-4 max-w-4xl mx-auto space-y-8 ${className}`}>
      {/* Starry background effect - cosmic orange and white */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 70 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              backgroundColor: i % 2 === 0 ? '#f8fafc' : '#fbbf24', // White and light orange stars
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 4 + 2}s infinite ease-in-out alternate`
            }}
          />
        ))}
      </div>
      {/* Charts container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 gap-8 w-full"
      >
        {/* Natal Chart */}
        <div className="w-full max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
            Natal Chart
          </h2>
          
          {/* Planet Sign Pills */}
          {planetsPerSign && Object.keys(planetsPerSign).length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {Object.entries(planetsPerSign).map(([sign, planets]) =>
                planets.map(planet => (
                  <div 
                    key={`${planet}-${sign}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-shadow"
                  >
                    <span className="font-semibold">{planet}</span>
                    <span className="mx-1">in</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{sign}</span>
                  </div>
                ))
              )}
            </div>
          )}
          
          <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            {isLoading ? (
              <ChartLoading />
            ) : error ? (
              <ChartError error={error} onRetry={handleRetry} />
            ) : (
              <NatalChart
                astroData={natalChartData}
                isLoading={isLoading}
                error={error}
                onDownload={handleDownloadNatalChart}
                onShare={handleShareNatalChart}
                isDownloading={isDownloading}
              />
            )}
          </div>
        </div>

        {/* Planetary Count Chart */}
        <div className="w-full max-w-3xl mx-auto">
          <PlanetaryCountChart 
            planetCounts={planetaryCounts ?? null} 
            planetsPerSign={planetsPerSign ?? null} 
            isDownloading={isDownloadingPlanets}
            onDownload={handleDownloadPlanetaryCount}
            onShare={handleSharePlanetaryCount}
          />
        </div>

        {/* Planets in Houses Interpretations */}
        {interpretations?.planets && Object.keys(interpretations.planets).some(planetName => {
          const planet = interpretations.planets![planetName as keyof typeof interpretations.planets] as any;
          return Object.keys(planet?.houses || {}).length > 0;
        }) && (
          <div className="w-full max-w-3xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
              Planets in Houses
            </h2>
            {/* Display planet in house interpretations */}
            {interpretations?.planets && Object.entries(interpretations.planets).map(([planet, data]) => {
              if (!data) return null; // Add null check for data

              // Use type assertion to handle the houses property
              const planetData = data as any;
              if (!planetData?.houses) return null;
              
              // Find the house for this planet
              const houseKey = planetData.houses && Object.keys(planetData.houses).length > 0 ? Object.keys(planetData.houses)[0] : undefined;
              if (!houseKey) return null; // If no house key, don't render
              const interpretation = planetData.houses[houseKey] as { 
                emoji?: string;
                effect?: string;
                sportsTitle?: string;
                sportsDescription?: string;
              };
              
              return (
                <motion.div 
                  key={`${planet}-house`}
                  className="mb-8 bg-black/30 border border-amber-500/20 rounded-lg p-6 backdrop-blur-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-white">
                      {planet} in {houseKey.replace('house', 'House ')}
                    </h3>
                    <span className="text-amber-400">
                      {interpretation?.emoji || '✨'}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-white/90">
                      {interpretation?.effect || 'This placement influences your cosmic energy.'}
                    </p>
                    
                    <div className="mt-4 space-y-3">
                      <h4 className="text-lg font-medium text-amber-400">
                        {interpretation?.sportsTitle || 'Sports Influence'}
                      </h4>
                      <p className="text-white/80">
                        {interpretation?.sportsDescription || 'This placement may affect your performance in competitive activities.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Planetary Aspects Interpretations (Placeholder) */}
        <div className="w-full max-w-3xl mx-auto bg-white/5 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
            Planetary Aspects
          </h2>
          <p className="text-slate-300 text-center">Aspect interpretations will be displayed here once available.</p>
        </div>

      </motion.div>
    </div>
  );
};

export default NatalChartProfile;
