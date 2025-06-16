import React from "react";
import { GameOutcomePrediction } from "@/types";

interface AstroDisclosureProps {
  title: string;
  defaultOpen?: boolean;
  prediction: GameOutcomePrediction;
  moonPhase?: string;
  sunSign?: string;
  mercuryRetrograde?: boolean;
  planetaryAspects?: any[];
}

/**
 * Displays astrological predictions and insights for a game.
 */
const AstroDisclosure: React.FC<AstroDisclosureProps> = ({
  title,
  defaultOpen = true,
  prediction,
  moonPhase,
  sunSign,
  mercuryRetrograde,
  planetaryAspects,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Prediction:</span>
          <span className="font-medium text-gray-900">
            {prediction.predicted_winner ||
              prediction.prediction ||
              "No clear prediction"}
          </span>
        </div>

        {prediction.confidence !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Confidence:</span>
            <span className="font-medium text-gray-900">
              {Math.round(prediction.confidence * 100)}%
            </span>
          </div>
        )}

        {(moonPhase || prediction.moonPhase) && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Moon Phase:</span>
            <span className="text-slate-300">
              {moonPhase || prediction.moonPhase}
            </span>
          </div>
        )}

        {(sunSign || prediction.sunSign) && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Sun Sign:</span>
            <span className="text-slate-300">
              {sunSign || prediction.sunSign}
            </span>
          </div>
        )}

        {mercuryRetrograde !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Mercury Retrograde:</span>
            <span
              className={
                mercuryRetrograde ? "text-amber-400" : "text-slate-300"
              }
            >
              {mercuryRetrograde ? "Yes" : "No"}
            </span>
          </div>
        )}

        {planetaryAspects && planetaryAspects.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-slate-300 mb-1">
              Key Planetary Aspects:
            </h4>
            <ul className="space-y-1 text-sm text-slate-400">
              {planetaryAspects.map((aspect, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    {aspect.aspect} - {aspect.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AstroDisclosure;
