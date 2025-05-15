
/**
 * useFormulaData.ts - React hooks for the astrological formula calculations
 * 
 * This module provides React Query hooks to access the formula calculations
 * for players and teams, with proper caching and data synchronization.
 */

import { useQuery } from '@tanstack/react-query';
import { Player, Team, Sport } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateAIS, 
  calculateKPW, 
  calculateTAS,
  calculatePAF,
  calculateOAS,
  runTeamAnalysis
} from '@/lib/formula';

/**
 * Hook to get current ephemeris data
 */
export const useCurrentEphemeris = () => {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['ephemeris', today],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('ephemeris')
          .select('*')
          .eq('date', today)
          .single();
          
        if (error) {
          console.error('Error fetching ephemeris data:', error);
          return null;
        }
        
        return data;
      } catch (err) {
        console.error('Exception fetching ephemeris data:', err);
        return null;
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - ephemeris data doesn't change for the day
  });
};

/**
 * Hook to get a player's astrological impact score
 */
export const usePlayerAIS = (player: Player | null) => {
  const { data: ephemeris, isLoading: ephemerisLoading } = useCurrentEphemeris();
  
  return useQuery({
    queryKey: ['ais', player?.id, ephemeris?.date],
    queryFn: async () => {
      if (!player || !player.birth_date || !ephemeris) {
        return null;
      }
      
      // Calculate AIS
      const ais = calculateAIS(player, ephemeris);
      
      // Calculate KPW
      const kpw = calculateKPW(
        ais.score, 
        player.win_shares || 0, 
        player.sport === 'nba' ? 5.0 : 3.0 // Different baseline for different sports
      );
      
      return {
        date: ephemeris.date,
        player_id: player.id,
        ais: ais,
        kpw: kpw
      };
    },
    enabled: !!player?.id && !!player?.birth_date && !!ephemeris,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};

/**
 * Hook to get a team's astrological score
 */
export const useTeamAstrologicalScore = (team: Team | null, players: Player[] | null) => {
  const { data: ephemeris, isLoading: ephemerisLoading } = useCurrentEphemeris();
  
  return useQuery({
    queryKey: ['team-astro', team?.id, ephemeris?.date, players?.length],
    queryFn: async () => {
      if (!team || !players || players.length === 0 || !ephemeris) {
        return null;
      }
      
      // Get current odds
      const { data: latestOdds } = await supabase
        .from('betting_odds')
        .select('*')
        .eq('team_id', team.id)
        .order('timestamp', { ascending: false })
        .limit(1);
      
      const oddsData = latestOdds && latestOdds.length > 0 ? {
        moneyLine: latestOdds[0].odds,
        type: latestOdds[0].type,
        line: latestOdds[0].line,
        bookmaker: latestOdds[0].bookmaker
      } : null;
      
      // Run full team analysis
      return runTeamAnalysis(players, team, ephemeris, oddsData);
    },
    enabled: !!team?.id && !!players && players.length > 0 && !!ephemeris,
    staleTime: 3 * 60 * 60 * 1000, // 3 hours
  });
};

/**
 * Hook to get formula weights for a sport
 */
export const useFormulaWeights = (sport: Sport) => {
  return useQuery({
    queryKey: ['formula-weights', sport],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('formula_weights')
          .select('*')
          .eq('sport', sport)
          .order('last_updated', { ascending: false })
          .limit(1);
          
        if (error || !data || data.length === 0) {
          return null;
        }
        
        return data[0];
      } catch (err) {
        console.error('Exception fetching formula weights:', err);
        return null;
      }
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
};

/**
 * Hook to run sample calculations (useful for demonstrations)
 */
export const useSampleCalculations = () => {
  const { data: ephemeris } = useCurrentEphemeris();
  
  return useQuery({
    queryKey: ['sample-calculations', ephemeris?.date],
    queryFn: async () => {
      if (!ephemeris) {
        return null;
      }
      
      // Import the sample calculation functions
      const { runSamplePlayerCalculation, runSampleTeamCalculation } = await import('@/lib/formula');
      
      // Run sample calculations
      const playerExample = runSamplePlayerCalculation(ephemeris);
      const teamExample = runSampleTeamCalculation(ephemeris);
      
      return {
        date: ephemeris.date,
        playerExample,
        teamExample
      };
    },
    enabled: !!ephemeris,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export default {
  useCurrentEphemeris,
  usePlayerAIS,
  useTeamAstrologicalScore,
  useFormulaWeights,
  useSampleCalculations
};
