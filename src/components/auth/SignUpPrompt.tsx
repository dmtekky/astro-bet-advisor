import React, { useEffect, useState } from 'react';
import { X, Zap, BarChart2, Star, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SignUpPromptProps {
  onClose: () => void;
}

const SignUpPrompt: React.FC<SignUpPromptProps> = ({ onClose }) => {
  const { user: currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Show the prompt after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    
    // Auto-advance steps
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % 3);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const features = [
    {
      icon: <BarChart2 className="w-6 h-6 text-indigo-500" />,
      title: "Advanced Analytics",
      description: "Unlock detailed player stats and game predictions"
    },
    {
      icon: <Star className="w-6 h-6 text-amber-400" />,
      title: "Exclusive Content",
      description: "Get access to premium insights and expert analysis"
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-500" />,
      title: "Real-time Updates",
      description: "Stay ahead with live scores and instant notifications"
    }
  ];

  if (currentUser) return null;

  return (
    <AnimatePresence>
      {isVisible && (
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
                
                <div className="relative h-32 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-700/50 p-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{
                          opacity: step === index ? 1 : 0,
                          x: step === index ? 0 : (step > index ? -50 : 50),
                          scale: step === index ? 1 : 0.9
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <div className="mb-2">{feature.icon}</div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        onClick={() => setStep(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          step === i ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        aria-label={`Go to step ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Maybe Later
                </Button>
                <Button
                  asChild
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                >
                  <a href="/signup">
                    Sign Up Free
                  </a>
                </Button>
              </div>
              
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <a href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SignUpPrompt;
