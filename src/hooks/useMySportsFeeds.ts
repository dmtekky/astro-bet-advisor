import { useState, useEffect } from 'react';

interface MySportsFeedsPlayerResponse {
  players: {
    player: {
      id: number;
      firstName: string;
      lastName: string;
      primaryPosition: string;
      jerseyNumber: string;
      currentTeam: {
        id: number;
        abbreviation: string;
      };
      officialImageSrc?: string;
      age?: number;
      height?: string;
      weight?: number;
      birthDate?: string;
      birthCity?: string;
      birthCountry?: string;
      rookie?: boolean;
    }[];
  };
}

interface PlayerData {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  jerseyNumber: string;
  teamId: number;
  teamAbbreviation: string;
  imageUrl?: string;
  age?: number;
  height?: string;
  weight?: number;
  birthDate?: string;
  birthCity?: string;
  birthCountry?: string;
  rookie?: boolean;
}

export const useMySportsFeeds = () => {
  const apiKey = import.meta.env.MY_SPORTS_FEEDS_API_KEY || '8844c949-54d6-4e72-ba93-203dfd';
  const password = import.meta.env.MY_SPORTS_FEEDS_PASSWORD || 'MYSPORTSFEEDS';

  // Base64 encode the credentials
  const credentials = btoa(`${apiKey}:${password}`);

  const fetchPlayers = async (
    league: string = 'mlb', 
    season: string = '2025-regular',
    team?: string
  ): Promise<PlayerData[]> => {
    try {
      let url = `https://api.mysportsfeeds.com/v2.1/pull/${league}/players.json?season=${season}`;
      
      // Add team filter if provided
      if (team) {
        url += `&team=${team}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: MySportsFeedsPlayerResponse = await response.json();
      
      // Transform the response into our format
      return data.players.player.map(player => ({
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        fullName: `${player.firstName} ${player.lastName}`,
        position: player.primaryPosition,
        jerseyNumber: player.jerseyNumber,
        teamId: player.currentTeam.id,
        teamAbbreviation: player.currentTeam.abbreviation,
        imageUrl: player.officialImageSrc,
        age: player.age,
        height: player.height,
        weight: player.weight,
        birthDate: player.birthDate,
        birthCity: player.birthCity,
        birthCountry: player.birthCountry,
        rookie: player.rookie
      }));
    } catch (error) {
      console.error('Error fetching players from MySportsFeeds:', error);
      return [];
    }
  };

  return { fetchPlayers };
};

// Hook to fetch players for a specific team
export const useTeamPlayers = (teamAbbreviation: string) => {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { fetchPlayers } = useMySportsFeeds();

  useEffect(() => {
    const getPlayers = async () => {
      try {
        setLoading(true);
        const data = await fetchPlayers('mlb', '2025-regular', teamAbbreviation);
        setPlayers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    if (teamAbbreviation) {
      getPlayers();
    }
  }, [teamAbbreviation]);

  return { players, loading, error };
};
