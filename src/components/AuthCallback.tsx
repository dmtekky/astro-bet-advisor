import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error.message);
        // Optionally, redirect to an error page or home
        navigate('/error'); 
      } else if (data?.session) {
        console.log('Session obtained:', data.session);
        // Redirect to profile or dashboard after successful login
        navigate('/profile'); 
      } else {
        console.log('No session found, redirecting to login.');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div>
      <p>Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;
