import React from 'react';
import { Player } from '../../types/app.types';

interface PlayerStatsTableProps {
  player: Player;
  league?: 'NBA' | string;
}

const PlayerStatsTable: React.FC<PlayerStatsTableProps> = ({ player, league = 'NBA' }) => {
  // Helper function to format percentage values
  const formatPercentage = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    
    let num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return 'N/A';
    
    // If the number is between 0 and 1, assume it's a decimal and convert to percentage
    if (num > 0 && num < 1) num *= 100;
    // If the number is between 0 and 100, use as is
    else if (num < 0 || num > 100) return 'N/A';
    
    return num.toFixed(1) + '%';
  };

  // Helper function to format numeric stats
  const formatStat = (value: number | string | null | undefined, decimals: number = 1): string => {
    if (value === null || value === undefined) return 'N/A';
    
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return 'N/A';
    
    return decimals === 0 ? num.toLocaleString() : num.toFixed(decimals);
  };

  // Render NBA stats table
  const renderNbaStats = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            {['GP', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG%', '3P%', 'FT%'].map((header) => (
              <th key={header} className="px-3 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-3 py-2">{formatStat(player.stats_games_played, 0)}</td>
            <td className="px-3 py-2">{formatStat(player.stats_minutes_per_game)}</td>
            <td className="px-3 py-2">{formatStat(player.stats_points_per_game)}</td>
            <td className="px-3 py-2">{formatStat(player.stats_rebounds_per_game)}</td>
            <td className="px-3 py-2">{formatStat(player.stats_assists_per_game)}</td>
            <td className="px-3 py-2">{formatStat(player.stats_steals_per_game)}</td>
            <td className="px-3 py-2">{formatStat(player.stats_blocks_per_game)}</td>
            <td className="px-3 py-2">{formatPercentage(player.stats_field_goal_pct)}</td>
            <td className="px-3 py-2">{formatPercentage(player.stats_three_point_pct)}</td>
            <td className="px-3 py-2">{formatPercentage(player.stats_free_throw_pct)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Render non-NBA stats table (placeholder - can be expanded as needed)
  const renderDefaultStats = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            {['GP', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'FG%', '3P%', 'FT%'].map((header) => (
              <th key={header} className="px-3 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={10} className="px-3 py-4 text-center text-gray-500">
              No statistics available for this league
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 border-b pb-3">
        Basketball Statistics
      </h2>
      {league === 'NBA' ? renderNbaStats() : renderDefaultStats()}
    </section>
  );
};

export default PlayerStatsTable;
