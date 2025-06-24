import React from "react";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Moon, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getMoonClipPath, getMoonPhaseImpact, getMoonAspectMessage } from "@/utils/astroUtils/index";
import type { ZodiacSign, MoonPhaseInfo } from "@/types/astrology";

interface VoidMoonInfo {
  isVoid: boolean;
  start?: string;
  end?: string;
}

interface MoonData {
  sign?: ZodiacSign;
  degree?: number;
  speed?: number;
  minute?: number;
  [key: string]: any;
}

interface LunarStatusCardProps {
  moonPhase?: MoonPhaseInfo;
  voidMoon?: VoidMoonInfo;
  moonData?: MoonData;
}

const LunarStatusCard: React.FC<LunarStatusCardProps> = ({
  moonPhase,
  voidMoon,
  moonData,
}) => {
  return (
    <div className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <Moon className="h-5 w-5 mr-2 text-indigo-500" /> Lunar & Void Status
        </CardTitle>
        <CardDescription className="text-slate-600">
          {voidMoon
            ? voidMoon.isVoid
              ? " • Void of Course"
              : " • Not Void of Course"
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {/* Moon Phase Section with Visualization */}
        <div className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm">
          <div className="flex flex-col items-center lg:flex-row lg:items-start">
            <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-full overflow-hidden mb-6 lg:mb-0 lg:mr-8 flex-shrink-0 border-[10px] border-indigo-600/90 shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
              {/* Moon phase visualization */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 rounded-full transition-all duration-1000 ease-in-out"
                style={{
                  clipPath: getMoonClipPath(
                    moonPhase?.illumination || 0, 
                    moonPhase?.phaseName
                  ),
                  opacity: 0.95,
                  boxShadow: "inset 0 0 40px rgba(255, 255, 255, 0.8)",
                }}
              >
                {/* Add some subtle craters */}
                <div className="absolute w-4 h-4 bg-slate-200/30 rounded-full top-1/3 left-1/4"></div>
                <div className="absolute w-5 h-5 bg-slate-300/40 rounded-full top-2/3 left-1/2"></div>
                <div className="absolute w-3 h-3 bg-slate-200/50 rounded-full top-1/4 left-3/4"></div>
                <div className="absolute w-6 h-6 bg-slate-300/30 rounded-full top-3/4 left-1/3"></div>
                <div className="absolute w-3.5 h-3.5 bg-slate-200/40 rounded-full top-1/5 left-1/2"></div>
              </div>
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: "0 0 60px 15px rgba(99, 102, 241, 0.4)",
                  pointerEvents: "none",
                  background: "radial-gradient(circle at 30% 30%, rgba(199, 210, 254, 0.3), transparent 60%)",
                }}
              />
            </div>
            <div className="w-full lg:flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="text-center lg:text-left">
                  <h4 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-2">
                    Moon Phase
                  </h4>
                  <p className="text-xl md:text-2xl font-semibold text-indigo-700 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {moonPhase?.name || "Current phase unknown"}
                  </p>
                </div>
                <div className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-medium px-4 py-1.5 rounded-full mb-3 lg:mb-0">
                  {moonPhase?.illumination !== null && moonPhase?.illumination !== undefined
                    ? `${moonPhase?.emoji || '🌕'} ${Math.round((moonPhase?.illumination || 0) * 100)}% Illuminated`
                    : "🌑 Illumination unknown"}
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm mb-6">
                <p className="text-base text-slate-700 leading-relaxed">
                  {moonPhase?.name && getMoonPhaseImpact(moonPhase?.name || 'Unknown')}
                </p>
              </div>

              <div className="flex flex-row flex-wrap items-stretch justify-between gap-3 mb-6">
                <div className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col flex-1 min-w-[120px]">
                  <div className="text-xs uppercase text-slate-500 font-medium mb-1">Moon Sign</div>
                  <div className="font-semibold text-indigo-700 text-lg">
                    {moonData?.sign || "—"}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col flex-1 min-w-[120px]">
                  <div className="text-xs uppercase text-slate-500 font-medium mb-1">
                    Next Full Moon
                  </div>
                  <div className="font-semibold text-indigo-700 text-lg">
                    {moonPhase?.nextFullMoon
                      ? new Date(moonPhase?.nextFullMoon).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        })
                      : "—"}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col flex-1 min-w-[120px]">
                  <div className="text-xs uppercase text-slate-500 font-medium mb-1">
                    Zodiac Degree
                  </div>
                  <div className="font-semibold text-indigo-700 text-lg">
                    {moonData?.degree
                      ? `${Math.floor(moonData?.degree || 0)}°`
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Void of Course Status */}
              <div className="w-full bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-amber-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800 flex items-center text-sm">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${voidMoon?.isVoid ? "bg-red-500" : "bg-green-500"}`}
                      ></div>
                      Void of Course Status
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${voidMoon?.isVoid ? "bg-red-100 text-red-800" : "bg-red-50 text-red-700"}`}
                    >
                      {voidMoon?.isVoid ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-sm text-slate-700 mb-2">
                    {voidMoon?.isVoid
                      ? `Moon is void of course until ${new Date(voidMoon?.end || new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : getMoonAspectMessage(moonPhase, moonData?.sign as ZodiacSign | undefined)}
                  </p>

                  {voidMoon?.isVoid && (
                    <div className="space-y-3 mt-3">
                      <div>
                        <div className="w-full bg-amber-100 rounded-full h-1.5 mb-1">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${voidMoon?.start && voidMoon?.end ? Math.max(5, Math.min(100, ((new Date().getTime() - new Date(voidMoon.start).getTime()) / (new Date(voidMoon.end).getTime() - new Date(voidMoon.start).getTime())) * 100)) : 0}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-amber-700">
                          <span>
                            Started:{" "}
                            {new Date(
                              voidMoon?.start || new Date().toISOString(),
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>
                            Ends:{" "}
                            {new Date(
                              voidMoon?.end || new Date().toISOString(),
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border text-xs ${voidMoon.isVoid ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}
                      >
                        <p
                          className={`font-medium mb-1 ${voidMoon.isVoid ? "text-red-800" : "text-slate-700"}`}
                        >
                          {voidMoon.isVoid
                            ? "⚠️ Void of Course Moon"
                            : "✓ Strong Lunar Aspects"}
                        </p>
                        <p
                          className={
                            voidMoon.isVoid
                              ? "text-red-700"
                              : "text-slate-600"
                          }
                        >
                          {voidMoon.isVoid
                            ? "The moon is not making any major aspects. Game outcomes may be more unpredictable during this period."
                            : getMoonAspectMessage(
                                moonPhase,
                                moonData?.sign as ZodiacSign | undefined,
                              )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Measurement */}
        <div className="bg-white p-3 rounded-md border border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
            <Activity className="h-4 w-4 mr-1 text-slate-400" />{" "}
            Lunar Technical Analysis
          </h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Moon Speed</span>
                <span>
                  {moonData?.speed
                    ? `${Math.abs(moonData?.speed || 0).toFixed(2)}°/day`
                    : "Unknown"}
                </span>
              </div>
              <Progress
                value={
                  moonData?.speed
                    ? Math.min(
                        (Math.abs(
                          moonData?.speed || 0,
                        ) /
                          15) *
                          100,
                        100,
                      )
                    : 50
                }
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Lunar Sign Position</span>
                <span>
                  {moonData?.degree
                    ? `${Math.floor(moonData?.degree || 0)}°${moonData?.minute ? ` ${moonData?.minute}'` : ""}`
                    : "Unknown"}
                </span>
              </div>
              <Progress
                value={
                  moonData?.degree
                    ? ((moonData?.degree || 0) / 30) *
                      100
                    : 50
                }
                className="h-2"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default LunarStatusCard;
