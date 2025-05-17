
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Player, Team, BettingOdds, AstrologicalData, Sport } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Info, Star, Shield } from 'lucide-react';
import { usePlayerAIS, useTeamAstrologicalScore } from '@/hooks/useFormulaData';

interface PlayerCardProps {
  player: Player;
  odds?: BettingOdds[];
  astrologyData?: AstrologicalData | null;
  isLoading?: boolean;
}

interface TeamCardProps {
  team: Team;
  players?: Player[];
  odds?: BettingOdds[];
  isLoading?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  odds, 
  astrologyData,
  isLoading = false
}) => {
  const { data: aisData, isLoading: isLoadingAIS } = usePlayerAIS(player);
  const loading = isLoading || isLoadingAIS;
  
  if (loading) {
    return <BettingCardSkeleton />;
  }

  // Format odds for display (American odds format)
  const formatOdds = (odds: number) => {
    if (odds > 0) {
      return `+${odds}`;
    }
    return odds.toString();
  };

  // Get best odds
  const bestOdds = odds && odds.length > 0 
    ? odds.sort((a, b) => a.odds - b.odds)[0] 
    : null;
  
  // Calculate odds adjustment if AIS data is available
  const oasValue = aisData?.kpw ? 
    (aisData.kpw > 1 ? `+${((aisData.kpw - 1) * 100).toFixed(1)}%` : `-${((1 - aisData.kpw) * 100).toFixed(1)}%`) 
    : null;
  
  // Determine if astrologically favorable
  const isFavorable = aisData?.ais.score 
    ? aisData.ais.score > 60 
    : astrologyData?.favorability 
      ? astrologyData.favorability > 60 
      : false;

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md", 
      `border-sports-${player.sport} border-opacity-5 hover:border-opacity-50`
    )}>
      <CardHeader className={cn(
        "pb-2 relative",
        `bg-sports-${player.sport} bg-opacity-5`
      )}>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate">
            {player.name}
          </CardTitle>
          <Badge variant="outline" className={cn(
            `border-sports-${player.sport} text-sports-${player.sport}`,
            "uppercase text-xs font-bold"
          )}>
            {player.sport}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {player.position || ''} {player.team || ''}
        </p>
        
        {/* OAS Indicator */}
        {oasValue && (
          <div className="absolute right-6 -bottom-4 bg-background border rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-sm">
            {isFavorable ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={isFavorable ? "text-green-500" : "text-red-500"}>
              OAS: {oasValue}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            {player.image ? (
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                <img 
                  src={player.image} 
                  alt={player.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                {player.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            <div>
              {/* Astrological Rating */}
              {(aisData?.ais.score || astrologyData?.favorability) && (
                <div className="mb-1">
                  <p className="text-xs font-medium mb-1">Astro Rating</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const score = aisData?.ais.score || astrologyData?.favorability || 0;
                      return (
                        <Star
                          key={star}
                          size={14}
                          className={cn(
                            "mr-0.5",
                            star <= Math.ceil(score / 20)
                              ? "fill-yellow-500 text-yellow-500"
                              : "fill-transparent text-muted-foreground"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            {bestOdds ? (
              <>
                <div className="text-sm text-muted-foreground">Best Odds</div>
                <div className={cn(
                  "text-xl font-bold",
                  bestOdds.odds < 0 ? "text-red-500" : "text-green-500"
                )}>
                  {formatOdds(bestOdds.odds)}
                </div>
                <div className="text-xs text-muted-foreground">
                  via {bestOdds.bookmaker}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No odds available
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-secondary/20 py-2 px-4 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {aisData?.ais.influences?.slice(0, 2).join(', ') || 
           astrologyData?.influences?.slice(0, 2).join(', ') || 
           'No astrological data'}
        </div>
        
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
          <Info className="h-3 w-3" />
          <span className="sr-only">More info</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const TeamCard: React.FC<TeamCardProps> = ({ 
  team, 
  players = [], 
  odds,
  isLoading = false 
}) => {
  const { 
    data: teamAstroData, 
    isLoading: isLoadingTeamAstro 
  } = useTeamAstrologicalScore(team, players.length > 0 ? players : null);
  
  const loading = isLoading || isLoadingTeamAstro;
  
  if (loading) {
    return <BettingCardSkeleton />;
  }
  
  // Format odds for display
  const formatOdds = (odds: number) => {
    if (odds > 0) {
      return `+${odds}`;
    }
    return odds.toString();
  };
  
  // Get best odds
  const bestOdds = odds && odds.length > 0 
    ? odds.sort((a, b) => a.odds - b.odds)[0]
    : null;
  
  // Calculate OAS and determine favorability
  const oasValue = teamAstroData?.oas ? 
    (teamAstroData.oas > 1 ? `+${((teamAstroData.oas - 1) * 100).toFixed(1)}%` : `-${((1 - teamAstroData.oas) * 100).toFixed(1)}%`) 
    : null;
    
  const isFavorable = teamAstroData?.tas ? teamAstroData.tas > 60 : false;
  
  // Get key players (up to 3)
  const keyPlayers = players
    .slice(0, 3)
    .sort((a, b) => (b.win_shares || 0) - (a.win_shares || 0));
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        `border-sports-${team.sport} border-opacity-5 hover:border-opacity-50`
      )}
    >
      <CardHeader 
        className={cn(
          "pb-2 relative",
          `bg-sports-${team.sport} bg-opacity-5`
        )}
      >
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold truncate">
            {team.name}
          </CardTitle>
          <Badge variant="outline" className={cn(
            `border-sports-${team.sport} text-sports-${team.sport}`,
            "uppercase text-xs font-bold"
          )}>
            {team.sport}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {team.abbreviation}
        </p>
        
        {/* TAS/OAS Indicator */}
        {oasValue && (
          <div className="absolute right-6 -bottom-4 bg-background border rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-sm">
            {isFavorable ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={isFavorable ? "text-green-500" : "text-red-500"}>
              OAS: {oasValue}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            {team.logo ? (
              <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded flex items-center justify-center bg-muted text-muted-foreground">
                <Shield className="h-8 w-8" />
              </div>
            )}
            
            <div>
              {/* TAS Rating */}
              {teamAstroData?.tas && (
                <div className="mb-1">
                  <p className="text-xs font-medium mb-1">Team Astro Score</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={cn(
                          "mr-0.5",
                          star <= Math.ceil(teamAstroData.tas / 20)
                            ? "fill-yellow-500 text-yellow-500"
                            : "fill-transparent text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            {bestOdds ? (
              <>
                <div className="text-sm text-muted-foreground">Best Odds</div>
                <div className={cn(
                  "text-xl font-bold",
                  bestOdds.odds < 0 ? "text-red-500" : "text-green-500"
                )}>
                  {formatOdds(bestOdds.odds)}
                </div>
                <div className="text-xs text-muted-foreground">
                  via {bestOdds.bookmaker}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                No odds available
              </div>
            )}
          </div>
        </div>
        
        {/* Key Players */}
        {keyPlayers.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium mb-1">Key Players</h4>
            <div className="flex flex-wrap gap-1">
              {keyPlayers.map((player) => (
                <Badge key={player.id} variant="secondary" className="text-xs">
                  {player.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-secondary/20 py-2 px-4 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {teamAstroData?.influences?.slice(0, 2).join(', ') || 
           `${teamAstroData?.keyPlayers || 0} key players analyzed`}
        </div>
        
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
          <Info className="h-3 w-3" />
          <span className="sr-only">More info</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const BettingCardSkeleton = () => {
  return (
    <Card className="w-full bg-gray-900/50 border-gray-800 overflow-hidden">
      <div className="relative
        before:absolute before:inset-0 before:-translate-x-full
        before:bg-gradient-to-r before:from-transparent before:via-gray-700/30 before:to-transparent
        before:animate-[shimmer_2s_infinite] before:z-10">
        <CardHeader>
          <Skeleton className="h-5 w-3/4 bg-gray-800/50" />
          <Skeleton className="h-4 w-1/2 mt-2 bg-gray-800/50" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-gray-800/50" />
            <Skeleton className="h-4 w-5/6 bg-gray-800/50" />
            <Skeleton className="h-4 w-4/6 bg-gray-800/50" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          <Skeleton className="h-10 w-24 bg-gray-800/50" />
          <Skeleton className="h-10 w-24 bg-gray-800/50" />
        </CardFooter>
      </div>
    </Card>
  );
};
