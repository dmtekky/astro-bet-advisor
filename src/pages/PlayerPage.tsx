import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Info, BarChart2, Activity, Star, Clock, Award } from 'lucide-react';
import { getZodiacSign, getZodiacIcon } from '@/lib/astroCalc';
import { calculateAIS } from '@/lib/formula';

// Types
import type { Player, Sport } from '@/types';
import type { AISResult, Ephemeris } from '@/lib/formula';

interface PlayerAIS extends AISResult {
  dominant_house?: string;
  key_attributes?: string[];
  forecast?: string;
}

interface PlayerWithStats extends Omit<Player, 'sport' | 'position'> {
  height?: string;
  weight?: string;
  position?: string | string[];
  number?: number;
  sport: Sport;
  stats?: {
    points: number;
    rebounds: string;
    assists: string;
    steals: string;
    blocks: string;
    fgPercentage: string;
    threePointPercentage: string;
    ftPercentage: string;
  };
}

import { Tooltip } from 'react-tooltip';
import { calculateAstrologicalInfluence } from '@/lib/astroCalc';

// Convert astrological influence data to UI format
function formatAstroInfluences(influences: any) {
  const impacts = [];
  
  // Add zodiac sign influence
  if (influences.zodiacSign) {
    impacts.push({
      name: `Sun in ${influences.zodiacSign}`,
      impact: Math.round((influences.aspects?.sunMoon || 0.5) * 20) - 10, // Convert 0-1 to -10 to 10
      description: `Sun sign influence on performance`
    });
  }

  // Add moon phase influence
  if (influences.moonPhase !== undefined) {
    const moonImpact = Math.round((influences.moonPhase - 0.5) * 20); // Convert 0-1 to -10 to 10
    impacts.push({
      name: 'Moon Phase',
      impact: moonImpact,
      description: `Current lunar phase influence (${(influences.moonPhase * 100).toFixed(0)}% full)`
    });
  }

  // Add Mercury retrograde if applicable
  if (influences.mercuryRetrograde) {
    impacts.push({
      name: 'Mercury Retrograde',
      impact: -5, // Fixed negative impact
      description: 'Mercury is retrograde, may affect communication and coordination'
    });
  }

  // Add aspects
  if (influences.aspects) {
    Object.entries(influences.aspects).forEach(([aspect, value]) => {
      if (typeof value === 'number') {
        const aspectImpact = Math.round((value - 0.5) * 10); // Convert 0-1 to -5 to 5
        if (Math.abs(aspectImpact) > 1) { // Only include significant aspects
          impacts.push({
            name: aspect.split(/(?=[A-Z])/).join(' '),
            impact: aspectImpact,
            description: `Aspect influence on performance`
          });
        }
      }
    });
  }

  return impacts;
}

function getTopImpact(impacts: any[]) {
  if (!impacts.length) return { name: 'No Data', impact: 0, description: 'No astrological data available' };
  return impacts.reduce((max, curr) => (Math.abs(curr.impact) > Math.abs(max.impact) ? curr : max), impacts[0]);
}

function getSortedImpacts(impacts: any[]) {
  return [...impacts].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

const PlayerPage: React.FC = () => {
  const { playerId, teamId } = useParams<{ playerId: string; teamId: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerWithStats | null>(null);
  const [ephemeris, setEphemeris] = useState<Ephemeris | null>(null);
  const [ais, setAIS] = useState<PlayerAIS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState<Record<string, string | number> | null>(null);

  // Astrological insights
  const [astrologicalData, setAstrologicalData] = useState<any>(null);
  const [loadingAstro, setLoadingAstro] = useState(true);
  const [astroError, setAstroError] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;

    const fetchAstroData = async () => {
      try {
        setLoadingAstro(true);
        const result = await calculateAstrologicalInfluence(player);
        setAstrologicalData(result);
      } catch (err) {
        console.error('Error calculating astrological data:', err);
        setAstroError('Failed to load astrological data');
      } finally {
        setLoadingAstro(false);
      }
    };

    fetchAstroData();
  }, [player]);

  // Format the astrological data for display
  const astroImpacts = astrologicalData ? formatAstroInfluences(astrologicalData.influences) : [];
  const topImpact = getTopImpact(astroImpacts);
  const sortedImpacts = getSortedImpacts(astroImpacts);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch player data from Supabase
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId)
          .single();
        if (playerError) throw playerError;
        
        // Transform player data to match expected format
        const formattedPlayer = {
          ...player,
          sport: player.sport as Sport, // Type assertion for Sport enum
          stats: player.stats && typeof player.stats === 'object' 
            ? {
                points: (player.stats as any).points || 0,
                rebounds: (player.stats as any).rebounds || '0',
                assists: (player.stats as any).assists || '0',
                steals: (player.stats as any).steals || '0',
                blocks: (player.stats as any).blocks || '0',
                fgPercentage: (player.stats as any).fgPercentage || '0%',
                threePointPercentage: (player.stats as any).threePointPercentage || '0%',
                ftPercentage: (player.stats as any).ftPercentage || '0%'
              }
            : {
                points: 0,
                rebounds: '0',
                assists: '0',
                steals: '0',
                blocks: '0',
                fgPercentage: '0%',
                threePointPercentage: '0%',
                ftPercentage: '0%'
              }
        } as PlayerWithStats;
        
        setPlayer(formattedPlayer);

        // Fetch team data for this player
        if (player && player.team_id) {
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', player.team_id)
            .single();
          if (teamError) throw teamError;
          setTeam(team);
        }
        
        // Fetch player stats (mock data for now)
        setStats({
          points: Math.floor(Math.random() * 30) + 10,
          rebounds: (Math.random() * 12).toFixed(1),
          assists: (Math.random() * 10).toFixed(1),
          steals: (Math.random() * 3).toFixed(1),
          blocks: (Math.random() * 2.5).toFixed(1),
          fgPercentage: (Math.random() * 30 + 40).toFixed(1) + '%',
          threePointPercentage: (Math.random() * 20 + 30).toFixed(1) + '%',
          ftPercentage: (Math.random() * 20 + 70).toFixed(1) + '%',
        });
        
        // Mock ephemeris data
        const mockEphemeris: Ephemeris = {
          id: 'mock-ephemeris',
          date: new Date().toISOString().slice(0, 10),
          moon_phase: Math.random(),
          moon_sign: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][Math.floor(Math.random() * 12)],
          sun_sign: 'Leo',
          mercury_sign: 'Virgo',
          venus_sign: 'Libra',
          mars_sign: 'Scorpio',
          jupiter_sign: 'Sagittarius',
          saturn_sign: 'Capricorn',
          mercury_retrograde: Math.random() > 0.8,
          sun_mars_aspect: Math.random(),
          sun_saturn_aspect: Math.random(),
          sun_jupiter_aspect: Math.random(),
        };
        
        setEphemeris(mockEphemeris);
        
        // Calculate AIS using the formula
        if (formattedPlayer) {
          const aisResult = await calculateAIS(formattedPlayer, mockEphemeris);
          
          // Enhance the AIS result with additional UI-specific data
          const enhancedAIS: PlayerAIS = {
            ...aisResult,
            dominant_house: ['first', 'second', 'fifth', 'tenth'][Math.floor(Math.random() * 4)],
            key_attributes: ['creativity', 'energy', 'focus', 'luck'].slice(0, Math.floor(Math.random() * 3) + 1),
            forecast: generateAstroForecast(aisResult, formattedPlayer.name)
          };
          
          setAIS(enhancedAIS);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Error fetching player data:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [playerId, teamId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Skeleton className="h-12 w-1/3 mb-4" />
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-8 w-1/2 mb-2" />
        </div>
      </div>
    );
  }

  // --- Simplified Astrological Insight at the Top ---
  const insightSection = loadingAstro ? (
    <div className="bg-gradient-to-r from-indigo-900 to-black text-white p-4 rounded-lg mb-6 flex items-center gap-2">
      <Skeleton className="h-6 w-48" />
    </div>
  ) : astroError ? (
    <div className="bg-red-900/50 text-white p-4 rounded-lg mb-6">
      {astroError}
    </div>
  ) : (
    <div className="bg-gradient-to-r from-indigo-900 to-black text-white p-4 rounded-lg mb-6 flex items-center gap-2">
      <span 
        className="font-semibold text-lg" 
        data-tooltip-id="top-impact-tip" 
        data-tooltip-content={topImpact.description}
      >
        {topImpact.name}: {topImpact.impact > 0 ? "+" : ""}{topImpact.impact}%
      </span>
      <Tooltip id="top-impact-tip" />
    </div>
  );

  if (!player) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Player not found</h1>
          <p className="text-gray-400 mb-6">The player you're looking for doesn't exist or has been moved.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const zodiacSign = player.birth_date ? getZodiacSign(new Date(player.birth_date)) : 'Unknown';
  const zodiacIcon = getZodiacIcon(zodiacSign);
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {insightSection}
      
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/team/${teamId}`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Team
      </Button>
      
      {/* Player Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-5xl">
            {zodiacIcon || '🏀'}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{player.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className="text-base py-1 px-3">
                    {player.position || 'N/A'}
                  </Badge>
                  {team && (
                    <Link 
                      to={`/team/${team.id}`}
                      className="text-yellow-400 hover:underline flex items-center"
                    >
                      {team.name}
                    </Link>
                  )}
                </div>
              </div>
              
              {/* AIS Score */}
              {ais && (
                <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Astrological Impact Score</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {(ais.score * 100).toFixed(0)}<span className="text-lg text-gray-400">/100</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Player Details */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Birthday</div>
                  <div>{player.birth_date || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 flex items-center justify-center text-gray-400">
                  {zodiacIcon}
                </div>
                <div>
                  <div className="text-sm text-gray-400">Zodiac</div>
                  <div>{zodiacSign}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Height</div>
                  <div>{player.height || '6\'7"'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Weight</div>
                  <div>{player.weight || '220 lbs'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats and Astrology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Player Stats */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Season Averages
              </CardTitle>
              <CardDescription>Current season statistics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Points" value={stats.points} icon={<Activity className="h-4 w-4" />} />
                  <StatCard label="Rebounds" value={stats.rebounds} icon={<BarChart2 className="h-4 w-4" />} />
                  <StatCard label="Assists" value={stats.assists} icon={<Award className="h-4 w-4" />} />
                  <StatCard label="Steals" value={stats.steals} icon="🏃" />
                  <StatCard label="Blocks" value={stats.blocks} icon="✋" />
                  <StatCard label="FG%" value={stats.fgPercentage} icon="🏀" />
                  <StatCard label="3P%" value={stats.threePointPercentage} icon="🎯" />
                  <StatCard label="FT%" value={stats.ftPercentage} icon="🏀" />
                </div>
              ) : (
                <p className="text-gray-500">No statistics available for this player.</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Astrology Impact */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Astrological Impact
              </CardTitle>
              <CardDescription>How the stars align for {player.name?.split(' ')[0]} today</CardDescription>
            </CardHeader>
            <CardContent>
              {ais ? (
                <div className="space-y-4">
                  <div className="bg-gray-900 p-4 rounded-lg border border-yellow-900/30">
                    <div className="text-sm text-yellow-400 mb-2">Overall Impact</div>
                    <div className="flex items-end gap-2">
                      <div className="text-4xl font-bold">
                        {(ais.score * 100).toFixed(0)}
                      </div>
                      <div className="text-gray-400 mb-1">/100</div>
                    </div>
                    <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                        style={{ width: `${ais.score * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Key Influences</h4>
                    <div className="space-y-2">
                      {Object.entries(ais.factors).map(([factor, value]) => (
                        <div key={factor} className="flex items-center justify-between">
                          <span className="text-sm text-gray-400 capitalize">{factor.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="border-yellow-800 text-yellow-400">
                            {String(value)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-gray-800">
                    <h4 className="font-medium mb-2">Today's Forecast</h4>
                    <p className="text-sm text-gray-400">
                      {generateAstroForecast(ais, player.name?.split(' ')[0] || 'This player')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  No astrological data available for today.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Additional Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Recent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-400">
              Recent game logs and performance trends will be displayed here.
            </div>
          </CardContent>
        </Card>
        
        {/* Betting Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Betting Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-400">
              Personalized betting recommendations and insights based on astrological data.
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Astrological Insights */}
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 mb-8">
        <h3 className="font-medium mb-2">Detailed Astrological Insights</h3>
        {loadingAstro ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : astroError ? (
          <div className="text-red-400">{astroError}</div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {sortedImpacts.length > 0 ? (
                sortedImpacts.map((impact) => (
                  <div key={impact.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{impact.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`${impact.impact > 0 ? 'border-green-800 text-green-400' : 'border-red-800 text-red-400'}`}
                    >
                      {impact.impact > 0 ? "+" : ""}{impact.impact}%
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm">No astrological data available</div>
              )}
            </div>
            

          </>
        )}
      </div>
    </div>
  );
};

// Helper component for stat cards
function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-gray-900">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {typeof icon === 'string' ? (
          <span>{icon}</span>
        ) : (
          icon
        )}
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

// Helper function to generate astrological forecast
function generateAstroForecast(ais: AISResult, playerName: string): string {
  if (!ais) return '';
  
  const { score, factors } = ais;
  const positiveTraits = ['strong', 'favorable', 'excellent', 'powerful', 'exceptional'];
  const negativeTraits = ['challenging', 'difficult', 'testing', 'demanding', 'tough'];
  const neutralTraits = ['balanced', 'neutral', 'moderate', 'mixed', 'variable'];
  
  const getTrait = (value: number, traits: string[]): string => {
    return traits[Math.floor(value * traits.length) % traits.length];
  };
  
  let forecast = `${playerName}'s astrological forecast shows `;
  
  // Calculate derived metrics for the forecast
  const zodiacCompatibility = factors.moon_sign;
  const planetaryAlignment = (factors.sun_mars_aspect + factors.sun_jupiter_aspect) / 2;
  const retrogradeImpact = factors.mercury_retrograde < 1 ? 0.2 : 0.8; // Lower is worse during retrograde
  
  if (score > 0.7) {
    forecast += `an overall ${getTrait(score, positiveTraits)} alignment. `;
    forecast += `The stars indicate strong performance potential with ${getTrait(zodiacCompatibility, positiveTraits)} cosmic support. `;
  } else if (score < 0.4) {
    forecast += `a ${getTrait(1 - score, negativeTraits)} astrological period. `;
    forecast += `The celestial configuration suggests some challenges ahead with ${getTrait(1 - zodiacCompatibility, negativeTraits)} aspects. `;
  } else {
    forecast += `a ${getTrait(score, neutralTraits)} astrological outlook. `;
    forecast += `The planetary alignment shows a mix of ${getTrait(planetaryAlignment, neutralTraits)} influences. `;
  }
  
  // Add specific astrological insights
  if (factors.mercury_retrograde < 1) {
    forecast += 'Be aware of potential communication issues due to Mercury retrograde. ';
  }
  
  if (factors.sun_mars_aspect > 0.7) {
    forecast += 'Strong Mars influence suggests high energy and competitive drive. ';
  } else if (factors.sun_mars_aspect < 0.3) {
    forecast += 'Reduced Mars influence may affect energy levels - focus on strategy over raw power. ';
  }
  
  if (factors.sun_jupiter_aspect > 0.7) {
    forecast += 'Favorable Jupiter aspects indicate good luck and expansion opportunities. ';
  }
  
  if (factors.sun_saturn_aspect < 0.3) {
    forecast += 'Challenging Saturn aspects suggest the need for discipline and hard work. ';
  }
  
  // Add moon phase insights
  if (factors.moon_phase > 0.7) {
    forecast += 'The full moon enhances emotional intensity and performance under pressure. ';
  } else if (factors.moon_phase < 0.3) {
    forecast += 'The new moon phase suggests a time for setting new intentions and strategies. ';
  }
  
  return forecast.trim();
}

export default PlayerPage;
