import React from 'react';
import { Link } from 'react-router-dom';

interface Player {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  primary_position?: string;
  primary_number?: number;
  birth_date?: string;
  headshot_url?: string;
  is_active?: boolean;
  idteam?: string;
  strteam?: string;
}

interface TeamRosterProps {
  players: Player[];
  teamId: string;
  playerImpacts?: Record<string, number>;
}

export default function TeamRoster({ players, teamId, playerImpacts = {} }: TeamRosterProps) {
  if (!players || players.length === 0) {
    return <div className="text-gray-400 p-4">No players found for this team.</div>;
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4">Team Roster</h2>
      <div className="bg-gray-800 bg-opacity-50 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Player
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Position
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Impact
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    to={`/teams/${teamId}/players/${player.id}`}
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    {player.full_name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {player.primary_position || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {player.primary_number || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${player.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {player.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {playerImpacts[player.id] !== undefined ? playerImpacts[player.id] : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
