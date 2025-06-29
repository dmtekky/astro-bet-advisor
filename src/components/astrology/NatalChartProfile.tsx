import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';
import { useAstroData } from '@/hooks/useAstroData';
import { 
  BirthDataProps, 
  NatalChartProfileProps, 
  UserData 
} from './utils/types';
import { 
  calculatePlanetaryCounts, 
  processPlanetsPerSign, 
  countsToArray 
} from './utils/chartUtils';
import NatalChart from './components/NatalChart';
import PlanetaryCountChart from './components/PlanetaryCountChart';
import ChartPlaceholder from './components/ChartPlaceholder';
import ChartLoading from './components/ChartLoading';
import ChartError from './components/ChartError';
import BirthDataForm from './components/BirthDataForm';

/**
 * NatalChartProfile component that renders both a natal chart and planetary count chart
 * based on birth data or user data from Supabase.
 */
export const NatalChartProfile: React.FC<NatalChartProfileProps> = ({
  birthData: propBirthData,
  userId,
  onDataLoad,
  natalChartData: propNatalChartData,
  planetaryCounts: propPlanetaryCounts,
  planetsPerSign: propPlanetsPerSign,
  className = ''
}) => {
  // State for birth data
  const [internalBirthData, setInternalBirthData] = useState<BirthDataProps>({
    date: '',
    time: '',
    timeUnknown: false,
    city: ''
  });

  // Determine which birth data to use (props or internal)
  const actualBirthData = useMemo(() => 
    propBirthData || internalBirthData, 
    [propBirthData, internalBirthData]
  );

  // State for UI controls
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDownloadingPlanets, setIsDownloadingPlanets] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Get astro data from hook or props
  const { 
    data: astroData, 
    loading: astroLoading, 
    error: astroError 
  } = useAstroData(actualBirthData);

  // Derived state for chart data
  const [natalChartData, setNatalChartData] = useState<any>(propNatalChartData || null);
  const [planetCounts, setPlanetCounts] = useState<number[] | null>(propPlanetaryCounts || null);
  const [planetsPerSign, setPlanetsPerSign] = useState<Record<string, string[]> | null>(
    propPlanetsPerSign || null
  );
  
  // Stored planetary counts from Supabase
  const [storedPlanetaryCounts, setStoredPlanetaryCounts] = useState<number[] | null>(null);
  const [storedPlanetsPerSign, setStoredPlanetsPerSign] = useState<Record<string, string[]> | null>(null);

  /**
   * Fetch user data from Supabase
   */
  const fetchUserData = useCallback(async () => {
    if (!userId && !actualBirthData.date) return;

    setIsLoadingUserData(true);
    setError(null);

    try {
      let query = customSupabase.from('user_data').select('*');
      
      if (userId) {
        query = query.eq('id', userId);
      } else if (actualBirthData.date) {
        query = query.eq('birth_date', actualBirthData.date);
      }

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      if (data) {
        setUserData(data);
        
        // Extract planetary data from user data
        if (data.planetary_data) {
          setNatalChartData(data.planetary_data);
        }
        
        // Use stored planetary counts if available
        if (data.planetary_count) {
          setStoredPlanetaryCounts(data.planetary_count);
        }
        
        // Use stored planets per sign if available
        if (data.planets_per_sign) {
          setStoredPlanetsPerSign(data.planets_per_sign);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error as Error);
    } finally {
      setIsLoadingUserData(false);
    }
  }, [userId, actualBirthData.date]);

  /**
   * Process data from astroData or stored data
   */
  const processData = useCallback(() => {
    // If we have stored planetary counts, use those
    if (storedPlanetaryCounts && storedPlanetaryCounts.length === 12) {
      setPlanetCounts(storedPlanetaryCounts);
    } 
    // Otherwise calculate from astroData
    else if (astroData && astroData.planets) {
      const counts = calculatePlanetaryCounts(astroData);
      setPlanetCounts(countsToArray(counts));
    }

    // If we have stored planets per sign, use those
    if (storedPlanetsPerSign) {
      setPlanetsPerSign(storedPlanetsPerSign);
    } 
    // Otherwise calculate from astroData
    else if (astroData && astroData.planets) {
      const planetsInSigns = processPlanetsPerSign(astroData);
      setPlanetsPerSign(planetsInSigns);
    }

    // Call onDataLoad callback if provided
    if (onDataLoad) {
      onDataLoad({
        natalChartData: astroData,
        planetaryCounts: planetCounts || undefined,
        planetsPerSign: planetsPerSign || undefined
      });
    }
  }, [astroData, storedPlanetaryCounts, storedPlanetsPerSign, planetCounts, planetsPerSign, onDataLoad]);

  // Fetch user data when userId or birth date changes
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Process data when astroData or stored counts change
  useEffect(() => {
    processData();
  }, [processData]);

  // Handle input changes for birth data form
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (propBirthData) return; // Don't handle changes if using prop data

    const { name, value, type, checked } = e.target;
    setInternalBirthData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, [propBirthData]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is handled by the useEffect that watches actualBirthData.date
  }, []);

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

  // If no birth data or no astro data, show no data state
  if (!actualBirthData.date || (!astroData && !userData?.planetary_data)) {
    return (
      <ChartPlaceholder 
        showForm={showForm} 
        setShowForm={setShowForm} 
        propBirthData={propBirthData} 
      />
    );
  }

  return (
    <div className={`p-4 max-w-4xl mx-auto space-y-8 ${className}`}>
      {/* Birth data form */}
      {!propBirthData && showForm && (
        <BirthDataForm 
          birthData={internalBirthData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      )}

      {/* Charts container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Natal Chart */}
        <div className="w-full">
          <NatalChart 
            astroData={astroData || userData?.planetary_data}
            isLoading={astroLoading || isLoadingUserData}
            error={astroError || error}
            onDownload={handleDownloadNatalChart}
            onShare={handleShareNatalChart}
            isDownloading={isDownloading}
          />
        </div>

        {/* Planetary Count Chart */}
        <div className="w-full">
          <PlanetaryCountChart 
            planetCounts={planetCounts}
            planetsPerSign={planetsPerSign}
            isLoading={astroLoading || isLoadingUserData}
            error={astroError || error}
            onDownload={handleDownloadPlanetaryCount}
            onShare={handleSharePlanetaryCount}
            isDownloading={isDownloadingPlanets}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default NatalChartProfile;
