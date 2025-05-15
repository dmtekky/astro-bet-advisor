
import { useQuery } from '@tanstack/react-query';
import { supabase, fetchFromSupabase } from '@/lib/supabase';
import { Player, Team, BettingOdds, Sport, AstrologicalData } from '@/types';
import { calculateAstrologicalInfluence, getAstrologicalData } from '@/lib/astroCalc';

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
  const idField = isTeam ? 'team_id' : 'player_id';
  
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
          .eq('player_id', playerId)
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

// Calculate astrological influence on demand
export const useCalculateAstrology = (player: Player | null, date?: string) => {
  return useQuery({
    queryKey: ['astrologyCalculation', player?.id, date],
    queryFn: async () => {
      if (!player || !player.birth_date) {
        return null;
      }
      
      // Try to get from existing astrological_data first
      const existingData = await getAstrologicalData(player.id);
      if (existingData) {
        return existingData;
      }
      
      // Calculate new data if nothing exists
      const calculatedData = await calculateAstrologicalInfluence(player, date);
      return {
        id: '',
        player_id: player.id,
        favorability: calculatedData.score,
        influences: calculatedData.influences,
        details: calculatedData.details,
        timestamp: new Date().toISOString()
      };
    },
    enabled: !!player?.id && !!player?.birth_date,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Fetch ephemeris data for a specific date
export const useEphemerisData = (date: string) => {
  return useQuery({
    queryKey: ['ephemeris', date],
    queryFn: async () => {
      return fetchFromSupabase(
        'ephemeris',
        supabase
          .from('ephemeris')
          .select('*')
          .eq('date', date)
          .single(),
        'Failed to fetch ephemeris data'
      )[0];
    },
    enabled: !!date,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - ephemeris data is stable
  });
};

// Batch fetch or calculate astrological data for multiple players
export const useBatchAstrology = (players: Player[], enabled: boolean = false) => {
  return useQuery({
    queryKey: ['astrologyBatch', players.map(p => p.id).join(',')],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const results = [];
      
      for (const player of players) {
        if (player.id && player.birth_date) {
          // Try to get existing data first
          const existingData = await getAstrologicalData(player.id);
          
          if (existingData && new Date(existingData.timestamp).toDateString() === new Date().toDateString()) {
            results.push(existingData);
          } else {
            // Calculate new data
            const calculatedData = await calculateAstrologicalInfluence(player, today);
            results.push({
              id: '',
              player_id: player.id,
              favorability: calculatedData.score,
              influences: calculatedData.influences,
              details: calculatedData.details,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      return results;
    },
    enabled: enabled && players.length > 0,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};
