import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { generateInterpretations, KeyPlacementInterpretation } from '@/components/astrology/utils/interpretationsGenerator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Added for demo badge
import { User, Star, Activity, Share2, Download, Printer, Info, Loader2 } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import UserBirthDataForm from '@/components/forms/UserBirthDataForm';
import ChartLoading from '@/components/astrology/components/ChartLoading';
import SignInterpretation from '@/components/astrology/SignInterpretation';
import AspectsGrid from '@/components/astrology/AspectsGrid';
import SignInterpretationSkeleton from '@/components/astrology/SignInterpretationSkeleton';

// Lazily import the chart components for code splitting
const NatalChartProfile = lazy(() => import('@/components/astrology/NatalChartProfile'));

// Define sport type
type Sport = {
  id: string;
  name: string;
};

// Available sports options
const SPORTS: Sport[] = [
  { id: 'basketball', name: 'Basketball' },
  { id: 'baseball', name: 'Baseball' },
  { id: 'football', name: 'Football' },
  { id: 'hockey', name: 'Hockey' },
  { id: 'soccer', name: 'Soccer' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'golf', name: 'Golf' },
  { id: 'boxing', name: 'Boxing' },
  { id: 'mma', name: 'MMA' },
  { id: 'rugby', name: 'Rugby' },
];

// Define a type for the user profile data structure used in the UI
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  memberSince: string;
  lastLogin: string;
  accountType: string;
  preferences: {
    favoriteSports: string[];
    notificationEmail: string;
    theme: string;
  };
  stats: {
    predictions: number;
    accuracy: string;
    followers: number;
    following: number;
  };
  birthData: {
    birthDate: string;
    birthTime: string;
    birthCity: string;
    timeUnknown: boolean;
    birthLatitude: number;
    birthLongitude: number;
  } | null;
  planetary_data: any | null; // These can be typed more strictly later
  planetary_count: any | null;
  planets_per_sign: any | null;
}

// Consistent styling for all sports
const SPORT_STYLE = 'bg-blue-50 text-blue-700 hover:bg-blue-100';
const SPORT_PILL = 'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border border-transparent hover:shadow-sm';
const ADD_PILL = 'flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm border-2 border-white';

// Animation variants for framer-motion
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.2,
      ease: 'easeOut'
    }
  }),
  hover: {
    scale: 1.03,
    transition: { duration: 0.15 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const ExampleProfilePage: React.FC = () => {
  // State for user data from Supabase
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddSports, setShowAddSports] = useState(false);
  const [interpretations, setInterpretations] = useState<KeyPlacementInterpretation>({});
  const [interpretationsLoading, setInterpretationsLoading] = useState(true);
  
  // Default user data when no Supabase data is available
  const defaultUser = {
    name: 'New User',
    email: 'user@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    memberSince: new Date().toLocaleDateString(),
    lastLogin: 'Today',
    accountType: 'Standard',
    preferences: {
      favoriteSports: [] as string[],
      notificationEmail: 'user@example.com',
      theme: 'Light Mode'
    },
    stats: {
      predictions: 0,
      accuracy: '0%',
      followers: 0,
      following: 0,
    },
  };
  
  // Current user data (from Supabase or default)
  const user = userData || { ...defaultUser, birthData: null, planetary_data: null, planetary_count: null, planets_per_sign: null } as UserProfile;

  const fetchSpecificUser = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch data for the specific user ID
      const specificUserId = '9245f829-40d5-44ee-9ea7-182d4d23d0b6';
      // With a typed Supabase client, this call becomes fully type-safe.
      const { data, error } = await supabase
        .from('user_data') // No more `(supabase as any)` needed!
        .select('*')
        .eq('id', specificUserId)
        .single();
        
      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }
      
      if (data) {
        try {
          // Add null check for userData.id
          setUserId(data?.id || specificUserId);
          
          // Transform the data to match our UI expectations
          setUserData({
          name: data.name || 'User',
          email: data.email || 'user@example.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          memberSince: new Date(data.created_at).toLocaleDateString(),
          lastLogin: 'Today',
          accountType: 'Premium',
          preferences: {
            favoriteSports: data.favorite_sports || [],
            notificationEmail: data.email || 'user@example.com',
            theme: 'Dark Mode'
          },
          stats: {
            predictions: Math.floor(Math.random() * 100),
            accuracy: `${Math.floor(Math.random() * 30) + 70}%`,
            followers: Math.floor(Math.random() * 200) + 50,
            following: Math.floor(Math.random() * 100) + 50,
          },
          birthData: data.birth_date ? {
            birthDate: data.birth_date,
            birthTime: data.birth_time || '',
            birthCity: data.birth_city,
            timeUnknown: !!data.time_unknown, // Ensure it's a boolean
            birthLatitude: data.birth_latitude,
            birthLongitude: data.birth_longitude,
          } : null,
          planetary_data: data.planetary_data || null,
          planetary_count: data.planetary_count || null,
          planets_per_sign: data.planets_per_sign || null,
        });
        
        // Update selected sports
        if (data.favorite_sports && Array.isArray(data.favorite_sports)) {
          setSelectedSports(data.favorite_sports);
        }
        } catch (error) {
          console.error('Error processing user data:', error);
          // Use default user data as fallback
          setUserData(defaultUser);
        }
      } else {
        console.error('No data found for the specific user ID');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initialize sports selection with user preferences
  const [selectedSports, setSelectedSports] = useState<string[]>(user.preferences.favoriteSports);
  
  // Fetch user data from Supabase
  useEffect(() => {
    fetchSpecificUser();
  }, [fetchSpecificUser]);
  
  // Generate interpretations dynamically
  useEffect(() => {
    if (userData?.planetary_data) {
      setInterpretationsLoading(true);
      const generated = generateInterpretations(userData.planetary_data);
      setInterpretations(generated);
      setInterpretationsLoading(false);
    } else {
      setInterpretations({}); // Clear interpretations if no planetary data
    }
  }, [userData?.planetary_data]);
  
  const availableSports = SPORTS.filter(sport => !selectedSports.includes(sport.id));
  const selectedSportData = SPORTS.filter(sport => selectedSports.includes(sport.id));

  const toggleSport = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId)
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };
  
  const toggleAddSports = () => {
    setShowAddSports(prev => !prev);
  };
  
  const updateFavoriteSports = async () => {
    if (userId) {
      try {
        // Update the user's favorite sports in the unified user_data table
        const { data, error } = await supabase.from('user_data').upsert({
          id: userId,
          favorite_sports: selectedSports
        });
        
        if (error) {
          throw error;
        }
        
        // Update local state
        if (userData) {
          setUserData({
            ...userData,
            preferences: {
              ...userData.preferences,
              favoriteSports: selectedSports
            }
          });
        }
      } catch (error) {
        console.error('Error updating favorite sports:', error);
      }
    }
    
    setShowAddSports(false);
  };
  
  // Handle form submission success
  const handleFormSuccess = () => {
    setShowForm(false);
    // Re-fetch user data to show the new charts
    fetchSpecificUser();
  };

  const getMajorSigns = (planetaryData: any): { sun: string | null; moon: string | null; rising: string | null } => {
    if (!planetaryData || !Array.isArray(planetaryData.planets)) {
      return { sun: null, moon: null, rising: null };
    }

    const findSign = (planetName: string): string | null =>
      planetaryData.planets.find((p: any) => p.name.toLowerCase() === planetName.toLowerCase())?.sign || null;

    const getSignFromDegree = (degree: number): string => {
      const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
      const signIndex = Math.floor(degree / 30) % 12;
      return signs[signIndex];
    };

    return {
      sun: findSign('Sun'),
      moon: findSign('Moon'),
      rising: planetaryData.ascendant !== undefined ? getSignFromDegree(planetaryData.ascendant) : null,
    };
  };

  const majorSigns = getMajorSigns(user?.planetary_data);

  console.log('user.planetary_data:', user.planetary_data);
  console.log('interpretationsLoading:', interpretationsLoading);
  console.log('interpretations:', interpretations);
  console.log('majorSigns:', majorSigns);

  const signDetails = {
    sun: {
      icon: '☀️',
      colorClass: 'border-yellow-300',
    },
    moon: {
      icon: '🌙',
      colorClass: 'border-slate-300',
    },
    rising: {
      icon: '🌅',
      colorClass: 'border-rose-300',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-lg text-gray-700">Loading user data...</span>
          </div>
        )}
        
        {/* User Birth Data Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle>{userData ? 'Edit' : 'Enter'} Your Birth Information</CardTitle>
                  <CardDescription>
                    This information is used to generate your astrological profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserBirthDataForm 
                    userId={userId!}
                    onSuccess={handleFormSuccess} 
                    defaultValues={userData?.birthData}
                  />
                </CardContent>
              </Card>
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close form"
              >✕</button>
            </motion.div>
          </div>
        )}
        
        {/* Button to show form if no user data */}
        {!loading && !userData && !showForm && (
          <div className="flex justify-center mb-8">
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Enter Your Birth Information
            </Button>
          </div>
        )}
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                  {user.planetary_data && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {majorSigns.sun && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">☀️ Sun in {majorSigns.sun}</Badge>
                      )}
                      {majorSigns.moon && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">🌙 Moon in {majorSigns.moon}</Badge>
                      )}
                      {majorSigns.rising && (
                        <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">🌅 {majorSigns.rising} Rising</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-slate-500">
                      Member since {user.memberSince}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-slate-900">Favorite Sports</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {selectedSportData.map((sport, index) => (
                <motion.div
                  key={sport.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  variants={itemVariants}
                  className={`${SPORT_PILL} ${SPORT_STYLE}`}
                >
                  {sport.name}
                </motion.div>
              ))}
              
              {availableSports.length > 0 && (
                <motion.button
                  onClick={toggleAddSports}
                  className={`${SPORT_PILL} ${ADD_PILL}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Add sport"
                >
                  <span className="text-xl font-bold">+</span>
                </motion.button>
              )}
            </div>
            
            {showAddSports && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem' }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  {availableSports.map((sport) => (
                    <Button
                      key={sport.id}
                      variant="outline"
                      className={`${SPORT_PILL} ${SPORT_STYLE}`}
                      onClick={() => toggleSport(sport.id)}
                    >
                      {sport.name}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Button variant="outline" onClick={toggleAddSports}>
                    Cancel
                  </Button>
                  <Button onClick={updateFavoriteSports}>Save</Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        

        
        {/* Astrological Charts Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Astrological Profile</h2>
            <Badge 
              variant="outline" 
              className="
                relative overflow-hidden
                border-amber-600 bg-amber-600/90 
                text-white hover:text-white/95
                font-medium tracking-wide
                px-3 sm:px-4 py-1.5 rounded-full
                shadow-lg shadow-amber-600/30
                hover:shadow-amber-600/40 hover:bg-amber-600
                transition-all duration-300
                group
                backdrop-blur-sm
                border-2 border-amber-500/50
              "
            >
              <span className="relative z-10 flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 group-hover:opacity-100"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <span className="drop-shadow-sm text-xs sm:text-sm font-semibold">Sidereal (Lahiri Ayanamsa)</span>
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-amber-400/30 via-amber-300/40 to-amber-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            </Badge>
          </div>
          
          {/* Birth data info */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-900 rounded-lg shadow-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="text-sm sm:text-base text-white font-medium">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Birth Data</span>
                </div>
                <p>{user.birthData ? `${user.birthData.birthDate} at ${user.birthData.birthTime || '12:01'} in ${user.birthData.birthCity}` : 'Not provided'}</p>
                {user.birthData?.birthLatitude && user.birthData?.birthLongitude && (
                  <p className="text-sm opacity-90 mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Coordinates: {user.birthData.birthLatitude.toFixed(4)}°N, {Math.abs(user.birthData.birthLongitude).toFixed(4)}°W
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                className="text-slate-900 bg-white/90 hover:bg-blue-700 hover:text-white border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200"
                onClick={() => setShowForm(true)}
                aria-label="Edit birth data"
              >
                {user.birthData ? 'Edit Birth Data' : 'Add Birth Data'}
              </Button>
            </div>
          </div>
          
          {/* Astrological Charts Container */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-xl shadow-xl overflow-hidden p-6 relative">
            {/* Cosmic background effect */}
            <div className="absolute inset-0 z-0 opacity-20">
              {Array.from({ length: 50 }).map((_, i) => (
                <div 
                  key={`star-${i}`}
                  className="absolute rounded-full bg-white" 
                  style={{
                    width: `${Math.random() * 2 + 1}px`,
                    height: `${Math.random() * 2 + 1}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.8,
                    animation: `twinkle ${Math.random() * 5 + 3}s infinite alternate`
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {user.birthData && userId ? (
                <Suspense fallback={<ChartLoading />}>
                  <NatalChartProfile
                    userId={userId}
                    birthData={{
                      date: user.birthData.birthDate,
                      time: user.birthData.birthTime,
                      city: user.birthData.birthCity,
                      timeUnknown: user.birthData.timeUnknown || false
                    }}
                    natalChartData={user.planetary_data}
                    planetaryCounts={user.planetary_count}
                    planetsPerSign={user.planets_per_sign}
                  />
                </Suspense>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {user.birthData ? 'Generate Your Astrological Profile' : 'Unlock Your Astrological Profile'}
                  </h3>
                  <p className="text-slate-300 mb-6 max-w-md mx-auto">
                    {user.birthData 
                      ? 'Your charts haven\'t been generated yet. Open the form and click "Save" to create them.' 
                      : 'Enter your birth information to generate your personalized charts.'}
                  </p>
                  <Button onClick={() => setShowForm(true)} size="lg">
                    {user.birthData ? 'Generate Charts' : 'Add Birth Data'}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart Description */}
          <div className="mt-6 bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300">
            <h3 className="font-semibold text-slate-200 mb-2">About Your Charts</h3>
            <p className="mb-2">
              Your <span className="text-blue-400">Natal Chart</span> shows the positions of celestial bodies at your exact time of birth, 
              while the <span className="text-purple-400">Planetary Distribution</span> chart visualizes how many planets are in each zodiac sign.
            </p>
            <p className="text-xs opacity-75">
              For the most accurate reading, ensure your birth time and location are precise.
            </p>
          </div>
        </div>

        {/* Key Placement Interpretations */}
        {user.planetary_data ? (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Key Placements</h2>
            {interpretationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SignInterpretationSkeleton />
                <SignInterpretationSkeleton />
                <SignInterpretationSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {majorSigns.sun && interpretations.sun?.description && (
                  <SignInterpretation
                    placement="Sun"
                    sign={majorSigns.sun}
                    interpretation={interpretations.sun.description}
                    icon={signDetails.sun.icon}
                    colorClass={signDetails.sun.colorClass}
                  />
                )}
                {majorSigns.moon && interpretations.moon?.description && (
                  <SignInterpretation
                    placement="Moon"
                    sign={majorSigns.moon}
                    interpretation={interpretations.moon.description}
                    icon={signDetails.moon.icon}
                    colorClass={signDetails.moon.colorClass}
                  />
                )}
                {majorSigns.rising && interpretations.rising?.description && (
                  <SignInterpretation
                    placement="Rising"
                    sign={majorSigns.rising}
                    interpretation={interpretations.rising.description}
                    icon={signDetails.rising.icon}
                    colorClass={signDetails.rising.colorClass}
                  />
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Planetary Aspects */}
        {user?.planetary_data?.aspects && Array.isArray(user.planetary_data.aspects) && user.planetary_data.aspects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Deeper Insights</h2>
            <AspectsGrid 
              aspects={user.planetary_data.aspects} 
              interpretations={interpretations?.aspects || {}} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExampleProfilePage;
