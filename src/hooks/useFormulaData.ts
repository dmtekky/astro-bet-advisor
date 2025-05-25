
/**
 * useFormulaData.ts - React hooks for the astrological formula calculations
 * 
 * This module provides React Query hooks to access the formula calculations
 * for players and teams, with proper caching and data synchronization.
 */

import { useQuery } from '@tanstack/react-query';
import { Player, Team, Sport } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import * as formula from '@/lib/formula';

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
  return useQuery({
    queryKey: ['player-ais', player?.id],
    queryFn: async () => {
      if (!player) return null;
      
      try {
        // Get ephemeris data for the player's birth date
        const { data: ephemerisData, error: ephemerisError } = await supabase
          .from('ephemeris')
          .select('*')
          .eq('date', player.birth_date)
          .single();
          
        if (ephemerisError || !ephemerisData) {
          console.warn('No ephemeris data found for player birth date');
          return null;
        }
        
        // Calculate AIS using the ephemeris data
        return formula.calculateAIS(player, ephemerisData);
      } catch (err) {
        console.error('Error calculating player AIS:', err);
        return null;
      }
    },
    enabled: !!player,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

/**
 * Hook to get a team's astrological score
 */
export const useTeamAstrologicalScore = (team: Team | null, players: Player[] | null) => {
  return useQuery({
    queryKey: ['team-astrological-score', team?.id],
    queryFn: async () => {
      if (!team || !players || players.length === 0) return null;
      
      try {
        // Get all player AIS scores
        const playerScores = await Promise.all(
          players.map(async (player) => {
            const { data } = usePlayerAIS(player);
            return data;
          })
        );
        
        // Filter out null scores and calculate team score
        const validScores = playerScores.filter(score => score !== null);
        if (validScores.length === 0) return null;
        
        // Calculate average AIS for the team
        const totalAIS = validScores.reduce((sum, score) => sum + (score?.score || 0), 0);
        return {
          teamId: team.id,
          averageAIS: totalAIS / validScores.length,
          playerCount: validScores.length
        };
      } catch (err) {
        console.error('Error calculating team astrological score:', err);
        return null;
      }
    },
    enabled: !!team && !!players && players.length > 0,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
  });
};

/**
 * Hook to get formula weights for a sport
 * @param sport - The sport key (e.g., 'basketball_nba')
 */
export const useFormulaWeights = (sport: string) => {
  return useQuery({
    queryKey: ['formula-weights', sport],
    queryFn: async () => {
      try {
        // Use a raw query via rpc to avoid TypeScript errors
        // This is because formula_weights isn't in the generated types yet
        const { data, error } = await (supabase.rpc as any)('get_latest_formula_weights', {
          p_sport: sport
        });
        
        if (error || !data) {
          console.warn(`No stored weights found for ${sport}, using defaults`);
          return null;
        }
        
        return data;
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
  return useQuery({
    queryKey: ['sample-calculations'],
    queryFn: async () => {
      // Get sample players and teams
      const { data: samplePlayers } = await supabase
        .from('players')
        .select('*')
        .limit(5);
        
      const { data: sampleTeams } = await supabase
        .from('teams')
        .select('*')
        .limit(2);
      
      if (!samplePlayers || samplePlayers.length === 0 || !sampleTeams || sampleTeams.length < 2) {
        throw new Error('Sample data not found');
      }
      
      // Get current ephemeris
      const { data: ephemeris } = await supabase
        .from('ephemeris')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();
        
      if (!ephemeris) {
        throw new Error('Ephemeris data not available');
      }
      
      // Return sample data structure
      return {
        date: new Date().toISOString(),
        ephemeris: ephemeris,
        playerResults: samplePlayers.map(player => ({
          player,
          ais: { score: Math.random() * 100, aspects: [] },
          kpw: Math.random() * 10
        })),
        teamResults: sampleTeams.map(team => ({
          team,
          tas: { score: Math.random() * 100, aspects: [] },
          paf: Math.random()
        })),
        teamAnalysis: {
          teamId: sampleTeams[0]?.id,
          score: Math.random() * 100,
          strengths: ['Strong offense', 'Good defense'],
          weaknesses: ['Inconsistent performance', 'Injuries'],
          recommendation: 'Consider betting on this team'
        }
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export default {
  useCurrentEphemeris,
  usePlayerAIS,
  useTeamAstrologicalScore,
  useFormulaWeights,
  useSampleCalculations
};
