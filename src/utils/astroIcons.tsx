import React from "react";
import { 
  Sun, 
  Moon, 
  Sparkle,  // For Mercury
  Heart,    // For Venus
  Flame,    // For Mars
  CircleDashed,  // For Jupiter
  CircleDollarSign,  // For Saturn
  Cloud,    // For Uranus
  Droplets, // For Neptune
  Skull     // For Pluto
} from "lucide-react";

interface PlanetIconProps {
  className?: string;
  size?: number;
}

/**
 * Get a styled icon for a planet with consistent sizing and theming
 */
export const getPlanetIcon = (name: string, size = 16): React.ReactNode => {
  const baseClass = "flex-shrink-0";
  const iconProps: PlanetIconProps = {
    className: baseClass,
    size: size
  };

  switch (name.toLowerCase()) {
    case "sun":
      return <Sun {...iconProps} className={`${baseClass} text-yellow-500`} />;
    case "moon":
      return <Moon {...iconProps} className={`${baseClass} text-slate-400`} />;
    case "mercury":
      return <Sparkle {...iconProps} className={`${baseClass} text-gray-500`} />;
    case "venus":
      return <Heart {...iconProps} className={`${baseClass} text-pink-400 fill-pink-400`} />;
    case "mars":
      return <Flame {...iconProps} className={`${baseClass} text-red-500`} />;
    case "jupiter":
      return <CircleDashed {...iconProps} className={`${baseClass} text-purple-500`} />;
    case "saturn":
      return <CircleDollarSign {...iconProps} className={`${baseClass} text-amber-600`} />;
    case "uranus":
      return <Cloud {...iconProps} className={`${baseClass} text-teal-400`} />;
    case "neptune":
      return <Droplets {...iconProps} className={`${baseClass} text-blue-400`} />;
    case "pluto":
      return <Skull {...iconProps} className={`${baseClass} text-slate-700`} />;
    default:
      return <Sun {...iconProps} className={`${baseClass} text-yellow-500`} />;
  }
};
