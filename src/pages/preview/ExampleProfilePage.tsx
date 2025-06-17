import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableSports.map((sport, index) => (
                    <motion.button
                      key={sport.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      variants={itemVariants}
                      onClick={() => toggleSport(sport.id)}
                      className={`${SPORT_PILL} ${SPORT_STYLE}`}
                    >
                      {sport.name}
                    </motion.button>
                  ))}
                </div>
                
                <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
                  <Button 
                    size="sm"
                    onClick={saveSports}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-900 mb-2">Notification Email</h3>
            <div className="flex items-center">
              <p className="text-sm text-slate-900">{user.preferences.notificationEmail}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-blue-600 hover:text-blue-700"
                onClick={() => {/* Open email change modal */}}
              >
                Change
              </Button>
            </div>
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
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Full Name</Label>
                      <Input type="text" defaultValue={user.name} className="mt-1 bg-white" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Email Address</Label>
                      <Input type="email" defaultValue={user.email} className="mt-1 bg-white" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-900">Birth Information</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-slate-500">Date of Birth</Label>
                        <Input type="date" className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-500">Time of Birth</Label>
                        <Input type="time" className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-500">Place of Birth</Label>
                        <Input placeholder="City, Country" className="mt-1 bg-white" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Astrological Profile */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Astrological Profile</CardTitle>
                <CardDescription className="text-slate-500">Your astrological placements and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-medium text-blue-700 mb-1">SUN SIGN</p>
                    <p className="font-semibold text-slate-900">Gemini</p>
                    <p className="text-xs text-slate-500 mt-1">Communication, Intellect</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <p className="text-xs font-medium text-purple-700 mb-1">MOON SIGN</p>
                    <p className="font-semibold text-slate-900">Libra</p>
                    <p className="text-xs text-slate-500 mt-1">Emotions, Instincts</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-700 mb-1">RISING SIGN</p>
                    <p className="font-semibold text-slate-900">Aries</p>
                    <p className="text-xs text-slate-500 mt-1">First Impressions</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                    View Detailed Birth Chart
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Notification Preferences</CardTitle>
                <CardDescription className="text-slate-500">Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                    <div>
                      <h4 className="font-medium text-slate-900">Email Notifications</h4>
                      <p className="text-sm text-slate-500">Receive important account notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                    <div>
                      <h4 className="font-medium text-slate-900">Push Notifications</h4>
                      <p className="text-sm text-slate-500">Get real-time updates in your browser</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                    <div>
                      <h4 className="font-medium text-slate-900">SMS Alerts</h4>
                      <p className="text-sm text-slate-500">Important updates via text message</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Security</CardTitle>
                <CardDescription className="text-slate-500">Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Change Password</h4>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Current Password</Label>
                        <Input type="password" className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">New Password</Label>
                        <Input type="password" className="mt-1 bg-white" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Confirm New Password</Label>
                        <Input type="password" className="mt-1 bg-white" />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-medium text-slate-900 mb-3">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-center">
    <div className="text-2xl font-bold text-purple-600">{value}</div>
    <div className="text-sm text-slate-500 mt-1">{label}</div>
  </div>
);

export default ExampleProfilePage;
