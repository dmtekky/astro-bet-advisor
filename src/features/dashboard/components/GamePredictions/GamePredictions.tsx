import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Game } from '@/types';
import type { GamePredictionData } from '@/types/gamePredictions';
import type { AstroData } from '@/types/astrology';

interface GamePredictionsProps {
  game: Game;
  astroData: AstroData | null;
  getGamePrediction: (game: Game, astroData?: AstroData) => any;
  transformHookDataToGamePredictionData: (hookData: any) => GamePredictionData | null;
}

export const GamePredictions: React.FC<GamePredictionsProps> = ({
  game,
  astroData,
  getGamePrediction,
  transformHookDataToGamePredictionData,
}) => {
  // Get prediction data
  const prediction = useMemo(() => {
    if (!astroData) return null;
    try {
      const predictionData = getGamePrediction(game, astroData);
      return transformHookDataToGamePredictionData(predictionData);
    } catch (error) {
      console.error('Error getting game prediction:', error);
      return null;
    }
  }, [game, astroData, getGamePrediction, transformHookDataToGamePredictionData]);

  if (!prediction) return null;

  return (
    <Card className="mt-4 border-slate-200/50 bg-white/70 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="text-sm font-medium text-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span>Astrological Advantage:</span>
            <span className="font-semibold">
              {prediction.predicted_winner || 'Evenly Matched'}
            </span>
          </div>
          {prediction.confidence && (
            <div className="flex justify-between items-center mb-2">
              <span>Confidence:</span>
              <span className="font-semibold">{prediction.confidence}%</span>
            </div>
          )}
          {prediction.key_factors && prediction.key_factors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200/60">
              <div className="text-xs font-medium text-slate-600 mb-1">Key Factors:</div>
              <ul className="text-xs text-slate-600 space-y-1">
                {prediction.key_factors.map((factor, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GamePredictions;
