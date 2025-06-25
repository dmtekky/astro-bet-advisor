import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
} from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import GameCard from "@/components/GameCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { groupGamesByDate, formatGameDate } from "@/utils/dateUtils";
import { useTeams } from "@/hooks/useTeams";
import { useUpcomingGames } from "@/hooks/useUpcomingGames";
import { Progress } from "@/components/ui/progress";
import CosmicWaveProgress from "@/components/CosmicWaveProgress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Newspaper,
  ArrowRight,
  Star,
  Calendar,
  Sun,
  Moon,
  Info,
  Activity,
  Zap,
  BarChart,
  BarChart2,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  Globe,
  CircleDot,
  Heart,
  Flame,
  CircleOff,
  Waves,
  CircleX,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate, Link } from "react-router-dom";
import { useAstroData } from "@/hooks/useAstroData";
import type { Team } from "@/types";
import type { Game } from "@/types";
import {
  calculateSportsPredictions,
  predictGameOutcome,
} from "@/utils/sportsPredictions";
import type {
  ModalBalance,
  ElementalBalance as ElementalBalanceType,
  ZodiacSign,
  AspectType,
  MoonPhaseInfo,
  Aspect,
  AstroData,
} from "@/types/astrology";
import type { GamePredictionData } from "@/types/gamePredictions";
import type { Article } from "../types/news";
import { createDefaultCelestialBody } from "@/types/gamePredictions";

// Extend the Team interface to include additional properties used in the component
interface ExtendedTeam extends Omit<Team, "logo" | "logo_url" | "external_id"> {
  logo_url?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  record?: string;
  wins?: number;
  losses?: number;
  external_id?: string | number;
}

// Helper type for aspect influence
interface AspectInfluence {
  description: string;
  strength: number;
  area?: string[];
}

// Type definitions
interface AstrologyInfluence {
  name: string;
  impact: number;
  description: string;
  icon?: React.ReactNode;
}

// Renamed to avoid conflict with the imported component
interface ElementDistribution {
  fire: number;
  earth: number;
  water: number;
  air: number;
}

// Constants
import { Sport } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";
import TopPlayersCarousel from "@/components/dashboard/TopPlayersCarousel";
import useTopPlayers from "@/hooks/useTopPlayers";

// Helper function to calculate moon clip path based on illumination (0-1) and phase name
const getMoonClipPath = (illumination: number, phaseName?: string): string => {
  // For testing/debugging
  console.log(`[Moon Illustration] Generating clip path: illumination=${illumination}, phase=${phaseName}`);
  
  if (!illumination && illumination !== 0) return 'circle(50%)';
  
  // Handle edge cases
  if (illumination >= 0.99) return 'circle(50%)'; // Full Moon (100% illuminated)
  if (illumination <= 0.01) return 'circle(0%)';  // New Moon (0% illuminated)
  
  // Determine if we're in waxing (illumination increasing) or waning (illumination decreasing) phase
  const isWaxing = phaseName?.toLowerCase().includes('waxing') || 
                  (phaseName?.toLowerCase().includes('first') && !phaseName.toLowerCase().includes('last')) ||
                  (illumination > 0 && illumination <= 0.5);
  
  // For waxing phases (illumination increasing, right side lit)
  if (isWaxing) {
    if (illumination < 0.5) {
      // Waxing Crescent: less than 50% illuminated, right side lit
      const xPos = 50 + ((1 - (illumination * 2)) * 50);
      return `inset(0 0 0 ${xPos}%)`;
    } else {
      // Waxing Gibbous: more than 50% illuminated, right side lit
      const xPos = 50 - ((illumination - 0.5) * 100);
      return `inset(0 0 0 0) polygon(${xPos}% 0, 100% 0, 100% 100%, ${xPos}% 100%)`;
    }
  } 
  // For waning phases (illumination decreasing, left side lit)
  else {
    if (illumination < 0.5) {
      // Waning Crescent: less than 50% illuminated, left side lit
      const xPos = 50 - ((1 - (illumination * 2)) * 50);
      return `inset(0 ${xPos}% 0 0)`;
    } else {
      // Waning Gibbous: more than 50% illuminated, left side lit
      const xPos = 50 + ((illumination - 0.5) * 100);
      return `inset(0 0 0 0) polygon(${xPos}% 0, 100% 0, 100% 100%, ${xPos}% 100%)`;
    }
  }
};

const MLB_LEAGUE_KEY: Sport = "mlb";
const DEFAULT_LOGO = "/images/default-team-logo.svg";

import AstroDisclosure from "@/components/AstroDisclosure";

// Import refactored dashboard components
import KeyPlanetaryInfluences from "@/components/dashboard/KeyPlanetaryInfluences";
import LunarStatusCard from "@/components/dashboard/LunarStatusCard";
import SolarInfluenceInsights from "@/components/dashboard/SolarInfluenceInsights";
import ElementalBalance from "@/components/dashboard/ElementalBalance";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(true);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [astroInfluences, setAstroInfluences] = useState<AstrologyInfluence[]>(
    [],
  );

  // Fetch the featured article from the news API
  useEffect(() => {
    const fetchFeaturedArticle = async () => {
      try {
        setIsLoadingArticle(true);
        const response = await fetch("/news/index.json");

        if (!response.ok) {
          throw new Error(
            `Failed to fetch articles: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        const articles = Array.isArray(data) ? data : data.articles || [];

        if (articles.length > 0) {
          const latestArticle = articles[0];
          // Map the article to match our Article interface
          const mappedArticle: Article = {
            slug: latestArticle.slug || `article-${Date.now()}`,
            title: latestArticle.title || "Latest News",
            subheading: latestArticle.description || "",
            contentHtml:
              latestArticle.content ||
              `<p>${latestArticle.description || ""}</p>`,
            featureImageUrl: latestArticle.image || "",
            publishedAt: latestArticle.publishedAt || new Date().toISOString(),
            author: latestArticle.author || "AI Insights",
            tags: latestArticle.tags || ["MLB", "News"],
          };
          setFeaturedArticle(mappedArticle);
        }
      } catch (err) {
        console.error("Error fetching featured article:", err);
        setArticleError(
          "Failed to load the latest news. Please try again later.",
        );
      } finally {
        setIsLoadingArticle(false);
      }
    };

    fetchFeaturedArticle();
  }, []);
  // State for today's date
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Memoize date string for API call
  const dateString = useMemo(
    () => selectedDate.toISOString().split("T")[0],
    [selectedDate],
  );

  // Fetch teams and games data
  const {
    teams,
    teamMap,
    teamByExternalId,
    loading: teamsLoading,
    error: teamsError,
    resolvedLeagueId: mlbLeagueId, // Rename for clarity
    isLeagueResolutionComplete: isMlbLeagueResolutionComplete,
  } = useTeams(MLB_LEAGUE_KEY);

  // Fetch upcoming games only when MLB league ID resolution is complete
  const {
    games,
    loading: gamesLoading,
    error: gamesError,
  } = useUpcomingGames({
    sport: MLB_LEAGUE_KEY,
    limit: 12,
    // Only pass leagueId if resolution is complete and ID is available
    leagueId: isMlbLeagueResolutionComplete ? mlbLeagueId : null,
    // Disable hook if resolution is not complete and we are targeting MLB
    disabled: MLB_LEAGUE_KEY && !isMlbLeagueResolutionComplete,
  });

  // Memoized astro data hook call with stable date string
  const stableDateString = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const {
    astroData,
    loading: astroLoading,
    error: astroError,
  } = useAstroData(stableDateString);

  // Fetch top baseball players with highest astro influence
  const {
    players: topPlayers,
    loading: topPlayersLoading,
    error: topPlayersError
  } = useTopPlayers(6); // Limit to top 6 players

  // Memoize elements distribution
  const elementsDistribution = useMemo(() => {
    if (!astroData?.elements) return { fire: 0, earth: 0, water: 0, air: 0 };
    
    // Helper function to extract numeric value from element (handles both number and {score: number} types)
    const getElementValue = (element: number | { score: number } | undefined): number => {
      if (element === undefined) return 0;
      return typeof element === 'number' ? element : element.score || 0;
    };
    
    return {
      fire: getElementValue(astroData?.elements?.fire),
      earth: getElementValue(astroData?.elements?.earth),
      water: getElementValue(astroData?.elements?.water),
      air: getElementValue(astroData?.elements?.air),
    };
  }, [astroData]);

  // Memoize game prediction data
  const sportsPredictions = useMemo(() => {
    if (!astroData) return null;
    return calculateSportsPredictions(astroData);
  }, [astroData]);

  // Group games by date
  const groupedGames = useMemo(() => {
    if (!games || games.length === 0) return [];

    const groups = games.reduce<Record<string, { date: Date; games: Game[] }>>(
      (acc, game) => {
        const dateKey = new Date(game.start_time || "")
          .toISOString()
          .split("T")[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: new Date(dateKey), games: [] };
        }
        acc[dateKey].games.push(game);
        return acc;
      },
      {},
    );

    return Object.values(groups).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, [games]);

  // Single handler definition
  const handleSeeMoreGames = useCallback(() => {
    navigate("/games");
  }, [navigate]);

  // Transform games data for display
  const processedGames = useMemo(() => {
    if (!games) return [];

    return games.map((game) => ({
      ...game,
      // Add any game processing logic here
    }));
  }, [games]);

  // Create a memoized function to get game-specific predictions
  const getGamePrediction = useCallback(
    (
      game: Game,
      homeTeam: Team | ExtendedTeam,
      awayTeam: Team | ExtendedTeam,
    ) => {
      if (!sportsPredictions || !sportsPredictions.games) return null;

      // Find prediction for this game
      return (
        sportsPredictions.games.find(
          (pred: any) => pred && pred.gameId === game.id,
        ) || null
      );
    },
    [sportsPredictions],
  );

  // Helper function to find a team with proper type casting
  const findTeam = (teamId: string): Team | undefined => {
    const team = teamMap?.[teamId] as ExtendedTeam | undefined;
    if (!team) return undefined;

    const teamData: Team = {
      id: team.id || teamId,
      name: team.name || "Unknown Team",
      abbreviation:
        team.abbreviation || team.name?.substring(0, 3).toUpperCase() || "TBD",
      logo_url: team.logo_url || team.logo || DEFAULT_LOGO,
      sport: "baseball_mlb",
    };
    // Add external_id if it exists
    if (team.external_id !== undefined) {
      (teamData as any).external_id = String(team.external_id);
    }

    // Add optional properties if they exist
    if (team.city) teamData.city = team.city;
    if (team.primary_color) teamData.primary_color = team.primary_color;
    if (team.secondary_color) teamData.secondary_color = team.secondary_color;

    return teamData;
  };

  // Process astrological data when it's available
  useEffect(() => {
    if (astroData && !astroLoading) {
      // Initialize element scores
      let fireScore = 0;
      let earthScore = 0;
      let waterScore = 0;
      let airScore = 0;

      // Process elements from astroData
      if (astroData.elements) {
        const elements = astroData.elements as any;
        if (typeof elements.fire === "number") {
          fireScore = elements.fire || 0;
          earthScore = elements.earth || 0;
          waterScore = elements.water || 0;
          airScore = elements.air || 0;
        } else if (elements.fire && typeof elements.fire === "object") {
          fireScore = elements.fire.score || 0;
          earthScore = elements.earth?.score || 0;
          waterScore = elements.water?.score || 0;
          airScore = elements.air?.score || 0;
        }
      } // Closes if (astroData.elements)

      const totalElements = fireScore + earthScore + waterScore + airScore;

      // Format astrological influences
      const influences: AstrologyInfluence[] = [];

      // Safely get sun sign from astroData
      const sunSign = astroData?.planets?.sun?.sign;

      // Sun Position is now handled in a dedicated, visually distinct panel below the Moon & Void Status panel. Remove from influences.

      // Add moon phase influence if available
      const moonPhase =
        astroData?.moon?.phase_name ||
        (astroData?.planets?.moon as any)?.phase_name;
      if (moonPhase) {
        influences.push({
          name: "Lunar Influence",
          impact: 0.7,
          description: `${moonPhase} Moon ${getMoonPhaseImpact(moonPhase)}`,
          icon: <Moon className="h-5 w-5 text-slate-400" />,
        });
      }

      // Add retrograde planets if any
      const retrogradePlanets = [];
      if (astroData?.planets) {
        Object.entries(astroData.planets).forEach(
          ([planet, data]: [string, any]) => {
            if (data?.retrograde) {
              retrogradePlanets.push(planet);
            }
          },
        );
      }

      if (retrogradePlanets.length > 0) {
        const planetNames = retrogradePlanets
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(", ");
        influences.push({
          name: "Retrograde Planets",
          impact: 0.6,
          description: `${planetNames} ${retrogradePlanets.length > 1 ? "are" : "is"} retrograde, which may affect ${retrogradePlanets.length > 1 ? "their" : "its"} related aspects of the game`,
          icon: <Info className="h-5 w-5 text-orange-500" />,
        });
      }

      // Add dominant element influence if we have element data
      if (totalElements > 0) {
        const elementScores = {
          fire: fireScore,
          earth: earthScore,
          air: airScore,
          water: waterScore,
        };
        const dominantEntry = Object.entries(elementScores).sort(
          (a, b) => b[1] - a[1],
        )[0];

        if (dominantEntry && dominantEntry[1] > 0) {
          const [dominantElement, score] = dominantEntry as [
            keyof ElementDistribution,
            number,
          ];
          influences.push({
            name: "Dominant Element",
            impact: Math.min(0.9, 0.5 + score / totalElements),
            description: `Strong ${dominantElement} influence (${Math.round((score / totalElements) * 100)}%) affects player ${getElementImpact(dominantElement)}`,
            icon: <Activity className="h-5 w-5 text-indigo-500" />,
          });
        }
      }

      setAstroInfluences(influences);
    }
  }, [astroData]);

  // Helper functions for astrological descriptions
  function getSunSignImpact(sign: string): string {
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

  function getMoonPhaseImpact(phase: string): string {
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

  function getElementImpact(element: string): string {
    const impacts: Record<string, string> = {
      fire: "aggression and risk-taking",
      earth: "endurance and reliability",
      air: "strategy and communication",
      water: "intuition and flow",
    };
    return impacts[element.toLowerCase()] || "performance";
  }

  function getSunElement(sign: string): string {
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

  function getSunSportsInfluences(
    astroData: any,
  ): { text: string; color: string }[] {
    const influences: { text: string; color: string }[] = [];

    if (!astroData) return influences;

    // Use the sunSign property directly from the API response
    if (astroData?.sunSign) {
      const sign = astroData.sunSign;
      const element = getSunElement(sign);

      influences.push({
        text: `The Sun in ${sign} brings ${getSunSignImpact(sign)} energy to today's games`,
        color:
          element === "Fire"
            ? "bg-red-500"
            : element === "Earth"
              ? "bg-green-500"
              : element === "Air"
                ? "bg-sky-300"
                : "bg-indigo-500",
      });
    }

    if (astroData.planets?.sun?.degree !== undefined) {
      const degree = Math.floor(astroData.planets.sun.degree);
      influences.push({
        text: `The Sun is at ${degree}°, which may indicate ${getDegreeImpact(degree)} performance`,
        color: "bg-orange-500",
      });
    }

    return influences;
  }

  function getDegreeImpact(degree: number): string {
    const impacts: Record<string, string> = {
      "0-10": "strong start",
      "11-20": "building momentum",
      "21-30": "peak performance",
    };
    const range = Object.keys(impacts).find((r) => {
      const [start, end] = r.split("-").map((n) => parseInt(n));
      return degree >= start && degree <= end;
    });
    return impacts[range] || "variable";
  }

  // Helper function to format degrees and minutes for display
  function formatDegreesMinutes(degrees: number, minutes: number): string {
    return `${Math.floor(degrees)}°${minutes ? ` ${minutes}'` : ""}`;
  }

  // Helper function to get moon aspect message based on phase and sign with sports focus
  const getMoonAspectMessage = (
    moonPhaseData: MoonPhaseInfo | undefined,
    moonSign: ZodiacSign | undefined,
  ): string => {
    if (!moonPhaseData)
      return "Analyzing lunar influences on sports performance";

    const { name: phaseName, value: phaseValue, illumination } = moonPhaseData;

    // Determine if waxing or waning based on value; names can sometimes be ambiguous or vary by source
    // Standard phase values: New=0, FQ=0.25, Full=0.5, LQ=0.75, New=1 (or 0 again)
    // Waxing: (0, 0.5), Waning: (0.5, 1)
    const isWaxing = phaseValue > 0 && phaseValue < 0.5;
    const isWaning = phaseValue > 0.5 && phaseValue < 1;

    let description = `Current lunar phase (${phaseName}, ${Math.round(illumination * 100)}% illuminated) `;

    if (isWaxing) {
      description += "favors teams building momentum. ";
      description += "Look for squads that improve as the game progresses. ";
      if (illumination > 0.7) {
        // Closer to Full Moon within waxing period
        description += "Peak performance conditions expected. ";
      }
    } else if (isWaning) {
      description += "may benefit experienced teams. ";
      description += "Watch for veteran players making key plays. ";
      if (illumination < 0.3) {
        // Closer to New Moon within waning period
        description += "Potential for unexpected outcomes increases. ";
      }
    } else if (phaseName === "Full Moon" || Math.abs(phaseValue - 0.5) < 0.05) {
      // Check name or close value
      description =
        "Peak intensity conditions (Full Moon). Expect high-energy performances ";
      description += "and potential for standout individual efforts. ";
    } else if (
      phaseName === "New Moon" ||
      phaseValue < 0.05 ||
      phaseValue > 0.95
    ) {
      // Check name or close value
      description = "Fresh start energy (New Moon). Underdogs may surprise, ";
      description += "and new strategies could prove effective. ";
    }

    if (moonSign) {
      const signStrengths: Record<string, { traits: string; sports: string }> =
        {
          Aries: {
            traits: "aggressive play, strong starts, physicality",
            sports: "football, hockey, sprinting",
          },
          Taurus: {
            traits: "endurance, consistency, strong defense",
            sports: "baseball, golf, wrestling",
          },
          Gemini: {
            traits: "quick thinking, adaptability, fast breaks",
            sports: "basketball, tennis, soccer midfielders",
          },
          Cancer: {
            traits: "team chemistry, home advantage, emotional plays",
            sports: "team sports, swimming, water polo",
          },
          Leo: {
            traits: "leadership, clutch performances, showmanship",
            sports: "basketball, gymnastics, figure skating",
          },
          Virgo: {
            traits: "precision, technical skills, strategy",
            sports: "baseball, golf, figure skating",
          },
          Libra: {
            traits: "teamwork, fair play, balanced attack",
            sports: "basketball, tennis doubles, volleyball",
          },
          Scorpio: {
            traits: "intensity, comebacks, mental toughness",
            sports: "boxing, martial arts, football defense",
          },
          Sagittarius: {
            traits: "risk-taking, long shots, adventurous play",
            sports: "basketball, horse racing, archery",
          },
          Capricorn: {
            traits: "discipline, strong defense, late-game strength",
            sports: "football, weightlifting, cycling",
          },
          Aquarius: {
            traits: "unconventional strategies, surprise plays",
            sports: "basketball, soccer, extreme sports",
          },
          Pisces: {
            traits: "creativity, intuition, fluid movement",
            sports: "soccer, swimming, figure skating",
          },
        };

      const signData = signStrengths[moonSign] || {
        traits: "competitive edge",
        sports: "various sports",
      };
      description += `\n\n${moonSign} Influence:\n`;
      description += `• Strengths: ${signData.traits}\n`;
      description += `• Favors: ${signData.sports}`;
    }

    return description;
  };

  // Helper function to get color class for element
  const getElementColor = (element: keyof ElementDistribution): string => {
    const colors: Record<keyof ElementDistribution, string> = {
      fire: "bg-red-500",
      earth: "bg-green-500",
      air: "bg-sky-400",
      water: "bg-indigo-500",
    };
    return colors[element] || "bg-slate-400";
  };

  // Simple team color palette for game cards
  const teamColorPalette = {
    getTeamColors: (team?: Team) => {
      return {
        primary: team?.primary_color || "#4338ca",
        secondary: team?.secondary_color || "#818cf8",
        text: "#ffffff",
      };
    },
  };

  // Update the daily recommendation to use real data
  const dailyRecommendation = useMemo(() => {
    if (!astroData) {
      return "";
    }

    // First, check if we have a sports prediction
    if (sportsPredictions?.prediction) {
      return sportsPredictions.prediction;
    }

    // Fall back to astrological data
    const elements = astroData?.elements;
    let dominantElement = "";
    let maxScore = 0;

    // Find the dominant element
    Object.entries(elements).forEach(([element, data]) => {
      if (data.score > maxScore) {
        maxScore = data.score;
        dominantElement = element;
      }
    });

    // Generate recommendation based on dominant element
    let recommendation = "";

    // Add moon phase influence if available
    if (astroData?.moon?.phase_name) {
      recommendation += `With the ${astroData?.moon?.phase_name} Moon, `;
    }

    // Add element-based recommendation
    recommendation += `The strong ${dominantElement} influence suggests ${getElementImpact(dominantElement)}.`;

    return recommendation;
  }, [astroData, elementsDistribution, sportsPredictions]);

  // Animation variants
  const featuredArticleVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
    },
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    hover: {
      y: -5,
      transition: { duration: 0.2 },
    },
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const isLoading = astroLoading || teamsLoading || gamesLoading;

  useEffect(() => {
    if (astroData) {
      console.log("Dashboard planets:", astroData?.planets);
      console.log("Dashboard aspects:", astroData?.aspects?.slice(0, 5));
      
      // Log individual planets
      topPlanets.forEach(planetName => {
        const planetKey = planetName.toLowerCase();
        console.log(`Dashboard planet ${planetName}:`, astroData?.planets?.[planetKey]);
      });
      
      // Log individual aspects
      astroData?.aspects?.slice(0, 5).forEach((aspect, index) => {
        console.log(`Dashboard aspect ${index}:`, aspect);
      });
    }
  }, [astroData]);

  const topPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

  // Helper functions for planetary influences
  const SIGN_TO_ELEMENT: Record<string, string> = {
    'aries': 'fire',
    'taurus': 'earth',
    'gemini': 'air',
    'cancer': 'water',
    'leo': 'fire',
    'virgo': 'earth',
    'libra': 'air',
    'scorpio': 'water',
    'sagittarius': 'fire',
    'capricorn': 'earth',
    'aquarius': 'air',
    'pisces': 'water',
  };

  const getPlanetIcon = (planet: string) => {
    const planetLower = planet.toLowerCase();
    switch (planetLower) {
      case 'sun': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'moon': return <Moon className="h-4 w-4 text-indigo-500" />;
      case 'mercury': return <CircleDot className="h-4 w-4 text-gray-500" />;
      case 'venus': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'mars': return <Flame className="h-4 w-4 text-red-500" />;
      case 'jupiter': return <Zap className="h-4 w-4 text-purple-500" />;
      case 'saturn': return <CircleOff className="h-4 w-4 text-amber-700" />;
      case 'uranus': return <Sparkles className="h-4 w-4 text-blue-400" />;
      case 'neptune': return <Waves className="h-4 w-4 text-blue-600" />;
      case 'pluto': return <CircleX className="h-4 w-4 text-gray-700" />;
      default: return <CircleDot className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return <LoadingScreen fullScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100">
      {featuredArticle && (
        <Link
          to={`/news/${featuredArticle.slug}`}
          className="block group relative overflow-hidden"
          onClick={() => window.scrollTo(0, 0)}
        >
          {/* Animated cosmic background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950">
              {/* Animated stars */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute rounded-full bg-white/30"
                  style={{
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.1,
                  }}
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2,
                  }}
                />
              ))}

              {/* Animated gradient orbs */}
              <motion.div
                className="absolute rounded-full w-64 h-64 -top-32 -right-32 bg-gradient-to-br from-purple-500/20 to-transparent blur-3xl"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute rounded-full w-96 h-96 -bottom-48 -left-48 bg-gradient-to-tr from-indigo-500/20 to-transparent blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
              />
            </div>

            {/* Main content image with overlay */}
            <div className="absolute inset-0 z-10">
              {featuredArticle.featureImageUrl ? (
                <img
                  src={featuredArticle.featureImageUrl}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
                  <Newspaper className="w-32 h-32 text-white/20" />
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
          </div>

          {/* Content */}
          <motion.article
            variants={featuredArticleVariant}
            initial="hidden"
            animate="visible"
            className="relative z-20 flex flex-col justify-end h-[300px] md:h-[350px] lg:h-[400px] p-8 md:p-12"
          >
            <div className="max-w-4xl mx-auto w-full">
              {/* Decorative elements */}
              <motion.div
                className="absolute top-6 right-6 w-16 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge
                  variant="secondary"
                  className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Featured Insight
                </Badge>

                <motion.h2
                  className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-white drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {featuredArticle.title}
                </motion.h2>

                {featuredArticle.subheading && (
                  <motion.p
                    className="text-base md:text-lg text-white/90 max-w-3xl leading-relaxed line-clamp-2 font-light"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {featuredArticle.subheading}
                  </motion.p>
                )}

                <motion.div
                  className="flex items-center mt-6 space-x-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium border-0 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30">
                    Read Full Story
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>

                  {featuredArticle.publishedAt && (
                    <span className="text-sm text-white/70">
                      {new Date(featuredArticle.publishedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.article>
        </Link>
      )}

      {/* Top Players Carousel moved to be directly after Daily Astro Tip */}

      {/* Main Dashboard Content Starts Here */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        exit="hidden"
        className="space-y-8"
      >
        <div className="space-y-8">
          {/* Main Content */}
          {astroError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-500 font-medium">
                Failed to load astrological data
              </p>
              <p className="text-gray-600 mt-2">Please try again later</p>
            </div>
          ) : (
            // No global error, proceed to render the main layout with individual section loading
            <div className="grid grid-cols-1">
              {/* Upcoming Games Section (Full width) */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4 bg-white"
              >
                {gamesLoading && (!games || games.length === 0) ? (
                  // Skeletons for Games section
                  <div className="px-6 pt-6 bg-white">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton
                            key={`game-skel-${i}`}
                            className="h-64 rounded-xl"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : games && games.length > 0 ? (
                  // Actual Games content
                  <div className="px-6 pt-6 bg-white">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Upcoming Games
                    </h2>
                    <div>
                      {groupedGames.map((group) => (
                        <div key={group.date.toString()} className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3 sticky top-0 bg-white py-2 z-10">
                            {format(group.date, "EEEE, MMMM d")}
                          </h3>
                          <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar px-4">
                            {group.games.map((game) => {
                              // Get team data with proper fallbacks
                              const homeTeam =
                                typeof game.home_team === "string"
                                  ? { id: game.home_team_id, name: "Home Team" }
                                  : game.home_team || {
                                      id: game.home_team_id,
                                      name: "Home Team",
                                    };

                              const awayTeam =
                                typeof game.away_team === "string"
                                  ? { id: game.away_team_id, name: "Away Team" }
                                  : game.away_team || {
                                      id: game.away_team_id,
                                      name: "Away Team",
                                    };

                              const gamePrediction = getGamePrediction(
                                game,
                                homeTeam,
                                awayTeam,
                              );

                              // Use memoized game prediction data directly
                              const gameCardAstroData = sportsPredictions;

                              // Merge game data with its prediction and team data for the GameCard
                              const gameWithTeams = {
                                ...game,
                                prediction: gamePrediction ?? undefined, // Ensure undefined if null for type compatibility
                              };

                              // Ensure we have proper team objects with required properties
                              const homeTeamData = {
                                ...(typeof homeTeam === "string"
                                  ? {}
                                  : homeTeam || {}),
                                id: game.home_team_id,
                                name:
                                  typeof homeTeam === "string"
                                    ? homeTeam
                                    : homeTeam?.name || "Home Team",
                                // Try logo_url first, then logo, then empty string
                                logo_url:
                                  typeof homeTeam === "string"
                                    ? ""
                                    : homeTeam?.logo_url ||
                                      homeTeam?.logo ||
                                      "",
                                // Also include the logo property for backward compatibility
                                logo:
                                  typeof homeTeam === "string"
                                    ? ""
                                    : homeTeam?.logo ||
                                      homeTeam?.logo_url ||
                                      "",
                                record:
                                  typeof homeTeam === "string"
                                    ? "0-0"
                                    : homeTeam?.record || "0-0",
                              };

                              const awayTeamData = {
                                ...(typeof awayTeam === "string"
                                  ? {}
                                  : awayTeam || {}),
                                id: game.away_team_id,
                                name:
                                  typeof awayTeam === "string"
                                    ? awayTeam
                                    : awayTeam?.name || "Away Team",
                                // Try logo_url first, then logo, then empty string
                                logo_url:
                                  typeof awayTeam === "string"
                                    ? ""
                                    : awayTeam?.logo_url ||
                                      awayTeam?.logo ||
                                      "",
                                // Also include the logo property for backward compatibility
                                logo:
                                  typeof awayTeam === "string"
                                    ? ""
                                    : awayTeam?.logo ||
                                      awayTeam?.logo_url ||
                                      "",
                                record:
                                  typeof awayTeam === "string"
                                    ? "0-0"
                                    : awayTeam?.record || "0-0",
                              };

                              return (
                                <GameCard
                                  key={game.id}
                                  game={game}
                                  homeTeam={homeTeamData}
                                  awayTeam={awayTeamData}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {games.length === 0 && !gamesLoading ? (
                        <p className="text-center text-gray-600 py-8">
                          No upcoming games scheduled for this league.
                        </p>
                      ) : (
                        <div className="mt-8 mb-2 flex justify-center">
                          <Button
                            variant="outline"
                            className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-indigo-500 rounded-full shadow-md group"
                            onClick={handleSeeMoreGames}
                          >
                            <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-500 group-hover:translate-x-0 ease">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                ></path>
                              </svg>
                            </span>
                            <span className="absolute flex items-center justify-center w-full h-full text-indigo-500 transition-all duration-300 transform group-hover:translate-x-full ease">
                              View All Games
                            </span>
                            <span className="relative invisible">
                              View All Games
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !gamesLoading && (!games || games.length === 0) ? (
                  // No games found message
                  <div className="px-6 pt-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Games</h2>
                    <p className="text-gray-500">No upcoming games found.</p>
                  </div>
                ) : null}
              </motion.div>

              {/* Astrological Insights Section */}
              <motion.div
                variants={slideUp}
                initial="hidden"
                animate="show"
                className="bg-white p-6 rounded-t-none"
              >
                {/* Astrological Insights Full-Width Banner */}
                <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] my-16 py-20 bg-gradient-to-b from-[#0c0a1d] via-[#1a1339] to-[#1d1a3d] text-white overflow-hidden">
                  {/* Deep space background with multiple layers */}
                  <div className="absolute inset-0 bg-[url('/stars.svg')] bg-repeat opacity-60"></div>
                  <div className="absolute inset-0 bg-[url('/galaxy.svg')] bg-center bg-no-repeat opacity-40 scale-150"></div>
                  
                  {/* Animated stars */}
                  <div className="absolute inset-0 overflow-hidden">
                    {/* Large bright star */}
                    <motion.div 
                      className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]" 
                      style={{ top: '15%', left: '10%' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div 
                      className="absolute w-2 h-2 bg-blue-200 rounded-full shadow-[0_0_15px_5px_rgba(147,197,253,0.8)]" 
                      style={{ top: '25%', right: '15%' }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                    <motion.div 
                      className="absolute w-1.5 h-1.5 bg-amber-100 rounded-full shadow-[0_0_12px_4px_rgba(254,243,199,0.8)]" 
                      style={{ bottom: '30%', left: '25%' }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <motion.div 
                      className="absolute w-1 h-1 bg-purple-200 rounded-full shadow-[0_0_8px_2px_rgba(233,213,255,0.8)]" 
                      style={{ bottom: '20%', right: '30%' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    />
                  </div>
                  
                  {/* Subtle nebula effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/20"></div>
                  
                  {/* Content with enhanced animations */}
                  <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      viewport={{ once: true, margin: "-100px" }}
                    >
                      <h2 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 [text-shadow:0_0_20px_rgba(255,165,0,0.5)]">
                        Astrological Insights
                      </h2>
                      
                      {/* Animated underline */}
                      <motion.div 
                        className="h-1 bg-gradient-to-r from-amber-400/0 via-amber-400 to-amber-400/0 rounded-full mx-auto mt-2"
                        initial={{ width: 0 }}
                        whileInView={{ width: "70%" }}
                        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                        viewport={{ once: true, margin: "-100px" }}
                      />
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      viewport={{ once: true, margin: "-100px" }}
                    >
                      <p className="mt-6 text-2xl md:text-3xl font-bold text-indigo-200 tracking-wide">
                        {format(selectedDate, "MMMM d, yyyy")}
                      </p>
                    </motion.div>
                    
                    {/* Constellation line connecting to content below */}
                    <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2">
                      <motion.div 
                        className="w-px h-16 bg-gradient-to-b from-amber-400/80 to-transparent"
                        initial={{ height: 0, opacity: 0 }}
                        whileInView={{ height: 64, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                        viewport={{ once: true, margin: "-100px" }}
                      />
                      <div className="w-2 h-2 rounded-full bg-amber-400 absolute -bottom-1 -left-1 shadow-[0_0_10px_2px_rgba(251,191,36,0.8)]"></div>
                    </div>
                  </div>
                </div>
                {/* Elemental Balance Full-Width Card */}
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="show"
                  className="w-full mb-8"
                >
                  <ElementalBalance 
                    planets={astroData?.planets} 
                  />
                  
                  {/* Daily Astro Tip - Enhanced Full Width Section */}
                  <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] my-12 py-12 bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>
                    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="max-w-4xl mx-auto text-center">
                        <div className="flex flex-col items-center mb-6">
                          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-xl shadow-lg w-14 h-14 flex items-center justify-center mb-4">
                            <Lightbulb className="h-7 w-7 text-white" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-100">
                              Daily Astro Tip
                            </h3>
                            <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mt-2 mx-auto"></div>
                          </div>
                        </div>
                        <p className="text-slate-100 text-lg leading-relaxed font-light max-w-3xl mx-auto">
                          {dailyRecommendation ||
                            "Versatile teams with good passing and communication will perform well. Rest and recovery strategies will be particularly important. Air's strong influence benefits teams with superior passing, communication, and strategic adaptability."}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Players Carousel */}
                  <div className="px-4 pt-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                      <Trophy className="h-5 w-5 mr-3 text-amber-500" />
                      This Weeks' Astro Allstars
                    </h3>
                  </div>
                  <TopPlayersCarousel 
                    players={topPlayers}
                    loading={topPlayersLoading}
                    error={topPlayersError}
                    />
                </motion.div>
                {/* Other astrology cards below */}
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="space-y-6"
                >
                  {astroLoading && !astroData ? (
                    // Skeletons for Astro section
                    <>
                      <Skeleton className="h-48 rounded-xl" />
                      <Skeleton className="h-64 rounded-xl" />
                      <Skeleton className="h-56 rounded-xl md:col-span-2" />
                    </>
                  ) : astroData ? (
                    // Actual Astro content
                    <>
                      <motion.div 
                        variants={item}
                      >
                        <SolarInfluenceInsights 
                          sun={astroData?.planets?.sun} 
                          getSunSignImpact={getSunSignImpact}
                          getSunElement={getSunElement}
                          getElementImpact={getElementImpact}
                          getDegreeImpact={getDegreeImpact}
                          getSunSportsInfluences={() => getSunSportsInfluences(astroData)}
                          sidereal={astroData?.sidereal}
                          formattedDegree={formatDegreesMinutes(
                            astroData?.planets?.sun?.degree || 0,
                            astroData?.planets?.sun?.minute || 0
                          )}
                        />
                      </motion.div>

                      <motion.div
                        variants={item}
                        className="bg-white shadow-sm rounded-lg w-full"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                            <Moon className="h-5 w-5 mr-2 text-indigo-500" />{" "}
                            Lunar & Void Status
                          </CardTitle>
                          <CardDescription className="text-slate-600">
                            {astroData?.voidMoon
                              ? astroData?.voidMoon?.isVoid
                                ? " • Void of Course"
                                : " • Not Void of Course"
                              : ""}
                          </CardDescription>
                        </CardHeader>
                        {/* Moon Phase Section with Visualization - Removed CardContent for full width */}
                        <div className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm">
                            <div className="flex flex-col items-center lg:flex-row lg:items-start">
                              <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-full overflow-hidden mb-6 lg:mb-0 lg:mr-8 flex-shrink-0 border-[10px] border-indigo-600/90 shadow-xl transform hover:scale-[1.02] transition-transform duration-500">
                                {/* Moon phase visualization */}
                                <div
                                  className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 rounded-full transition-all duration-1000 ease-in-out"
                                  style={{
                                    clipPath: getMoonClipPath(
                                      astroData?.moonPhase?.illumination || 0, 
                                      astroData?.moonPhase?.phaseName
                                    ),
                                    opacity: 0.95,
                                    boxShadow:
                                      "inset 0 0 40px rgba(255, 255, 255, 0.8)",
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
                                    boxShadow:
                                      "0 0 60px 15px rgba(99, 102, 241, 0.4)",
                                    pointerEvents: "none",
                                    background:
                                      "radial-gradient(circle at 30% 30%, rgba(199, 210, 254, 0.3), transparent 60%)",
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
                                      {astroData?.moonPhase?.name ||
                                        "Current phase unknown"}
                                    </p>
                                  </div>
                                  <div className="inline-block bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-medium px-4 py-1.5 rounded-full mb-3 lg:mb-0">
                                    {astroData?.moonPhase?.illumination !== null &&
                                    astroData?.moonPhase?.illumination !== undefined
                                      ? `${astroData?.moonPhase?.emoji || '🌕'} ${Math.round((astroData?.moonPhase?.illumination || 0) * 100)}% Illuminated`
                                      : "🌑 Illumination unknown"}
                                  </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl mb-6">
                                  <p className="text-base text-slate-700 leading-relaxed">
                                    {astroData?.moonPhase?.name &&
                                      getMoonPhaseImpact(
                                        astroData?.moonPhase?.name || 'Unknown',
                                      )}
                                  </p>
                                </div>

                                <div className="flex flex-row flex-wrap items-stretch justify-between gap-3 mb-6">
                                  <div className="bg-white p-3 rounded-lg flex flex-col flex-1 min-w-[120px]">
                                    <div className="text-xs uppercase text-slate-500 font-medium mb-1">Moon Sign</div>
                                    <div className="font-semibold text-indigo-700 text-lg">
                                      {astroData?.planets?.moon?.sign || "—"}
                                    </div>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg flex flex-col flex-1 min-w-[120px]">
                                    <div className="text-xs uppercase text-slate-500 font-medium mb-1">
                                      Next Full Moon
                                    </div>
                                    <div className="font-semibold text-indigo-700 text-lg">
                                      {astroData?.moonPhase?.nextFullMoon
                                        ? new Date(
                                            astroData?.moonPhase?.nextFullMoon
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "2-digit",
                                          })
                                        : "—"}
                                    </div>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg flex flex-col flex-1 min-w-[120px]">
                                    <div className="text-xs uppercase text-slate-500 font-medium mb-1">
                                      Zodiac Degree
                                    </div>
                                    <div className="font-semibold text-indigo-700 text-lg">
                                      {astroData?.planets?.moon?.degree
                                        ? `${Math.floor(astroData?.planets?.moon?.degree || 0)}°`
                                        : "—"}
                                    </div>
                                  </div>
                                </div>

                                {/* Void of Course Status */}
                                <div className="w-full bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl overflow-hidden">
                                  <div className="p-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium text-slate-800 flex items-center text-sm">
                                        <div
                                          className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${astroData?.voidMoon?.isVoid ? "bg-red-500" : "bg-green-500"}`}
                                        ></div>
                                        Void of Course Status
                                      </h4>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${astroData?.voidMoon?.isVoid ? "bg-red-100 text-red-800" : "bg-red-50 text-red-700"}`}
                                      >
                                        {astroData?.voidMoon?.isVoid
                                          ? "Active"
                                          : "Inactive"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-3">
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                      </motion.div>

                      {astroData && astroData.aspects && astroData.planets && (
                        <motion.div 
                          variants={item}
                          className="md:col-span-2"
                        >
                          <KeyPlanetaryInfluences 
                            aspects={astroData.aspects} 
                            planets={astroData.planets} 
                          />
                        </motion.div>
                      )}

                      {/* Daily Astro Tip moved to Elemental Balance section */}
                    </>
                  ) : !astroLoading && !astroData ? (
                    // No Astro data message
                    <Card className="bg-white backdrop-blur-sm shadow-none">
                      <CardHeader>
                        <CardTitle>Astrological Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center text-slate-500 py-8">
                          Astrological insights are currently unavailable.
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
