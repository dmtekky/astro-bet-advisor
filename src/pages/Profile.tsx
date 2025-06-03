import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePageView } from '@/contexts/PageViewContext';
import type { Profile, ProfileInsert } from '@/types/profiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { resetPageViews } = usePageView();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        // Try to get the profile from the profiles table first
        const { data: profileData, error } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error

        if (profileData) {
          setDisplayName(profileData.username || '');
          setAvatarUrl(profileData.avatar_url || '');
        } else if (user.user_metadata) {
          // Fall back to auth user metadata
          setDisplayName(user.user_metadata.name || user.email?.split('@')[0] || '');
          setAvatarUrl(user.user_metadata.avatar_url || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      resetPageViews();
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user) throw new Error('No user found');

      // Update the user's profile in the public.profiles table
      const profileData: ProfileInsert = {
        id: user.id,
        username: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      };

      // Update the profiles table
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .upsert(profileData);

      if (profileError) throw profileError;
      
      // Update the user's metadata in the auth.users table
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          name: displayName,
          avatar_url: avatarUrl 
        }
      });

      if (updateError) throw updateError;
      
      setSuccess('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={displayName || user.email} />
                  <AvatarFallback>
                    {getInitials(displayName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-lg font-medium">
                    {displayName || user.email}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account's profile information and email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
