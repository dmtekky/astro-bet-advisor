import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearch } from '@/context/SearchContext';
import { usePlayersBySport, useTeamsBySport } from '@/hooks/useSportsData';
import { PlayerCard } from '@/features/dashboard/EnhancedBettingCard';
import { Sport } from '@/types';
import { Search } from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { searchQuery } = useSearch();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = React.useState<'players' | 'teams'>('players');

  // Get all sports data
  const sports: Sport[] = ['nba', 'mlb', 'nfl', 'boxing'];
  
  // Fetch players and teams from all sports
  const allPlayers = sports.flatMap(sport => 
    usePlayersBySport(sport).data?.map(player => ({
      ...player,
      sport
    })) || []
  );

  const allTeams = sports.flatMap(sport => 
    useTeamsBySport(sport).data?.map(team => ({
      ...team,
      sport
    })) || []
  );

  // Filter results based on search query
  const filteredPlayers = React.useMemo(() => {
    if (!query.trim()) return [];
    const searchTerm = query.toLowerCase().trim();
    
    return allPlayers.filter(player => 
      player.name?.toLowerCase().includes(searchTerm) ||
      player.team?.toLowerCase().includes(searchTerm)
    );
  }, [allPlayers, query]);

  const filteredTeams = React.useMemo(() => {
    if (!query.trim()) return [];
    const searchTerm = query.toLowerCase().trim();
    
    return allTeams.filter(team => 
      team.name?.toLowerCase().includes(searchTerm) ||
      team.abbreviation?.toLowerCase().includes(searchTerm)
    );
  }, [allTeams, query]);

  if (!query) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Search Results</h1>
        <p>Enter a search term to find players and teams.</p>
      </div>
    );
  }

  type SearchResultItem = {
    id: string;
    type: 'player' | 'team';
    displayName: string;
    subtitle: string;
    url: string;
    sport: Sport;
    logo?: string;
    position?: string;
  };

  const allResults = useMemo<SearchResultItem[]>(() => {
    const playerResults: SearchResultItem[] = filteredPlayers.map(player => ({
      id: player.id,
      type: 'player' as const,
      displayName: player.name,
      subtitle: player.team || '',
      url: `/team/${player.team_id}/player/${player.id}`,
      sport: player.sport,
      position: player.position,
      logo: player.image // Use player's image as logo if available
    }));

    const teamResults: SearchResultItem[] = filteredTeams.map(team => ({
      id: team.id,
      type: 'team' as const,
      displayName: team.name,
      subtitle: team.sport.toUpperCase(),
      url: `/team/${team.id}`,
      sport: team.sport,
      logo: team.logo
    }));

    // Combine and sort by relevance (simple sort by name match for now)
    return [...playerResults, ...teamResults].sort((a, b) => {
      const aMatch = a.displayName.toLowerCase().indexOf(query.toLowerCase());
      const bMatch = b.displayName.toLowerCase().indexOf(query.toLowerCase());
      return aMatch - bMatch;
    });
  }, [filteredPlayers, filteredTeams, query]);

  if (!query) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-muted p-6 rounded-full mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Search for players and teams</h1>
        <p className="text-muted-foreground max-w-md">
          Enter a player name or team to search across all sports
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search results for "{query}"
      </h1>
      
      {allResults.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allResults.map((item) => (
            <Link 
              to={item.url} 
              key={`${item.type}-${item.id}`}
              className="block hover:opacity-90 transition-opacity"
            >
              <div className="border rounded-lg p-4 h-full hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  {item.logo && (
                    <img 
                      src={item.logo} 
                      alt={`${item.displayName} logo`}
                      className="w-10 h-10 object-contain rounded-full bg-muted p-1"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.displayName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {item.type === 'player' ? 'Player' : 'Team'}
                      </span>
                      <span>•</span>
                      <span className="truncate">{item.subtitle}</span>
                    </div>
                  </div>
                </div>
                {item.type === 'player' && 'position' in item && item.position && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {item.position}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="bg-muted p-6 rounded-full inline-flex mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No results found</h2>
          <p className="text-muted-foreground">
            We couldn't find any players or teams matching "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
