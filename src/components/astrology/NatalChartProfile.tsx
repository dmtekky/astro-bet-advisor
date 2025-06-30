import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { NatalChartProfileProps } from './utils/types';
import NatalChart from './components/NatalChart';
import PlanetaryCountChart from './components/PlanetaryCountChart';
import ChartLoading from './components/ChartLoading';
import ChartError from './components/ChartError';

/**
 * NatalChartProfile component that renders both a natal chart and planetary count chart
 * based on a user's profile data.
 */
export const NatalChartProfile: React.FC<NatalChartProfileProps> = ({
  profile,
  className = ''
}) => {
  // State for UI controls
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDownloadingPlanets, setIsDownloadingPlanets] = useState<boolean>(false);
  
  if (!profile) {
    return <ChartLoading />;
  }
  
  if (!profile.planetary_data) {
    return (
      <ChartError error={new Error('Astrological profile data not found. Please enter your birth data.')} />
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
      {/* Charts container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Natal Chart */}
        <div className="w-full planetary-count-container">
          <NatalChart 
            astroData={profile?.planetary_data}
            onDownload={handleDownloadNatalChart}
            onShare={handleShareNatalChart}
            isDownloading={isDownloading}
          />
        </div>

        {/* Planetary Count Chart */}
        <div className="w-full planetary-count-container">
          <PlanetaryCountChart 
            planetCounts={profile?.planetary_count || null}
            planetsPerSign={profile?.planets_per_sign || {}}
            onDownload={handleDownloadPlanetaryCount}
            onShare={handleSharePlanetaryCount}
            isDownloading={isDownloadingPlanets}
            isLoading={false}
            error={null}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default NatalChartProfile;
