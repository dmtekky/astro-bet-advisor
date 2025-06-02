import React from 'react';
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
      <div key={element} className="mb-4">
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span className="font-medium flex items-center">
            <span className="mr-2" role="img" aria-label={element}>{emoji}</span>
            {label}
          </span>
          <span className="font-semibold">{Math.round(value)}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} rounded-full`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <Card className="overflow-hidden border-2 border-slate-200 shadow-sm h-full flex flex-col">
        <CardHeader className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white pb-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
            <CardTitle className="text-2xl font-bold flex items-center">
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                Team Chemistry
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help opacity-80 hover:opacity-100 transition-opacity" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-slate-800 text-white border-0">
                    <p>
                      Team Chemistry measures the astrological compatibility among players, 
                      weighted by their impact scores. Higher scores indicate better synergy.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <div className={`text-4xl font-bold ${getScoreColor(chemistry.score)} drop-shadow-md`}>
              {Math.round(chemistry.score)}<span className="text-xl opacity-80">/100</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/80 mb-1">
              <span>Team Synergy</span>
              <span>{Math.round(chemistry.score)}%</span>
            </div>
            <Progress 
              value={chemistry.score} 
              className="h-2.5 bg-white/20" 
              indicatorClassName={`${getProgressColor(chemistry.score)} shadow-lg`} 
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-6">
          {/* Team Elemental Balance Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                Team Elemental Balance
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-2 cursor-help text-slate-400 hover:text-slate-600" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-slate-800 text-white border-0">
                      <p>
                        Shows the distribution of astrological elements in the team.
                        A balanced team (about 25% each) scores higher.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="text-sm font-medium text-slate-500">
                Balance: {Math.round(chemistry.elements.balance)}%
              </div>
            </div>
            
            {/* Element Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {renderElementBar('fire', 'Fire')}
                {renderElementBar('earth', 'Earth')}
              </div>
              <div>
                {renderElementBar('air', 'Air')}
                {renderElementBar('water', 'Water')}
              </div>
            </div>
          </div>
          
          {/* Aspect Harmony Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
              Astrological Aspects
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-2 cursor-help text-slate-400 hover:text-slate-600" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-slate-800 text-white border-0">
                    <p>
                      Measures the astrological aspects between players.
                      Higher harmony scores indicate better compatibility.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-sm font-medium text-slate-500 mb-1">Harmony</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {Math.round(chemistry.aspects.harmonyScore)}%
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${chemistry.aspects.harmonyScore}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-sm font-medium text-slate-500 mb-1">Challenges</div>
                <div className="text-2xl font-bold text-amber-600">
                  {Math.round(chemistry.aspects.challengeScore)}%
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${chemistry.aspects.challengeScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Last Updated */}
          <div className="text-xs text-slate-400 text-right mt-auto pt-4 border-t border-slate-100">
            Last updated: {formattedDate}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamChemistryMeter;
