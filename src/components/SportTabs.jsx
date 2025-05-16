import React from 'react';

const SPORTS = [
  { id: 'NBA', name: 'NBA' },
  { id: 'MLB', name: 'MLB' },
  { id: 'NFL', name: 'NFL' },
  { id: 'BOXING', name: 'Boxing' },
  { id: 'SOCCER', name: 'Soccer', disabled: true },
  { id: 'NCAAF', name: 'NCAA Football', disabled: true },
];

function SportTabs({ activeSport, onSportChange }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 px-4">
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          onClick={() => !sport.disabled && onSportChange(sport.id)}
          disabled={sport.disabled}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeSport === sport.id
              ? 'bg-indigo-600 text-white shadow-md'
              : sport.disabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
          }`}
        >
          {sport.name}
          {sport.disabled && <span className="ml-1 text-xs">(Soon)</span>}
        </button>
      ))}
    </div>
  );
}

export default SportTabs;
