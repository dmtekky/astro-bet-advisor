import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Sun, Moon, Stars } from "lucide-react";
import { SportsPrediction } from "@/utils/sportsPredictions";

interface AstroPredictionCardProps {
  title?: string;
  defaultOpen?: boolean;
  prediction: SportsPrediction;
  moonPhase?: string;
  sunSign?: string;
  mercuryRetrograde?: boolean;
  planetaryAspects?: Array<{ aspect: string; description: string }>;
}

const AstroPredictionCard: React.FC<AstroPredictionCardProps> = ({
  title = "Today's Cosmic Prediction",
  prediction,
  moonPhase,
  sunSign,
  mercuryRetrograde,
  planetaryAspects = [],
}) => {
  const confidencePercent = Math.round(prediction.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80
      ? "bg-green-500"
      : confidencePercent >= 65
        ? "bg-blue-500"
        : confidencePercent >= 50
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-semibold text-gray-900 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
              {title}
            </h3>
            <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white">
              {confidencePercent}% Confidence
            </Badge>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {prediction.prediction}
          </p>

          {prediction.reasoning && (
            <div className="mb-4 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
              <p className="italic">{prediction.reasoning}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-3 text-xs">
            <div className="flex-1 bg-gray-50 p-2 rounded flex items-center gap-2 border border-gray-200">
              <div className="rounded-full bg-yellow-100 p-1.5">
                <Sun className="w-3 h-3 text-yellow-500" />
              </div>
              <span className="text-gray-700">
                {sunSign || prediction.sunSign || "Sun Sign"}
              </span>
            </div>

            <div className="flex-1 bg-gray-50 p-2 rounded flex items-center gap-2 border border-gray-200">
              <div className="rounded-full bg-blue-100 p-1.5">
                <Moon className="w-3 h-3 text-blue-500" />
              </div>
              <span className="text-gray-700">
                {moonPhase || prediction.moonPhase || "Moon Phase"}
              </span>
            </div>

            <div className="flex-1 bg-gray-50 p-2 rounded flex items-center gap-2 border border-gray-200">
              <div className="rounded-full bg-purple-100 p-1.5">
                <Stars className="w-3 h-3 text-purple-500" />
              </div>
              <span className="text-gray-700 capitalize">
                {prediction.dominantElement || "Element"}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-slate-400">Away Team</span>
              <span className="text-slate-400">Home Team</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-[1px] bg-gray-400"></div>
              </div>
              <div
                className={`h-full ${prediction.homeWinProbability > 0.5 ? "bg-indigo-600" : "bg-purple-600"}`}
                style={{
                  width: `${Math.round(prediction.homeWinProbability * 100)}%`,
                  marginLeft: `${100 - Math.round(prediction.homeWinProbability * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {planetaryAspects && planetaryAspects.length > 0 && (
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Significant Planetary Aspects
            </h4>
            <ul className="space-y-1.5 text-xs">
              {planetaryAspects.map((aspect, idx) => (
                <li key={idx} className="flex gap-2 text-gray-600">
                  <span className="text-indigo-500">•</span>
                  <span>
                    {aspect.aspect}: {aspect.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mercuryRetrograde && (
          <div className="border-t border-gray-200 p-3 bg-purple-50">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-purple-500 text-purple-600 text-xs"
              >
                Mercury Retrograde
              </Badge>
              <span className="text-xs text-gray-600">
                Communication and technology may be affected
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AstroPredictionCard;
