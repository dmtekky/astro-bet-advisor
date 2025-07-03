import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react'; // For sort indicator

interface Player {
  id: string;
  player_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  number?: number | string | null;
  headshot_url?: string;
  is_active?: boolean;
  team_id?: string | null;
  team_name?: string | null;
  stats_batting_hits?: number | null;
  stats_batting_runs?: number | null;
  stats_fielding_assists?: number | null;
  impact_score?: number | null;
}

interface TeamRosterProps {
  players: Player[];
  teamId: string;
  // playerImpacts?: Record<string, number>; // Removed playerImpacts prop
}

export default function TeamRoster({ players, teamId }: TeamRosterProps) {
  const [sortConfig, setSortConfig] = useState<{ key: 'impact_score' | null; direction: 'asc' | 'desc' }>({ 
    key: 'impact_score', 
    direction: 'desc' 
  });

  // Sort players based on sortConfig
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    const sortablePlayers = [...players];
    
    if (sortConfig.key) {
      sortablePlayers.sort((a, b) => {
        // Handle null/undefined values
        if (a[sortConfig.key!] === null || a[sortConfig.key!] === undefined) return 1;
        if (b[sortConfig.key!] === null || b[sortConfig.key!] === undefined) return -1;
        
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortablePlayers;
  }, [players, sortConfig]);

  // Toggle sort direction when clicking on the Impact header
  const requestSort = (key: 'impact_score') => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Get color class based on impact score
  const getImpactColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!players || players.length === 0) {
    return <div className="px-4 py-8 text-center text-slate-500">No players available for this team</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100">
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider relative group cursor-help"
                title="Player"
              >
                <span className="truncate inline-block max-w-[60px]">Player</span>
              </th>
              <th 
                className="px-2 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider relative group"
                title="Jersey Number"
              >
                <span className="truncate inline-block">#</span>
              </th>
              <th 
                className="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider relative group"
                title="Position"
              >
                <span className="truncate inline-block max-w-[60px]">Pos</span>
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors relative group"
                onClick={() => requestSort('impact_score')}
                title="Impact Score"
              >
                <div className="flex items-center justify-end">
                  <span className="truncate inline-block">Impact</span>
                  <ArrowUpDown className="ml-1 h-3 w-3 flex-shrink-0" />
                  {sortConfig.key === 'impact_score' && (
                    <span className="ml-0.5">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider relative group"
                title="Hits"
              >
                <span className="truncate inline-block">H</span>
              </th>
              <th 
                className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider relative group"
                title="Runs"
              >
                <span className="truncate inline-block">R</span>
              </th>
              <th 
                className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider relative group"
                title="Fielding Assists"
              >
                <span className="truncate inline-block">A</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedPlayers.map((player, index) => (
              <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <a href={`/teams/${teamId}/player-details/${player.player_id}`} className="hover:opacity-80 transition-opacity">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                        <img 
                          className="h-10 w-10 rounded-full object-cover"
                          src={player.headshot_url || '/placeholder-player.png'}
                          alt={player.full_name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-player.png';
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors">
                          {player.full_name}
                        </div>
                      </div>
                    </div>
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {player.number || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {player.position || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {player.impact_score !== undefined && player.impact_score !== null ? (
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">{player.impact_score}</span>
                      <div className="relative w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getImpactColor(player.impact_score)}`}
                          style={{ width: `${Math.min(100, Math.max(0, player.impact_score))}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-500">
                  {player.stats_batting_hits !== undefined ? player.stats_batting_hits : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-500">
                  {player.stats_batting_runs !== undefined ? player.stats_batting_runs : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-500">
                  {player.stats_fielding_assists !== undefined ? player.stats_fielding_assists : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <a href={`/teams/${teamId}/player-details/${player.player_id}`} className="text-blue-600 hover:text-blue-900">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
