import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GameCard from '@/components/GameCard';
import { Game } from '@/types';
import { ExtendedTeam } from '@/features/dashboard/types';

interface GameGroup {
  date: Date;
  games: Game[];
}

interface UpcomingGamesProps {
  gameGroups: GameGroup[];
  isLoading: boolean;
  onViewAllGames: () => void;
  findTeam: (id: string) => ExtendedTeam | undefined;
  renderGamePrediction: (game: Game) => React.ReactNode;
}

type Team = ExtendedTeam;

// Extended Team type with all required properties for GameCard
interface GameTeam {
  id: string;
  name: string;
  abbreviation: string;
  sport: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  logo: string;
  record: string;
  external_id?: string | number;
  city?: string;
}

// Helper to create a default team with required properties
const createDefaultTeam = (id: string, name: string): GameTeam => {
  const abbr = name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase();
  return {
    id,
    name,
    abbreviation: abbr,
    sport: 'mlb',
    external_id: id,
    logo_url: '',
    logo: '',
    record: '0-0',
    primary_color: '#000000',
    secondary_color: '#ffffff',
  };
};

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const UpcomingGames: React.FC<UpcomingGamesProps> = ({
  gameGroups,
  isLoading,
  onViewAllGames,
  findTeam,
  renderGamePrediction,
}) => {
  if (isLoading && (!gameGroups || gameGroups.length === 0)) {
    return (
      <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`game-skel-${i}`} className="h-64 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameGroups && gameGroups.length > 0) {
    return (
      <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-slate-800">Upcoming Games</CardTitle>
        </CardHeader>
        <CardContent>
          {gameGroups.map((group) => (
            <div key={group.date.toString()} className="mb-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                {format(group.date, 'EEEE, MMMM d')}
              </h3>
              <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                {group.games.map((game) => {
                  // Get team data with proper fallbacks and type safety
                  const foundHomeTeam = findTeam(String(game.home_team_id));
                  const foundAwayTeam = findTeam(String(game.away_team_id));
  
                  // Create team objects with all required properties
                  const homeTeam: GameTeam = foundHomeTeam ? {
                    id: foundHomeTeam.id,
                    name: foundHomeTeam.name || 'Home Team',
                    abbreviation: foundHomeTeam.abbreviation || foundHomeTeam.name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase(),
                    sport: foundHomeTeam.sport || 'mlb',
                    primary_color: foundHomeTeam.primary_color || '#1E40AF',
                    secondary_color: foundHomeTeam.secondary_color || '#FFFFFF',
                    logo_url: foundHomeTeam.logo_url || foundHomeTeam.logo || '',
                    logo: foundHomeTeam.logo || foundHomeTeam.logo_url || '',
                    record: foundHomeTeam.record || '0-0',
                    external_id: foundHomeTeam.external_id,
                    city: foundHomeTeam.city
                  } : createDefaultTeam(String(game.home_team_id), 'Home Team');

                  const awayTeam: GameTeam = foundAwayTeam ? {
                    id: foundAwayTeam.id,
                    name: foundAwayTeam.name || 'Away Team',
                    abbreviation: foundAwayTeam.abbreviation || foundAwayTeam.name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase(),
                    sport: foundAwayTeam.sport || 'mlb',
                    primary_color: foundAwayTeam.primary_color || '#1E40AF',
                    secondary_color: foundAwayTeam.secondary_color || '#FFFFFF',
                    logo_url: foundAwayTeam.logo_url || foundAwayTeam.logo || '',
                    logo: foundAwayTeam.logo || foundAwayTeam.logo_url || '',
                    record: foundAwayTeam.record || '0-0',
                    external_id: foundAwayTeam.external_id,
                    city: foundAwayTeam.city
                  } : createDefaultTeam(String(game.away_team_id), 'Away Team');

                  return (
                    <GameCard
                      key={game.id}
                      game={game}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                    >
                      <div className="mt-3">
                        {renderGamePrediction(game)}
                      </div>
                    </GameCard>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="mt-8 mb-2 flex justify-center">
            <Button 
              variant="outline" 
              className="group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-indigo-500 rounded-full shadow-md group"
              onClick={onViewAllGames}
            >
              <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-500 group-hover:translate-x-0 ease">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </span>
              <span className="absolute flex items-center justify-center w-full h-full text-indigo-500 transition-all duration-300 transform group-hover:translate-x-full ease">
                View All Games
              </span>
              <span className="relative invisible">View All Games</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No games found
  return (
    <Card className="overflow-hidden border border-slate-200/50 bg-white/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Upcoming Games</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-slate-500 py-8">No upcoming games found.</p>
      </CardContent>
    </Card>
  );
};

export default UpcomingGames;
