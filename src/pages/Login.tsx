import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';

const Login = () => {
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
      title="Sign in to your account"
      subtitle="Enter your details to continue"
      footerText="Don't have an account?"
      footerLink="/signup"
      footerLinkText="Create account"
    >
      <div className="space-y-6">
        <LoginForm />
        <div className="text-center">
          <Button variant="link" asChild>
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
              Forgot your password?
            </Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
