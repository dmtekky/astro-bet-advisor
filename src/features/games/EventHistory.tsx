import React from 'react';

const PAST_EVENTS = [
  {
    id: 1,
    name: 'Full Moon in Taurus',
    date: '2023-11-27',
    impact: 'High',
    winRate: '72%',
    totalBets: 45,
    profit: '+$1,240',
  },
  {
    id: 2,
    name: 'Mars Square Jupiter',
    date: '2023-11-20',
    impact: 'Medium',
    winRate: '65%',
    totalBets: 38,
    profit: '+$890',
  },
  {
    id: 3,
    name: 'Venus Enters Scorpio',
    date: '2023-11-15',
    impact: 'Low',
    winRate: '58%',
    totalBets: 42,
    profit: '+$520',
  },
];

function EventHistory() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Event History</h2>
      <div className="space-y-4">
        {PAST_EVENTS.map((event) => (
          <div key={event.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{event.name}</h3>
                <p className="text-sm text-gray-500">{event.date}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                event.impact === 'High' ? 'bg-red-100 text-red-800' :
                event.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {event.impact} Impact
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Win Rate:</span>{' '}
                <span className="font-medium">{event.winRate}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Bets:</span>{' '}
                <span className="font-medium">{event.totalBets}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Profit:</span>{' '}
                <span className={`font-medium ${
                  event.profit.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {event.profit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium">
        View All Events
      </button>
    </div>
  );
}

export default EventHistory;
