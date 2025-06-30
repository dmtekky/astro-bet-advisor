import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';
import { customSupabase } from '@/lib/custom-supabase';
import { UserData as SupabaseUserData } from '@/types/supabase-extensions';
import { useAstroData, UseAstroDataReturn, BirthData } from '@/hooks/useAstroData';
import { Button } from '@/components/ui/button';
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
export const NatalChartProfile: React.FC<NatalChartProfileProps> = ({
  birthData: propBirthData,
  onUpdateSuccess,
  showForm: propShowForm,
  setShowForm: propSetShowForm,
  skipPlaceholder = false,
}) => {
  const { user, updateUserProfile } = useUser();
  const { toast } = useToast();
  
  // Local state for form visibility if not controlled from parent
  const [localShowForm, setLocalShowForm] = useState(false);
  const showForm = propShowForm ?? localShowForm;
  const setShowForm = propSetShowForm ?? setLocalShowForm;
  
  // Use prop birth data or fetch from user profile
  const [birthData, setBirthData] = useState<UserBirthData | null>(propBirthData || null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(!propBirthData);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);

  // Get the actual birth data to use (prop or fetched)
  const actualBirthData = useMemo(() => {
    return propBirthData || birthData;
  }, [propBirthData, birthData]);

  // Only use astro data if we have valid birth data
  const { astroData, loading: astroLoading, error: astroError } = useMemo(() => {
    if (!actualBirthData?.date || 
        typeof actualBirthData.latitude !== 'number' || 
        typeof actualBirthData.longitude !== 'number') {
      return { astroData: null, loading: false, error: null };
    }
    
    try {
      return useAstroData({
        date: actualBirthData.date,
        time: actualBirthData.time || '12:00',
        latitude: actualBirthData.latitude,
        longitude: actualBirthData.longitude,
        timeUnknown: actualBirthData.timeUnknown || false,
      });
    } catch (err) {
      console.error('Error initializing useAstroData:', err);
      return { 
        astroData: null, 
        loading: false, 
        error: err instanceof Error ? err : new Error('Failed to initialize astro data') 
      };
    }
  }, [actualBirthData]);

  // Early return if no birth data is available
  if (!actualBirthData || !actualBirthData.date) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No Birth Data Available</h3>
        <p className="text-muted-foreground mb-4">Please enter your birth information to view your astrological chart.</p>
        <Button onClick={() => setShowForm(true)}>Enter Birth Data</Button>
      </div>
    );
  }

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
    if (!userId) {
      console.log('🚫 No userId provided, skipping fetch');
      return;
    }
    
    console.log('🔄 Fetching user data for userId:', userId);
    console.log('🔄 Current Supabase client:', supabase ? 'initialized' : 'not initialized');
    setIsLoadingUserData(true);
    setError(null);
    setHasFetched(true);
    
    try {
      console.log('🔄 Starting Supabase query for table: user_data');
      console.log('🔄 Query parameters: id =', userId);
      
      // Use maybeSingle to avoid 406 errors when no data is found
      // Use type assertion to handle Supabase table type issues
      const { data, error: fetchError, status, statusText } = await supabase
        .from('user_data' as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      console.log('🔄 Supabase query completed with status:', status, statusText);
      
      if (fetchError) {
        console.error('Error fetching user data:', fetchError);
        throw fetchError;
      }
      
      console.log('Fetched user data:', data);
      
      if (data) {
        // Safely cast data to our expected type
        const typedData = data as unknown as SupabaseUserData;
        setUserData(typedData);
        
        // Extract planetary counts from user data if available
        if (typedData.planets_per_sign) {
          console.log('Found planets_per_sign in user data:', typedData.planets_per_sign);
          setStoredPlanetsPerSign(typedData.planets_per_sign);
          
          // Calculate counts array from planets per sign
          const countsArray = Object.values(typedData.planets_per_sign).map(planets => planets.length);
          if (countsArray.length === 12) {
            console.log('Setting stored planetary counts from user data:', countsArray);
            setStoredPlanetaryCounts(countsArray);
          }
        }
        
        // Update internal birth data state from user data
        const birthDataFromUser = {
          date: typedData.birth_date || '',
          time: typedData.birth_time || '',
          timeUnknown: typedData.time_unknown || false,
          city: typedData.birth_city || '',
          latitude: typedData.birth_latitude,
          longitude: typedData.birth_longitude
        };
        
        console.log('Setting internal birth data from user data:', birthDataFromUser);
        setInternalBirthData(birthDataFromUser);
      } else {
        console.log('No user data found for userId:', userId);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error as Error);
    } finally {
      setIsLoadingUserData(false);
    }
  }, [userId]);

  /**
   * Process data from astroData or stored data
   */
  const processData = useCallback(() => {
    // If we have stored planetary counts, use those
    if (storedPlanetaryCounts && storedPlanetaryCounts.length === 12) {
      console.log('Using stored planetary counts:', storedPlanetaryCounts);
      setPlanetCounts(storedPlanetaryCounts);
    } 
    // Otherwise calculate from astroData
    else if (astroData && astroData.planets) {
      console.log('Calculating planetary counts from astroData');
      const counts = calculatePlanetaryCounts(astroData);
      const countsArray = countsToArray(counts);
      console.log('Calculated counts:', countsArray);
      setPlanetCounts(countsArray);
    }

    // If we have stored planets per sign, use those
    if (storedPlanetsPerSign) {
      console.log('Using stored planets per sign:', storedPlanetsPerSign);
      setPlanetsPerSign(storedPlanetsPerSign);
    } 
    // Otherwise calculate from astroData
    else if (astroData && astroData.planets) {
      console.log('Calculating planets per sign from astroData');
      const planetsInSigns = processPlanetsPerSign(astroData);
      console.log('Calculated planets per sign:', planetsInSigns);
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
    console.log('Fetching user data for userId:', userId);
    fetchUserData();
  }, [fetchUserData]);

  // Process data when astroData or stored counts change
  useEffect(() => {
    console.log('Processing data with astroData:', !!astroData, 'storedCounts:', !!storedPlanetaryCounts);
    processData();
  }, [processData]);

  // Handle input changes for birth data form
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    if (propBirthData) return; // Don't handle changes if using prop data

    const { name, value } = e.target;
    const type = 'type' in e.target ? e.target.type : 'text';
    const checked = 'checked' in e.target ? e.target.checked : undefined;
    
    setInternalBirthData(prev => ({
      ...prev,
      [name]: type === 'checkbox' && checked !== undefined ? checked : value
    }));
  }, [propBirthData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    console.log('🚀 ===== START FORM SUBMISSION =====');
    e.preventDefault();
    
    console.group('📋 Form Submission Data');
    console.log('📅 Birth Date:', actualBirthData.date);
    console.log('🕒 Birth Time:', actualBirthData.time);
    console.log('🌍 Birth City:', actualBirthData.city);
    console.log('👤 User ID:', userId);
    console.groupEnd();
    
    // Validate required fields
    if (!actualBirthData.date || !actualBirthData.city) {
      const errorMsg = '❌ Missing required fields: ' + 
        (!actualBirthData.date ? 'date ' : '') + 
        (!actualBirthData.city ? 'location' : '');
      console.error(errorMsg);
      setError(new Error('Please enter both birth date and location'));
      return;
    }
    
    // Set loading state
    console.log('⏳ Starting form submission process...');
    setIsLoadingUserData(true);
    setError(null);
    setShowForm(false);
    
    try {
      // Validate user ID
      if (!userId) {
        const errorMsg = '❌ No userId available for upsert operation';
        console.error(errorMsg);
        throw new Error('User ID is required for updating birth data');
      }
      
      // Prepare data for Supabase
      const userData = {
        id: userId,
        birth_date: actualBirthData.date,
        birth_time: actualBirthData.timeUnknown ? null : actualBirthData.time,
        birth_city: actualBirthData.city,
        birth_latitude: actualBirthData.latitude,
        birth_longitude: actualBirthData.longitude,
        birth_timezone: actualBirthData.timezone || 'UTC',
      };
      
      console.group('💾 Supabase Upsert Data');
      console.log('🔑 User ID:', userId);
      console.log('📅 Birth Date:', userData.birth_date);
      console.log('🕒 Birth Time:', userData.birth_time);
      console.log('🌍 Birth City:', userData.birth_city);
      console.log('📍 Latitude:', userData.birth_latitude);
      console.log('📍 Longitude:', userData.birth_longitude);
      console.log('🕒 Timezone:', userData.birth_timezone);
      console.groupEnd();
      
      // Execute Supabase upsert
      console.log('🚀 Executing Supabase upsert operation...');
      console.log('Using customSupabase:', customSupabase ? '✅ Available' : '❌ Not available');
      
      const { data, error: upsertError } = await customSupabase.userData.upsert(userData);
      
      if (upsertError) {
        console.error('❌ Supabase upsert failed:', upsertError);
        console.error('Error details:', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
        });
        throw upsertError;
      }
      
      console.group('✅ Supabase Upsert Successful');
      console.log('Returned data:', data);
      console.groupEnd();
      
      // Update local state
      setUserData(data as unknown as SupabaseUserData);
      setInternalBirthData(actualBirthData);
      
      // Process and update planetary counts if astro data is available
      if (astroData?.planets) {
        console.group('🪐 Processing Planetary Data');
        console.log('Found astro data, processing planets per sign...');
        
        try {
          const planetsInSigns = processPlanetsPerSign(astroData);
          console.log('Planets per sign calculated:', planetsInSigns);
          
          console.log('Updating Supabase with planetary data...');
          const result = await customSupabase.userData.update(userId, { 
            planets_per_sign: planetsInSigns 
          });
          
          if (!result) {
            console.warn('⚠️ No result returned from planets_per_sign update');
          } else {
            console.log('✅ Successfully updated planetary data in Supabase');
          }
        } catch (planetsError) {
          console.error('❌ Error updating planetary data:', planetsError);
          // Don't rethrow - we want to continue even if planetary update fails
        }
        
        console.groupEnd();
      } else {
        console.log('ℹ️ No astro data available, skipping planetary update');
      }
      
      // Refresh user data
      console.log('🔄 Refreshing user data...');
      try {
        await fetchUserData();
        console.log('✅ Successfully refreshed user data');
      } catch (fetchError) {
        console.error('❌ Error refreshing user data:', fetchError);
        // Continue even if refresh fails
      }
      
      console.log('🎉 Form submission completed successfully!');
    } catch (err) {
      console.group('❌ Form Submission Error');
      console.error('Error details:', err);
      console.groupEnd();
      
      setError(err as Error);
      setShowForm(true); // Reopen form on error
    } finally {
      setIsLoadingUserData(false);
      console.log('🏁 Form submission process completed');
      console.log('===== END FORM SUBMISSION =====\n\n');
    }
  }, [actualBirthData, astroData, userId, fetchUserData]);
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

  // Track when we've completed a fetch attempt
  useEffect(() => {
    if (!astroLoading && !isLoadingUserData) {
      setHasFetched(true);
    }
  }, [astroLoading, isLoadingUserData]);

  // Only show error if we've tried to fetch and got an error
  const shouldShowError = (astroError || error) && hasFetched;
  
  // Handle retry logic
  const handleRetry = useCallback(() => {
    setShowError(false);
    if (userId) {
      fetchUserData();
    } else if (actualBirthData.date) {
      // If we have birth data but no user ID, trigger a re-fetch of astro data
      // Reset the error state and force a re-render
      setError(null);
      setHasFetched(false);
      // This will cause useAstroData to re-fetch
      setInternalBirthData({...internalBirthData});
    }
  }, [userId, actualBirthData.date, fetchUserData, internalBirthData]);
  
  // Define a simple error boundary component
  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: any) {
      return { hasError: true };
    }
    componentDidCatch(error: any, errorInfo: any) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    render() {
      if (this.state.hasError) {
        return <div>Error: Something went wrong. Please check your birth data and try again.</div>;
      }
      return this.props.children;
    }
  }

  // Show loading state or if data is incomplete
  if (astroLoading || isLoadingUserData || !hasRequiredData) {
    return <ChartLoading />;
  }

  // Show error state if there's an error and we're not showing the form
  if (shouldShowError && !showForm) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <ChartError 
          error={astroError || error} 
          onRetry={handleRetry}
          setShowForm={setShowForm}
        />
      </div>
    );
  }

  // Show placeholder if no birth data and no error
  // This is the initial state when no data has been entered
  if (!actualBirthData.date && !skipPlaceholder) {
    return (
      <ErrorBoundary>
        <ChartPlaceholder 
          showForm={showForm} 
          setShowForm={setShowForm} 
          propBirthData={propBirthData} 
        />
        
        {/* Modal overlay for birth data form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Enter Birth Data</h2>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <BirthDataForm 
                birthData={actualBirthData}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onSuccess={() => {
                  setShowForm(false);
                  if (userId) fetchUserData();
                }}
              />
            </div>
          </div>
        )}
      </ErrorBoundary>
    );
  }

  // Determine what to render based on renderMode
  if (renderMode === 'both') {
    return (
      <ErrorBoundary>
        <div className={`p-4 max-w-4xl mx-auto space-y-8 ${className}`}>
          {/* Modal overlay for birth data form */}
          {showForm && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Edit Birth Data</h2>
                  <button 
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <BirthDataForm 
                  birthData={actualBirthData}
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                  onSuccess={() => {
                    setShowForm(false);
                    if (userId) fetchUserData();
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Edit Birth Data Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Edit Birth Data button clicked in main view');
                setShowForm(true);
              }}
              className="text-sm"
            >
              Edit Birth Data
            </Button>
          </div>
          
          {/* Charts container */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Natal Chart */}
            <div className="w-full relative">
              <NatalChart 
                astroData={astroData || userData?.planetary_data}
                isLoading={astroLoading || isLoadingUserData}
                error={astroError || error}
                onDownload={handleDownloadNatalChart}
                onShare={handleShareNatalChart}
                isDownloading={isDownloading}
              />
              
              {/* Edit Birth Data button with improved accessibility */}
              <Button 
                variant="default" 
                className="absolute top-4 left-4 z-30 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                onClick={() => {
                  console.log('Edit Birth Data button clicked, toggling showForm from', showForm, 'to', !showForm);
                  setShowForm(!showForm);
                }}
                aria-label={showForm ? 'Hide birth data form' : 'Edit birth data to update chart'}
              >
                {showForm ? 'Hide Form' : 'Edit Birth Data'}
              </Button>
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
      </ErrorBoundary>
    );
  } else if (renderMode === 'natal') {
    return (
      <ErrorBoundary>
        <div className={`${className}`}>
          {!skipPlaceholder && !actualBirthData.date && (
            <Button 
              variant="default" 
              className="absolute top-4 left-4 z-30 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
              onClick={() => setShowForm(true)}
            >
              Edit Birth Data
            </Button>
          )}
          <NatalChart 
            astroData={astroData || userData?.planetary_data}
            isLoading={astroLoading || isLoadingUserData}
            error={astroError || error}
            onDownload={handleDownloadNatalChart}
            onShare={handleShareNatalChart}
            isDownloading={isDownloading}
          />
        </div>
      </ErrorBoundary>
    );
  } else if (renderMode === 'planetary') {
    return (
      <ErrorBoundary>
        <div className={`${className}`}>
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
      </ErrorBoundary>
    );
  }
  
  // Default fallback
  return (
    <ErrorBoundary>
      <div className={`p-4 max-w-4xl mx-auto space-y-8 ${className}`}>
        <div>Invalid render mode</div>
      </div>
    </ErrorBoundary>
  );
};

export default NatalChartProfile;
