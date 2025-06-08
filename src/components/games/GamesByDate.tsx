import React from 'react';
import { format } from 'date-fns';
import { GameCard } from './GameCard';
import { GameWithTeams, DEFAULT_LOGOS, SportKey } from '@/types/dashboard';

interface GamesByDateProps {
  gamesByDate: Record<string, GameWithTeams[]>;
  sport: SportKey;
}

export const GamesByDate: React.FC<GamesByDateProps> = ({ gamesByDate, sport }) => {
  if (Object.keys(gamesByDate).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No games scheduled
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(gamesByDate).map(([date, games]) => (
        <div key={date} className="space-y-4">
          <h2 className="text-xl font-semibold">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <GameCard
                key={`${game.id}-${game.game_time}`}
                game={game}
                homeTeam={game.home_team_data}
                awayTeam={game.away_team_data}
                defaultLogo={DEFAULT_LOGOS[sport]}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
