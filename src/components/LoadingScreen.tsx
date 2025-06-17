import React from 'react';

interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  fullScreen = true, 
  message = 'Loading astrological data...' 
}) => {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-20'}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-lg text-slate-300">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
