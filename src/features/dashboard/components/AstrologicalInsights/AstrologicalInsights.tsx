import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AstrologicalInsightsProps, 
  AstrologicalInsight, 
  AspectInfluence, 
  AstrologyInfluence, 
  ElementsDistribution, 
  ModalBalance 
} from './types';

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const AstrologicalInsights: React.FC<AstrologicalInsightsProps> = ({
  game,
  homeTeam,
  awayTeam,
  isLoading,
  astroData,
  getGamePrediction,
  transformHookDataToGamePredictionData,
}) => {
  // Handle case when no game is selected
  if (!game) {
    return (
      <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Astrological Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select a game to view astrological insights and predictions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Get the game prediction
  const gamePrediction = useMemo(() => {
    return getGamePrediction(game, homeTeam, awayTeam);
  }, [game, homeTeam, awayTeam, getGamePrediction]);

  // Transform the astro data if available
  const gameCardAstroData = useMemo(() => {
    return astroData ? transformHookDataToGamePredictionData(astroData) : null;
  }, [astroData, transformHookDataToGamePredictionData]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Astrological Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`insight-skel-${i}`} className="h-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no prediction data is available
  if (!gamePrediction || !gameCardAstroData) {
    return (
      <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Astrological Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No astrological data available for this game.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate element distribution (simplified - adapt based on your actual data structure)
  const elementDistribution: ElementsDistribution = {
    fire: 25,
    earth: 25,
    water: 25,
    air: 25,
  };

  // Calculate modal balance (simplified - adapt based on your actual data structure)
  const modalBalance: ModalBalance = {
    cardinal: 33.3,
    fixed: 33.3,
    mutable: 33.3,
  };

  // Generate astrological insights (simplified - adapt based on your actual data structure)
  const insights: AstrologicalInsight[] = [
    {
      title: 'Strong Fire Influence',
      description: 'High energy and competitiveness expected',
      icon: <span className="text-2xl">🔥</span>,
      color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    },
    {
      title: 'Moon in Water Sign',
      description: 'Emotional intensity could affect performance',
      icon: <span className="text-2xl">🌊</span>,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Favorable Aspects',
      description: 'Multiple trines and sextiles suggest good flow',
      icon: <span className="text-2xl">⭐</span>,
      color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    },
    {
      title: 'Challenging Transits',
      description: 'Some squares may create tension',
      icon: <span className="text-2xl">⚡</span>,
      color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Astrological Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Element Distribution */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Elemental Balance</h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(elementDistribution).map(([element, value]) => (
                  <div key={element} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="capitalize">{element}</span>
                      <span>{value}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Modal Balance */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Modal Balance</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(modalBalance).map(([modality, value]) => (
                  <div key={modality} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="capitalize">{modality}</span>
                      <span>{value.toFixed(1)}%</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Key Insights */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                  <motion.div 
                    key={index}
                    variants={item}
                    className={cn(
                      'p-4 rounded-lg border',
                      insight.color,
                      'border-slate-200/50',
                      'dark:border-slate-700/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{insight.icon}</div>
                      <div>
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AstrologicalInsights;
