import React, { useEffect, useState, useRef } from 'react';

import { useAuth } from '@/contexts/AuthContext.js';
import { supabase } from '@/lib/supabase.js';
import { PostgrestError } from '@supabase/supabase-js';

import type { Profile } from '@/types/profiles';
import PlanetaryCountChart from '@/components/astrology/PlanetaryCountChart';
import UserBirthDataForm from '@/components/forms/UserBirthDataForm';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sportsPreferences, setSportsPreferences] = useState<string[]>([]);
  const [theme, setTheme] = useState<string>('Light Mode');
  const [isClient, setIsClient] = useState(false);
  const [showBirthForm, setShowBirthForm] = useState(false);
  
  // Create a ref to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    setIsClient(true);
    
    // Set isMounted to false when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshData = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_data')
      .select(`
          id,
          name,
          email,
          avatar_url,
          account_type,
          favorite_sports,
          notification_email,
          theme,
          birth_date,
          birth_time,
          birth_city,
          time_unknown,
          birth_latitude,
          birth_longitude,
          planetary_data,
          planetary_count,
          planets_per_sign,
          created_at,
          member_since,
          last_login
        `)
      .eq('id', user.id)
      .single();

    // Check if component is still mounted before updating state
    if (!isMounted.current) return;

    if (error) {
      console.error('Error refreshing user data:', error);
      setError('Failed to refresh profile data.');
    } else if (data) {
      setUserData(data as Profile); // Explicitly cast to Profile
      setSportsPreferences(data.favorite_sports || []);
      setTheme(data.theme || 'Light Mode');
    }
    setLoading(false);
  };


  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        if (isMounted.current) setLoading(false);
        return;
      }
      if (isMounted.current) setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('user_data')
        .select(`
          id,
          name,
          email,
          avatar_url,
          account_type,
          favorite_sports,
          notification_email,
          theme,
          birth_date,
          birth_time,
          birth_city,
          time_unknown,
          birth_latitude,
          birth_longitude,
          planetary_data,
          planetary_count,
          planets_per_sign,
          created_at,
          member_since,
          last_login
        `)
        .eq('id', user.id)
        .single() as { data: Profile | null, error: PostgrestError | null };

      // Check if component is still mounted before updating state
      if (!isMounted.current) return;

      let finalProfile: Profile | null = null;

      if (profileError && profileError.code === 'PGRST116') { // No rows found
        console.log("No existing user data found, creating new entry.");
        const newProfile: Profile = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || null,
          email: user.email || null,
          avatar_url: null,
          account_type: 'Standard',
          favorite_sports: [],
          notification_email: user.email || null,
          theme: 'Light Mode',

          birth_date: null,
          birth_time: null,
          birth_city: null,
          time_unknown: null,
          birth_latitude: null,
          birth_longitude: null,
          planetary_data: null,
          planetary_count: null,
          planets_per_sign: null,
          member_since: new Date().toISOString(),
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { data: newProfileData, error: insertError } = await supabase
          .from('user_data')
          .insert(newProfile)
          .select()
          .single();

        // Check if component is still mounted before updating state
        if (!isMounted.current) return;

        if (insertError) {
          console.error("Error creating new user data:", insertError);
          setError(`Error creating profile: ${insertError.message}`);
          return;
        }
        finalProfile = newProfileData;
      } else if (profileError) {
        console.error("Error fetching user data:", profileError);
        setError(`Error fetching profile: ${profileError.message}`);
        return;
      } else {
        finalProfile = profileData;
      }

      // Check if component is still mounted before updating state
      if (isMounted.current) {
        if (finalProfile) {
          setUserData(finalProfile);
        }
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);


  const [name, setName] = useState(userData?.name || '');

  useEffect(() => {
    if (userData && isMounted.current) {
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {loading ? (
        <p>Loading profile...</p>
      ) : userData ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">User Information</h2>
            <div className="space-y-4">
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Member Since:</strong> {new Date(userData.created_at || '').toLocaleDateString()}</p>
              <p><strong>Account Type:</strong> {userData.account_type}</p>

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

            <button
              onClick={handleSignOut}
              className="mt-6 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Sign Out
            </button>

            {/* Planetary Count Chart */}
            {userData?.planetary_count && (
              <div className="mt-6">
                <PlanetaryCountChart planetaryCount={userData.planetary_count} />
              </div>
            )}

            {/* Birth Data Form */}
            <div className="mt-6">
              {showBirthForm ? (
                <UserBirthDataForm
                  userId={user!.id}
                  defaultValues={{
                    birthDate: userData?.birth_date ?? undefined,
                    birthTime: userData?.birth_time ?? undefined,
                    birthCity: userData?.birth_city ?? undefined,
                    timeUnknown: userData?.time_unknown ?? undefined,
                    birthLatitude: userData?.birth_latitude ?? undefined,
                    birthLongitude: userData?.birth_longitude ?? undefined,
                  }}
                  onSuccess={() => window.location.reload()}
                />
              ) : (
                <button
                  onClick={() => setShowBirthForm(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                >
                  {userData?.birth_date ? 'Update Birth Data' : 'Add Birth Data'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );


};

export default Profile;
