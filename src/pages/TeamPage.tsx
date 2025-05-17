import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AstroTeamSection from './_AstroTeamSection';
import TeamRoster from '@/components/TeamRoster';
import { Player } from '@/lib/formula';

interface TeamInfo {
  id: string;
  name: string;
  city: string;
  logo: string;
  league: string;
  founded: number;
  venue: string;
  coach: string;
  record?: string;
}

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentGames, setRecentGames] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTeamData() {
      setLoading(true);
      try {
        // In a real app, you would fetch this from your API
        // const teamData = await fetch(`/api/teams/${teamId}`).then(res => res.json());
        
        // Mock data for demonstration
        const mockTeam: TeamInfo = {
          id: teamId || '',
          name: teamId ? teamId.toUpperCase() : 'Team',
          city: teamId === 'lakers' ? 'Los Angeles' : teamId === 'celtics' ? 'Boston' : 'City',
          logo: `/${teamId}-logo.png`,
          league: 'NBA',
          founded: 1947,
          venue: teamId === 'lakers' ? 'Crypto.com Arena' : 'Arena',
          coach: 'Head Coach',
          record: '42-30'
        };
        
        setTeam(mockTeam);
        
        // Mock players data
        const mockPlayers: Player[] = Array(5).fill(0).map((_, i) => ({
          id: `player-${i}`,
          name: `Player ${i + 1}`,
          position: ['PG', 'SG', 'SF', 'PF', 'C'][i],
          birth_date: `199${i}-0${i+1}-${10+i}`,
          team_id: teamId || ''
        }));
        
        setPlayers(mockPlayers);
        
        // Mock recent games
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
            {team.logo ? (
              <img src={team.logo} alt={`${team.name} logo`} className="w-24 h-24 object-contain" />
            ) : (
              <span className="text-4xl">🏀</span>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{team.city} {team.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-gray-300">
              <div>
                <span className="font-semibold">League:</span> {team.league}
              </div>
              <div>
                <span className="font-semibold">Founded:</span> {team.founded}
              </div>
              <div>
                <span className="font-semibold">Arena:</span> {team.venue}
              </div>
              <div>
                <span className="font-semibold">Coach:</span> {team.coach}
              </div>
              {team.record && (
                <div>
                  <span className="font-semibold">Record:</span> {team.record}
                </div>
              )}
            </div>
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
          <TeamRoster players={players} teamId={teamId || ''} />
        </div>
      </div>
    </div>
  );
}
