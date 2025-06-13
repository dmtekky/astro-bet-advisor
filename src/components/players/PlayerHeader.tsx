import React from 'react';

interface PlayerHeaderProps {
  player: {
    full_name: string | null;
    headshot_url: string | null;
    number?: string | number | null;
    position: string | null;
    team_name?: string | null;
    birth_date: string | null;
    birth_location?: string | null;
  };
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ player }) => {
  return (
    <section className="flex flex-col items-center text-center gap-4 bg-white p-8 rounded-lg shadow-md">
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600 bg-gray-100 flex items-center justify-center">
        {player.headshot_url ? (
          <img 
            src={player.headshot_url}
            alt={`${player.full_name} headshot`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150/cccccc/666666?text=No+Image';
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-800 text-xl font-bold">
            {player.full_name?.split(' ').map(n => n[0]).join('')}
          </div>
        )}
      </div>
      <h1 className="text-4xl font-bold text-gray-800">{player.full_name}</h1>
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">#{player.number || 'N/A'}</span>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">{player.position || 'N/A'}</span>
        {player.team_name && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
            {player.team_name}
          </span>
        )}
      </div>
      {player.birth_date && (
        <p className="text-gray-600 mt-2">
          Born: {new Date(player.birth_date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      )}
      {player.birth_location && (
        <p className="text-gray-600">From: {player.birth_location}</p>
      )}
    </section>
  );
};

export default PlayerHeader;
