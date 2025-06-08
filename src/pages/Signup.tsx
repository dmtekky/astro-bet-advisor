import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import SignupForm from '@/components/auth/SignupForm';

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if user is already logged in
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join and start making better betting decisions"
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default Signup;
