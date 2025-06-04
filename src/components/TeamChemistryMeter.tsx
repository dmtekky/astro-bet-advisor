import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info } from 'lucide-react';
import { getElementColor, getElementEmoji } from '../utils/zodiacUtils';

interface ElementalBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
  balance: number;
}

interface AspectHarmony {
  harmonyScore: number;
  challengeScore: number;
  netHarmony: number;
}

export interface TeamChemistryData {
  score: number;
  elements: ElementalBalance;
  aspects: AspectHarmony;
  calculatedAt: string;
}

interface TeamChemistryMeterProps {
  chemistry: TeamChemistryData;
  className?: string;
}

export const TeamChemistryMeter: React.FC<TeamChemistryMeterProps> = ({ 
  chemistry, 
  className = '' 
}) => {
  // Helper function to get the dominant element
  const getDominantElement = () => {
    const { fire, earth, air, water, ...rest } = chemistry.elements;
    const elements = { fire, earth, air, water };
    const [dominantElement] = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
    return dominantElement as keyof typeof elements;
  };

  const dominantElement = getDominantElement();
  const dominantElementName = {
    fire: 'Fire',
    earth: 'Earth',
    air: 'Air',
    water: 'Water'
  }[dominantElement];

  const elementColors = {
    fire: 'bg-red-50 text-red-800 border-red-200',
    earth: 'bg-amber-50 text-amber-800 border-amber-200',
    air: 'bg-blue-50 text-blue-800 border-blue-200',
    water: 'bg-blue-50 text-blue-800 border-blue-200'
  };
  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    if (score >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  // Helper function to get progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    if (score >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Format date to readable string
  const formattedDate = new Date(chemistry.calculatedAt).toLocaleString();

  // Helper function to render element progress bar
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) {
      // Animate all progress bars when component comes into view
      controls.start({
        opacity: 1,
        width: '100%',
        transition: { duration: 0.8, ease: 'easeOut' }
      });
    }
  }, [isInView, chemistry, controls]);

  const renderElementBar = (element: keyof ElementalBalance, label: string) => {
    const value = chemistry.elements[element];
    const emoji = getElementEmoji(element);
    const color = getElementColor(element);
    
    // Get the color class based on the element
    const colorClass = {
      fire: 'bg-red-500',
      earth: 'bg-amber-700',
      air: 'bg-blue-400',
      water: 'bg-blue-600'
    }[element];
    
    return (
      <div key={element} className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 mb-1">
          <span className="font-medium flex items-center">
            <span className="mr-1 sm:mr-2" role="img" aria-label={element}>{emoji}</span>
            <span className="whitespace-nowrap">{label}</span>
          </span>
          <motion.span 
            className={`font-semibold text-xs sm:text-sm ${
              element === dominantElement ? 'text-white bg-opacity-20 px-1.5 py-0.5 rounded' : ''
            }`}
            style={element === dominantElement ? { backgroundColor: getElementColor(element) } : {}}
            initial={{ opacity: 0, y: 5 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          >
            {Math.round(value)}%
          </motion.span>
        </div>
        <div className="h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${colorClass} rounded-full ${
              element === dominantElement ? 'ring-2 ring-offset-1 ring-opacity-70 ring-white' : ''
            }`}
            initial={{ width: 0 }}
            animate={isInView ? { width: `${value}%` } : { width: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={className} ref={ref}>
      <Card className="overflow-hidden border-2 border-slate-200 shadow-sm h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white pb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
            <CardTitle className="text-2xl font-bold flex items-center">
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                Astro Chemistry
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help opacity-80 hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-slate-800 text-white border-0">
                    <p>
                      Astro Chemistry measures the astrological compatibility among players, 
                      weighted by their impact scores. Higher scores indicate better performance potential.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <div className={`text-4xl font-bold ${getScoreColor(chemistry.score)} drop-shadow-md`}>
              {Math.round(chemistry.score)}<span className="text-xl opacity-80">/100</span>
            </div>
          </div>
          <motion.div 
            className="mt-3"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              initial={{ opacity: 0, scaleX: 0.9 }}
              animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.9 }}
              transition={{ 
                delay: 0.4, 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <Progress 
                value={chemistry.score} 
                className="h-2.5 bg-white/20 overflow-hidden"
                indicatorClassName={`${getProgressColor(chemistry.score)} shadow-lg transition-all duration-1500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
              />
            </motion.div>
          </motion.div>
        </CardHeader>
        
        <CardContent className="flex-1 p-6">
          {/* Team Elemental Balance Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 sm:mb-4">
              <div className="flex items-center">
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                  Team Elemental Balance
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 cursor-help text-slate-400 hover:text-slate-600" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-slate-800 text-white border-0 text-sm">
                        <p>
                          Shows the distribution of astrological elements in the team.
                          A balanced team (about 25% each) scores higher.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
              </div>
              <div className={`text-sm font-medium px-3 py-1 rounded-md inline-flex items-center border ${elementColors[dominantElement]}`}>
                <span className="font-semibold">
                  {dominantElementName} Dominant
                </span>
              </div>
            </div>
            
            {/* Element Progress Bars */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {renderElementBar('fire', 'Fire')}
              {renderElementBar('earth', 'Earth')}
              {renderElementBar('air', 'Air')}
              {renderElementBar('water', 'Water')}
            </div>
          </div>
          
          {/* Aspect Harmony Section */}
          <div className="mb-6">
            <div className="flex items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                Astrological Aspects
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 cursor-help text-slate-400 hover:text-slate-600" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-slate-800 text-white border-0 text-sm">
                      <p>
                        Measures the astrological aspects between players.
                        Higher harmony scores indicate better compatibility.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100">
                <div className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Harmony</div>
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                  {Math.round(chemistry.aspects.harmonyScore)}%
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${chemistry.aspects.harmonyScore}%` } : { width: 0 }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100">
                <div className="text-xs sm:text-sm font-medium text-slate-500 mb-1">Challenges</div>
                <div className="text-xl sm:text-2xl font-bold text-amber-600">
                  {Math.round(chemistry.aspects.challengeScore)}%
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${chemistry.aspects.challengeScore}%` } : { width: 0 }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Last Updated */}
          <motion.div 
            className="text-xs text-slate-400 text-right mt-auto pt-4 border-t border-slate-100"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Last updated: {formattedDate}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamChemistryMeter;
