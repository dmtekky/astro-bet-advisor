
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Player, Team, Sport } from '@/types';
import { PlayerCard, TeamCard } from './EnhancedBettingCard';
import { usePlayersBySport, useTeamsBySport, useBettingOdds, useAstrologicalData } from '@/hooks/useSportsData';
import { Search } from 'lucide-react';

interface BettingGridProps {
  sport: Sport;
}

const BettingGrid: React.FC<BettingGridProps> = ({ sport }) => {
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch players data
  const {
    data: players = [],
    isLoading: isLoadingPlayers,
    error: playersError
  } = usePlayersBySport(sport);
  
  // Fetch teams data
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    error: teamsError
  } = useTeamsBySport(sport);
  
  // Filter data based on search query
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.team && player.team.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Render placeholder for empty state
  const renderEmptyState = (type: 'players' | 'teams', isError: boolean = false) => (
    <div className="text-center py-12">
      <div className="mb-4 text-muted-foreground">
        <Search className="mx-auto h-12 w-12 opacity-50" />
      </div>
      <h3 className="text-xl font-medium mb-2">
        {isError 
          ? `Error loading ${type}` 
          : `No ${type} found`}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {isError 
          ? "There was an error loading data from Supabase."
          : searchQuery 
            ? `No ${type} matched your search. Try a different query.`
            : `Connect Supabase to load ${type} data for ${sport.toUpperCase()}.`
        }
      </p>
    </div>
  );
  
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'players' | 'teams')}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>
      
      <TabsContent value="players" className="m-0 animate-fade-in">
        {isLoadingPlayers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`player-skeleton-${i}`}>
                <PlayerCard player={{} as Player} isLoading={true} />
              </div>
            ))}
          </div>
        ) : playersError ? (
          renderEmptyState('players', true)
        ) : filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player) => (
              <PlayerCardContainer key={player.id} player={player} />
            ))}
          </div>
        ) : (
          renderEmptyState('players')
        )}
      </TabsContent>
      
      <TabsContent value="teams" className="m-0 animate-fade-in">
        {isLoadingTeams ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`team-skeleton-${i}`}>
                <TeamCard team={{} as Team} isLoading={true} />
              </div>
            ))}
          </div>
        ) : teamsError ? (
          renderEmptyState('teams', true)
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <TeamCardContainer key={team.id} team={team} />
            ))}
          </div>
        ) : (
          renderEmptyState('teams')
        )}
      </TabsContent>
    </div>
  );
};

// Helper component for player cards with data loading
const PlayerCardContainer: React.FC<{ player: Player }> = ({ player }) => {
  const { data: odds, isLoading: isLoadingOdds } = useBettingOdds(player.id);
  const { data: astrologyData, isLoading: isLoadingAstrology } = useAstrologicalData(player.id);
  
  return (
    <PlayerCard
      player={player}
      odds={odds}
      astrologyData={astrologyData}
      isLoading={isLoadingOdds || isLoadingAstrology}
    />
  );
};

// Helper component for team cards with data loading
const TeamCardContainer: React.FC<{ team: Team }> = ({ team }) => {
  const { data: odds, isLoading: isLoadingOdds } = useBettingOdds(team.id, true);
  const { data: players = [], isLoading: isLoadingPlayers } = usePlayersBySport(team.sport);
  
  // Filter players by team ID
  const teamPlayers = players.filter(player => player.team_id === team.id);
  
  return (
    <TeamCard
      team={team}
      players={teamPlayers}
      odds={odds}
      isLoading={isLoadingOdds || isLoadingPlayers}
    />
  );
};

export default BettingGrid;
