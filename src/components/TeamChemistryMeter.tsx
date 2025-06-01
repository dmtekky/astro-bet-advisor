import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
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

interface TeamChemistryData {
  score: number;
  elements: ElementalBalance;
  aspects: AspectHarmony;
  calculatedAt: string;
}

interface TeamChemistryMeterProps {
  chemistry: TeamChemistryData;
  className?: string;
}

export function TeamChemistryMeter({ chemistry, className = '' }: TeamChemistryMeterProps) {
  // Helper function to get color based on score
  const getScoreColor = (value: number) => {
    if (value < 40) return 'text-red-500';
    if (value < 60) return 'text-yellow-500';
    if (value < 80) return 'text-green-500';
    return 'text-emerald-500';
  };
  
  // Helper function to get progress bar color based on score
  const getProgressColor = (value: number) => {
    if (value < 40) return 'bg-red-500';
    if (value < 60) return 'bg-yellow-500';
    if (value < 80) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  // Format date to readable string
  const formattedDate = new Date(chemistry.calculatedAt).toLocaleString();

  return (
    <Card className={`overflow-hidden border-2 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center">
            Team Chemistry
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Team Chemistry measures the astrological compatibility among players, 
                    weighted by their impact scores. Higher scores indicate better synergy.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className={`text-3xl font-bold ${getScoreColor(chemistry.score)}`}>
            {Math.round(chemistry.score)}
          </div>
        </div>
        <Progress 
          value={chemistry.score} 
          className="h-2 mt-1" 
          indicatorClassName={getProgressColor(chemistry.score)} 
        />
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Elemental Balance Section */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <h3 className="font-medium text-sm text-gray-600 flex items-center">
              Elemental Balance
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Shows the distribution of astrological elements in the team.
                      A balanced team (about 25% each) scores higher.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <span className={`text-sm font-medium ${getScoreColor(chemistry.elements.balance)}`}>
              {Math.round(chemistry.elements.balance)}%
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-2">
            {Object.entries(chemistry.elements)
              .filter(([key]) => key !== 'balance')
              .map(([element, value]) => (
                <div 
                  key={element}
                  className="text-center p-1 rounded"
                  style={{ 
                    backgroundColor: `${getElementColor(element)}20`,
                    borderColor: getElementColor(element)
                  }}
                >
                  <div className="flex justify-center items-center gap-1 text-xs font-medium" style={{ color: getElementColor(element) }}>
                    {getElementEmoji(element)} {element.toUpperCase()}
                  </div>
                  <div className="text-sm font-bold" style={{ color: getElementColor(element) }}>
                    {Math.round(value)}%
                  </div>
                </div>
              ))}
          </div>
          
          <Progress 
            value={chemistry.elements.balance} 
            className="h-1.5" 
            indicatorClassName={getProgressColor(chemistry.elements.balance)}
          />
        </div>
        
        {/* Aspect Harmony Section */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <h3 className="font-medium text-sm text-gray-600 flex items-center">
              Aspect Harmony
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Measures the harmony vs. challenges in player interactions.
                      Higher green (harmony) and lower red (challenge) is ideal.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <span className={`text-sm font-medium ${getScoreColor(chemistry.aspects.netHarmony)}`}>
              {Math.round(chemistry.aspects.netHarmony)}%
            </span>
          </div>
          
          {/* Harmony Bar */}
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-500">Harmony</span>
            <span className="text-green-500 font-medium">{Math.round(chemistry.aspects.harmonyScore)}%</span>
          </div>
          <Progress 
            value={chemistry.aspects.harmonyScore} 
            className="h-2 mb-2" 
            indicatorClassName="bg-green-500" 
          />
          
          {/* Challenge Bar */}
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-500">Challenge</span>
            <span className="text-red-500 font-medium">{Math.round(chemistry.aspects.challengeScore)}%</span>
          </div>
          <Progress 
            value={chemistry.aspects.challengeScore} 
            className="h-2" 
            indicatorClassName="bg-red-500" 
          />
        </div>
        
        <div className="text-xs text-gray-500 mt-4 flex justify-between items-center">
          <Badge variant="outline" className="text-xs font-normal">
            Last updated: {formattedDate}
          </Badge>
          <Badge variant="secondary" className="bg-purple-100">
            Cosmic Edge™
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
