import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export interface Team {
  id: string;
  external_id: number;
  name: string;
  city: string;
  abbreviation: string;
  logo_url: string | null;
  // Add other fields as needed
}

export function useTeams(leagueKey?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track the resolved league ID in state
  const [resolvedLeagueId, setResolvedLeagueId] = useState<string | null>(null);
  
  // First effect: Resolve league key to league ID
  useEffect(() => {
    async function resolveLeagueId() {
      if (!leagueKey) {
        setResolvedLeagueId(null);
        return;
      }
      
      try {
        console.log(`Looking up league with key: ${leagueKey}`);
        const { data: leagueData, error: leagueError } = await supabase
          .from('leagues')
          .select('id, name, key')
          .eq('key', leagueKey)
          .single();
          
        if (leagueError) {
          console.warn(`Could not find league with key: ${leagueKey}`, leagueError);
          setResolvedLeagueId(null);
        } else if (leagueData) {
          console.log('Found league:', leagueData);
          setResolvedLeagueId(leagueData.id);
        } else {
          console.warn('No league data returned for key:', leagueKey);
          setResolvedLeagueId(null);
        }
      } catch (err) {
        console.error('Error resolving league ID:', err);
        setResolvedLeagueId(null);
      }
    }
    
    resolveLeagueId();
  }, [leagueKey]);
  
  // Second effect: Fetch teams when league ID changes
  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching teams with leagueId:', resolvedLeagueId);
        let query = supabase
          .from('teams')
          .select('id, external_id, name, city, abbreviation, logo_url, league_id')
          .order('name', { ascending: true });
          
        if (resolvedLeagueId) {
          console.log('Filtering teams by leagueId:', resolvedLeagueId);
          query = query.eq('league_id', resolvedLeagueId);
        } else if (leagueKey) {
          console.warn(`No league found for key: ${leagueKey}, fetching all teams`);
        } else {
          console.log('No league filter applied, fetching all teams');
        }
        
        console.log('Executing teams query...');
        const { data, error: fetchError, count } = await query;
        
        if (fetchError) {
          console.error('Error fetching teams:', fetchError);
          throw fetchError;
        }
        
        console.log(`Found ${data?.length || 0} teams`);
        
        // Transform the data to match our Team interface
        const formattedTeams = (data || []).map(team => {
          const formatted = {
            id: team.id,
            external_id: team.external_id,
            name: team.name,
            city: team.city,
            abbreviation: team.abbreviation,
            logo_url: team.logo_url,
            league_id: team.league_id
          };
          console.log('Team:', formatted);
          return formatted;
        });
        
        setTeams(formattedTeams);
        console.log('Teams state updated with:', formattedTeams.length, 'teams');
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch teams'));
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTeams();
  }, [resolvedLeagueId, leagueKey]);

  // Create a map for quick lookup by team ID
  const teamMap = useMemo(() => {
    return teams.reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {} as Record<string, Team>);
  }, [teams]);
  
  // Create a map for lookup by external_id
  const teamByExternalId = useMemo(() => {
    return teams.reduce((acc, team) => {
      acc[team.external_id] = team;
      return acc;
    }, {} as Record<number, Team>);
  }, [teams]);

  return { 
    teams, 
    teamMap, 
    teamByExternalId,
    loading, 
    error 
  };
}
