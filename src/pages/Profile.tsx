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
import ProfileHeader from '@/components/profile/ProfileHeader';

import { generateInterpretations } from '@/components/astrology/utils/interpretationsGenerator';
import SignInterpretation from '@/components/astrology/SignInterpretation';
import AspectsGrid from '@/components/astrology/AspectsGrid';

import { NatalChartProfile } from '@/components/astrology/NatalChartProfile';
import SignInterpretationSkeleton from '@/components/astrology/SignInterpretationSkeleton';

import { UserProfile, BirthData } from '@/types/profiles';
import { AstroData } from '@/types/astrology';

// Lazily import the chart components for code splitting
const NatalChartProfileLazy = lazy(() => import('@/components/astrology/NatalChartProfile'));

const Profile = () => {
  const { user, signOut } = useAuth();
  const { resetPageViews } = usePageView();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpretations, setInterpretations] = useState<AstroData | null>(null);
  const [interpretationsLoading, setInterpretationsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);

      // Placeholder for fetching full UserProfile data
      // In a real scenario, this would fetch from Supabase and include birthData and other profile details
      const fetchedUserData: UserProfile = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || 'N/A',
        avatar: user.user_metadata?.avatar_url || null,
        memberSince: 'January 1, 2023', // Placeholder for memberSince
        lastLogin: 'Today', // Placeholder for lastLogin
        isPremium: false, // Placeholder
        birthData: {
          birthDate: '1990-01-01',
          birthTime: '12:00',
          birthCity: 'London',
          birthLat: 51.5074,
          birthLon: 0.1278,
          birthTimeZone: 'Europe/London',
        },
        // Placeholder for other astrological data
        sunSign: 'Capricorn',
        moonSign: 'Cancer',
        risingSign: 'Leo',
        planetary_data: {
          planets: [
            { name: 'Sun', sign: 'Capricorn', degree: 10, house: 1 },
            { name: 'Moon', sign: 'Cancer', degree: 20, house: 7 },
          ],
          date: '1990-01-01',
          query_time: '12:00',
          latitude: 51.5074,
          longitude: 0.1278,
          timezone: 'Europe/London',
        }, // Example planetary data with structure for interpretationsGenerator
        planetaryPositions: [
          { name: 'Sun', sign: 'Capricorn', degree: 10, house: 1 },
          { name: 'Moon', sign: 'Cancer', degree: 20, house: 7 },
        ], // Example planetary data
        aspects: [],
        houses: [],
        interpretations: null, // Initial interpretations state
      };
      setUserData(fetchedUserData);
      setLoading(false);
    };

    loadProfile();
  }, [user]);

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

  const handleSignOut = async () => {
    try {
      resetPageViews();
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user || !userData) throw new Error('No user data found');

      // In a real scenario, this would update the user's profile in Supabase
      console.log('Updating profile:', { name: userData.name, avatar: userData.avatar });
      // Simulate update
      setUserData(prev => prev ? { ...prev, name: userData.name, avatar: userData.avatar } : null);
      setSuccess('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBirthDataUpdate = (updatedData: BirthData) => {
    setUserData((prevData) => {
      if (!prevData) return null;
      // Update planetary_data as well if birthData changes, for interpretations
      const updatedPlanetaryData = prevData.planetary_data ? {
        ...prevData.planetary_data,
        date: updatedData.birthDate,
        query_time: updatedData.birthTime,
        latitude: updatedData.birthLat,
        longitude: updatedData.birthLon,
        timezone: updatedData.birthTimeZone,
      } : null;

      return {
        ...prevData,
        birthData: updatedData,
        planetary_data: updatedPlanetaryData,
      };
    });
    setSuccess('Birth data updated successfully!');
  };

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  // Function to get major signs (Sun, Moon, Rising) - copied from ExampleProfilePage.tsx
  const getMajorSigns = (userData: UserProfile) => {
    return {
      sun: userData.sunSign || null,
      moon: userData.moonSign || null,
      rising: userData.risingSign || null,
    };
  };

  const majorSigns = getMajorSigns(userData);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <ProfileHeader user={userData} majorSigns={majorSigns} />
          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email || ''}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                type="text"
                value={userData.name}
                onChange={(e) => setUserData(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                type="url"
                value={userData.avatar || ''}
                onChange={(e) => setUserData(prev => prev ? { ...prev, avatar: e.target.value } : null)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {userData?.birthData && (
              <BirthDataSection
                birthData={userData.birthData}
                onUpdateBirthData={handleBirthDataUpdate}
              />
            )}

            {userData?.birthData && userData?.planetary_data && (
              <div className="mt-4">
                <CardHeader>
                  <CardTitle>Natal Chart</CardTitle>
                  <CardDescription>Your personal astrological blueprint.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div>Loading chart...</div>}>
                    <NatalChartProfileLazy
                      birthData={userData.birthData}
                      planetaryData={userData.planetary_data}
                      refreshData={() => { /* No-op for now, will be implemented with backend */ }}
                    />
                  </Suspense>
                </CardContent>
              </div>
            )}

            {userData.birthData && userData.planetaryPositions.length > 0 && (
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Astrological Chart Display</CardTitle>
                    <CardTitle>Natal Chart</CardTitle>
                    <CardDescription>Your personal astrological chart.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<div>Loading chart...</div>}>
                      <NatalChartProfileLazy
                        birthData={userData.birthData}
                        planetaryData={userData.planetaryPositions}
                        refreshData={() => { /* No-op for now */ }}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Interpretations Section */}
            {interpretations && !interpretationsLoading && (
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    {/* Astrological Interpretations Section */}
                    {userData?.planetary_data && interpretations && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Planetary Interpretations</CardTitle>
                            <CardDescription>Insights into your planetary placements.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Suspense fallback={<SignInterpretationSkeleton />}>
                              {Object.entries(interpretations.planets).map(([planetName, interpretation]) => (
                                <SignInterpretation
                                  key={planetName}
                                  sign={planetName}
                                  interpretation={interpretation as any}
                                />
                              ))}
                            </Suspense>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Aspect Interpretations</CardTitle>
                            <CardDescription>Understanding the relationships between planets.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Suspense fallback={<div>Loading aspects...</div>}>
                              <AspectsGrid aspects={interpretations.aspects as any} />
                            </Suspense>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {interpretations.planets && Object.keys(interpretations.planets).length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Planetary Interpretations</h3>
                        {Object.entries(interpretations.planets).map(([planetName, interpretation]) => (
                          <SignInterpretation
                            key={planetName}
                            title={planetName}
                            interpretation={interpretation}
                          />
                        ))}
                      </div>
                    )}
                    {interpretations.aspects && Object.keys(interpretations.aspects).length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Aspect Interpretations</h3>
                        <AspectsGrid aspects={Object.values(interpretations.aspects)} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {interpretationsLoading && userData.birthData && userData.planetary_data && (
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Astrological Interpretations</CardTitle>
                    <CardDescription>Generating insights...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Loading interpretations...</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
