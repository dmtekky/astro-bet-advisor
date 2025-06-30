import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge'; // Added for demo badge
import { User, Star, Activity, Share2, Download, Printer, Info, Loader2 } from 'lucide-react';

import { customSupabase } from '@/lib/custom-supabase';
import UserBirthDataForm from '@/components/forms/UserBirthDataForm';

// Dynamically import the chart components with SSR disabled
const NatalChartProfile = dynamic(
  () => import('@/components/astrology/NatalChartProfile'),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center">Loading natal chart...</div> }
);

const PlanetaryCountChart = dynamic(
  () => import('@/components/astrology/PlanetaryCountChart'),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center">Loading planetary chart...</div> }
);

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
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddSports, setShowAddSports] = useState(false);
  
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
  const user = userData || defaultUser;
  
  // Initialize sports selection with user preferences
  const [selectedSports, setSelectedSports] = useState<string[]>(user.preferences.favoriteSports);
  
  // Fetch user data from Supabase
  useEffect(() => {
    const fetchSpecificUser = async () => {
      try {
        setLoading(true);
        
        // Fetch data for the specific user ID
        const specificUserId = '9245f829-40d5-44ee-9ea7-182d4d23d0b6';
        const data = await customSupabase.userData.getById(specificUserId);
        
        if (data) {
          setUserId(data.id);
          
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
            birthData: {
              birthDate: data.birth_date,
              birthTime: data.birth_time || '',
              birthCity: data.birth_city,
              timeUnknown: data.time_unknown,
              birthLatitude: data.birth_latitude,
              birthLongitude: data.birth_longitude,
            },
          });
          
          // Update selected sports
          if (data.favorite_sports && Array.isArray(data.favorite_sports)) {
            setSelectedSports(data.favorite_sports);
          }
        } else {
          console.error('No data found for the specific user ID');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSpecificUser();
  }, []);
  
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
  
  const saveSports = async () => {
    if (userId) {
      try {
        // Update the user's favorite sports in the unified user_data table
        await customSupabase.userData.update(userId, {
          favorite_sports: selectedSports
        });
        
        // Update local state
        if (userData) {
          setUserData(prev => ({
            ...prev,
            preferences: {
              ...prev.preferences,
              favoriteSports: [...selectedSports]
            }
          }));
        }
      } catch (error) {
        console.error('Error updating favorite sports:', error);
      }
    } else {
      // If no user ID, just update local state
      if (userData) {
        setUserData(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            favoriteSports: [...selectedSports]
          }
        }));
      }
    }
    
    setShowAddSports(false);
  };
  
  // Handle form submission success
  const handleFormSuccess = (newUserData: any) => {
    setUserId(newUserData.id);
    setShowForm(false);
    
    // Refresh the page to show the new data
    window.location.reload();
  };

  // Birth data from user data or fallback to demo data
  const birthData = userData?.birthData || {
    date: '1990-06-15',
    time: '14:30',
    timeUnknown: false,
    city: 'New York, NY',
    latitude: 40.7128,
    longitude: -74.0060
  };
  
  // State for chart data sharing
  const [chartData, setChartData] = useState<{
    natalChartData?: any;
    planetaryCounts?: number[];
    planetsPerSign?: Record<string, string[]>;
  }>({});

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
                  <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                      {user.accountType} Member
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">Last active: {user.lastLogin}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">Member since {user.memberSince}</p>
                </div>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-sm">
              Upgrade Plan
            </Button>
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
                  <Button onClick={saveSports}>Save</Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Personal Info */}
          <div className="space-y-6">
            {/* Account Overview */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Account Overview</CardTitle>
                <CardDescription className="text-slate-500">Your personal and subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Account Type</Label>
                    <p className="text-sm text-slate-900">{user.accountType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Member Since</Label>
                    <p className="text-sm text-slate-900">{user.memberSince}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Last Login</Label>
                    <p className="text-sm text-slate-900">{user.lastLogin}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-slate-100 px-6 py-4">
                <Button variant="outline">Manage Subscription</Button>
                <Button>Upgrade</Button>
              </CardFooter>
            </Card>

            {/* Preferences */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Preferences</CardTitle>
                <CardDescription className="text-slate-500">Customize your experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme-mode" className="text-sm font-medium text-slate-700">
                      Dark Mode
                    </Label>
                    <Switch id="theme-mode" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2">Timezone</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                        <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                        <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
                        <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Middle Column - Stats */}
          <div className="space-y-6">
            {/* Stats Overview */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Stats Overview</CardTitle>
                <CardDescription className="text-slate-500">Your activity statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700">{user.stats.followers}</p>
                    <p className="text-sm text-purple-600">Followers</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">{user.stats.following}</p>
                    <p className="text-sm text-amber-600">Following</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Security and More */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
                <CardDescription className="text-slate-500">Your latest actions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Prediction submitted</p>
                      <p className="text-xs text-slate-500">Lakers vs Celtics - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <ChevronsUpDown className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Updated profile</p>
                      <p className="text-xs text-slate-500">Added favorite sports - Yesterday</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <Check className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Prediction won</p>
                      <p className="text-xs text-slate-500">Yankees vs Red Sox - 2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Astrological Charts Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Astrological Profile</h2>
            <Badge variant="secondary">Demo Version</Badge>
          </div>
          
          {/* Birth data info */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-900 rounded-lg shadow-xl p-6 mb-6">
            <div className="flex justify-between items-start">
              <div className="text-sm text-slate-300">
                <p><strong>Birth Data:</strong> {birthData.date} at {birthData.time} in {birthData.city}</p>
                {birthData.latitude && birthData.longitude && (
                  <p className="text-xs opacity-75 mt-1">
                    Coordinates: {birthData.latitude.toFixed(4)}°N, {Math.abs(birthData.longitude).toFixed(4)}°W
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                className="text-slate-900 bg-white/90 hover:bg-blue-700 hover:text-white border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200"
                onClick={() => setShowForm(true)}
                aria-label="Edit birth data"
              >
                {userData ? 'Edit Birth Data' : 'Add Birth Data'}
              </Button>
            </div>
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Natal Chart */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Natal Chart</h2>
                <div className="bg-opacity-30 bg-slate-800 backdrop-blur-sm rounded-xl border border-slate-700 p-4 h-[500px] relative">
                  {/* Cosmic background effect */}
                  <div className="absolute inset-0 z-0 opacity-20">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div 
                        key={`star-${i}`}
                        className="absolute rounded-full bg-white" 
                        style={{
                          width: `${Math.random() * 2 + 1}px`,
                          height: `${Math.random() * 2 + 1}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: Math.random() * 0.8
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Natal Chart */}
                  <div className="relative z-10 h-full">
                    {userId ? (
                      <NatalChartProfile 
                        userId={userId} 
                        onDataLoad={setChartData}
                        className="h-full"
                      />
                    ) : (
                      <NatalChartProfile 
                        birthData={birthData} 
                        onDataLoad={setChartData}
                        className="h-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Planetary Count Chart */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Planetary Distribution</h2>
                <div className="bg-opacity-30 bg-slate-800 backdrop-blur-sm rounded-xl border border-slate-700 p-4 h-[500px] relative">
                  {/* Cosmic background effect */}
                  <div className="absolute inset-0 z-0 opacity-20">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div 
                        key={`star-${i}`}
                        className="absolute rounded-full bg-white" 
                        style={{
                          width: `${Math.random() * 2 + 1}px`,
                          height: `${Math.random() * 2 + 1}px`,
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: Math.random() * 0.8
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Planetary Count Chart */}
                  <div className="relative z-10 h-full">
                    <PlanetaryCountChart 
                      planetCounts={chartData.planetaryCounts || null}
                      planetsPerSign={chartData.planetsPerSign || {}}
                      isDownloading={false}
                      onDownload={async () => {
                        // Implement download functionality if needed
                      }}
                      onShare={async () => {
                        // Implement share functionality if needed
                      }}
                    />
                  </div>
                </div>
              </div>
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
      </div>
    </div>
  );
};

export default ExampleProfilePage;
