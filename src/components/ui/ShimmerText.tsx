import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
}

const ShimmerText: React.FC<ShimmerTextProps> = ({ children, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.span
      className={`relative inline-block ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{
        backgroundPosition: isHovered ? '200% center' : '0% center',
      }}
      transition={{
        duration: 1.5,
        ease: 'linear',
        repeat: Infinity,
      }}
      style={{
        backgroundImage: 'linear-gradient(90deg, #4f46e5, #9333ea, #4f46e5, #9333ea)',
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </motion.span>
  );
};

export default ShimmerText;
