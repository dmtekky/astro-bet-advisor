import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUpcomingGames } from '@/hooks/useUpcomingGames';
import GameCard from '@/components/GameCard';
import { groupGamesByDate, formatGameDate } from '@/utils/dateUtils';
import { useTeams } from '@/hooks/useTeams';

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

  // Helper to find team info
  const findTeam = (teamId: string) => {
    if (teamMap[teamId]) return teamMap[teamId];
    const team = Object.values(teamByExternalId).find(t => t.external_id?.toString() === teamId);
    return team || {
      id: teamId,
      external_id: 0,
      name: teamId,
      city: '',
      abbreviation: teamId.substring(0, 3).toUpperCase(),
      logo_url: DEFAULT_LOGOS.baseball,
      wins: 0,
      losses: 0,
      primary_color: '#1E40AF',
      secondary_color: '#3B82F6',
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
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-blue-100 shadow-xl p-6 md:p-10">
          <div className="flex flex-col gap-6 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-1 flex items-center gap-2">
                <span role="img" aria-label="stars">✨</span> Today's Cosmic Sports Forecast
              </h2>
              <p className="text-gray-600 text-sm">Check daily for fresh insights and cosmic guidance</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-indigo-200 text-indigo-900 px-3 py-1 text-xs font-bold">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs text-gray-500">Next update: 12:00 AM</span>
            </div>
          </div>
          <AstroSummarySection />
        </div>
      </section>
    </DashboardLayout>
  );
};

// --- Astrological Summary Section ---
import { useAstroData } from '@/hooks/useAstroData';

const AstroSummarySection: React.FC = () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  const { astroData, loading, error } = useAstroData(dateStr);

  if (loading) return <div className="py-12 text-center text-indigo-700 animate-pulse">Loading today's cosmic forecast...</div>;
  if (error || !astroData) return <div className="text-red-600">Failed to load astrological data.</div>;

  // Helper for intensity colors
  const intensityColor = (intensity: string) => {
    if (intensity === 'high') return 'text-red-600 font-bold';
    if (intensity === 'medium') return 'text-yellow-600 font-semibold';
    return 'text-green-700 font-medium';
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Row: Sun, Moon, Mercury, Hour */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white shadow p-4 flex flex-col items-center">
          <span className="text-3xl mb-1">{astroData.sun.icon}</span>
          <span className="font-bold text-indigo-800">Sun</span>
          <span className="text-sm text-gray-700">{astroData.sun.sign}</span>
        </div>
        <div className="rounded-xl bg-white shadow p-4 flex flex-col items-center">
          <span className="text-3xl mb-1">{astroData.moon.icon}</span>
          <span className="font-bold text-indigo-800">Moon</span>
          <span className="text-sm text-gray-700">{astroData.moon.phase} in {astroData.moon.sign}</span>
        </div>
        <div className="rounded-xl bg-white shadow p-4 flex flex-col items-center">
          <span className="text-2xl mb-1">☿</span>
          <span className="font-bold text-indigo-800">Mercury</span>
          <span className="text-sm text-gray-700">{astroData.mercury.sign} <span className={astroData.mercury.retrograde ? 'text-red-500 font-bold' : 'text-green-700 font-semibold'}>{astroData.mercury.retrograde ? 'Retrograde' : 'Direct'}</span></span>
        </div>
        <div className="rounded-xl bg-white shadow p-4 flex flex-col items-center">
          <span className="text-2xl mb-1">🕑</span>
          <span className="font-bold text-indigo-800">Planetary Hour</span>
          <span className="text-sm text-gray-700">{astroData.currentHour.ruler}: <span className="font-semibold text-indigo-700">{astroData.currentHour.influence}</span></span>
        </div>
      </div>
      {/* Elemental Balance & Key Aspects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">Elemental Balance <span className="text-xs text-gray-400">(Today's Energy Mix)</span></h4>
          <div className="flex gap-4 text-lg">
            <span className="flex items-center gap-1">🔥 <span className="font-bold text-orange-600">{astroData.elements.fire}</span></span>
            <span className="flex items-center gap-1">🌱 <span className="font-bold text-green-700">{astroData.elements.earth}</span></span>
            <span className="flex items-center gap-1">💨 <span className="font-bold text-blue-500">{astroData.elements.air}</span></span>
            <span className="flex items-center gap-1">💧 <span className="font-bold text-cyan-600">{astroData.elements.water}</span></span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">Key Aspects <span className="text-xs text-gray-400">(Game-Changing Alignments)</span></h4>
          <div className="flex flex-wrap gap-4 text-base">
            <span>☉♂ <span className="font-semibold">Sun-Mars:</span> {astroData.aspects.sunMars || '—'}</span>
            <span>☉♄ <span className="font-semibold">Sun-Saturn:</span> {astroData.aspects.sunSaturn || '—'}</span>
            <span>☉♃ <span className="font-semibold">Sun-Jupiter:</span> {astroData.aspects.sunJupiter || '—'}</span>
          </div>
        </div>
      </div>
      {/* Lunar Nodes & Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-indigo-900">
            <span>🌑🌕</span> Lunar Nodes 
            <span className="text-xs font-normal text-indigo-500">(Karmic Axis)</span>
          </h4>
          
          <div className="space-y-3">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-indigo-800">
                  North Node (Rahu) <span className="text-indigo-600">☊</span>
                </span>
                <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {astroData.lunarNodes.northNode.sign} {astroData.lunarNodes.northNode.degree}°
                </span>
              </div>
              <p className="text-xs text-indigo-700">
                Karmic direction, growth, destiny
              </p>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-indigo-800">
                  South Node (Ketu) <span className="text-indigo-600">☋</span>
                </span>
                <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {astroData.lunarNodes.southNode.sign} {astroData.lunarNodes.southNode.degree}°
                </span>
              </div>
              <p className="text-xs text-indigo-700">
                Past life, release, comfort zone
              </p>
            </div>
            
            {astroData.lunarNodes.nextTransitDate && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="font-medium text-amber-800 text-sm">
                  Upcoming Node Transit
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  <span className="font-medium">
                    {astroData.lunarNodes.nextTransitType === 'north' ? '☊ North' : '☋ South'} Node enters {astroData.lunarNodes.nextTransitSign}
                  </span>
                  <div className="text-amber-600 mt-1">
                    {new Date(astroData.lunarNodes.nextTransitDate).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">Celestial Events <span className="text-xs text-gray-400">(Today's Highlights)</span></h4>
          {astroData.celestialEvents.length === 0 ? (
            <div className="text-gray-500">No major events today.</div>
          ) : (
            <ul className="space-y-1">
              {astroData.celestialEvents.map((event, idx) => (
                <li key={idx} className="flex gap-2 items-center">
                  <span className={intensityColor(event.intensity)}>
                    ●
                  </span>
                  <span className="font-semibold">{event.name}:</span>
                  <span className="text-gray-700">{event.description}</span>
                </li>
              ))}
            </ul>
          )}
          {astroData.next_event && (
            <div className="mt-2 text-xs text-blue-700 font-medium">Upcoming: {astroData.next_event.name} ({astroData.next_event.intensity}) on {new Date(astroData.next_event.date as string).toLocaleDateString()}</div>
          )}
        </div>
      </div>
      {/* Astrological Outlook */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-200 via-indigo-100 to-blue-100 shadow p-6 mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-bold text-lg md:text-xl mb-1 flex items-center gap-2">Today's Sports Outlook <span className="text-indigo-700">({now.toLocaleDateString()})</span></h4>
          <AstroSportsSummary astroData={astroData} date={now} />
        </div>
        <div className="flex flex-col items-end justify-center">
          <span className="text-xs text-gray-500">Tip: Check back every day for new cosmic trends!</span>
          <span className="text-xs text-indigo-600 mt-1 animate-bounce">🌙 Next update at {new Date(now.getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};

// --- Astrological Sports Summary ---
import { calculateAstrologicalImpact } from '@/lib/astroFormula';
import { useState, useEffect } from 'react';

type AstroSportsSummaryProps = { astroData: any; date: Date };
const AstroSportsSummary: React.FC<AstroSportsSummaryProps> = ({ astroData, date }) => {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    async function calc() {
      // For dashboard, just use empty player stats for a global outlook
      const dateStr = date.toISOString().split('T')[0];
      const result = await calculateAstrologicalImpact([], astroData, dateStr);
      setScore(result);
    }
    calc();
  }, [astroData, date]);

  if (score === null) return <div className="text-indigo-700 animate-pulse">Calculating today's outlook...</div>;
  let outlook = 'Neutral';
  let outlookColor = 'text-gray-700';
  let emoji = '⚖️';
  if (score > 70) { outlook = 'Highly Favorable'; outlookColor = 'text-green-600 font-bold'; emoji = '🌟'; }
  else if (score > 55) { outlook = 'Favorable'; outlookColor = 'text-green-500 font-semibold'; emoji = '👍'; }
  else if (score < 45) { outlook = 'Challenging'; outlookColor = 'text-yellow-600 font-semibold'; emoji = '⚠️'; }
  else if (score < 30) { outlook = 'Very Challenging'; outlookColor = 'text-red-600 font-bold'; emoji = '⛈️'; }

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-2 text-xl md:text-2xl ${outlookColor}`}>
        <span>{emoji}</span>
        <span>{outlook}</span>
      </div>
      <div className="text-gray-700 text-base">Astrological impact score: <span className="font-semibold">{score}</span> / 100</div>
      <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
        <li>High scores suggest favorable cosmic conditions for bold bets and upsets.</li>
        <li>Low scores indicate caution—expect unpredictable or defensive outcomes.</li>
        <li>Astrological trends update every day. Come back for tomorrow's forecast!</li>
      </ul>
    </div>
  );
};

export default Dashboard;
