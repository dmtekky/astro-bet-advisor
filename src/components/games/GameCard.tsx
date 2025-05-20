import React from 'react';
import { format } from 'date-fns';
import { Clock, Zap, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Team, Game } from "@/types/dashboard";

interface GameCardProps {
  game: Game & {
    astroEdge?: number;
    astroInfluence?: string;
  };
  homeTeam: Team;
  awayTeam: Team;
  defaultLogo: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  homeTeam,
  awayTeam,
  defaultLogo,
}) => {
  const gameTime = game.commence_time || game.start_time || game.game_time;
  const gameDate = gameTime ? new Date(gameTime) : new Date();
  const isLive = game.status === 'in_progress' || game.status === 'in-progress';
  
  // Get team logo or fallback to default
  const getTeamLogo = (team: Team) => {
    if (team.logo_url) return team.logo_url;
    if (team.logo) return team.logo;
    return defaultLogo;
  };

  // Get team record string
  const getTeamRecord = (team: Team): string => {
    if (team.record) return team.record;
    if (team.wins !== undefined && team.losses !== undefined) {
      return `${team.wins}-${team.losses}`;
    }
    return '';
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center w-2/5">
            <img
              src={getTeamLogo(homeTeam)}
              alt={homeTeam.name}
              className="w-16 h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultLogo;
              }}
            />
            <span className="font-semibold text-center mt-2">
              {homeTeam.name}
            </span>
            {getTeamRecord(homeTeam) && (
              <span className="text-xs text-muted-foreground">
                {getTeamRecord(homeTeam)}
              </span>
            )}
          </div>

          {/* Game Info */}
          <div className="flex flex-col items-center px-2">
            <div className="text-sm text-muted-foreground">
              {isLive ? (
                <span className="flex items-center text-red-500 font-medium">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  LIVE
                </span>
              ) : (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(gameDate, 'h:mm a')}
                </span>
              )}
            </div>
            <div className="my-2 text-xl font-bold">VS</div>
            <div className="text-xs text-muted-foreground">
              {format(gameDate, 'MMM d')}
            </div>
            
            {game.odds && game.odds.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="flex items-center">
                  <Zap className="w-3 h-3 text-yellow-500 mr-1" />
                  <span>Odds: {game.odds[0]?.market || 'N/A'}</span>
                </div>
              </div>
            )}
            
            {game.astroInfluence && (
              <div className="mt-2 text-xs">
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-purple-500 mr-1" />
                  <Badge variant="outline" className="text-xs bg-purple-500/10 hover:bg-purple-500/20">
                    {game.astroInfluence}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center w-2/5">
            <img
              src={getTeamLogo(awayTeam)}
              alt={awayTeam.name}
              className="w-16 h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = defaultLogo;
              }}
            />
            <span className="font-semibold text-center mt-2">
              {awayTeam.name}
            </span>
            {getTeamRecord(awayTeam) && (
              <span className="text-xs text-muted-foreground">
                {getTeamRecord(awayTeam)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
