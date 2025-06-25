import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, User, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface GneeWidgetProps {
  expectedWinner: string;
  winnerLogo?: string;
  topPlayers: { name: string; team: string; astroInfluence: number }[];
  keyAspects: string[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.2 } }),
};

const GneeWidget: React.FC<GneeWidgetProps> = ({ expectedWinner, winnerLogo, topPlayers, keyAspects }) => {
  // Mock data for charts
  const winProbability = 68; // mock probability for winner
  const sparklineData = [30, 45, 25, 60, 50];
  const sparkPoints = sparklineData
    .map((d, i) => `${(i * (100 / (sparklineData.length - 1))).toFixed(1)},${(20 - (d / 100) * 20).toFixed(1)}`)
    .join(' ');
    // Mock expected RBI and match history
  const expectedRBIData = [3, 2, 4, 1, 3];
  const maxRBI = Math.max(...expectedRBIData);
  const last5Games = [
    { runsFor: 5, runsAgainst: 3 },
    { runsFor: 2, runsAgainst: 4 },
    { runsFor: 6, runsAgainst: 2 },
    { runsFor: 3, runsAgainst: 5 },
    { runsFor: 4, runsAgainst: 1 },
  ];
  const maxRuns = Math.max(...last5Games.map(g => Math.max(g.runsFor, g.runsAgainst)));
  // Chart data
  const rbiChartData = topPlayers.map((p, i) => ({ name: p.name, expectedRBI: expectedRBIData[i] }));
  const matchChartData = last5Games.map((g, i) => ({ name: `Game ${i+1}`, Scored: g.runsFor, Conceded: g.runsAgainst }));
  return (
  <div className="w-full bg-gray-900 rounded-xl p-6">
    <h2 className="text-2xl font-semibold text-white mb-6">GNEE Insights</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Winner Card */}
      <motion.div
        className="p-5 rounded-lg bg-yellow-400 text-gray-900 flex flex-col items-start"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center mb-3">
          <Trophy className="h-6 w-6 mr-2" />
          <span className="font-bold uppercase text-sm">Winner</span>
        </div>
        {winnerLogo && <img src={winnerLogo} alt="Winner Logo" className="w-12 h-12 mb-3 rounded-full" />}
        <span className="text-xl font-bold">{expectedWinner}</span>
        {/* Win Probability Bar */}
        <div className="mt-3 w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-white" style={{ width: `${winProbability}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-400 uppercase">{winProbability}% chance</p>
        {/* Last 5 Match-ups Chart */}
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={matchChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: '#ccc', fontSize: 10 }} />
            <YAxis tick={{ fill: '#ccc', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} itemStyle={{ color: '#fff' }} />
            <Bar dataKey="Scored" fill="#fff" barSize={8} />
            <Bar dataKey="Conceded" fill="#888" barSize={8} />
          </BarChart>
        </ResponsiveContainer>
        
        
      </motion.div>

      {/* Top Players Card */}
      <motion.div
        className="p-5 rounded-lg bg-cyan-400 text-gray-900"
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center mb-3">
          <User className="h-6 w-6 mr-2" />
          <span className="font-bold uppercase text-sm">Top Players</span>
        </div>
        <ul className="space-y-2">
          {topPlayers.map((p, idx) => (
            <li key={idx} className="flex flex-col">  {/* RBI Bar */}
              <div className="w-full bg-gray-700 h-1 rounded overflow-hidden mb-2">
                <div className="h-full bg-white" style={{ width: `${(expectedRBIData[idx]/maxRBI)*100}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <div className="absolute inset-y-0 left-0 bg-gray-800" style={{ width: `${p.astroInfluence}%` }} />
                <div className="relative flex justify-between w-full">
                  <span className="font-medium">{idx+1}. {p.name}</span>
                  <span className="font-mono font-semibold">{p.astroInfluence}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Insights Card */}
      <motion.div
        className="p-5 rounded-lg bg-purple-400 text-gray-900"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="flex items-center mb-3">
          <Star className="h-6 w-6 mr-2" />
          <span className="font-bold uppercase text-sm">Insights</span>
        {/* Sparkline Chart */}
        <svg className="w-full h-6 mt-2 mb-3" viewBox="0 0 100 20" preserveAspectRatio="none">
          <polyline fill="none" stroke="#ccc" strokeWidth={2} points={sparkPoints} />
        </svg>
        </div>
        <ul className="list-disc pl-5 space-y-2">
          {keyAspects.map((a, idx) => (
            <li key={idx} className="text-sm font-medium">
              {a}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
    <p className="mt-6 text-xs text-gray-400">Predictions based on astrology • For entertainment purposes only</p>
  </div>
  );
};

export default GneeWidget;
