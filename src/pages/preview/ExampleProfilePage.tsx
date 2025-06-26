import React, { useState } from 'react';
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

// Dynamically import the NatalChartProfile component with SSR disabled
const NatalChartProfile = dynamic(
  () => import('@/components/astrology/NatalChartProfile'),
  { ssr: false }
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
  // In a real app, this data would come from your backend/API
  const [user, setUser] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    memberSince: 'January 15, 2023',
    lastLogin: 'Today at 2:45 PM',
    accountType: 'Premium',
    preferences: {
      favoriteSports: ['basketball', 'baseball', 'football'],
      notificationEmail: 'alex.johnson@example.com',
      theme: 'Dark Mode'
    },
    stats: {
      predictions: 128,
      accuracy: '74%',
      followers: 245,
      following: 156,
    },
  });

  const [showAddSports, setShowAddSports] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>(user.preferences.favoriteSports);
  
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
  
  const saveSports = () => {
    setUser(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        favoriteSports: [...selectedSports]
      }
    }));
    setShowAddSports(false);
  };

  // Hardcoded demo birth data for the natal chart
  const demoBirthData = {
    date: '1990-06-15',
    time: '14:30',
    timeUnknown: false,
    city: 'New York, NY'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <CardTitle className="text-lg font-semibold text-slate-900">Your Stats</CardTitle>
                <CardDescription className="text-slate-500">Performance and activity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{user.stats.predictions}</p>
                    <p className="text-sm text-blue-600">Predictions</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{user.stats.accuracy}</p>
                    <p className="text-sm text-green-600">Accuracy</p>
                  </div>
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
        
        {/* Natal Chart Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Astrological Profile</h2>
            <Badge variant="secondary">Demo Version</Badge>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4 text-sm text-slate-600">
              <p><strong>Demo Birth Data:</strong> {demoBirthData.date} at {demoBirthData.time} in {demoBirthData.city}</p>
            </div>
            <NatalChartProfile birthData={demoBirthData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleProfilePage;
