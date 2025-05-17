import React from 'react';

const HEADLINES = [
  {
    id: 1,
    title: 'Mercury Retrograde Affects Guard Play',
    summary: 'Point guards may experience more turnovers than usual during this transit.',
    icon: '🌌',
    impact: 'High',
  },
  {
    id: 2,
    title: 'Mars in Leo Boosts Scoring',
    summary: 'Expect higher scoring games as Mars energizes offensive players.',
    icon: '🔥',
    impact: 'Medium',
  },
  {
    id: 3,
    title: 'Venus-Neptune Aspect Favors Underdogs',
    summary: 'Upset alert: Underperforming teams may surprise during this transit.',
    icon: '🎯',
    impact: 'High',
  },
  {
    id: 4,
    title: 'Saturn Square Mars Increases Injuries',
    summary: 'Be cautious with player props as injury risk is elevated.',
    icon: '⚠️',
    impact: 'Critical',
  },
];

function CosmicHeadlines() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Cosmic Headlines</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HEADLINES.map((headline) => (
          <div 
            key={headline.id} 
            className={`p-4 rounded-lg border-l-4 ${
              headline.impact === 'High' ? 'border-purple-500 bg-purple-50' :
              headline.impact === 'Critical' ? 'border-red-500 bg-red-50' :
              'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex">
              <span className="text-2xl mr-3">{headline.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900">{headline.title}</h3>
                <p className="text-sm text-gray-600">{headline.summary}</p>
                <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded ${
                  headline.impact === 'High' ? 'bg-purple-100 text-purple-800' :
                  headline.impact === 'Critical' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }">
                  {headline.impact} Impact
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium">
        View All Insights
      </button>
    </div>
  );
}

export default CosmicHeadlines;
