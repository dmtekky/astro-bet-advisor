
import { useQuery } from '@tanstack/react-query';
import { supabase, fetchFromSupabase } from '@/lib/supabase';
import { Player, Team, BettingOdds, Sport, AstrologicalData } from '@/types';

// Fetch players by sport
export const usePlayersBySport = (sport: Sport) => {
  return useQuery({
    queryKey: ['players', sport],
    queryFn: async () => {
      return fetchFromSupabase<Player>(
        'players',
        supabase
          .from('players')
          .select('*')
          .eq('sport', sport)
          .order('name'),
        `Failed to fetch ${sport} players`
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch teams by sport
export const useTeamsBySport = (sport: Sport) => {
  return useQuery({
    queryKey: ['teams', sport],
    queryFn: async () => {
      return fetchFromSupabase<Team>(
        'teams',
        supabase
          .from('teams')
          .select('*')
          .eq('sport', sport)
          .order('name'),
        `Failed to fetch ${sport} teams`
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch betting odds for a player or team
export const useBettingOdds = (id: string, isTeam: boolean = false) => {
  const idField = isTeam ? 'teamId' : 'playerId';
  
  return useQuery({
    queryKey: ['bettingOdds', id, isTeam],
    queryFn: async () => {
      return fetchFromSupabase<BettingOdds>(
        'betting_odds',
        supabase
          .from('betting_odds')
          .select('*')
          .eq(idField, id)
          .order('timestamp', { ascending: false })
          .limit(5),
        'Failed to fetch betting odds'
      );
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - odds change frequently
  });
};

// Fetch astrological data for a player
export const useAstrologicalData = (playerId: string) => {
  return useQuery({
    queryKey: ['astrology', playerId],
    queryFn: async () => {
      const data = await fetchFromSupabase<AstrologicalData>(
        'astrological_data',
        supabase
          .from('astrological_data')
          .select('*')
          .eq('playerId', playerId)
          .order('timestamp', { ascending: false })
          .limit(1),
        'Failed to fetch astrological data'
      );
      
      return data[0] || null;
    },
    enabled: !!playerId,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours - astrological data doesn't change frequently
  });
};
