import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAstroData } from '../hooks/useAstroData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingScreen from '@/components/LoadingScreen';
import type { Database } from '@/types/database.types';

// Define types based on Supabase schema
type PlayerRow = Database['public']['Tables']['players']['Row'];
type TeamRow = Database['public']['Tables']['teams']['Row'];
type LeagueRow = Database['public']['Tables']['leagues']['Row'];
type BaseballStatsRow = Database['public']['Tables']['baseball_stats']['Row'] & {
  team_abbreviation?: string;
  team_name?: string;
  season?: number;
};

interface PlayerProfile {
  player: PlayerRow;
  team: TeamRow | null;
  league: LeagueRow | null;
  stats: BaseballStatsRow | null;
}

const formatHeight = (inches: number | null): string => {
  if (inches === null || inches === undefined) return 'N/A';
  const feet = Math.floor(inches / 12);
  const remInches = inches % 12;
  return `${feet}'${remInches}"`;
};

const PlayerPage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);

  const fetchPlayerProfile = useCallback(async (id: string): Promise<PlayerProfile | null> => {
    console.log(`Fetching profile for player ID: ${id}`);

    // 1. Fetch Player Data
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (playerError || !playerData) {
      console.error('Error fetching player data:', playerError);
      throw new Error(playerError?.message || 'Player not found.');
    }
    console.log('Player data fetched:', playerData);

    // 2. Fetch Team Data
    let teamData: TeamRow | null = null;
    if (playerData.current_team_id) {
      const { data: fetchedTeamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', playerData.current_team_id)
        .single();
      if (teamError) console.error('Error fetching team data:', teamError);
      else teamData = fetchedTeamData;
      console.log('Team data fetched:', teamData);
    }

    // 3. Fetch League Data
    let leagueData: LeagueRow | null = null;
    if (teamData?.league_id) {
      const { data: fetchedLeagueData, error: leagueError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', teamData.league_id)
        .single();
      if (leagueError) console.error('Error fetching league data:', leagueError);
      else leagueData = fetchedLeagueData;
      console.log('League data fetched:', leagueData);
    }

    // Helper function to find player stats by name, then filter by team name/abbreviation
    const findPlayerStats = async (): Promise<BaseballStatsRow | null> => {
      if (!playerData.first_name || !playerData.last_name) {
        console.warn('Missing player name for stats lookup.');
        return null;
      }
      // 1. Fetch all stats where first and last name match
      const { data: statsRows, error } = await supabase
        .from('baseball_stats')
        .select('*')
        .eq('first_name', playerData.first_name)
        .eq('last_name', playerData.last_name);

      if (error) {
        console.error('Error fetching stats by name:', error.message);
        return null;
      }
      if (!statsRows || statsRows.length === 0) {
        console.warn('No stats found for player by name.');
        return null;
      }
      // 2. If only one result, return it
      if (statsRows.length === 1) {
        return statsRows[0];
      }
      // 3. If multiple, filter by team abbreviation or team name (case-insensitive)
      if (teamData) {
        const teamAbbr = (teamData.abbreviation || '').toLowerCase();
        const teamName = (teamData.name || '').toLowerCase();
        // Try abbreviation first, then name
        let filtered = statsRows.filter(
          s => (s.team_abbreviation || '').toLowerCase() === teamAbbr
        );
        if (filtered.length === 0) {
          filtered = statsRows.filter(
            s => (s.team_abbreviation || '').toLowerCase() === teamName || (s.team_abbreviation || '').toLowerCase() === teamAbbr
          );
        }
        if (filtered.length === 1) {
          return filtered[0];
        }
        // If still ambiguous, try matching by team name field if available
        if (filtered.length === 0 && teamName) {
          filtered = statsRows.filter(
            s => (s.team_name || '').toLowerCase() === teamName
          );
        }
        if (filtered.length === 1) {
          return filtered[0];
        }
        // If multiple remain, pick the most recent season
        if (filtered.length > 1) {
          filtered.sort((a, b) => (b.season || 0) - (a.season || 0));
          return filtered[0];
        }
      }
      // If no team info or still ambiguous, pick the most recent season
      statsRows.sort((a, b) => (b.season || 0) - (a.season || 0));
      return statsRows[0];
    };
    
    // Execute our enhanced stats finder
    const statsData = await findPlayerStats();

    return {
      player: playerData,
      team: teamData,
      league: leagueData,
      stats: statsData,
    };
  }, []);

  useEffect(() => {
    if (playerId) {
      setLoadingProfile(true);
      setErrorProfile(null);
      fetchPlayerProfile(playerId)
        .then(data => {
          if (data) setProfile(data);
          else setErrorProfile('Player profile could not be constructed.');
        })
        .catch(err => {
          console.error(err);
          setErrorProfile(err.message || 'Failed to fetch player profile.');
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [playerId, fetchPlayerProfile]);

  const { 
    astroData,
    loading: loadingAstroData,
    error: errorAstroData 
  } = useAstroData(profile?.player?.birth_date || null); // Use birth_date from fetched profile

  if (!playerId) {
    return <div className="p-4 text-red-500">Error: Player ID is missing from URL.</div>;
  }

  if (loadingProfile) {
    return <LoadingScreen fullScreen={false} message="Loading player profile..." />;
  }

  if (errorProfile) {
    return <div className="p-4 text-red-500">{errorProfile}</div>;
  }

  if (!profile || !profile.player) {
    return <div className="p-4">Player not found.</div>;
  }

  const { player, team, league, stats } = profile;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            {player.full_name || `${player.first_name} ${player.last_name}`} #{player.primary_number ?? 'N/A'}
          </CardTitle>
          <CardDescription>
            {player.primary_position || 'N/A'} | {team?.name || 'N/A'} ({team?.abbreviation || 'N/A'}) | {league?.name || 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><strong>Height:</strong> {formatHeight(player.height)}</p>
            <p><strong>Weight:</strong> {player.weight ?? 'N/A'} lbs</p>
            <p><strong>Birth Date:</strong> {player.birth_date ? new Date(player.birth_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Birth City:</strong> {player.birth_city ?? 'N/A'}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Astrological Insights</CardTitle>
          {player.birth_date ? (
            <CardDescription>
              Birth Date: {new Date(player.birth_date).toLocaleDateString()}
            </CardDescription>
          ) : (
            <CardDescription className="text-amber-500">
              No birth date available - astrological data may be limited
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loadingAstroData && <p className="text-slate-500">Loading astrological data...</p>}
          {errorAstroData && <p className="text-red-500">Error: {String(errorAstroData)}</p>}
          {astroData && !loadingAstroData && !errorAstroData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {/* Sun Sign with icon */}
                <div className="border rounded-md p-2 flex flex-col items-center">
                  <span className="text-amber-500 font-semibold">Sun</span>
                  <span className="text-lg">{astroData.planets?.sun?.sign || 'N/A'}</span>
                  <span className="text-xs">{astroData.planets?.sun?.degree?.toFixed(1)}°</span>
                </div>
                
                {/* Moon Sign with icon */}
                <div className="border rounded-md p-2 flex flex-col items-center">
                  <span className="text-blue-400 font-semibold">Moon</span>
                  <span className="text-lg">{astroData.planets?.moon?.sign || 'N/A'}</span>
                  <span className="text-xs">{astroData.planets?.moon?.degree?.toFixed(1)}°</span>
                </div>
                
                {/* Mercury */}
                <div className="border rounded-md p-2 flex flex-col items-center">
                  <span className="text-gray-500 font-semibold">Mercury</span>
                  <span className="text-lg">{astroData.planets?.mercury?.sign || 'N/A'}</span>
                  <span className="text-xs">
                    {astroData.planets?.mercury?.retrograde ? 'Retrograde' : 'Direct'}
                  </span>
                </div>
                
                {/* Venus */}
                <div className="border rounded-md p-2 flex flex-col items-center">
                  <span className="text-pink-400 font-semibold">Venus</span>
                  <span className="text-lg">{astroData.planets?.venus?.sign || 'N/A'}</span>
                </div>
                
                {/* Mars */}
                <div className="border rounded-md p-2 flex flex-col items-center">
                  <span className="text-red-500 font-semibold">Mars</span>
                  <span className="text-lg">{astroData.planets?.mars?.sign || 'N/A'}</span>
                </div>
                
                {/* Jupiter */}
                <div className="border rounded-md p-2 flex flex-col items-center">
                  <span className="text-purple-500 font-semibold">Jupiter</span>
                  <span className="text-lg">{astroData.planets?.jupiter?.sign || 'N/A'}</span>
                </div>
              </div>
              
              {/* Moon Phase */}
              <div className="border rounded-md p-3 mt-4">
                <h3 className="font-medium mb-1">Moon Phase</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 relative overflow-hidden">
                    {/* Simple moon phase visual representation */}
                    <div 
                      className="absolute bg-gray-700 h-full" 
                      style={{
                        width: '100%',
                        transform: `translateX(${(astroData.moonPhase?.value || 0) * 100 - 50}%)`,
                      }}
                    ></div>
                  </div>
                  <div>
                    <span className="font-medium">{astroData.moonPhase?.name || 'Unknown'}</span>
                    <span className="text-xs block text-gray-500">
                      {astroData.moonPhase?.illumination ? 
                        `${(astroData.moonPhase.illumination * 100).toFixed(0)}% illumination` : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Element Balance */}
              {astroData.elements && (
                <div className="border rounded-md p-3 mt-2">
                  <h3 className="font-medium mb-1">Element Balance</h3>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs">
                    <div className="bg-red-100 p-1 rounded">
                      <div className="font-semibold">Fire</div>
                      <div>{astroData.elements.fire.score}</div>
                    </div>
                    <div className="bg-green-100 p-1 rounded">
                      <div className="font-semibold">Earth</div>
                      <div>{astroData.elements.earth.score}</div>
                    </div>
                    <div className="bg-yellow-100 p-1 rounded">
                      <div className="font-semibold">Air</div>
                      <div>{astroData.elements.air.score}</div>
                    </div>
                    <div className="bg-blue-100 p-1 rounded">
                      <div className="font-semibold">Water</div>
                      <div>{astroData.elements.water.score}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!astroData && !loadingAstroData && !errorAstroData && player.birth_date && (
            <p className="text-gray-500 italic">No astrological data could be retrieved.</p>
          )}
          
          {!player.birth_date && (
            <p className="text-amber-500">Birth date is required for astrological insights.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Baseball Statistics</CardTitle>
          {stats?.created_at && <CardDescription>Last Updated: {new Date(stats.created_at).toLocaleDateString()}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loadingProfile && !stats && <p>Loading baseball statistics...</p>}
          {!loadingProfile && errorProfile && <p className="text-red-500">Could not load statistics due to profile error.</p>}
          {!loadingProfile && !errorProfile && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <p><strong>Batting Avg:</strong> {stats.batting_average?.toFixed(3) ?? 'N/A'}</p>
              <p><strong>Home Runs:</strong> {stats.home_runs ?? 'N/A'}</p>
              <p><strong>RBIs:</strong> {stats.runs_batted_in ?? 'N/A'}</p>
              <p><strong>OBP:</strong> {stats.on_base_percentage?.toFixed(3) ?? 'N/A'}</p>
              <p><strong>SLG:</strong> {stats.slugging_percentage?.toFixed(3) ?? 'N/A'}</p>
              <p><strong>OPS:</strong> {stats.on_base_plus_slugging?.toFixed(3) ?? 'N/A'}</p>
              <p><strong>Wins (Pitcher):</strong> {stats.wins ?? 'N/A'}</p>
              <p><strong>Losses (Pitcher):</strong> {stats.losses ?? 'N/A'}</p>
              <p><strong>ERA (Pitcher):</strong> {stats.earned_run_average?.toFixed(2) ?? 'N/A'}</p>
              <p><strong>Strikeouts (Pitcher):</strong> {stats.strikeouts ?? 'N/A'}</p>
              <p><strong>Saves (Pitcher):</strong> {stats.saves ?? 'N/A'}</p>
              <p><strong>Stolen Bases:</strong> {stats.stolen_bases ?? 'N/A'}</p>
            </div>
          )}
          {!loadingProfile && !errorProfile && !stats && (
            <p>No baseball statistics available for this player or the link to historical stats could not be established.</p>
          )}
        </CardContent>
      </Card>
      {/* TODO: Add AstroDisclosure or similar component for detailed astro predictions */}
    </div>
  );
};

export default PlayerPage;
