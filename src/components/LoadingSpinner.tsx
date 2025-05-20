function LoadingSpinner({ fullScreen = false }) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-20'}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100"></div>
        
        {/* Spinning ring */}
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
        
        {/* Moon phase indicator (for fun) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500"></div>
      </div>
      
      <p className="mt-4 text-indigo-600 font-medium">Analyzing cosmic patterns...</p>
      <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
    </div>
  );
}

export default LoadingSpinner;
