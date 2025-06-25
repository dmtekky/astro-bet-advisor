import React, { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Trophy, User, Star, Zap, Sparkles, Sparkle, Orbit, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Floating particles component
const FloatingParticles = ({ count = 20 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => {
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 3 + Math.random() * 4;
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/30"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${posX}%`,
              top: `${posY}%`,
              boxShadow: '0 0 10px 2px rgba(199, 210, 254, 0.7)'
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
          />
        );
      })}
    </div>
  );
};

// Pulsing orb component
const PulsingOrb = () => {
  return (
    <motion.div 
      className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.3, 0.1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    />
  );
};

interface GneePredictionProps {
  expectedWinner: string;
  winnerLogo?: string;
  topPlayers: { name: string; team: string; astroInfluence: number }[];
  keyAspects: string[];
  gameInsights: string[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  })
};

const GneePrediction: React.FC<GneePredictionProps> = ({
  expectedWinner,
  winnerLogo,
  topPlayers,
  keyAspects,
  gameInsights
}) => {
  return (
    <motion.div 
      className="relative w-full overflow-hidden rounded-2xl"
      animate={{
        boxShadow: [
          '0 0 15px rgba(99, 102, 241, 0.3)',
          '0 0 25px rgba(139, 92, 246, 0.4)',
          '0 0 15px rgba(99, 102, 241, 0.3)'
        ]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }}
    >
      <Card className="relative w-full h-full overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 border border-indigo-700/50 rounded-2xl transition-all duration-500 group">
      {/* Background Elements */}
      <FloatingParticles count={30} />
      <PulsingOrb />
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-purple-500/5 to-transparent"></div>
      
      <div className="relative z-10 p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <motion.div 
            className="relative inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              textShadow: [
                '0 0 5px rgba(255, 140, 0, 0.5)',
                '0 0 15px rgba(255, 69, 0, 0.7)',
                '0 0 5px rgba(255, 140, 0, 0.5)'
              ]
            }}
            transition={{
              duration: 0.5,
              textShadow: {
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse'
              }
            }}
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-left text-orange-500">
              <span className="relative">
                <span className="absolute -inset-1 bg-orange-500 rounded-lg blur opacity-20"></span>
                <span className="relative">GNEE</span>
              </span>
            </h2>
          </motion.div>
          <motion.p 
            className="text-sm md:text-base text-gray-300 mt-1 ml-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            AI powered game insights
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Expected Winner Card */}
          <motion.div 
            className="p-4 rounded-lg bg-yellow-400 text-gray-900 flex flex-col items-start" 
            custom={0} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
          >
            <div className="flex items-center mb-2">
              <Trophy className="h-5 w-5 mr-2" />
              <span className="font-bold uppercase text-sm">Winner</span>
            </div>
            {winnerLogo && (
              <img 
                src={winnerLogo} 
                alt="winner logo" 
                className="w-12 h-12 mb-2 rounded-full bg-white p-1" 
              />
            )}
            <span className="text-xl font-bold">{expectedWinner}</span>
            <div className="w-full mt-3 bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-gray-900 h-1.5 rounded-full" 
                style={{ width: '75%' }}
              />
            </div>
            <p className="text-xs text-gray-700 mt-1">75% confidence</p>
          </motion.div>

          {/* Top Players Card */}
          <motion.div 
            className="p-4 rounded-lg bg-cyan-400 text-gray-900 flex flex-col" 
            custom={1} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
          >
            <div className="flex items-center mb-3">
              <User className="h-5 w-5 mr-2" />
              <span className="font-bold uppercase text-sm">Top Players</span>
            </div>
            <ul className="space-y-3">
              {topPlayers.slice(0, 3).map((p, i) => (
                <li key={i} className="relative">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{i+1}. {p.name}</span>
                    <span className="font-mono font-semibold">{p.astroInfluence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <motion.div 
                      className="bg-gray-900 h-1.5 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${p.astroInfluence}%` }}
                      transition={{ duration: 1, delay: 0.1 * i }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Astro Insights Card */}
          <motion.div 
            className="p-4 rounded-lg bg-purple-400 text-gray-900 flex flex-col" 
            custom={2} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
          >
            <div className="flex items-center mb-3">
              <Star className="h-5 w-5 mr-2" />
              <span className="font-bold uppercase text-sm">Astro Insights</span>
            </div>
            <ul className="space-y-2">
              {keyAspects.map((a, i) => (
                <motion.li 
                  key={i} 
                  className="text-sm flex items-start"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <span className="text-yellow-900 mr-2">•</span>
                  <span>{a}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Game Insights Card */}
          <motion.div 
            className="p-4 rounded-lg bg-green-400 text-gray-900 flex flex-col" 
            custom={3} 
            initial="hidden" 
            animate="visible" 
            variants={cardVariants}
          >
            <div className="flex items-center mb-3">
              <Info className="h-5 w-5 mr-2" />
              <span className="font-bold uppercase text-sm">Game Insights</span>
            </div>
            <ul className="space-y-2">
              {gameInsights.map((insight, i) => (
                <motion.li 
                  key={i} 
                  className="text-sm flex items-start"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <span className="text-green-900 mr-2">•</span>
                  <span>{insight}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
        
        <p className="mt-6 text-xs text-gray-400 text-center">
          Predictions based on astrology • For entertainment purposes only
        </p>
      </div>
      </Card>
    </motion.div>
  );
};

export default GneePrediction;
