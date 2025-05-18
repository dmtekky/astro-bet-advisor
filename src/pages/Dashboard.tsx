import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GameCard } from '@/features/dashboard/GameCard';
import { useAstroData } from '@/hooks/useAstroData';
import { useCurrentEphemeris } from '@/hooks/useFormulaData';
import { calculateAstrologicalImpact } from '@/lib/astroFormula';
import type { GameData } from '../types/game';

// Type definitions for astrological data
type AspectKey = 'sunMars' | 'sunJupiter' | 'sunSaturn' | 'moonVenus' | 'mercuryMars' | 'venusMars';
type ElementKey = 'fire' | 'earth' | 'air' | 'water';

type AspectRecord = Record<AspectKey, string | null>;
type ElementRecord = Record<ElementKey, number>;

interface CelestialEvent {
  name: string;
  date: string;
  intensity: 'low' | 'medium' | 'high';
  description: string;
}

// Type for data coming from the hook (all fields optional)
type AstroDataFromHook = Partial<{
  moon_phase: string;
  moon_sign: string;
  mercury_retrograde: boolean;
  mercury_sign: string;
  aspects: Partial<AspectRecord>;
  planetary_hour: string;
  elements: Partial<ElementRecord>;
  north_node: string;
  south_node: string;
  next_event: Partial<CelestialEvent>;
  sun_sign: string;
  sun_icon: string;
}>;

// Extended AstroData interface with all required properties
interface AstroData {
  // Core astro data
  moon_phase: string;
  moon_sign: string;
  mercury_retrograde: boolean;
  mercury_sign: string;
  venus_sign: string;
  mars_sign: string;
  jupiter_sign: string;
  saturn_sign: string;
  uranus_sign: string;
  neptune_sign: string;
  pluto_sign: string;
  
  // Aspects and elements
  aspects: AspectRecord;
  elements: ElementRecord;
  
  // Nodes and events
  north_node: string;
  south_node: string;
  next_event: CelestialEvent;
  
  // Sun and planetary data
  sun_sign: string;
  sun_icon: string;
  planetary_hour: string;
  
  // Aliases for backward compatibility
  moonPhase: string;
  moonSign: string;
  mercuryRetrograde: boolean;
  mercurySign: string;
  venusSign: string;
  marsSign: string;
  jupiterSign: string;
  saturnSign: string;
  uranusSign: string;
  neptuneSign: string;
  plutoSign: string;
  planetaryHour: string;
  northNode: string;
  southNode: string;
  nextEvent: CelestialEvent;
  sunSign: string;
  sunIcon: string;
  
  // Additional properties that might be used
  [key: string]: any;
}

// Sample games data
const SAMPLE_GAMES: GameData[] = [
  {
    id: '1',
    league: 'NBA',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    homeOdds: -110,
    awayOdds: -110,
    spread: 1.5,
    total: 225.5,
    homeRecord: '25-15',
    awayRecord: '28-12',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    period: 0,
  },
  {
    id: '2',
    league: 'NBA',
    homeTeam: 'Celtics',
    awayTeam: 'Bucks',
    startTime: new Date(Date.now() + 7200000).toISOString(),
    homeOdds: 120,
    awayOdds: -140,
    spread: -2.5,
    total: 218.5,
    homeRecord: '30-10',
    awayRecord: '28-12',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    period: 0,
  },
  {
    id: '3',
    league: 'NBA',
    homeTeam: 'Suns',
    awayTeam: 'Nuggets',
    startTime: new Date(Date.now() + 10800000).toISOString(),
    homeOdds: -150,
    awayOdds: 130,
    spread: -3.5,
    total: 230.5,
    homeRecord: '26-14',
    awayRecord: '27-13',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    period: 0,
  },
];
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip } from 'react-tooltip';

const Dashboard = () => {
  const { data: ephemerisData } = useCurrentEphemeris();
  const { astroData: astroDataFromHook, loading, error } = useAstroData();

  // Default values for astro data
  const defaultAspects: AspectRecord = {
    sunMars: null,
    sunJupiter: null,
    sunSaturn: null,
    moonVenus: null,
    mercuryMars: null,
    venusMars: null,
  };
  
  const defaultElements: ElementRecord = { 
    fire: 0, 
    earth: 0, 
    air: 0, 
    water: 0 
  };
  
  const defaultEvent: CelestialEvent = {
    name: 'No upcoming events',
    date: new Date().toISOString(),
    intensity: 'low',
    description: 'No major celestial events in the near future.'
  };
  
  // Safely merge astro data with defaults
  const safeAstroData: AstroData = (() => {
    // Default values for all required properties
    const defaultSigns = {
      venus_sign: 'Taurus',
      mars_sign: 'Aries',
      jupiter_sign: 'Sagittarius',
      saturn_sign: 'Capricorn',
      uranus_sign: 'Taurus',
      neptune_sign: 'Pisces',
      pluto_sign: 'Capricorn'
    };

    // Base data with all required fields
    const baseData = {
      // Core astro data
      moon_phase: 'New Moon',
      moon_sign: 'Aries',
      mercury_retrograde: false,
      mercury_sign: 'Gemini',
      ...defaultSigns,
      
      // Aspects and elements
      aspects: { ...defaultAspects },
      elements: { ...defaultElements },
      
      // Nodes and events
      north_node: 'Aries',
      south_node: 'Libra',
      next_event: { ...defaultEvent },
      
      // Sun and planetary data
      sun_sign: 'Gemini',
      sun_icon: '♊️',
      planetary_hour: 'Sun',
      
      // Aliases for backward compatibility
      moonPhase: 'New Moon',
      moonSign: 'Aries',
      mercuryRetrograde: false,
      mercurySign: 'Gemini',
      venusSign: 'Taurus',
      marsSign: 'Aries',
      jupiterSign: 'Sagittarius',
      saturnSign: 'Capricorn',
      uranusSign: 'Taurus',
      neptuneSign: 'Pisces',
      plutoSign: 'Capricorn',
      planetaryHour: 'Sun',
      northNode: 'Aries',
      southNode: 'Libra',
      nextEvent: { ...defaultEvent },
      sunSign: 'Gemini',
      sunIcon: '♊️'
    };

    // If no data from hook, return defaults
    if (loading || error || !astroDataFromHook) {
      return { ...baseData };
    }

    // Merge hook data with defaults
    const mergedData: Partial<AstroData> = {
      ...baseData,
      ...astroDataFromHook,
      aspects: { ...defaultAspects, ...(astroDataFromHook.aspects || {}) },
      elements: { ...defaultElements, ...(astroDataFromHook.elements || {}) },
      next_event: { ...defaultEvent, ...(astroDataFromHook.next_event || {}) },
      nextEvent: { ...defaultEvent, ...(astroDataFromHook.next_event || {}) }
    };

    // Ensure all required fields are set
    const result: AstroData = {
      ...mergedData,
      // Core astro data
      moon_phase: mergedData.moon_phase || baseData.moon_phase,
      moon_sign: mergedData.moon_sign || baseData.moon_sign,
      mercury_retrograde: mergedData.mercury_retrograde ?? baseData.mercury_retrograde,
      mercury_sign: mergedData.mercury_sign || baseData.mercury_sign,
      venus_sign: mergedData.venus_sign || baseData.venus_sign,
      mars_sign: mergedData.mars_sign || baseData.mars_sign,
      jupiter_sign: mergedData.jupiter_sign || baseData.jupiter_sign,
      saturn_sign: mergedData.saturn_sign || baseData.saturn_sign,
      uranus_sign: mergedData.uranus_sign || baseData.uranus_sign,
      neptune_sign: mergedData.neptune_sign || baseData.neptune_sign,
      pluto_sign: mergedData.pluto_sign || baseData.pluto_sign,
      
      // Aliases
      moonPhase: mergedData.moon_phase || baseData.moon_phase,
      moonSign: mergedData.moon_sign || baseData.moon_sign,
      mercuryRetrograde: mergedData.mercury_retrograde ?? baseData.mercury_retrograde,
      mercurySign: mergedData.mercury_sign || baseData.mercury_sign,
      venusSign: mergedData.venus_sign || baseData.venus_sign,
      marsSign: mergedData.mars_sign || baseData.mars_sign,
      jupiterSign: mergedData.jupiter_sign || baseData.jupiter_sign,
      saturnSign: mergedData.saturn_sign || baseData.saturn_sign,
      uranusSign: mergedData.uranus_sign || baseData.uranus_sign,
      neptuneSign: mergedData.neptune_sign || baseData.neptune_sign,
      plutoSign: mergedData.pluto_sign || baseData.pluto_sign,
      planetaryHour: mergedData.planetary_hour || baseData.planetary_hour,
      northNode: mergedData.north_node || baseData.north_node,
      southNode: mergedData.south_node || baseData.south_node,
      nextEvent: { ...defaultEvent, ...(mergedData.next_event || {}) },
      sunSign: mergedData.sun_sign || baseData.sun_sign,
      sunIcon: mergedData.sun_icon || baseData.sun_icon,
      
      // Other required fields
      aspects: { ...defaultAspects, ...(mergedData.aspects || {}) },
      elements: { ...defaultElements, ...(mergedData.elements || {}) },
      next_event: { ...defaultEvent, ...(mergedData.next_event || {}) }
    };

    return result;
  })();
  
  // Safe accessor for astro data with fallbacks
  const getAstroData = <K extends keyof AstroData>(
    key: K,
    fallback: AstroData[K]
  ): AstroData[K] => {
    if (loading || error) return fallback;
    const value = safeAstroData[key];
    return value !== undefined ? value : fallback;
  };

  // Calculate astro edge for a game
  const calculateAstroEdge = (game: any): number => {
    if (!game?.players?.length) return 0;
    
    // Ensure we have valid astro data
    if (!safeAstroData) return 0;
    
    // Default aspects if not provided
    const defaultAspects: AspectRecord = {
      sunMars: null,
      sunJupiter: null,
      sunSaturn: null,
      moonVenus: null,
      mercuryMars: null,
      venusMars: null
    };

    // Default elements if not provided
    const defaultElements: ElementRecord = {
      fire: 0,
      earth: 0,
      air: 0,
      water: 0
    };

    // Default event if not provided
    const defaultEvent: CelestialEvent = {
      name: 'New Moon',
      date: new Date().toISOString(),
      intensity: 'medium',
      description: 'A new lunar cycle begins'
    };

    try {
      // Prepare astro data with all required properties
      const astroDataForCalculation: AstroData = {
        ...safeAstroData,
        // Ensure all required properties are present
        moon_phase: safeAstroData.moon_phase || 'New Moon',
        moon_sign: safeAstroData.moon_sign || 'Aries',
        mercury_retrograde: safeAstroData.mercury_retrograde || false,
        mercury_sign: safeAstroData.mercury_sign || 'Gemini',
        venus_sign: safeAstroData.venus_sign || 'Taurus',
        mars_sign: safeAstroData.mars_sign || 'Aries',
        jupiter_sign: safeAstroData.jupiter_sign || 'Sagittarius',
        saturn_sign: safeAstroData.saturn_sign || 'Capricorn',
        uranus_sign: safeAstroData.uranus_sign || 'Taurus',
        neptune_sign: safeAstroData.neptune_sign || 'Pisces',
        pluto_sign: safeAstroData.pluto_sign || 'Capricorn',
        aspects: { ...defaultAspects, ...(safeAstroData.aspects || {}) },
        elements: { ...defaultElements, ...(safeAstroData.elements || {}) },
        north_node: safeAstroData.north_node || 'Aries',
        south_node: safeAstroData.south_node || 'Libra',
        next_event: { ...defaultEvent, ...(safeAstroData.next_event || {}) },
        sun_sign: safeAstroData.sun_sign || 'Gemini',
        sun_icon: safeAstroData.sun_icon || '♊️',
        planetary_hour: safeAstroData.planetary_hour || 'Sun',
        // Aliases
        moonPhase: safeAstroData.moon_phase || 'New Moon',
        moonSign: safeAstroData.moon_sign || 'Aries',
        mercuryRetrograde: safeAstroData.mercury_retrograde || false,
        mercurySign: safeAstroData.mercury_sign || 'Gemini',
        venusSign: safeAstroData.venus_sign || 'Taurus',
        marsSign: safeAstroData.mars_sign || 'Aries',
        jupiterSign: safeAstroData.jupiter_sign || 'Sagittarius',
        saturnSign: safeAstroData.saturn_sign || 'Capricorn',
        uranusSign: safeAstroData.uranus_sign || 'Taurus',
        neptuneSign: safeAstroData.neptune_sign || 'Pisces',
        plutoSign: safeAstroData.pluto_sign || 'Capricorn',
        planetaryHour: safeAstroData.planetary_hour || 'Sun',
        northNode: safeAstroData.north_node || 'Aries',
        southNode: safeAstroData.south_node || 'Libra',
        nextEvent: { ...defaultEvent, ...(safeAstroData.next_event || {}) },
        sunSign: safeAstroData.sun_sign || 'Gemini',
        sunIcon: safeAstroData.sun_icon || '♊️'
      };

      // Calculate average astro impact for all players
      const totalImpact = game.players.reduce((sum: number, player: any) => {
        // Skip players without birth data
        if (!player.birthDate) return sum;
        
        try {
          // Calculate player's astro impact
          const playerImpact = calculateAstrologicalImpact(
            [player],
            astroDataForCalculation,
            game.date || new Date().toISOString()
          );
          
          // Ensure we have a valid number
          const impactValue = Number(playerImpact) || 0;
          return sum + impactValue;
        } catch (error) {
          console.error('Error calculating player astro impact:', error);
          return sum;
        }
      }, 0);
      
      // Calculate average and ensure it's within 0-100 range
      const averageImpact = game.players.length > 0 
        ? totalImpact / game.players.length 
        : 0;
      
      // Return the impact as a percentage (0-100)
      return Math.min(100, Math.max(0, averageImpact));
    } catch (error) {
      console.error('Error in calculateAstroEdge:', error);
      return 0;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Upcoming Games Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Upcoming Games</h2>
          <p className="text-muted-foreground">
            Today's top matchups with astrological insights
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_GAMES.slice(0, 3).map((game) => {
              const astroEdge = calculateAstroEdge(game);
              return <GameCard key={game.id} game={game} astroEdge={astroEdge} />;
            })}
          </div>

          <div className="flex justify-center mt-4">
            <Link to="/upcoming-games" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All Upcoming Games →
            </Link>
          </div>
        </div>

        {/* Celestial Insights Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Celestial Insights</h2>
          <p className="text-muted-foreground">
            Current astrological influences that may impact today's games and betting opportunities
          </p>

          {/* Elemental Balance - Full Width */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <CardTitle className="text-lg">Elemental Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 rounded-full overflow-hidden bg-gray-800 flex">
                  {Object.entries(getAstroData('elements', { fire: 25, earth: 25, air: 25, water: 25 })).map(([element, value]) => (
                    <div 
                      key={element}
                      className={`h-full ${
                        element === 'fire' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 
                        element === 'earth' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                        element === 'air' ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 
                        'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                      style={{ width: `${value}%` }}
                      data-tooltip-id="element-tooltip"
                      data-tooltip-content={`${element.charAt(0).toUpperCase() + element.slice(1)}: ${value}%`}
                    />
                  ))}
                  <Tooltip id="element-tooltip" />
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {Object.entries(getAstroData('elements', { fire: 25, earth: 25, air: 25, water: 25 })).map(([element, value]) => (
                    <div 
                      key={element} 
                      className="flex items-center gap-1"
                    >
                      <span className={`inline-block w-3 h-3 rounded-sm ${
                        element === 'fire' ? 'bg-gradient-to-br from-red-500 to-orange-500' : 
                        element === 'earth' ? 'bg-gradient-to-br from-amber-500 to-yellow-500' :
                        element === 'air' ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 
                        'bg-gradient-to-br from-blue-600 to-indigo-600'
                      }`} />
                      <span className="font-medium text-white/90">
                        {element.charAt(0).toUpperCase() + element.slice(1)}
                      </span>
                      <span className="text-white/60 ml-auto">
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-center pt-2">
                {getElementalInfluence(getAstroData('elements', { fire: 25, earth: 25, air: 25, water: 25 }))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Moon Phase & Influence */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Moon Phase & Influence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getAstroData('moonPhase', 'Loading...')}</span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-800/40 text-blue-200">
                    {getAstroData('moonSign', '')} • {getMoonInfluence(getAstroData('moonPhase', '') as string, getAstroData('moonSign', '') as string)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {String(getMoonInfluence(
                    getAstroData('moonPhase', '') as string, 
                    getAstroData('moonSign', '') as string
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Retrograde Status */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 19V5m7 7H5" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Retrograde Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {getAstroData('mercuryRetrograde', false) ? 'Mercury Retrograde' : 'Mercury Direct'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getAstroData('mercuryRetrograde', false) 
                      ? 'bg-red-800/40 text-red-200' 
                      : 'bg-green-800/40 text-green-200'
                  }`}>
                    {getMercuryInfluence(getAstroData('mercuryRetrograde', false), getAstroData('mercurySign', ''))}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getMercuryInfluence(getAstroData('mercuryRetrograde', false), getAstroData('mercurySign', ''))}
                </div>
              </CardContent>
            </Card>

            {/* Aspect Grid */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Aspect Grid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(getAstroData('aspects', {})).map(([aspect, value]) => (
                  value && (
                    <div key={aspect} className="flex justify-between text-sm">
                      <span className="capitalize">
                        {aspect.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={
                        ['square', 'opposition'].includes(value as string) 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }>
                        {value}
                      </span>
                    </div>
                  )
                ))}
                <div className="text-xs text-muted-foreground">
                  {getAspectAdvice(getAstroData('aspects', {}))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Transits */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 12h18M12 3v18" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Daily Transits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {getAstroData('planetaryHour', 'Calculating...')} Hour
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-purple-800/40 text-purple-200">
                    {getPlanetaryHourInfluence(getAstroData('planetaryHour', ''))}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getPlanetaryHourInfluence(getAstroData('planetaryHour', ''))}
                </div>
              </CardContent>
            </Card>



            {/* Planetary Hours */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 8v4l2 2" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Planetary Hour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">North Node in {getAstroData('northNode', 'Aries')}</span>
                  <span className="text-xs px-2 py-1 rounded bg-cyan-800/40 text-cyan-200">Karmic Path</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getLunarNodeInfluence(getAstroData('northNode', 'Aries'), getAstroData('southNode', 'Libra'))}
                </div>
              </CardContent>
            </Card>

            {/* Lunar Nodes */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 2v20M2 12h20" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Lunar Nodes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {safeAstroData.nextEvent?.name || 'No upcoming events'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-pink-800/40 text-pink-200">
                    {safeAstroData.nextEvent?.intensity === 'high' ? 'Major Event' : 'Event'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {safeAstroData.nextEvent?.description || 'No major celestial events in the near future.'}
                </div>
              </CardContent>
            </Card>

            {/* Meteor Showers & Celestial Events */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M2 12l10 10 10-10" strokeWidth="2" /><path d="M12 2v20" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Celestial Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Sun in {getAstroData('sunSign', 'Loading...')} {getAstroData('sunIcon', '')}</span>
                  <span className="text-xs px-2 py-1 rounded bg-teal-800/40 text-teal-200">
                    {getSunSignQuality(getAstroData('sunSign', ''))}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getSunSignInfluence(getAstroData('sunSign', ''))}
                </div>
              </CardContent>
            </Card>

            {/* Astrological Forecast */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-900/80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07l-1.42 1.42M6.34 17.66l-1.42 1.42m12.02 0l-1.42-1.42M6.34 6.34L4.92 4.92" strokeWidth="2" /></svg>
                </span>
                <CardTitle className="text-lg">Astrological Forecast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Current Planetary Alignments</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Sun in Taurus</span>
                      <span className="text-amber-400">Stable</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mercury in Gemini</span>
                      <span className="text-green-400">Favorable</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Venus in Aries</span>
                      <span className="text-amber-400">Neutral</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Mars in Aquarius</span>
                      <span className="text-green-400">Strong</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <h3 className="font-medium mb-2">Today's Key Aspect</h3>
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-amber-400 font-medium">Jupiter Trine Moon</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Favorable for team sports and strategic plays. Look for underdogs with strong team dynamics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Utility functions for astrological influences

function getMoonInfluence(phase: string, sign: string): string {
  const phaseInfluences: Record<string, string> = {
    'New Moon': 'New beginnings and fresh starts. Good for setting new betting strategies.',
    'Waxing Crescent': 'Building energy. Good for gradually increasing bet sizes.',
    'First Quarter': 'Challenges may arise. Be decisive with your betting choices.',
    'Waxing Gibbous': 'Refinement needed. Review and adjust your betting strategies.',
    'Full Moon': 'Peak energy. Expect volatility and potential upsets.',
    'Waning Gibbous': 'Gratitude and sharing. Good for cashing out winnings.',
    'Last Quarter': 'Release and let go. Time to cut losses on underperforming strategies.',
    'Waning Crescent': 'Rest and reflection. Good for reviewing past bets.'
  };

  const signInfluences: Record<string, string> = {
    'Aries': 'Bold, aggressive plays favored.',
    'Taurus': 'Steady, reliable bets preferred.',
    'Gemini': 'Quick changes and adaptability needed.',
    'Cancer': 'Intuition is strong. Trust your gut feelings.',
    'Leo': 'Confidence is high. Go for big plays.',
    'Virgo': 'Attention to detail pays off. Analyze carefully.',
    'Libra': 'Balance is key. Consider both sides carefully.',
    'Scorpio': 'Deep analysis reveals hidden opportunities.',
    'Sagittarius': 'Luck favors the bold. Take calculated risks.',
    'Capricorn': 'Disciplined, strategic approaches work best.',
    'Aquarius': 'Innovative strategies may surprise.',
    'Pisces': 'Intuition is strong. Watch for subtle patterns.'
  };

  return `${phaseInfluences[phase] || ''} ${signInfluences[sign] || ''}`.trim();
}

function getMercuryInfluence(isRetrograde: boolean, sign: string): string {
  if (isRetrograde) {
    return 'Mercury is retrograde in ' + sign + '. Expect miscommunications and unexpected changes. Double-check all information before placing bets.';
  }
  return 'Mercury is direct in ' + sign + '. Clear communication and smooth decision-making. Good for strategic bets.';
}

function getAspectAdvice(aspects: Record<string, string | null>): string {
  const advice: string[] = [];
  
  if (aspects.sunMars === 'square' || aspects.sunMars === 'opposition') {
    advice.push('Tension in play - be cautious with aggressive bets');
  } else if (aspects.sunMars === 'trine' || aspects.sunMars === 'sextile') {
    advice.push('Strong energy for decisive action - good for confident bets');
  }

  if (aspects.sunJupiter === 'trine' || aspects.sunJupiter === 'sextile') {
    advice.push('Luck is favored - good time for higher risk/reward plays');
  }

  if (aspects.sunSaturn === 'square' || aspects.sunSaturn === 'opposition') {
    advice.push('Restrictions possible - be disciplined with bankroll management');
  }

  return advice.length > 0 
    ? advice.join('. ') + '.' 
    : 'No major aspects affecting betting conditions.';
}

function getPlanetaryHourInfluence(planet: string): string {
  const influences: Record<string, string> = {
    'Sun': 'Confidence and vitality are high. Good for bold moves and leadership positions.',
    'Moon': 'Intuition is strong. Trust your gut feelings about games.',
    'Mercury': 'Communication and analysis are favored. Good for research and strategy.',
    'Venus': 'Harmony and value are highlighted. Look for good odds and fair matchups.',
    'Mars': 'Energy and aggression are high. Good for high-stakes, competitive bets.',
    'Jupiter': 'Luck and expansion are favored. Good for parlays and long shots.',
    'Saturn': 'Discipline and structure are key. Focus on bankroll management.'
  };
  return influences[planet] || 'Neutral influence. Proceed with standard strategies.';
}

function getElementalInfluence(elements: { fire: number; earth: number; air: number; water: number }): string {
  const maxElement = Object.entries(elements).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  const influences: Record<string, string> = {
    'fire': 'High energy and action. Favorable for aggressive, high-stakes betting.',
    'earth': 'Practical and stable. Focus on consistent, reliable betting strategies.',
    'air': 'Intellectual and communicative. Good for analytical approaches and live betting.',
    'water': 'Intuitive and emotional. Trust your instincts but beware of biases.'
  };
  
  return influences[maxElement] || 'Balanced elements. No strong directional influence.';
}

function getLunarNodeInfluence(northNode: string, southNode: string): string {
  return `North Node in ${northNode} (karmic direction) and South Node in ${southNode} (karmic past). ` +
         `Focus on embracing ${northNode} energy and releasing ${southNode} tendencies in your betting approach.`;
}

function getSunSignQuality(sign: string): string {
  const qualities: Record<string, string> = {
    'Aries': 'Cardinal Fire',
    'Taurus': 'Fixed Earth',
    'Gemini': 'Mutable Air',
    'Cancer': 'Cardinal Water',
    'Leo': 'Fixed Fire',
    'Virgo': 'Mutable Earth',
    'Libra': 'Cardinal Air',
    'Scorpio': 'Fixed Water',
    'Sagittarius': 'Mutable Fire',
    'Capricorn': 'Cardinal Earth',
    'Aquarius': 'Fixed Air',
    'Pisces': 'Mutable Water'
  };
  return qualities[sign] || '';
}

function getSunSignInfluence(sign: string): string {
  const influences: Record<string, string> = {
    'Aries': 'Bold, direct action is favored. Look for aggressive plays and early leads.',
    'Taurus': 'Steady, reliable strategies work best. Focus on consistent performers.',
    'Gemini': 'Versatility and quick thinking are assets. Good for live betting and in-game adjustments.',
    'Cancer': 'Emotional intelligence is key. Pay attention to home/away dynamics.',
    'Leo': 'Confidence and showmanship shine. Favor favorites and star players.',
    'Virgo': 'Attention to detail pays off. Look for undervalued opportunities.',
    'Libra': 'Balance and fairness are highlighted. Consider both sides carefully.',
    'Scorpio': 'Intensity and transformation. Look for games with high stakes or rivalries.',
    'Sagittarius': 'Optimism and luck are favored. Good for long shots and parlays.',
    'Capricorn': 'Discipline and strategy win. Focus on fundamentals and track records.',
    'Aquarius': 'Unexpected outcomes possible. Look for innovative strategies or underdogs.',
    'Pisces': 'Intuition is strong. Trust your instincts but verify with research.'
  };
  return influences[sign] || '';
}

export default Dashboard;
