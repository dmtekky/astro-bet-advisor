import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const FloatingBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on these routes
  const hideOnRoutes = [
    '/',
    '/dashboard',
    '/login',
    '/signup',
    '/auth',
    '/reset-password',
    '/forgot-password',
  ];

  const shouldShow = !hideOnRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          onClick={handleBack}
          className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-50 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 group"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.2)'
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          whileHover={{
            scale: 1.05,
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
            boxShadow: '0 6px 20px rgba(147, 51, 234, 0.3)'
          }}
          whileTap={{ 
            scale: 0.95,
            boxShadow: '0 2px 10px rgba(147, 51, 234, 0.2)'
          }}
          aria-label="Go back"
        >
          <ChevronLeft className="h-6 w-6 text-purple-900 group-hover:text-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default FloatingBackButton;
