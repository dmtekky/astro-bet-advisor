import React, { useState, useEffect } from 'react';

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showDescription?: boolean;
  children?: React.ReactNode;
}

const getProgressColor = (percentage: number): string => {
  // Red to yellow to green gradient based on percentage
  if (percentage < 25) return '#ef4444'; // Red
  if (percentage < 50) return '#f59e0b'; // Yellow
  if (percentage < 75) return '#3b82f6'; // Blue
  return '#10b981'; // Green
};

const getProgressDescription = (percentage: number): string => {
  if (percentage < 10) return 'Minimal Influence';
  if (percentage < 30) return 'Slight Influence';
  if (percentage < 50) return 'Moderate Influence';
  if (percentage < 70) return 'Strong Influence';
  if (percentage < 90) return 'Very Strong Influence';
  return 'Maximum Influence';
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color,
  showDescription = true,
  children
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Ensure value is a number and within bounds
  const numericValue = typeof value === 'number' ? value : 0;
  const progress = Math.min(Math.max(numericValue, 0), max);
  const targetPercentage = Math.round((progress / max) * 100);
  
  // Animate the value change
  useEffect(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const duration = 1500; // Animation duration in ms
    const startTime = performance.now();
    const startValue = animatedValue;
    
    const animate = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = startValue + (targetPercentage - startValue) * easeOutQuart;
      
      setAnimatedValue(Math.round(newValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(animate);
    
    return () => {
      setIsAnimating(false);
    };
  }, [targetPercentage]);
  
  const currentProgress = (animatedValue / 100) * max;
  const strokeDashoffset = circumference - (currentProgress / max) * circumference;
  const progressColor = color || getProgressColor(animatedValue);
  const description = getProgressDescription(animatedValue);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-gray-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="transition-all duration-1000 ease-in-out"
            strokeWidth={strokeWidth}
            stroke={progressColor}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset,
              stroke: progressColor,
              transition: 'stroke 0.5s ease-in-out, stroke-dashoffset 1s ease-in-out'
            }}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          {children || (
            <>
              <span className="text-3xl font-bold">
                {animatedValue}%
              </span>
              {showDescription && (
                <span className="text-xs text-gray-500 text-center px-2">
                  {description}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {showDescription && !children && (
        <div className="mt-2 text-center">
          <p className="text-sm font-medium" style={{ color: progressColor }}>
            {description}
          </p>
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
