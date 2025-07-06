import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

// Define the User type to match Supabase's User type
export type User = {
  id: string;
  email?: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
};

export type AuthContextType = {
  user: User | null;
  currentUser: User | null; // Alias for user for backward compatibility
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and set the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user as User ?? null);
      setLoading(false);
    });

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user as User ?? null;
      setUser(currentUser);
      setLoading(false);

      // Only redirect if we're not already on a protected route
      const isProtectedRoute = ['/profile', '/dashboard'].some(route => 
        window.location.pathname.startsWith(route)
      );
      
      if (event === 'SIGNED_IN' && !isProtectedRoute) {
        // Optional: You might want to redirect to the dashboard or home instead
        // navigate('/dashboard');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) {
      setUser(data.user as User);
    }
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: email.split('@')[0],
          avatar_url: ''
        }
      }
    });
    if (data?.user) {
      setUser(data.user as User);
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://fullmoonodds.com/auth/callback'
      }
    });
    if (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const contextValue = {
    user,
    currentUser: user, // Alias for backward compatibility
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
