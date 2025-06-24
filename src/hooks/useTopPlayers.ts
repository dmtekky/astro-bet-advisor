import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define Player interface to match what's expected by TopPlayersCarousel
interface Player {
  id: string;
  player_id: string;
  full_name: string;
  headshot_url?: string | null;
  team_id?: string | null;
  birth_date?: string | null;
  primary_number?: string | number | null;
  primary_position?: string | null;
  impact_score?: number | null;
  astro_influence_score: number;
  team_name?: string | null;
  team_abbreviation?: string | null;
  team_logo?: string | null;
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
        
        // Create players using only the fields we need, with careful handling of nulls/undefined
        const processedPlayers = (playersData || []).map((rawPlayer: RawPlayerRecord) => {
          // Create a player object with required fields, using safe defaults
          const player: Player = {
            // Use player_id for both id and player_id (player_id is the primary key)
            id: String(rawPlayer.player_id || ''),
            player_id: String(rawPlayer.player_id || ''),
            full_name: String(rawPlayer.full_name || ''),
            headshot_url: rawPlayer.headshot_url || null,
            team_id: rawPlayer.team_id || null,
            birth_date: rawPlayer.birth_date || null,
            primary_number: rawPlayer.primary_number || rawPlayer.jersey_number || null,
            primary_position: rawPlayer.primary_position || rawPlayer.position || null,
            team_name: rawPlayer.team_name || null,
            team_abbreviation: rawPlayer.team_abbreviation || null,
            impact_score: typeof rawPlayer.impact_score === 'number' ? rawPlayer.impact_score : 0,
            astro_influence_score: typeof rawPlayer.astro_influence_score === 'number' ? rawPlayer.astro_influence_score : 0,
            team_logo: rawPlayer.team_logo_url || null,
          };
          return player;
        });
        
        setPlayers(processedPlayers);
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
