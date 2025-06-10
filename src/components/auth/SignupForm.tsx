import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 as ReloadIcon, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';


const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      const { error } = await signUp(email, password);
      if (error) throw error;
      // The AuthContext will handle the redirect after successful signup
    } catch (error: any) {
      setError(error.message || 'Failed to create an account');
      setLoading(false);
    }
  };

  // Handler for Google sign up
  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      // Supabase will redirect to Google, no need to manually navigate
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-lg mx-auto bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-600/50 shadow-xl"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Join the team</h2>
        <p className="text-slate-200">
          Create your account and collect cosmic insights
        </p>
      </div>

      <Button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        variant="outline"
        className="w-full flex items-center justify-center gap-2 h-12 text-base bg-white/5 hover:bg-white/10 border-slate-700 text-white"
      >
        <FcGoogle className="text-xl" />
        Continue with Google
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-900/80 px-3 text-sm text-slate-200">or sign up with email</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/30 border-red-800/50 text-red-200">
          <AlertDescription className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200 text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-12 pl-10 bg-slate-700/80 border-slate-500 text-white placeholder-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-200 text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-500" />
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="h-12 pl-10 bg-slate-700/80 border-slate-500 text-white placeholder-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-slate-200 text-sm font-medium">
            Confirm Password
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-500" />
            </div>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="h-12 pl-10 bg-slate-700/80 border-slate-500 text-white placeholder-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          className="w-full mt-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium h-12 text-base rounded-md flex items-center justify-center"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
              Creating Your Cosmic Account...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Cosmic Account
            </>
          )}
        </motion.button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={() => {
            // Handle Google sign up
          }}
          disabled={loading}
        >
          <Mail className="mr-2 h-4 w-4" />
          Continue with Email
        </Button>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <label htmlFor="terms" className="ml-2 block text-sm text-slate-200">
            I agree to the{' '}
            <Link to="/terms" className="text-blue-300 hover:text-blue-200 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-300 hover:text-blue-200 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>
      </form>

      <p className="text-center text-sm text-slate-400">
        By joining, you agree to our{' '}
        <Link to="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
          Privacy Policy
        </Link>
        . We'll never share your data with third parties.
      </p>
    </motion.div>
  );
};

export default SignupForm;
