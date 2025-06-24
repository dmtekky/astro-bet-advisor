import React, { useEffect, useRef, useState } from 'react';
import { getPlanetColor, getPlanetGradient } from '@/utils/planetColors';

interface CosmicWaveProgressProps {
  value: number; // 0-100
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  startPlanet?: string; // Name of the start planet for color
  endPlanet?: string;   // Name of the end planet for color
  startColor?: string;  // Optional override for start color
  endColor?: string;    // Optional override for end color
  height?: number;
  className?: string;
  label?: string;
}

const CosmicWaveProgress: React.FC<CosmicWaveProgressProps> = ({
  value = 0,
  startIcon,
  endIcon,
  startPlanet = 'sun',
  endPlanet = 'moon',
  startColor: startColorProp,
  endColor: endColorProp,
  height = 40,
  className = '',
  label,
}) => {
  // Use provided colors or fall back to planet colors
  const startColor = startColorProp || getPlanetColor(startPlanet) || '#f59e0b';
  const endColor = endColorProp || getPlanetColor(endPlanet) || '#ec4899';
  
  // State for window size
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Normalize value to 0-1 range
  const normalizedValue = Math.min(Math.max(value, 0), 100) / 100;
  
  // Determine which planet's color to use for the indicator
  const indicatorPlanet = value > 50 ? endPlanet : startPlanet;
  const indicatorColor = indicatorPlanet ? getPlanetColor(indicatorPlanet) : startColor;
  
  // Responsive indicator size
  const indicatorSize = windowSize.width >= 640 ? 36 : 28;
  
  // Indicator styles
  const indicatorStyle: React.CSSProperties = {
    left: `${normalizedValue * 100}%`,
    top: '50%',
    width: `${indicatorSize}px`,
    height: `${indicatorSize}px`,
    borderRadius: '50%',
    background: getPlanetGradient(indicatorPlanet || 'default'),
    border: '2px solid rgba(255, 255, 255, 0.8)',
    boxShadow: `0 0 10px ${indicatorColor}80, 0 0 20px ${indicatorColor}40`,
    transition: 'all 0.3s ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [time, setTime] = useState(0);
  const labelRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Handle resize
    const handleResize = () => {
      // Set canvas dimensions with device pixel ratio for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      
      ctx.scale(dpr, dpr);
    };
    
    // Initial setup
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Animation function
    const animate = () => {
      if (!canvas || !ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(0.5, `${startColor}80`);
      gradient.addColorStop(1, endColor);
      
      // Set wave properties - slower animation
      const amplitude = height / 3.5; // Height of the wave
      const frequency = 0.01; // Lower frequency for slower wave
      const phaseShift = time * 0.01; // Slower phase shift for calmer animation
      
      // Draw the wave
      ctx.beginPath();
      
      // Calculate the endpoint based on the value
      const dpr = window.devicePixelRatio || 1;
      const endX = canvas.width * normalizedValue / dpr;
      
      // Draw the background glow
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      // Draw the wave path with multiple waves for a more complex effect
      for (let x = 0; x <= endX; x++) {
        // Combine multiple sine waves for more interesting effect
        const y = height / 2 + 
                 amplitude * 0.6 * Math.sin(frequency * x + phaseShift) + 
                 amplitude * 0.2 * Math.sin(frequency * 1.5 * x - phaseShift * 0.3);
        ctx.lineTo(x, y);
      }
      
      // Complete the wave shape
      ctx.lineTo(endX, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      // Create a glow effect
      const glowGradient = ctx.createLinearGradient(0, 0, endX, 0);
      glowGradient.addColorStop(0, `${startColor}30`);
      glowGradient.addColorStop(1, `${endColor}30`);
      
      ctx.fillStyle = glowGradient;
      ctx.shadowColor = startColor;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fill();
      ctx.restore();
      
      // Draw the main wave
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      // Draw the wave path
      for (let x = 0; x <= endX; x++) {
        // Combine multiple sine waves for more interesting effect
        const y = height / 2 + 
                 amplitude * 0.7 * Math.sin(frequency * x + phaseShift) + 
                 amplitude * 0.3 * Math.sin(frequency * 2 * x - phaseShift * 0.5);
        ctx.lineTo(x, y);
      }
      
      // Complete the wave shape
      ctx.lineTo(endX, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      
      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Update time for next frame
      setTime(prevTime => prevTime + 1);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [normalizedValue, startColor, endColor, height, time]);
  
  // Cleanup function for resize event listener
  useEffect(() => {
    // Store handleResize function reference
    const handleResizeCleanup = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      
      ctx.scale(dpr, dpr);
    };
    
    window.addEventListener('resize', handleResizeCleanup);
    
    return () => {
      window.removeEventListener('resize', handleResizeCleanup);
    };
  }, [height]);
  
  return (
    <div className={`relative flex items-center w-full ${className}`} style={{ height: `${height}px` }}>
      {/* Start Planet Icon */}
      <div className="absolute left-0 z-10 flex items-center justify-center w-8 h-8 transform -translate-y-1/2 top-1/2">
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-slate-50 to-white rounded-full shadow-md sm:w-8 sm:h-8 border border-slate-100">
          {startIcon && React.cloneElement(startIcon as React.ReactElement, {
            className: 'h-3 w-3 sm:h-4 sm:w-4 text-slate-700'
          })}
        </div>
      </div>
      
      {/* Canvas for wave animation */}
      <div className="relative w-full h-full px-2 sm:px-4">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ 
            borderRadius: '6px',
          }}
        />
      </div>
      
      {/* End Planet Icon */}
      <div className="absolute right-0 z-10 flex items-center justify-center w-8 h-8 transform -translate-y-1/2 top-1/2">
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-slate-50 to-white rounded-full shadow-md sm:w-8 sm:h-8 border border-slate-100">
          {endIcon && React.cloneElement(endIcon as React.ReactElement, {
            className: 'h-3 w-3 sm:h-4 sm:w-4 text-slate-700'
          })}
        </div>
      </div>
      
      {/* Planet indicator circle - Responsive sizing */}
      <div 
        className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 sm:w-9 sm:h-9 w-7 h-7"
        style={indicatorStyle}
      >
        {label && (
          <span className="sr-only">{label}</span>
        )}
      </div>
    </div>
  );
};

export default CosmicWaveProgress;
