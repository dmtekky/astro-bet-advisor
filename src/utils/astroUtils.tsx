import { ZodiacSign, MoonPhaseInfo } from "@/types/astrology";
import { Moon, Sun } from "lucide-react";
import React from "react";

/**
 * Helper function to calculate moon clip path based on illumination (0-1) and phase name
 */
export const getMoonClipPath = (illumination: number, phaseName?: string): string => {
  // Ensure illumination is between 0 and 1
  illumination = Math.max(0, Math.min(1, illumination));

  // If we have a phase name, use it to determine waxing/waning
  if (phaseName) {
    const isWaxing = phaseName.includes("Waxing");
    const isWaning = phaseName.includes("Waning");
    const isNew = phaseName.includes("New");
    const isFull = phaseName.includes("Full");

    if (isNew) {
      return "inset(0 0 0 0) polygon(0 0, 0 0, 0 100%, 0 100%)";
    }

    if (isFull) {
      return "inset(0 0 0 0)";
    }

    if (isWaxing) {
      // Waxing: right side lit
      const xPos = 50 * illumination;
      return `inset(0 0 0 ${50 - xPos}%)`;
    }

    if (isWaning) {
      // Waning: left side lit
      const xPos = 50 * (1 - illumination);
      return `inset(0 ${50 - xPos}% 0 0)`;
    }
  }

  // Fallback to simple calculation based on illumination
  if (illumination <= 0.5) {
    // Waxing Crescent to First Quarter: less than 50% illuminated, right side lit
    const xPos = 50 - ((1 - (illumination * 2)) * 50);
    return `inset(0 ${xPos}% 0 0)`;
  } else {
    // Waning Gibbous: more than 50% illuminated, left side lit
    const xPos = 50 + ((illumination - 0.5) * 100);
    return `inset(0 0 0 0) polygon(${xPos}% 0, 100% 0, 100% 100%, ${xPos}% 100%)`;
  }
};

/**
 * Get the impact description for a sun sign
 */
export function getSunSignImpact(sign: string): string {
  const impacts: Record<string, string> = {
    Aries: "assertive and competitive",
    Taurus: "consistent and determined",
    Gemini: "adaptable and strategic",
    Cancer: "intuitive and defensive",
    Leo: "confident and dominant",
    Virgo: "analytical and precise",
    Libra: "balanced and fair",
    Scorpio: "intense and tactical",
    Sagittarius: "optimistic and risk-taking",
    Capricorn: "disciplined and methodical",
    Aquarius: "innovative and unpredictable",
    Pisces: "intuitive and fluid",
  };
  return impacts[sign] || "influential";
}

/**
 * Get the impact description for a moon phase
 */
export function getMoonPhaseImpact(phase: string): string {
  const impacts: Record<string, string> = {
    "New Moon": "suggests fresh strategies and new beginnings",
    "Waxing Crescent": "brings building momentum and growing confidence",
    "First Quarter": "favors decisive action and breakthrough moments",
    "Waxing Gibbous": "enhances skill refinement and preparation",
    "Full Moon": "amplifies performance intensity and visibility",
    "Waning Gibbous": "supports teamwork and collaborative efforts",
    "Last Quarter": "indicates strategic adjustments and reassessment",
    "Waning Crescent": "suggests introspection and renewal",
  };
  return impacts[phase] || "influences game dynamics";
}

/**
 * Get the impact description for an element
 */
export function getElementImpact(element: string): string {
  const impacts: Record<string, string> = {
    fire: "aggression and risk-taking",
    earth: "endurance and reliability",
    air: "strategy and communication",
    water: "intuition and flow",
  };
  return impacts[element.toLowerCase()] || "performance";
}

/**
 * Get the element for a zodiac sign
 */
export function getSignElement(sign: string): string {
  const elements: Record<string, string> = {
    Aries: "Fire",
    Taurus: "Earth",
    Gemini: "Air",
    Cancer: "Water",
    Leo: "Fire",
    Virgo: "Earth",
    Libra: "Air",
    Scorpio: "Water",
    Sagittarius: "Fire",
    Capricorn: "Earth",
    Aquarius: "Air",
    Pisces: "Water",
  };
  return elements[sign] || "—";
}

/**
 * Get the color for an element
 */
export function getElementColor(sign: string): string {
  const element = getSignElement(sign);
  switch (element) {
    case "Fire":
      return "bg-gradient-to-r from-red-500 to-orange-500";
    case "Earth":
      return "bg-gradient-to-r from-green-600 to-emerald-500";
    case "Air":
      return "bg-gradient-to-r from-blue-500 to-sky-400";
    case "Water":
      return "bg-gradient-to-r from-blue-600 to-indigo-500";
    default:
      return "bg-gradient-to-r from-slate-500 to-slate-400";
  }
}

/**
 * Get a message about the moon's aspect based on phase and sign
 */
export function getMoonAspectMessage(
  moonPhase?: MoonPhaseInfo,
  moonSign?: ZodiacSign
): string {
  if (!moonPhase || !moonSign) {
    return "Moon aspects are currently unavailable.";
  }

  const phaseMessages: Record<string, string> = {
    "New Moon": "New beginnings and fresh energy in games.",
    "Waxing Crescent": "Building momentum and growing confidence.",
    "First Quarter": "Decisive action and breakthrough moments.",
    "Waxing Gibbous": "Skill refinement and preparation.",
    "Full Moon": "Peak performance and maximum visibility.",
    "Waning Gibbous": "Teamwork and collaborative efforts.",
    "Last Quarter": "Strategic adjustments and reassessment.",
    "Waning Crescent": "Introspection and renewal before the next cycle.",
  };

  const signMessages: Record<string, string> = {
    Aries: "Aggressive and competitive energy.",
    Taurus: "Steady and reliable performance.",
    Gemini: "Quick thinking and adaptability.",
    Cancer: "Intuitive and defensive strategies.",
    Leo: "Confidence and leadership on display.",
    Virgo: "Precise execution and attention to detail.",
    Libra: "Balanced approach and fair play.",
    Scorpio: "Intense focus and strategic depth.",
    Sagittarius: "Optimistic outlook and risk-taking.",
    Capricorn: "Disciplined performance and methodical approach.",
    Aquarius: "Innovative tactics and unexpected plays.",
    Pisces: "Fluid movement and intuitive gameplay.",
  };

  return `${phaseMessages[moonPhase.name] || ""} ${
    signMessages[moonSign] || ""
  }`.trim();
}

// getPlanetIcon has been moved to astroIcons.tsx
// Import it from '@/utils/astroIcons' when needed

/**
 * Get sun sports influences based on astro data
 */
export function getSunSportsInfluences(
  astroData: any
): { text: string; color: string }[] {
  const influences: { text: string; color: string }[] = [];

  if (!astroData) return influences;

  // Use the sunSign property directly from the API response
  if (astroData?.sunSign) {
    const sign = astroData.sunSign;
    const element = getSignElement(sign);

    influences.push({
      text: `The Sun in ${sign} brings ${getSunSignImpact(sign)} energy to today's games`,
      color:
        element === "Fire"
          ? "text-red-700"
          : element === "Earth"
          ? "text-green-700"
          : element === "Air"
          ? "text-blue-700"
          : "text-indigo-700",
    });
  } else if (astroData?.planets?.sun?.sign) {
    // Fallback to planets.sun.sign if sunSign is not available
    const sign = astroData.planets.sun.sign;
    const element = getSignElement(sign);

    influences.push({
      text: `The Sun in ${sign} brings ${getSunSignImpact(sign)} energy to today's games`,
      color:
        element === "Fire"
          ? "text-red-700"
          : element === "Earth"
          ? "text-green-700"
          : element === "Air"
          ? "text-blue-700"
          : "text-indigo-700",
    });
  }

  // Add element-specific influence
  if (astroData?.planets?.sun?.sign) {
    const sign = astroData.planets.sun.sign;
    const element = getSignElement(sign);
    
    switch (element) {
      case "Fire":
        influences.push({
          text: "Fire signs favor aggressive play and risk-taking strategies",
          color: "text-red-700",
        });
        break;
      case "Earth":
        influences.push({
          text: "Earth signs support consistent performance and endurance",
          color: "text-green-700",
        });
        break;
      case "Air":
        influences.push({
          text: "Air signs enhance strategic thinking and team communication",
          color: "text-blue-700",
        });
        break;
      case "Water":
        influences.push({
          text: "Water signs boost intuitive play and emotional resilience",
          color: "text-indigo-700",
        });
        break;
    }
  }

  // Add degree-specific influence if available
  if (astroData?.planets?.sun?.degree) {
    const degree = astroData.planets.sun.degree;
    // Critical degrees at 0, 13, and 26 of any sign
    const isCriticalDegree = degree < 1 || (degree > 12.5 && degree < 13.5) || degree > 25.5;
    
    if (isCriticalDegree) {
      influences.push({
        text: "Sun at a critical degree may bring unexpected turning points in games",
        color: "text-amber-700",
      });
    }
  }

  return influences;
}
