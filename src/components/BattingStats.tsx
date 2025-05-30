import React from 'react';

interface BattingStatsProps {
  stats: {
    atBats?: number;
    runs?: number;
    hits?: number;
    secondBaseHits?: number;
    thirdBaseHits?: number;
    homeruns?: number;
    runsBattedIn?: number;
    stolenBases?: number;
    caughtBaseSteals?: number;
    battingAvg?: number;
    batterOnBasePct?: number;
    batterSluggingPct?: number;
    batterOnBasePlusSluggingPct?: number;
    batterWalks?: number;
    batterStrikeouts?: number;
    hitByPitch?: number;
    batterSacrificeBunts?: number;
    batterSacrificeFlies?: number;
    batterIntentionalWalks?: number;
    totalBases?: number;
    extraBaseHits?: number;
    batterGroundBalls?: number;
    batterFlyBalls?: number;
    batterLineDrives?: number;
    batterDoublePlays?: number;
    leftOnBase?: number;
    pitchesFaced?: number;
    batterSwings?: number;
    batterStrikesMiss?: number;
  };
}

const formatPercentage = (value?: number) => {
  if (value === undefined || value === null) return '.000';
  return value.toFixed(3).replace('0.', '.');
};

const formatStatValue = (value: any) => {
  if (value === undefined || value === null) return 'N/A';
  return value;
};

const BattingStats: React.FC<BattingStatsProps> = ({ stats }) => {
  const statGroups = [
    {
      title: 'Basic Stats',
      stats: [
        { label: 'At Bats', key: 'atBats', value: stats.atBats },
        { label: 'Runs', key: 'runs', value: stats.runs },
        { label: 'Hits', key: 'hits', value: stats.hits },
        { label: 'Doubles', key: 'secondBaseHits', value: stats.secondBaseHits },
        { label: 'Triples', key: 'thirdBaseHits', value: stats.thirdBaseHits },
        { label: 'Home Runs', key: 'homeruns', value: stats.homeruns },
        { label: 'Runs Batted In', key: 'runsBattedIn', value: stats.runsBattedIn },
        { label: 'Stolen Bases', key: 'stolenBases', value: `${stats.stolenBases || 0}/${(stats.stolenBases || 0) + (stats.caughtBaseSteals || 0)}` },
      ]
    },
    {
      title: 'Averages',
      stats: [
        { label: 'Batting Average', key: 'battingAvg', value: formatPercentage(stats.battingAvg) },
        { label: 'On-Base %', key: 'batterOnBasePct', value: formatPercentage(stats.batterOnBasePct) },
        { label: 'Slugging %', key: 'batterSluggingPct', value: formatPercentage(stats.batterSluggingPct) },
        { label: 'OPS', key: 'batterOnBasePlusSluggingPct', value: formatPercentage(stats.batterOnBasePlusSluggingPct) },
      ]
    },
    {
      title: 'Plate Discipline',
      stats: [
        { label: 'Walks', key: 'batterWalks', value: stats.batterWalks },
        { label: 'Strikeouts', key: 'batterStrikeouts', value: stats.batterStrikeouts },
        { label: 'Hit By Pitch', key: 'hitByPitch', value: stats.hitByPitch },
        { label: 'Intentional Walks', key: 'batterIntentionalWalks', value: stats.batterIntentionalWalks },
        { 
          label: 'Swing %', 
          key: 'swingPercentage', 
          value: stats.pitchesFaced ? `${((stats.batterSwings || 0) / stats.pitchesFaced * 100).toFixed(1)}%` : '0.0%' 
        },
        { 
          label: 'Whiff %', 
          key: 'whiffPercentage', 
          value: stats.batterSwings ? `${((stats.batterStrikesMiss || 0) / stats.batterSwings * 100).toFixed(1)}%` : '0.0%' 
        },
      ]
    },
    {
      title: 'Situational',
      stats: [
        { label: 'Sacrifice Bunts', key: 'batterSacrificeBunts', value: stats.batterSacrificeBunts },
        { label: 'Sacrifice Flies', key: 'batterSacrificeFlies', value: stats.batterSacrificeFlies },
        { label: 'Double Plays', key: 'batterDoublePlays', value: stats.batterDoublePlays },
        { label: 'Left On Base', key: 'leftOnBase', value: stats.leftOnBase },
      ]
    }
  ];

  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistic</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100">
                  {group.title}
                </td>
              </tr>
              {group.stats.map((stat, statIndex) => (
                <tr key={`${groupIndex}-${statIndex}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">
                    {stat.label}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                    {formatStatValue(stat.value)}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BattingStats;
