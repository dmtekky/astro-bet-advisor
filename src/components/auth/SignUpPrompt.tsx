import React, { useEffect, useState } from 'react';
import { X, Zap, BarChart2, Star, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SignUpPromptProps {
  onClose: () => void;
  showPrompt: boolean;
}

const SignUpPrompt: React.FC<SignUpPromptProps> = ({ onClose, showPrompt }) => {
  const { user: currentUser } = useAuth();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Auto-advance steps
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % 3);
    }, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (currentUser) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transform scale-100 origin-center">
            <div className="p-8 pt-12">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <motion.div 
                    className="inline-block"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <h3 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      <span className="block">Unlock the Full</span>
                      <span className="block">Experience</span>
                    </h3>
                  </motion.div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-center">
                  Join our community of sports enthusiasts and get access to exclusive features and insights.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-2">
                      <BarChart2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Advanced Stats</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-2">
                      <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Premium Features</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-2">
                      <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Real-time Alerts</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    asChild
                    className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <a href="/signup">
                      Sign Up Free
                      <Zap className="ml-2 w-4 h-4 fill-current" />
                    </a>
                  </Button>
                </div>
                
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                    Log In
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SignUpPrompt;
