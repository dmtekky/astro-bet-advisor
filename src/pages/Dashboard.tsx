import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import GameCard from '@/components/GameCard';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { useTeams } from '@/hooks/useTeams';
import { useAstroData } from '@/hooks/useAstroData';
// Import types from the correct location
import { Sport } from '@/types';
import type { Team } from '@/hooks/useTeams';

const MLB_LEAGUE_KEY = 'mlb';
const DEFAULT_LOGOS: Record<string, string> = {
  soccer: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  basketball: 'https://cdn-icons-png.flaticon.com/512/33/33682.png',
  football: 'https://cdn-icons-png.flaticon.com/512/1/1322.png',
  baseball: 'https://cdn-icons-png.flaticon.com/512/33/33736.png',
  hockey: 'https://cdn-icons-png.flaticon.com/512/33/33618.png',
};

const Dashboard: React.FC = () => {
  // Use the same league as UpcomingGames for demo
  const { teams, teamMap, teamByExternalId, loading: teamsLoading, error: teamsError } = useTeams(MLB_LEAGUE_KEY);
  const { games, loading, error } = useUpcomingGames({ sport: 'baseball_mlb', limit: 6 });

  // Group and limit games by date
  const groupedGames = useMemo(() => groupGamesByDate(games), [games]);

  // Helper to find team info with proper type handling
  const findTeam = (teamId: string) => {
    // First try to find team by ID in teamMap
    if (teamMap[teamId]) {
      const team = teamMap[teamId];
      return {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
        logo_url: team.logo_url,
        city: team.city || '',
        external_id: typeof team.external_id === 'number' ? team.external_id : 0
      };
    }
    
    // Then try to find by external_id (converting string teamId to number for comparison)
    const numericTeamId = Number(teamId);
    const teamByExtId = !isNaN(numericTeamId) ? teamByExternalId[numericTeamId] : undefined;
    
    if (teamByExtId) {
      return {
        id: teamByExtId.id,
        name: teamByExtId.name,
        abbreviation: teamByExtId.abbreviation || teamByExtId.name.substring(0, 3).toUpperCase(),
        logo_url: teamByExtId.logo_url,
        city: teamByExtId.city || '',
        external_id: typeof teamByExtId.external_id === 'number' ? teamByExtId.external_id : 0
      };
    }
    
    // Fallback to a default team
    return {
      id: teamId,
      name: teamId,
      abbreviation: teamId.substring(0, 3).toUpperCase(),
      city: '',
      logo_url: DEFAULT_LOGOS.baseball_mlb,
      external_id: 0
    };
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Welcome to your dashboard! Below are the next upcoming MLB games.</p>
            {error || teamsError ? (
              <div className="text-red-600">{error?.message || teamsError?.message || 'Failed to load games.'}</div>
            ) : loading || teamsLoading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : (
              <div className="space-y-8">
                {groupedGames.slice(0, 2).map(({ date, games: dateGames }) => (
                  <div key={date.toString()} className="space-y-4">
                    <h2 className="text-xl font-semibold mb-2">{formatGameDate(date.toString())}</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {dateGames.map((game) => {
                        const homeTeam = findTeam(game.home_team_id);
                        const awayTeam = findTeam(game.away_team_id);
                        const defaultLogo = DEFAULT_LOGOS.baseball;
                        return (
                          <GameCard 
                            key={game.id}
                            game={game}
                            homeTeam={homeTeam}
                            awayTeam={awayTeam}
                            defaultLogo={defaultLogo}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Astrological Insights & Forecast Section */}
      <section className="container mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Cosmic Sports Forecast</h2>
                <p className="text-sm text-slate-500 mt-1">Daily astrological insights for strategic advantage</p>
              </div>
              <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
                  <span className="font-medium text-slate-700">Last updated: </span>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="p-6">
            <AstroSummarySection />
          </div>
          
          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-right">
            <p className="text-xs text-slate-500">
              Next update at {new Date(new Date().setHours(12, 0, 0, 0)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
              <span className="text-indigo-600 font-medium ml-1">Auto-refreshing</span>
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

// --- Astrological Summary Section ---

interface ZodiacData {
  [key: string]: {
    name: string;
    symbol: string;
    element: string;
  };
}

interface CurrentHour {
  ruler: string;
  influence: string;
  sign: string;
  is_positive: boolean;
}

interface AstroData {
  sun?: {
    sign?: string;
    degree?: number;
  };
  moon?: {
    phase?: string;
    sign?: string;
    degree?: number;
    illumination?: number;
  };
  mercury?: {
    sign?: string;
    degree?: number;
    retrograde?: boolean;
    speed?: number | string;
  };
  current_hour?: CurrentHour;
  lunar_nodes?: {
    north_node?: {
      sign: string;
      degree: number;
      house: number;
    };
    south_node?: {
      sign: string;
      degree: number;
      house: number;
    };
    next_transit?: {
      type: string;
      sign: string;
      date: string;
      description: string;
    };
    karmic_lessons: string[];
  };
  next_event?: {
    name: string;
    date: string;
    description: string;
    intensity: 'low' | 'medium' | 'high';
  };
}

const AstroSummarySection: React.FC = () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const { astroData, loading, error } = useAstroData(dateStr);

  // Zodiac data with type safety
  const zodiacData: ZodiacData = {
    aries: { name: 'Aries', symbol: '♈', element: 'Fire' },
    taurus: { name: 'Taurus', symbol: '♉', element: 'Earth' },
    gemini: { name: 'Gemini', symbol: '♊', element: 'Air' },
    cancer: { name: 'Cancer', symbol: '♋', element: 'Water' },
    leo: { name: 'Leo', symbol: '♌', element: 'Fire' },
    virgo: { name: 'Virgo', symbol: '♍', element: 'Earth' },
    libra: { name: 'Libra', symbol: '♎', element: 'Air' },
    scorpio: { name: 'Scorpio', symbol: '♏', element: 'Water' },
    sagittarius: { name: 'Sagittarius', symbol: '♐', element: 'Fire' },
    capricorn: { name: 'Capricorn', symbol: '♑', element: 'Earth' },
    aquarius: { name: 'Aquarius', symbol: '♒', element: 'Air' },
    pisces: { name: 'Pisces', symbol: '♓', element: 'Water' }
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse flex space-x-4 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 flex-1 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
        <p className="text-sm text-slate-500">Analyzing celestial patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <p className="font-medium">Data Unavailable</p>
        <p className="mt-1">Unable to load astrological data. {error.message}</p>
      </div>
    );
  }

  if (!astroData) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
        No astrological data available for the selected date.
      </div>
    );
  }

  // Safely access data with fallbacks
  const typedAstroData = astroData as AstroData;
  const sunSign = typedAstroData.sun?.sign?.toLowerCase() || '';
  const moonSign = typedAstroData.moon?.sign?.toLowerCase() || '';
  const mercurySign = typedAstroData.mercury?.sign?.toLowerCase() || '';
  const currentHour: CurrentHour = typedAstroData.current_hour || {};
  const lunarNodes = typedAstroData.lunar_nodes || {};
  const nextEvent = typedAstroData.next_event || {};

  // Elements data from live API
  const elements = typedAstroData.elements || { fire: 0, earth: 0, air: 0, water: 0 };
  const total = elements.fire + elements.earth + elements.air + elements.water;

  // Gradient colors for each element
  const gradients = {
    fire: 'from-[#ff512f] via-[#ff9966] to-[#ff512f]', // Red/orange
    earth: 'from-[#a8e063] via-[#56ab2f] to-[#a8e063]', // Green
    air: 'from-[#56ccf2] via-[#2f80ed] to-[#56ccf2]', // Blue
    water: 'from-[#43cea2] via-[#185a9d] to-[#43cea2]' // Aqua/blue
  };

  // Bar segment widths
  const fireWidth = (elements.fire / total) * 100;
  const earthWidth = (elements.earth / total) * 100;
  const airWidth = (elements.air / total) * 100;
  const waterWidth = (elements.water / total) * 100;

  return (
    <div className="space-y-6">
      {/* Elements Bar */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Elemental Balance</h2>
        <div className="w-full h-6 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
          <div
            className={`h-full transition-all duration-700 bg-gradient-to-r ${gradients.fire}`}
            style={{
              width: `${fireWidth}%`,
              borderTopLeftRadius: '9999px',
              borderBottomLeftRadius: '9999px',
              borderTopRightRadius: elements.earth === 0 && elements.air === 0 && elements.water === 0 ? '9999px' : 0,
              borderBottomRightRadius: elements.earth === 0 && elements.air === 0 && elements.water === 0 ? '9999px' : 0
            }}
          />
          <div
            className={`h-full transition-all duration-700 bg-gradient-to-r ${gradients.earth}`}
            style={{
              width: `${earthWidth}%`,
              borderTopLeftRadius: elements.fire === 0 ? '9999px' : 0,
              borderBottomLeftRadius: elements.fire === 0 ? '9999px' : 0,
              borderTopRightRadius: elements.air === 0 && elements.water === 0 ? '9999px' : 0,
              borderBottomRightRadius: elements.air === 0 && elements.water === 0 ? '9999px' : 0
            }}
          />
          <div
            className={`h-full transition-all duration-700 bg-gradient-to-r ${gradients.air}`}
            style={{
              width: `${airWidth}%`,
              borderTopLeftRadius: (elements.fire === 0 && elements.earth === 0) ? '9999px' : 0,
              borderBottomLeftRadius: (elements.fire === 0 && elements.earth === 0) ? '9999px' : 0,
              borderTopRightRadius: elements.water === 0 ? '9999px' : 0,
              borderBottomRightRadius: elements.water === 0 ? '9999px' : 0
            }}
          />
          <div
            className={`h-full transition-all duration-700 bg-gradient-to-r ${gradients.water}`}
            style={{
              width: `${waterWidth}%`,
              borderTopLeftRadius: (elements.fire === 0 && elements.earth === 0 && elements.air === 0) ? '9999px' : 0,
              borderBottomLeftRadius: (elements.fire === 0 && elements.earth === 0 && elements.air === 0) ? '9999px' : 0,
              borderTopRightRadius: '9999px',
              borderBottomRightRadius: '9999px'
            }}
          />
        </div>
        {/* Legend */}
        <div className="flex justify-between mt-2 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-[#ff512f] via-[#ff9966] to-[#ff512f] mr-1" />Fire
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-[#a8e063] via-[#56ab2f] to-[#a8e063] mr-1" />Earth
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-[#56ccf2] via-[#2f80ed] to-[#56ccf2] mr-1" />Air
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-[#43cea2] via-[#185a9d] to-[#43cea2] mr-1" />Water
          </div>
        </div>
      </div>
      {/* Celestial Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sun Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-900">Sun</h3>
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${
              zodiacData[sunSign]?.element === 'Fire' ? 'bg-red-100 text-red-800' :
              zodiacData[sunSign]?.element === 'Earth' ? 'bg-amber-100 text-amber-800' :
              zodiacData[sunSign]?.element === 'Air' ? 'bg-sky-100 text-sky-800' :
              'bg-indigo-100 text-indigo-800'}`}>
              {zodiacData[sunSign]?.element || 'N/A'}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">{zodiacData[sunSign]?.name || 'N/A'}</p>
              <p className="text-sm text-slate-500">{typedAstroData.sun?.degree !== undefined ? typedAstroData.sun.degree.toFixed(1) : 'N/A'}°</p>
            </div>
            <span className="text-3xl">{zodiacData[sunSign]?.symbol || '☀️'}</span>
          </div>
        </div>
        {/* Moon Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-900">Moon</h3>
            <div className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
              {typedAstroData.moon?.phase || 'N/A'}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">{zodiacData[moonSign]?.name || 'N/A'}</p>
              <p className="text-sm text-slate-500">{typedAstroData.moon?.degree !== undefined ? typedAstroData.moon.degree.toFixed(1) : 'N/A'}°</p>
            </div>
            <span className="text-3xl">{zodiacData[moonSign]?.symbol || '🌑'}</span>
          </div>
          {typedAstroData.moon?.illumination !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Illumination</span>
                <span>{Math.round(typedAstroData.moon.illumination * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full" 
                  style={{ width: `${typedAstroData.moon.illumination * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        {/* Mercury Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-900">Mercury</h3>
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${
              typedAstroData.mercury?.retrograde 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-emerald-100 text-emerald-800'}`}>
              {typedAstroData.mercury?.retrograde ? 'Retrograde' : 'Direct'}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">{zodiacData[mercurySign]?.name || 'N/A'}</p>
              <p className="text-sm text-slate-500">{typedAstroData.mercury?.degree !== undefined ? typedAstroData.mercury.degree.toFixed(1) : 'N/A'}°</p>
            </div>
            <span className="text-3xl">☿</span>
          </div>
          {typedAstroData.mercury?.speed !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Speed</span>
                <span>{typeof typedAstroData.mercury.speed === 'number' 
                  ? `${typedAstroData.mercury.speed.toFixed(2)}°/day` 
                  : String(typedAstroData.mercury.speed)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, Math.abs(
                      typeof typedAstroData.mercury.speed === 'number' 
                        ? typedAstroData.mercury.speed 
                        : parseFloat(typedAstroData.mercury.speed) || 0
                    ) * 20)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
        {/* Current Hour Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-900">Current Hour</h3>
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${
              currentHour.is_positive 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-slate-100 text-slate-800'}`}>
              {currentHour.is_positive ? 'Favorable' : 'Neutral'}
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-semibold text-slate-900">Ruled by {currentHour.ruler}</p>
            <p className="text-sm text-slate-500">In {zodiacData[currentHour.sign?.toLowerCase()]?.name || 'Unknown'}</p>
          </div>
          {currentHour.influence && (
            <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-100">
              <p className="text-sm italic text-slate-600">"{currentHour.influence}"</p>
            </div>
          )}
        </div>
      </div>
      {/* Lunar Nodes Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <h4 className="font-semibold mb-3">Lunar Nodes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">North Node (Destiny):</span>
              <span className="text-indigo-700">
                {astroData.lunar_nodes?.north_node?.sign || 'Unknown'} {astroData.lunar_nodes?.north_node?.degree || ''}°
              </span>
            </div>
            {astroData.lunar_nodes?.karmic_lessons?.[0] && (
              <div className="mt-1 text-xs text-gray-600">
                Lesson: {astroData.lunar_nodes.karmic_lessons[0]}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">South Node (Past):</span>
              <span className="text-indigo-700">
                {astroData.lunar_nodes?.south_node?.sign || 'Unknown'} {astroData.lunar_nodes?.south_node?.degree || ''}°
              </span>
            </div>
            {astroData.lunar_nodes?.karmic_lessons?.[1] && (
              <div className="mt-1 text-xs text-gray-600">
                Release: {astroData.lunar_nodes.karmic_lessons[1]}
              </div>
            )}
          </div>
        </div>
        {astroData.lunar_nodes?.next_transit && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-sm">
              <span className="font-medium">Next Transit:</span>{' '}
              <span className="text-indigo-700">
                {astroData.lunar_nodes.next_transit.description} on {astroData.lunar_nodes.next_transit.date}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Celestial Events */}
      {astroData.next_event && (
        <div className="bg-white rounded-xl shadow p-4">
          <h4 className="font-semibold mb-2">Upcoming Celestial Event</h4>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-full">
              {astroData.next_event.type === 'full_moon' ? '🌕' : '🌑'}
            </div>
            <div>
              <div className="font-medium">
                {astroData.next_event.type === 'full_moon' ? 'Full Moon' : 'New Moon'}
              </div>
              <div className="text-sm text-gray-600">
                {astroData.next_event.date} • {astroData.next_event.sign}
              </div>
              {astroData.next_event.influence && (
                <div className="mt-1 text-xs text-gray-500">
                  "{astroData.next_event.influence}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
