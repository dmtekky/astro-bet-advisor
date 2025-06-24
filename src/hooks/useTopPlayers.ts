import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define Player interface to match what's expected by TopPlayersCarousel
interface Player {
  id: string;
  player_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  headshot_url?: string | null;
  team_id: string | null;
  team_abbreviation: string | null;
  birth_date: string | null;
  primary_number: string | number | null;
  primary_position: string | null;
  jersey_number: number | null;
  age: number | null;
  height: string | null;
  weight: number | null;
  bats: string | null;
  throws: string | null;
  position: string | null;
  impact_score: number;
  astro_influence_score: number;
  stats_batting_avg: number | null;
  stats_batting_hits: number | null;
  stats_batting_homeruns: number | null;
  stats_batting_runs: number | null;
  stats_batting_runs_batted_in: number | null;
  stats_fielding_assists: number | null;
  stats_fielding_errors: number | null;
  stats_games_played: number | null;
  team_logo?: string | null;
  league_id: string;
}

// Type for raw database records - unknown structure
type RawPlayerRecord = Record<string, any>;

const useTopPlayers = (limit = 6) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        setLoading(true);
        // Query baseball_players table, selecting all fields
        const { data: playersData, error } = await supabase
          .from('baseball_players')
          .select('*')
          .not('astro_influence_score', 'is', null)
          .order('astro_influence_score', { ascending: false })
          .limit(limit);

        if (error) throw new Error(error.message);
        
        // Map database records to Player interface with proper field mapping
        const processedPlayers = (playersData || []).map((rawPlayer: RawPlayerRecord) => {
          // Ensure we have required fields
          const playerId = String(rawPlayer.player_id || '');
          if (!playerId) return null; // Skip invalid records
          
          const firstName = String(rawPlayer.player_first_name || '');
          const lastName = String(rawPlayer.player_last_name || '');
          const fullName = String(rawPlayer.player_full_name || `${firstName} ${lastName}`.trim() || '');
          
          // Create player object with exact field mapping from database schema
          const player: Player = {
            id: playerId,
            player_id: playerId,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            headshot_url: rawPlayer.player_official_image_src || null,
            team_id: rawPlayer.team_id || null,
            team_abbreviation: rawPlayer.team_abbreviation || null,
            birth_date: rawPlayer.player_birth_date || null,
            primary_number: rawPlayer.player_jersey_number || null,
            primary_position: rawPlayer.player_primary_position || null,
            jersey_number: rawPlayer.player_jersey_number || null,
            age: rawPlayer.player_age || null,
            height: rawPlayer.player_height || null,
            weight: rawPlayer.player_weight || null,
            bats: rawPlayer.player_handedness_bats || null,
            throws: rawPlayer.player_handedness_throws || null,
            position: rawPlayer.player_primary_position || null,
            impact_score: rawPlayer.impact_score || 0,
            astro_influence_score: rawPlayer.astro_influence_score || 0,
            stats_batting_avg: rawPlayer.stats_batting_batting_avg || null,
            stats_batting_hits: rawPlayer.stats_batting_hits || null,
            stats_batting_homeruns: rawPlayer.stats_batting_homeruns || null,
            stats_batting_runs: rawPlayer.stats_batting_runs || null,
            stats_batting_runs_batted_in: rawPlayer.stats_batting_runs_batted_in || null,
            stats_fielding_assists: rawPlayer.stats_fielding_assists || null,
            stats_fielding_errors: rawPlayer.stats_fielding_errors || null,
            stats_games_played: rawPlayer.stats_games_played || null,
            team_logo: null, // Will be set from team data if available
            league_id: 'mlb' // Default to MLB for baseball_players
          };
          
          return player;
        });
        
        // Filter out any null entries from invalid player records
        setPlayers(processedPlayers.filter((p): p is Player => p !== null));
      } catch (err: any) {
        console.error('Error fetching top baseball players:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch top players'));
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlayers();
  }, [limit]);

  return { players, loading, error };
};

export default useTopPlayers;
