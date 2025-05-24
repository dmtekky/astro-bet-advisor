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
  const [loading, setLoading] = useState(true); // True initially, covers resolution + fetch
  const [error, setError] = useState<Error | null>(null);
  const [resolvedLeagueId, setResolvedLeagueId] = useState<string | null>(null);
  const [isLeagueResolutionComplete, setIsLeagueResolutionComplete] = useState(false);

  // Effect 1: Resolve league key to league ID
  useEffect(() => {
    // Reset resolution status when leagueKey changes
    setIsLeagueResolutionComplete(false);
    setResolvedLeagueId(null); // Clear previous resolved ID
    async function resolve() {
      if (!leagueKey) {
        setResolvedLeagueId(null);
        setIsLeagueResolutionComplete(true);
        return;
      }
      
      try {
        console.log(`[useTeams] Looking up league with key: ${leagueKey}`);
        
        // First try to get from cache if available
        const cacheKey = `league_${leagueKey}`;
        const cachedLeague = localStorage.getItem(cacheKey);
        
        if (cachedLeague) {
          try {
            const leagueData = JSON.parse(cachedLeague);
            console.log('[useTeams] Using cached league data:', leagueData);
            setResolvedLeagueId(leagueData.id);
            setIsLeagueResolutionComplete(true);
            return;
          } catch (e) {
            console.warn('[useTeams] Error parsing cached league data, fetching fresh:', e);
          }
        }
        
        // If not in cache or invalid, fetch from API
        const { data: leagueDataArray, error: leagueFetchError } = await supabase
          .from('leagues')
          .select('id, name, key')
          .eq('key', leagueKey);

        let leagueData = null;
        let leagueError = leagueFetchError;

        if (!leagueError && leagueDataArray) {
          if (leagueDataArray.length > 1) {
            console.error(`[useTeams] Multiple leagues found for key '${leagueKey}'. This indicates a data issue. Found:`, leagueDataArray);
            // leagueData remains null, subsequent logic will treat as not found
          } else if (leagueDataArray.length === 1) {
            leagueData = leagueDataArray[0];
          }
        }
        
        if (leagueError || !leagueData) {
          console.warn(`[useTeams] Could not find league with key: ${leagueKey}`, leagueError);
          // Try a case-insensitive search as fallback
          let caseInsensitiveData = null;
          try {
            const { data: caseInsensitiveArray, error: ilikeError } = await supabase
              .from('leagues')
              .select('id, name, key')
              .ilike('key', leagueKey);
            
            if (!ilikeError && caseInsensitiveArray) {
              if (caseInsensitiveArray.length > 1) {
                console.error(`[useTeams] Multiple leagues found for case-insensitive key '${leagueKey}'. Found:`, caseInsensitiveArray);
                // Treat as not found
              } else if (caseInsensitiveArray.length === 1) {
                caseInsensitiveData = caseInsensitiveArray[0];
              }
            } else if (ilikeError) {
              console.warn('[useTeams] Case-insensitive league search itself failed:', ilikeError);
            }
          } catch (e) {
            console.warn('[useTeams] Case-insensitive league search failed:', e);
          }
            
          if (caseInsensitiveData) {
            console.log('[useTeams] Found league with case-insensitive search:', caseInsensitiveData);
            // Cache the result
            localStorage.setItem(cacheKey, JSON.stringify(caseInsensitiveData));
            setResolvedLeagueId(caseInsensitiveData.id);
            setIsLeagueResolutionComplete(true);
          } else {
            console.warn('[useTeams] No league data found for key (case-insensitive):', leagueKey);
            setResolvedLeagueId(null);
            setIsLeagueResolutionComplete(true);
          }
        } else {
          console.log('[useTeams] Found league:', leagueData);
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify(leagueData));
          setResolvedLeagueId(leagueData.id);
          setIsLeagueResolutionComplete(true);
        }
      } catch (err) {
        console.error('[useTeams] Error resolving league ID:', err);
        setResolvedLeagueId(null);
        setIsLeagueResolutionComplete(true); // Mark resolution complete even on error
      }
    }
    
    resolve();
  }, [leagueKey]);

  // Effect 2: Fetch teams when league ID or resolution status changes
  useEffect(() => {
    async function fetch() {
      // If a leagueKey is specified, wait for its resolution to complete.
      if (leagueKey && !isLeagueResolutionComplete) {
        console.log(`[useTeams] Waiting for league resolution of key: '${leagueKey}'.`);
        // setLoading(true); // Initial loading state should cover this period
        return;
      }

      console.log(`[useTeams] Proceeding to fetch teams. LeagueKey: '${leagueKey}', ResolvedId: '${resolvedLeagueId}', ResolutionComplete: ${isLeagueResolutionComplete}`);
      setLoading(true);
      setError(null);
      
      try {
        // This log is now part of the general proceeding log above
        let query = supabase
          .from('teams')
          .select('id, external_id, name, city, abbreviation, logo_url, league_id, created_at, updated_at')
          .order('name', { ascending: true });
          
        if (resolvedLeagueId) {
          console.log('[useTeams] Filtering teams by leagueId:', resolvedLeagueId);
          query = query.eq('league_id', resolvedLeagueId);
        } else if (leagueKey) {
          console.warn(`[useTeams] League resolution for key '${leagueKey}' complete but no ID found. Fetching all teams as fallback.`);
        } else {
          console.log('[useTeams] No leagueKey provided. Fetching all teams.');
        }
        
        console.log('[useTeams] Executing teams query...');
        const { data, error: fetchError, count } = await query;
        
        if (fetchError) {
          console.error('[useTeams] Error fetching teams:', fetchError);
          throw fetchError;
        }
        
        console.log(`[useTeams] Found ${data?.length || 0} teams`);
        
        // Transform the data to match our Team interface
        const formattedTeams = (data || []).map(team => {
          const formatted = {
            id: team.id,
            external_id: team.external_id,
            name: team.name,
            city: team.city,
            abbreviation: team.abbreviation,
            logo_url: team.logo_url,
            league_id: team.league_id,
            created_at: team.created_at,
            updated_at: team.updated_at
          };
          // console.log('[useTeams] Team:', formatted); // Too verbose for many teams
          return formatted;
        });
        
        setTeams(formattedTeams);
        console.log('[useTeams] Teams state updated with:', formattedTeams.length, 'teams');
      } catch (err) {
        console.error('[useTeams] Error in fetchTeams function:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch teams'));
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetch();
  }, [resolvedLeagueId, leagueKey, isLeagueResolutionComplete]);

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
