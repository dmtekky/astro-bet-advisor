import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '@/lib/formula';

interface TeamRosterProps {
  players: Player[];
  teamId: string;
}

export default function TeamRoster({ players, teamId }: TeamRosterProps) {
  if (!players.length) {
    return <div className="text-gray-400">No players found for this team.</div>;
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
                Age
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    to={`/team/${teamId}/player/${player.id}`}
                    className="text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    {player.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {player.position || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {player.birth_date ? new Date().getFullYear() - new Date(player.birth_date).getFullYear() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
