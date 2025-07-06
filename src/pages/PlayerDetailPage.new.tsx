import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card.js';
import { calculatePlanetaryPositions, BirthData } from '../lib/astroCalculations.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { Badge } from '@/components/ui/badge.js';
import { AspectType, CelestialBody, ElementalBalance, ModalBalance } from '@/types/astrology.js';
import { BarChart, RadarChart, LineChart, PieChart } from 'recharts';

// Types
interface Player {
  id: string;
  player_id?: string;
  player_first_name?: string;
  player_last_name?: string;
  player_full_name?: string;
  player_primary_position?: string;
  player_jersey_number?: string | number;
  player_birth_date?: string;
  player_birth_city?: string;
  player_birth_state?: string;
  player_birth_country?: string;
  player_height?: number;
  player_weight?: number;
  player_official_image_src?: string;
  player_current_team_id?: string;
  player_current_team_abbreviation?: string;
  stats_batting_hits?: number;
  stats_batting_runs?: number;
  stats_fielding_assists?: number;
  stats_batting_details?: any;
  stats_fielding_details?: any;
  stats_pitching_details?: any;
  [key: string]: any;
}

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo_url?: string;
  city: string;
  primary_color?: string;
  secondary_color?: string;
}

interface AstroChartData {
  date: string;
  planets: Record<string, CelestialBody>;
  moonPhase: {
    name: string;
    value: number;
    illumination: number;
  };
  houses: Record<string, {
    sign: string;
    degree: number;
  }>;
  signs: Record<string, {
    name: string;
    element: string;
    modality: string;
    symbol: string;
  }>;
  aspects: Array<{
    bodies: [string, string];
    type: AspectType;
    orb: number;
    aspect: string;
    influence: string;
  }>;
  elements: ElementalBalance;
  modalities: ModalBalance;
  sunSign: string;
  moonSign: string;
  ascendant: string;
  dominantPlanets: Array<{
    planet: string;
    score: number;
    interpretation: string;
    type: string;
    influence: string;
    interpretation?: string;
  }>;
  astroWeather: string;
}

// Helper functions
const formatBirthDate = (date: string | undefined): string => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getPositionLabel = (position: string | undefined): string => {
  if (!position) return 'Unknown';
  
  const positionMap: Record<string, string> = {
    'P': 'Pitcher',
    'C': 'Catcher',
    '1B': 'First Baseman',
    '2B': 'Second Baseman',
    '3B': 'Third Baseman',
    'SS': 'Shortstop',
    'LF': 'Left Fielder',
    'CF': 'Center Fielder',
    'RF': 'Right Fielder',
    'DH': 'Designated Hitter',
    'OF': 'Outfielder',
    'IF': 'Infielder',
    'UT': 'Utility Player'
  };
  
  return positionMap[position] || position;
};

const getSignColor = (sign: string): string => {
  const colors: Record<string, string> = {
    'Aries': '#FF4136',
    'Taurus': '#2ECC40',
    'Gemini': '#FFDC00',
    'Cancer': '#B10DC9',
    'Leo': '#FF851B',
    'Virgo': '#7FDBFF',
    'Libra': '#F012BE',
    'Scorpio': '#111111',
    'Sagittarius': '#0074D9',
    'Capricorn': '#85144b',
    'Aquarius': '#39CCCC',
    'Pisces': '#01FF70',
    'Unknown': '#AAAAAA'
  };
  
  return colors[sign] || colors['Unknown'];
};

// Main component
const PlayerDetailPage: React.FC = () => {
  const { playerId, teamId } = useParams<{ playerId: string; teamId: string }>();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [astroData, setAstroData] = useState<AstroChartData | null>(null);
  const [loadingAstroData, setLoadingAstroData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Fetch player data
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) {
        console.error('No playerId provided');
        setError('Player ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching player with ID:', playerId);
        
        // Handle case where ID might have 'player_' prefix
        let queryId = playerId;
        if (playerId && playerId.toString().startsWith('player_')) {
          queryId = playerId.toString().replace('player_', '');
        }
        
        // Define type for query result
        type PlayerQueryResult = {
          data: Player[] | null;
          error: any;
        };
        
        // First try with player_id field
        let playerQuery: PlayerQueryResult = await supabase
          .from('baseball_players')
          .select('*')
          .eq('player_id', queryId) as unknown as PlayerQueryResult;
          
        // If no results, try with id field
        if (!playerQuery.data || playerQuery.data.length === 0) {
          playerQuery = await supabase
            .from('baseball_players')
            .select('*')
            .eq('id', queryId) as unknown as PlayerQueryResult;
        }
        
        if (playerQuery.error) {
          console.error('Error fetching player:', playerQuery.error);
          setError(`Failed to load player: ${playerQuery.error.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
        
        const playerData = playerQuery.data && playerQuery.data.length > 0 ? playerQuery.data[0] : null;
        
        if (!playerData) {
          setError(`Player with ID ${queryId} not found`);
          setLoading(false);
          return;
        }
        
        setPlayer(playerData);
        
        // Fetch team data if we have a team ID
        if (teamId) {
          const teamQuery = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();
            
          if (teamQuery.data) {
            setTeam(teamQuery.data);
          }
        }
        
      } catch (err: any) {
        console.error('Error in fetchPlayerData:', err);
        setError(`Failed to load player: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId, teamId]);

  // Fetch astrological data
  useEffect(() => {
    if (player && player.player_birth_date) {
      setLoadingAstroData(true);
      
      const fetchAstroData = async () => {
        try {
          if (!player.player_birth_date) {
          setLoadingAstroData(false);
          setError("Player birth date is missing.");
          return;
        }
        const birthDate = new Date(player.player_birth_date);
          const year = birthDate.getFullYear();
          const month = birthDate.getMonth() + 1;
          const day = birthDate.getDate();
          const hour = 12;
          const minute = 0;

          // These values should ideally come from the player's data or a geocoding service.
          // For now, using placeholders. You might need to implement a way to get these.
          const latitude = 34.0522; // Example: Los Angeles latitude
          const longitude = -118.2437; // Example: Los Angeles longitude
          const timezoneOffset = -420; // Example: PST (UTC-7) in minutes

          const birthData: BirthData = {
            year,
            month,
            day,
            hour,
            minute,
            latitude,
            longitude,
            timezoneOffset,
          };

          const result = await calculatePlanetaryPositions(birthData);
          setAstroData(result);
        } catch (err) {
          console.error("Error calculating astrological data:", err);
          setError("Failed to calculate astrological data.");
        } finally {
          setLoadingAstroData(false);
        }
      };

      fetchAstroData();
    }
  }, [player]);

  // Render player header
  const renderPlayerHeader = () => {
    if (!player) return null;
    
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-32 h-32 overflow-hidden rounded-full border-4 border-gray-200">
            {player.player_official_image_src ? (
              <img 
                src={player.player_official_image_src} 
                alt={player.player_full_name || `${player.player_first_name} ${player.player_last_name}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {player.player_full_name || `${player.player_first_name || ''} ${player.player_last_name || ''}`}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {player.player_primary_position && (
                    <Badge variant="outline" className="text-sm">
                      {getPositionLabel(player.player_primary_position)}
                    </Badge>
                  )}
                  {player.player_jersey_number && (
                    <Badge variant="outline" className="text-sm">
                      #{player.player_jersey_number}
                    </Badge>
                  )}
                  {team && (
                    <Badge 
                      className="text-sm" 
                      style={{ 
                        backgroundColor: team.primary_color || '#1e40af',
                        color: '#ffffff'
                      }}
                    >
                      {team.name || team.abbreviation}
                    </Badge>
                  )}
                  {astroData && (
                    <Badge 
                      className="text-sm" 
                      style={{ 
                        backgroundColor: getSignColor(astroData.sunSign),
                        color: '#ffffff'
                      }}
                    >
                      {astroData.sunSign}
                    </Badge>
                  )}
                </div>
              </div>
              
              {team && (
                <div className="mt-4 md:mt-0">
                  <Link 
                    to={`/teams/${team.id}`}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-8 h-8" />
                    ) : null}
                    {team.name || team.abbreviation}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-lg">Loading player details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
              <Link to="/" className="text-red-700 font-medium underline mt-2 inline-block">Return to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Return page content
  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="mb-4">
        <Link to={`/teams/${teamId}`} className="text-blue-600 hover:underline flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Team
        </Link>
      </div>
      
      {player && renderPlayerHeader()}
      
      <Tabs defaultValue="overview" className="mt-8">
        <div className="flex flex-col space-y-4">
          <TabsList className="grid grid-cols-4 md:w-auto w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="astro">Astrology</TabsTrigger>
            <TabsTrigger value="analysis">Impact Analysis</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Player Summary</CardTitle>
                    <CardDescription>Key information about {player?.player_first_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Full Name</span>
                        <span className="font-medium">{player?.player_full_name || `${player?.player_first_name || ''} ${player?.player_last_name || ''}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Position</span>
                        <span className="font-medium">{player?.player_primary_position ? getPositionLabel(player.player_primary_position) : 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jersey Number</span>
                        <span className="font-medium">#{player?.player_jersey_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Date</span>
                        <span className="font-medium">{player?.player_birth_date ? formatBirthDate(player.player_birth_date) : 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birth Place</span>
                        <span className="font-medium">
                          {player?.player_birth_city ? [
                            player.player_birth_city,
                            player.player_birth_state,
                            player.player_birth_country
                          ].filter(Boolean).join(', ') : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Height</span>
                        <span className="font-medium">{player?.player_height ? `${Math.floor(player.player_height / 12)}'${player.player_height % 12}"` : 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight</span>
                        <span className="font-medium">{player?.player_weight ? `${player.player_weight} lbs` : 'Unknown'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Information</CardTitle>
                    <CardDescription>Current team details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {team ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          {team.logo_url && (
                            <div className="w-16 h-16 overflow-hidden rounded-full border border-gray-200 flex items-center justify-center">
                              <img src={team.logo_url} alt={team.name} className="max-w-full max-h-full" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-lg">{team.name}</h3>
                            <p className="text-gray-600">{team.city}</p>
                          </div>
                        </div>
                        <div className="pt-4">
                          <Link to={`/teams/${team.id}`} className="text-blue-600 hover:underline flex items-center gap-2">
                            View Team Page
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No team information available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Astrological Profile Overview */}
              {astroData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Astrological Profile</CardTitle>
                    <CardDescription>Overview of {player?.player_first_name}'s astrological influences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Sun Sign</h3>
                        <div 
                          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold" 
                          style={{ backgroundColor: getSignColor(astroData.sunSign) }}
                        >
                          {astroData.sunSign.charAt(0)}
                        </div>
                        <p className="mt-2 font-medium">{astroData.sunSign}</p>
                        <p className="text-sm text-gray-600">Core identity</p>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Moon Sign</h3>
                        <div 
                          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold" 
                          style={{ backgroundColor: getSignColor(astroData.moonSign) }}
                        >
                          {astroData.moonSign.charAt(0)}
                        </div>
                        <p className="mt-2 font-medium">{astroData.moonSign}</p>
                        <p className="text-sm text-gray-600">Emotional nature</p>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Ascendant</h3>
                        <div 
                          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold" 
                          style={{ backgroundColor: getSignColor(astroData.ascendant) }}
                        >
                          {astroData.ascendant.charAt(0)}
                        </div>
                        <p className="mt-2 font-medium">{astroData.ascendant}</p>
                        <p className="text-sm text-gray-600">Outward persona</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Current Astro Weather</h3>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: 
                        astroData.astroWeather === 'Favorable' ? '#dcfce7' : 
                        astroData.astroWeather === 'Challenging' ? '#fee2e2' : '#f5f5f4'
                      }}>
                        <p className="font-medium">{astroData.astroWeather}</p>
                        <p className="text-sm mt-1">
                          {astroData.astroWeather === 'Favorable' ? 
                            `Cosmic conditions are currently supporting ${player?.player_first_name}'s performance.` : 
                            astroData.astroWeather === 'Challenging' ? 
                            `${player?.player_first_name} may face some cosmic challenges in upcoming games.` :
                            `Neutral cosmic conditions for ${player?.player_first_name}'s performance.`
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          
            {/* Statistics Tab */}
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Player Statistics</CardTitle>
                  <CardDescription>Detailed performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Statistics content will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Astrology Tab */}
            <TabsContent value="astro">
              <Card>
                <CardHeader>
                  <CardTitle>Astrological Analysis</CardTitle>
                  <CardDescription>Astrological insights for {player?.player_first_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Astrology content will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Impact Analysis Tab */}
            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle>Impact Analysis</CardTitle>
                  <CardDescription>Performance impact analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Impact analysis content will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default PlayerDetailPage;
