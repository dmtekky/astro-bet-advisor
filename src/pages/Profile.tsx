import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePageView } from '@/contexts/PageViewContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { BirthDataSection } from '@/components/profile/BirthDataSection';
import UserBirthDataForm from '@/components/forms/UserBirthDataForm';
import ProfileHeader from '@/components/profile/ProfileHeader';

import { generateInterpretations } from '@/components/astrology/utils/interpretationsGenerator';
import SignInterpretation from '@/components/astrology/SignInterpretation';
import AspectsGrid from '@/components/astrology/AspectsGrid';

import NatalChartProfile from '@/components/astrology/NatalChartProfile';
import SignInterpretationSkeleton from '@/components/astrology/SignInterpretationSkeleton';

import { UserProfile, BirthData, Profile } from '@/types/profiles';
import { AstroData } from '@/types/astrology';

// Lazily import the chart components for code splitting
const NatalChartProfileLazy = lazy(() => import('@/components/astrology/NatalChartProfile'));

const Profile = () => {
  const { user, signOut } = useAuth();
  const { resetPageViews } = usePageView();
  const [userData, setUserData] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [sportsPreferences, setSportsPreferences] = useState<string[]>([]);
  const [theme, setTheme] = useState<string>('Light Mode');
  const [activeTab, setActiveTab] = useState('profile');

  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error refreshing user data:', error);
      setError('Failed to refresh profile data.');
    } else if (data) {
      setUserData(data);
      setBirthData(data.birth_date ? {
        birthDate: data.birth_date,
        birthTime: data.birth_time || '',
        birthCity: data.birth_city || '',
        birthLat: data.birth_latitude || 0,
        birthLon: data.birth_longitude || 0,
        birthTimeZone: 'America/New_York', // Default or fetch from data
      } : null);
      setSportsPreferences(data.favorite_sports || []);
      setTheme(data.theme || 'Light Mode');
    }
    setLoading(false);
  };
  const [interpretations, setInterpretations] = useState<AstroData | null>(null);
  const [interpretationsLoading, setInterpretationsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching user data:', error);
        setError('Failed to load profile.');
        setLoading(false);
        return;
      }

      if (data) {
        setUserData(data);
      } else {
        // Create a new profile if one doesn't exist
        const newProfile: Profile = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || null,
          email: user.email || null,

          member_since: new Date().toISOString(),
          last_login: new Date().toISOString(),
          account_type: 'Standard',
          favorite_sports: [],
          notification_email: user.email || null,
          theme: 'Light Mode',
          predictions: 0,
          accuracy: '0%',
          followers: 0,
          following: 0,
          birth_date: null,
          birth_time: null,
          birth_city: null,
          time_unknown: null,
          birth_latitude: null,
          birth_longitude: null,
          planetary_data: null,
          planetary_count: null,
          planets_per_sign: null,
          created_at: new Date().toISOString(),
        };

        const { data: newUserData, error: insertError } = await supabase
          .from('user_data')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating new user data:', insertError);
          setError('Failed to create profile.');
          setLoading(false);
          return;
        }
        setUserData(newUserData);
      }
      setLoading(false);
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (userData) {
      setBirthData(userData.birth_date ? {
        birthDate: userData.birth_date,
        birthTime: userData.birth_time || '',
        birthCity: userData.birth_city || '',
        birthLat: userData.birth_latitude || 0,
        birthLon: userData.birth_longitude || 0,
        birthTimeZone: 'America/New_York', // Default or fetch from data
      } : null);
      setSportsPreferences(userData.favorite_sports || []);
      setTheme(userData.theme || 'Light Mode');
    }
  }, [userData]);

  // Generate interpretations dynamically
  useEffect(() => {
    if (userData?.planetary_data && userData.birthData) {
      setInterpretationsLoading(true);
      try {
        const generated = generateInterpretations(
          userData.planetary_data.planets,
          userData.birthData.birthDate,
          userData.birthData.birthTime,
          userData.birthData.birthLat,
          userData.birthData.birthLon,
          userData.birthData.birthTimeZone
        );
        setInterpretations(generated);
      } catch (error) {
        console.error('Error generating interpretations:', error);
        setInterpretations(null);
      } finally {
        setInterpretationsLoading(false);
      }
    } else {
      setInterpretations(null); // Clear interpretations if no planetary data
    }
  }, [userData?.planetary_data, userData?.birthData]);





  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  // Function to get major signs (Sun, Moon, Rising) - copied from ExampleProfilePage.tsx
  const getMajorSigns = (userData: Profile) => {
    return {
      sun: userData.planetary_data?.planets?.find((p: any) => p.name === 'Sun')?.sign || null,
      moon: userData.planetary_data?.planets?.find((p: any) => p.name === 'Moon')?.sign || null,
      rising: userData.planetary_data?.ascendant_sign || null,
    };
  };

  const [name, setName] = useState(userData?.name || '');

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
    }
  }, [userData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('user_data')
      .update({ name: name })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Profile updated successfully!');
      refreshData(); // Refresh data after update
    }
    setLoading(false);
  };

  const handleSaveBirthData = async (data: BirthData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('user_data')
      .update({ birth_data: data })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Birth data updated successfully!');
      refreshData();
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    } else {
      setSuccess('Signed out successfully!');
      // Redirect to login or home page after sign out
      window.location.href = '/'; 
    }
    setLoading(false);
  };

  const majorSigns = getMajorSigns(userData);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {loading ? (
        <p>Loading profile...</p>
      ) : userData ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {['profile', 'astrology', 'sports', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={
                    `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ` +
                    (activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
                  }
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">User Information</h2>
              <div className="space-y-4">
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Member Since:</strong> {new Date(userData.member_since || '').toLocaleDateString()}</p>
                <p><strong>Last Login:</strong> {new Date(userData.last_login || '').toLocaleDateString()}</p>
                <p><strong>Account Type:</strong> {userData.account_type}</p>
                <p><strong>Predictions:</strong> {userData.predictions}</p>
                <p><strong>Accuracy:</strong> {userData.accuracy}</p>
                <p><strong>Followers:</strong> {userData.followers}</p>
                <p><strong>Following:</strong> {userData.following}</p>
              </div>

              <h3 className="text-xl font-semibold mt-6 mb-4">Update Profile</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700">Name:</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'astrology' && (
            <div>
              <h3 className="text-xl font-semibold mt-6 mb-4">Birth Data</h3>
              {user && (
                <UserBirthDataForm
                  userId={user.id}
                  initialBirthData={birthData}
                  onSave={handleSaveBirthData}
                  refreshData={refreshData}
                />
              )}

              <h3 className="text-xl font-semibold mt-6 mb-4">Astrological Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-lg font-medium mb-2">Major Signs</h4>
                  <p>Sun Sign: {majorSigns.sun}</p>
                  <p>Moon Sign: {majorSigns.moon}</p>
                  <p>Rising Sign: {majorSigns.rising}</p>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-2">Planetary Data</h4>
                  {interpretationsLoading ? (
                    <SignInterpretationSkeleton />
                  ) : (
                    interpretations && (
                      <NatalChartProfile
                        birthData={birthData}
                        astroData={interpretations}
                        refreshData={refreshData}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sports' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Sports Preferences</h3>
              {/* SportsPreferencesForm will go here */}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Account Settings</h3>
              {/* UserSettingsForm will go here */} 
              <button
                onClick={handleSignOut}
                className="mt-6 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
};

export default Profile;
