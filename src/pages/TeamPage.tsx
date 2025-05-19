import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchPlayersByTeam } from '@/services/playerService';
import AstroTeamSection from './_AstroTeamSection';
import TeamRoster from '@/components/TeamRoster';
import { PlayerStats, TeamStats, calculatePlayerImpact } from '@/lib/astroFormula';

interface Player {
  id: string;
  name: string;
  position: string;
  stats: {
    points: number;
    assists: number;
    rebounds: number;
  };
  image_url?: string;
}

interface TeamInfo {
  id: string;
  name: string;
  abbreviation?: string;
  logo: string;
  city?: string;
  league?: string;
  founded?: number;
  wins?: number;
  losses?: number;
  win_pct?: number;
}

interface TeamInfo {
  id: string;
  name: string;
  abbreviation?: string;
  logo: string;
  sport: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
  // Optional fields that might be in the database
  city?: string;
  league?: string;
  founded?: number;
  venue?: string;
  coach?: string;
  record?: string;
  // New fields for stats
  wins?: number;
  losses?: number;
  win_pct?: number;
}

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [playerImpacts, setPlayerImpacts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [recentGames, setRecentGames] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTeamData() {
      setLoading(true);
      try {
        // Fetch team info from Supabase
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();
        if (teamError) throw teamError;
        setTeam(team);

        // Fetch players for the team using playerService
        const players = await fetchPlayersByTeam(teamId);
        // Transform players data to match the PlayerStats type
        const formattedPlayers = players.map(player => ({
          ...player,
          position: player.position || 'N/A',
          // Ensure stats has the required shape with default values
          stats: player.stats && typeof player.stats === 'object' 
            ? {
                points: (player.stats as any).points || 0,
                assists: (player.stats as any).assists || 0,
                rebounds: (player.stats as any).rebounds || 0,
              }
            : { points: 0, assists: 0, rebounds: 0 }
        })) as unknown as PlayerStats[]; // Type assertion to handle the transformation
        setPlayers(formattedPlayers);
        
        // Set recent games (you might want to fetch this from your database later)
        setRecentGames([
          { id: '1', date: '2023-05-10', vs: 'Warriors', result: 'W 112-108' },
          { id: '2', date: '2023-05-08', vs: 'Suns', result: 'L 98-105' },
          { id: '3', date: '2023-05-05', vs: 'Nuggets', result: 'W 120-115' },
        ]);
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTeamData();
  }, [teamId]);

  // Calculate team stats
  useEffect(() => {
    if (players.length === 0) return;
    // Aggregate stats (mocked for now)
    const teamStats: TeamStats = {
      totalPoints: players.reduce((sum, p) => sum + (p.stats?.points || 0), 0),
      totalAssists: players.reduce((sum, p) => sum + (p.stats?.assists || 0), 0),
      totalRebounds: players.reduce((sum, p) => sum + (p.stats?.rebounds || 0), 0),
      totalWinShares: players.reduce((sum, p) => sum + (p.win_shares || 0), 0),
      playerCount: players.length,
    };
    // Mock astro data (replace with real hook/fetch in prod)
    const astroData = {
      moon_phase: 0.5,
      moon_sign: 'Aries',
      sun_sign: 'Aries',
      mercury_sign: 'Aries',
      venus_sign: 'Aries',
      mars_sign: 'Aries',
      jupiter_sign: 'Aries',
      saturn_sign: 'Aries',
      mercury_retrograde: false,
      aspects: {
        sun_mars: null,
        sun_saturn: null,
        sun_jupiter: null
      }
    };
    const today = new Date();
    // Calculate impact for each player
    Promise.all(
      [players].map(players => calculatePlayerImpact(players, astroData))
    ).then(scores => {
      const impacts: Record<string, number> = {};
      players.forEach((player, idx) => { impacts[player.id] = scores[idx]; });
      setPlayerImpacts(impacts);
    });
  }, [players, teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Team not found</h1>
          <p className="text-gray-400 mb-6">The team you're looking for doesn't exist or has been moved.</p>
          <Link 
            to="/" 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-full transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Team Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center mb-8 bg-gray-800 p-6 rounded-xl">
          <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-8">
            {team?.logo ? (
              <img src={team.logo} alt={`${team.name} logo`} className="w-24 h-24 object-contain" />
            ) : (
              <span className="text-4xl font-bold text-gray-400">?</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{team?.name}</h1>
            <div className="text-lg text-gray-400 mb-1">{team?.abbreviation}</div>
            <div className="text-md text-gray-400">{team?.city}</div>
          </div>
        </div>

        {/* Player Roster Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Team Roster</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.length === 0 ? (
              <div className="text-center text-gray-400">No players found for this team.</div>
            ) : (
              players.map((player) => (
                <div key={player.id} className="bg-gray-800 p-4 rounded-lg">
                  {player.image_url && (
                    <img src={player.image_url} alt={player.name} className="w-16 h-16 rounded-full mb-2" />
                  )}
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-gray-400">{player.position}</div>
                  <div className="text-sm text-gray-400">Points: {player.stats?.points || 0}</div>
                  <div className="text-sm text-gray-400">Assists: {player.stats?.assists || 0}</div>
                  <div className="text-sm text-gray-400">Rebounds: {player.stats?.rebounds || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Games */}
          <div className="lg:col-span-1 bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Recent Games</h2>
            <div className="space-y-3">
              {recentGames.length > 0 ? (
                recentGames.map((game) => (
                  <div key={game.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-400">{new Date(game.date).toLocaleDateString()}</div>
                      <div>vs {game.vs}</div>
                    </div>
                    <span className={`font-bold ${
                      game.result.startsWith('W') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {game.result}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No recent games</p>
              )}
            </div>
          </div>

          {/* Team Stats */}
          <div className="lg:col-span-2 bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Astrological Team Rating</h2>
            <AstroTeamSection teamId={teamId} />
          </div>
        </div>

        {/* Team Roster */}
        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700">
           <TeamRoster players={players} teamId={teamId || ''} playerImpacts={playerImpacts} />
        </div>
      </div>
    </div>
  );
}
