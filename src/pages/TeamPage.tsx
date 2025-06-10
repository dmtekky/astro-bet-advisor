import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const isUUID = (id: string | undefined): boolean => {
  if (!id) return false;
  return UUID_REGEX.test(id);
};

// Debug log for environment variables
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_KEY ? '***' : 'missing');
console.log('Supabase client:', supabase);

// Type for chemistry data from the database
interface TeamChemistryDB {
  id: string;
  team_id: string | number;
  team_name?: string;
  team_abbreviation?: string;
  score: number;
  elements: Record<string, any> | string;
  aspects?: any;
  last_updated?: string;
  calculated_at?: string;
}

// Function to fetch team chemistry data
const fetchTeamChemistry = async (teamId: string): Promise<TeamChemistryData | null> => {
  try {
    console.log('[fetchTeamChemistry] Fetching chemistry for team ID:', teamId);
    
    // First try to get from nba_teams
    const { data: nbaTeamData, error: nbaTeamError } = await supabase
      .from('nba_teams')
      .select('chemistry_score, elemental_balance, last_astro_update')
      .eq('id', teamId)
      .single();

    if (!nbaTeamError && nbaTeamData) {
      console.log('[fetchTeamChemistry] Found chemistry data in nba_teams');
      const elementalBalance = typeof nbaTeamData.elemental_balance === 'string' 
        ? JSON.parse(nbaTeamData.elemental_balance) 
        : nbaTeamData.elemental_balance;
      
      return {
        score: nbaTeamData.chemistry_score || 50,
        elements: {
          fire: elementalBalance?.fire || 25,
          earth: elementalBalance?.earth || 25,
          air: elementalBalance?.air || 25,
          water: elementalBalance?.water || 25,
          balance: elementalBalance?.balance || 50
        },
        aspects: {
          harmonyScore: 50,
          challengeScore: 20,
          netHarmony: 50
        },
        calculatedAt: nbaTeamData.last_astro_update || new Date().toISOString()
      };
    }

    // For non-NBA teams, first get the team data to find external_id and league
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, external_id, league_id, name, abbreviation')
      .eq('id', teamId)
      .single();

    if (teamError || !teamData) {
      console.error('[fetchTeamChemistry] Could not find team data for ID:', teamId, 'Error:', teamError?.message);
      return null;
    }

    console.log('[fetchTeamChemistry] Team data:', {
      teamId,
      teamName: teamData.name,
      leagueId: teamData.league_id,
      externalId: teamData.external_id,
      abbreviation: teamData.abbreviation
    });

    // Try multiple approaches to find chemistry data
    let chemistryData: TeamChemistryDB | null = null;
    
    // For MLB teams, try with external_id first (as string)
    if (teamData.league_id === 'mlb' && teamData.external_id) {
      console.log('[fetchTeamChemistry] Trying MLB team with external_id:', teamData.external_id);
      const { data, error } = await supabase
        .from('team_chemistry')
        .select('*')
        .eq('team_id', String(teamData.external_id))
        .maybeSingle<TeamChemistryDB>();
      
      if (data && !error) {
        chemistryData = data;
        console.log('[fetchTeamChemistry] Found chemistry data using MLB external_id');
      } else {
        console.log('[fetchTeamChemistry] No chemistry data found with external_id, trying other methods...');
      }
    }

    // If not found, try with team UUID
    if (!chemistryData) {
      console.log('[fetchTeamChemistry] Trying with team UUID:', teamId);
      const { data, error } = await supabase
        .from('team_chemistry')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle<TeamChemistryDB>();
      
      chemistryData = data;
      
      if (chemistryData) {
        console.log('[fetchTeamChemistry] Found chemistry data using team UUID');
      } else {
        console.log('[fetchTeamChemistry] No chemistry data found with team UUID');
      }
    }

    // If still not found, try with team abbreviation (as a last resort)
    if (!chemistryData && teamData.abbreviation) {
      console.log('[fetchTeamChemistry] Trying with team abbreviation:', teamData.abbreviation);
      const { data, error } = await supabase
        .from('team_chemistry')
        .select('*')
        .ilike('team_id', `%${teamData.abbreviation}%`)
        .maybeSingle<TeamChemistryDB>();
      
      if (data && !error) {
        chemistryData = data;
        console.log('[fetchTeamChemistry] Found chemistry data using team abbreviation');
      } else {
        console.log('[fetchTeamChemistry] No chemistry data found with team abbreviation');
      }
    }

    if (!chemistryData) {
      console.warn('[fetchTeamChemistry] No chemistry data found for team after all attempts:', {
        teamId,
        teamName: teamData.name,
        leagueId: teamData.league_id,
        externalId: teamData.external_id,
        abbreviation: teamData.abbreviation
      });
      return null;
    }

    console.log('[fetchTeamChemistry] Found chemistry data in team_chemistry table:', {
      teamId: chemistryData.team_id,
      score: chemistryData.score,
      elements: chemistryData.elements,
      last_updated: chemistryData.last_updated
    });
    
    // Parse elements from JSON if it's a string
    let elements: Record<string, any> = {};
    try {
      const elementsData = typeof chemistryData.elements === 'string' 
        ? JSON.parse(chemistryData.elements)
        : chemistryData.elements || {};
      
      // Ensure we have all required fields with defaults
      elements = {
        fire: typeof elementsData.fire === 'number' ? elementsData.fire : 25,
        earth: typeof elementsData.earth === 'number' ? elementsData.earth : 25,
        air: typeof elementsData.air === 'number' ? elementsData.air : 25,
        water: typeof elementsData.water === 'number' ? elementsData.water : 25,
        balance: typeof elementsData.balance === 'number' ? elementsData.balance : 50,
        ...elementsData // Spread any additional properties
      };
    } catch (e) {
      console.error('[fetchTeamChemistry] Error parsing elements JSON:', e);
      elements = {
        fire: 25,
        earth: 25,
        air: 25,
        water: 25,
        balance: 50
      };
    }
    
    return {
      score: chemistryData.score || 50,
      elements: {
        fire: elements.fire || 25,
        earth: elements.earth || 25,
        air: elements.air || 25,
        water: elements.water || 25,
        balance: elements.balance || 50
      },
      aspects: {
        harmonyScore: 50,
        challengeScore: 20,
        netHarmony: 50
      },
      calculatedAt: chemistryData.last_updated || new Date().toISOString()
    };
  } catch (error) {
    console.error('[fetchTeamChemistry] Error fetching chemistry data:', error);
    return null;
  }
};
import { motion } from 'framer-motion';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle, ChevronLeft, Calendar as CalendarIcon, Check, Info, MapPin as MapPinIcon, PlusSquare, ShieldCheck, Sparkles, Star, TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import PlayerCardNew from '@/components/PlayerCardNew';
import { toast } from '../components/ui/use-toast';
import TeamRoster from '../components/TeamRoster';
import { GameCarousel } from '../components/games/GameCarousel';
import { getTeamColorStyles } from '@/utils/teamColors';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { TeamChemistryMeter } from '@/components/TeamChemistryMeter';
import { calculateImpactScore } from '../utils/calculateImpactScore';

// Type for ElementalBalance to match TeamChemistryData
interface ElementalBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
  balance: number;
}

// Type definitions for the component
interface Team {
  id: string;
  name: string;
  logo_url: string;
  city: string;
  venue?: string;
  conference?: string;
  division?: string;
  abbreviation: string;
  primary_color: string;
  secondary_color: string;
  league_id: string;
  external_id?: string | number;
  // Additional team fields
  intFormedYear?: string | number;
  strStadium?: string;
  strDescriptionEN?: string;
  // League relationship
  league?: {
    id: string;
    name: string;
    sport?: string;
  };
  [key: string]: any; // For any additional properties
}

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  // Add other team properties as needed
  venue?: { name?: string | null; city?: string | null } | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  conference?: string | null;
  division?: string | null;
  // For NBA specific data if fetched into this structure initially
  chemistry_score?: number | null;
  elemental_balance?: any | null; // Changed Json to any
  last_astro_update?: string | null;
}

// Specific type for the elemental_balance data structure from the DB
interface ElementalBalanceFromDB {
  fire?: number;
  earth?: number;
  air?: number;
  water?: number;
  balance?: number;
  synergyBonus?: number;
  diversityBonus?: number;
}

interface Player {
  id: string;
  player_id: string; // Store the original player_id
  full_name: string;
  first_name?: string;
  last_name?: string;
  headshot_url?: string;
  position?: string;
  number?: number | string | null;
  team_id?: string | null;
  team_name?: string | null;
  birth_date?: string | null;
  is_active?: boolean;
  player_current_team_abbreviation?: string;
  stats_batting_hits?: number | null;
  stats_batting_runs?: number | null;
  stats_fielding_assists?: number | null;
  impact_score?: number | null; // Added impact_score
  astro_influence?: number | null; // Added astro_influence
  [key: string]: any; // For any additional properties
} 

// Helper type for team data in games
interface GameTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo_url?: string;
  city: string;
  [key: string]: any; // For any additional properties
}

// Type for the game data from the API
interface GameData {
  id: string | number;
  game_date?: string | null;
  game_time_utc?: string | null;
  status?: string | null;
  home_team_id?: string | number | null;
  away_team_id?: string | number | null;
  home_score?: number | null;
  away_score?: number | null;
  external_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  home_team?: Team | null;
  away_team?: Team | null;
  league_id?: string | number | null;
  venue_id?: string | number | null;
  venue?: {
    name?: string | null;
    city?: string | null;
  } | null;
  astroInfluence?: string | null;
  astroEdge?: number | null;
  home_odds?: number | null;
  away_odds?: number | null;
  spread?: number | null;
  over_under?: number | null;
  season?: number | null;
  week?: number | null;
  name?: string | null;
  city?: string | null;
}

// Base Game interface with all possible fields
interface GameBase {
  id: string | number;
  game_date: string;
  game_time_utc: string;
  status: string;
  home_team_id: string | number;
  away_team_id: string | number;
  home_score: number | null;
  away_score: number | null;
  home_team: Team | null;
  away_team: Team | null;
  league_id: string | number;
  venue_id?: string | number | null;
  external_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  home_odds?: number | null;
  away_odds?: number | null;
  spread?: number | null;
  over_under?: number | null;
  season?: number | null;
  week?: number | null;
  astroInfluence?: string;
  astroEdge?: number;
  venue?: {
    name?: string | null;
    city?: string | null;
  } | null;
  name?: string | null;
  city?: string | null;
}

// Type for the processed game with required fields
type Game = Omit<GameBase, 'id' | 'home_team_id' | 'away_team_id' | 'league_id'> & {
  id: string;
  home_team_id: string;
  away_team_id: string;
  league_id: string;
  home_team: Team;
  away_team: Team;
  home_odds: number | null;
  away_odds: number | null;
  spread: number | null;
  over_under: number | null;
  astroInfluence: string;
  astroEdge: number;
  venue: {
    name: string | null;
    city: string | null;
  } | null;
};

// Type for games with non-null teams for the GameCarousel
type GameWithTeams = Game;

// Define the interfaces for team chemistry data
interface ElementalBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
  balance: number;
}

interface AspectHarmony {
  harmonyScore: number;
  challengeScore: number;
  netHarmony: number;
}

interface TeamChemistryData {
  score: number;
  elements: ElementalBalance;
  aspects?: AspectHarmony;
  calculatedAt: string;
}

const TeamPage = () => {
  // Get parameters from URL - handle both teamId and id for backward compatibility
  const params = useParams<{ teamId?: string; id?: string }>();
  const teamId = params.teamId || params.id;
  
  // Debug logs to track data flow
  console.log('[TeamPage] Team ID from URL:', teamId);
  if (!teamId) {
    console.error('[TeamPage] No team ID found in URL parameters');
  }
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [chemistry, setChemistry] = useState<TeamChemistryData | null>(null);
  const [chemistryLoading, setChemistryLoading] = useState<boolean>(true);
  
  // Type for games with non-null teams for the GameCarousel
  type GameWithTeams = Game & { home_team: Team; away_team: Team };
  
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!teamId) {
      setError('No team ID provided');
      setLoading(false);
      return;
    }

    const fetchTeamData = async (): Promise<void> => {
      try {
        setLoading(true);

        // --- NBA TEAM LOGIC ---
        // Try to fetch from nba_teams first
        console.log('[TeamPage] Fetching NBA team data for ID:', teamId);
        const isNum = teamId ? /^\d+$/.test(teamId) : false;

        let nbaTeamQuery = supabase.from('nba_teams').select('*');
        if (isUUID(teamId)) {
          nbaTeamQuery = nbaTeamQuery.eq('id', teamId);
        } else if (isNum) {
          // Ensure we're using string comparison for external_team_id
          nbaTeamQuery = nbaTeamQuery.eq('external_team_id', teamId);
        } else {
          // Assuming non-UUID, non-numeric teamId is an abbreviation
          nbaTeamQuery = nbaTeamQuery.eq('abbreviation', teamId!.toUpperCase());
        }
        const { data: nbaTeam, error: nbaTeamError } = await nbaTeamQuery.single();
        console.log('[TeamPage] NBA team query result:', { nbaTeam, nbaTeamError });

        if (nbaTeam) {
          console.log('[TeamPage] Found NBA team:', nbaTeam.name);
          // Map NBA team data to our Team interface with safe property access
          setTeam({
            id: nbaTeam.id?.toString() ?? '',
            name: nbaTeam.name ?? '',
            logo_url: nbaTeam.logo_url ?? '/placeholder-team.png',
            city: nbaTeam.city ?? '',
            // Use optional chaining and provide fallbacks for potentially undefined properties
            venue: 'str_stadium' in nbaTeam ? (nbaTeam as any).str_stadium ?? '' : '',
            conference: nbaTeam.conference ?? '',
            division: nbaTeam.division ?? '',
            abbreviation: nbaTeam.abbreviation ?? '',
            primary_color: 'primary_color' in nbaTeam ? (nbaTeam as any).primary_color ?? '#17408B' : '#17408B',
            secondary_color: 'secondary_color' in nbaTeam ? (nbaTeam as any).secondary_color ?? '#C9082A' : '#C9082A',
            league_id: 'nba',
            external_id: nbaTeam.external_team_id ?? nbaTeam.id,
            intFormedYear: 'int_formed_year' in nbaTeam ? (nbaTeam as any).int_formed_year ?? '' : '',
            strStadium: 'str_stadium' in nbaTeam ? (nbaTeam as any).str_stadium ?? '' : '',
            strDescriptionEN: 'str_description_en' in nbaTeam ? (nbaTeam as any).str_description_en ?? '' : '',
            sport: 'Basketball',
            league: { id: 'nba', name: 'NBA', sport: 'Basketball' },
          });

          // Fetch NBA players for this team, including their scores directly
          console.log('[TeamPage] Fetching players for team:', nbaTeam.external_team_id);
          const { data: nbaPlayersData, error: nbaPlayersError } = await supabase
            .from('nba_players')
            .select('*, impact_score, astro_influence') // Assuming impact_score and astro_influence columns now exist here
            .eq('team_id', nbaTeam.external_team_id);
          
          console.log('[TeamPage] Players query result:', { playerCount: nbaPlayersData?.length, error: nbaPlayersError });

          if (nbaPlayersError) {
            setError(nbaPlayersError.message);
            setLoading(false);
            return;
          }

          // Map NBA player fields to generic Player fields
          const mappedPlayers = nbaPlayersData.map((p: any) => ({
            id: p.id,
            player_id: p.external_player_id, // Ensure this is the correct ID for linking if needed elsewhere
            full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            first_name: p.first_name,
            last_name: p.last_name,
            headshot_url: p.photo_url,
            position: p.primary_position,
            number: p.jersey_number,
            team_id: p.team_id,
            team_name: nbaTeam.name,
            birth_date: p.birth_date,
            is_active: p.active,
            impact_score: p.impact_score ?? null, // Directly from nba_players table
            astro_influence: p.astro_influence ?? null, // Directly from nba_players table
          }));
          
          // Fetch chemistry data for the NBA team only
          if (nbaTeam.id) {
            const chemistryData = await fetchTeamChemistry(nbaTeam.id.toString());
            if (chemistryData) {
              console.log('[TeamPage] Setting chemistry data (NBA):', chemistryData);
              setChemistry(chemistryData);
            } else {
              console.log('[TeamPage] Using default chemistry data (NBA)');
              setChemistry({
                score: 50,
                elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
                aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
                calculatedAt: new Date().toISOString()
              });
            }
          } else {
            console.warn('[TeamPage] NBA team id is missing, skipping chemistry fetch.');
            setChemistry({
              score: 50,
              elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
              aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
              calculatedAt: new Date().toISOString()
            });
          }

          // Sort players by impact score (descending) and then by last name (ascending)
          const sortedPlayers = [...mappedPlayers].sort((a, b) => {
            const scoreA = a.impact_score ? parseFloat(String(a.impact_score)) : 0;
            const scoreB = b.impact_score ? parseFloat(String(b.impact_score)) : 0;
            
            // Sort by impact score in descending order
            if (scoreA > scoreB) return -1;
            if (scoreA < scoreB) return 1;
            
            // If scores are equal, sort by last name
            return (a.last_name || '').localeCompare(b.last_name || '');
          });

          setPlayers(sortedPlayers);
          setTopPlayers(sortedPlayers.slice(0, 4));
          setLoading(false);
          return;
        }
        // --- END NBA TEAM LOGIC ---

        // Fallback: Fetch team from regular teams table (MLB/other)
        let fallbackTeamQuery = supabase.from('teams').select(`*,
            league:league_id(*)
          `);
        if (isUUID(teamId)) {
          fallbackTeamQuery = fallbackTeamQuery.eq('id', teamId);
        } else if (isNum) {
          fallbackTeamQuery = fallbackTeamQuery.eq('external_id', parseInt(teamId!, 10));
        } else {
          // Assuming non-UUID, non-numeric teamId is an abbreviation
          fallbackTeamQuery = fallbackTeamQuery.eq('abbreviation', teamId!.toUpperCase());
        }
        const { data: teamData, error: teamError } = await fallbackTeamQuery.single();

        if (teamError) {
          console.error('Error fetching team:', teamError);
          setError(teamError.message);
          setLoading(false);
          return;
        }

        console.log('[TeamPage] Fallback team data:', teamData);
        setTeam(teamData);

        // Fetch chemistry data for MLB/other leagues using the main fetchTeamChemistry function
        if (teamData && teamData.id) {
          try {
            console.log('[TeamPage] Fetching chemistry data for team ID:', teamData.id);
            const chemistryData = await fetchTeamChemistry(teamData.id);
            
            if (chemistryData) {
              console.log('[TeamPage] Setting chemistry data (MLB/Other):', chemistryData);
              setChemistry(chemistryData);
            } else {
              console.log('[TeamPage] Using default chemistry data (MLB/Other)');
              setChemistry({
                score: 50,
                elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
                aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
                calculatedAt: new Date().toISOString()
              });
            }
          } catch (chemError) {
            console.error('[TeamPage] Error fetching chemistry data (MLB/Other):', chemError);
            setChemistry({
              score: 50,
              elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
              aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
              calculatedAt: new Date().toISOString()
            });
          }
        } else {
          console.warn('[TeamPage] Fallback team id is missing, skipping chemistry fetch.');
          setChemistry({
            score: 50,
            elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
            aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
            calculatedAt: new Date().toISOString()
          });
        }
        
        // Fetch players from Supabase by matching team's external_id with baseball_players.team_id
        console.log('Fetching players for team:', teamData.name, 'abbreviation:', teamData.abbreviation);
        
        // Initialize player variables
        let playersData: any[] = [];
        let playersError: any = null;
        
        try {
          // Query all baseball players and filter by team abbreviation client-side
          // This avoids potential issues with Supabase filter formatting
          const { data, error } = await supabase
            .from('baseball_players')
            .select<'*', Player>('*'); // Specify Player type for select
          const allPlayers: Player[] = data || [];
          
          if (error) {
            console.error('Error fetching players:', error.message);
            playersError = error;
          } else if (!allPlayers || allPlayers.length === 0) {
            console.log('No players found in database');
          } else {
            // Special case for Athletics (OAK/ATH)
            const isAthletics = teamData.abbreviation.toUpperCase() === 'OAK';
            const abbreviation = teamData.abbreviation.toUpperCase();
            
            // Filter players client-side where either abbreviation field matches
            const playersForTeam = allPlayers.filter(player => {
              // Safely access fields that might not exist
              const currentTeamAbbr = player.player_current_team_abbreviation as string | null;
              const teamAbbr = (player as any).team_abbreviation as string | null;
              
              // For Athletics, check both OAK and ATH abbreviations
              if (isAthletics) {
                return (currentTeamAbbr && (currentTeamAbbr.toUpperCase() === 'OAK' || currentTeamAbbr.toUpperCase() === 'ATH')) || 
                       (teamAbbr && (teamAbbr.toUpperCase() === 'OAK' || teamAbbr.toUpperCase() === 'ATH'));
              }
              
              // For other teams, match the exact abbreviation
              return (currentTeamAbbr && currentTeamAbbr.toUpperCase() === abbreviation) || 
                     (teamAbbr && teamAbbr.toUpperCase() === abbreviation);
            });
            
            // Sort players by hits (descending) and then by last name (ascending)
            playersData = playersForTeam.sort((a, b) => {
              // Convert hits to numbers, defaulting to 0 if not available
              const hitsA = Number(a.stats_batting_hits) || 0;
              const hitsB = Number(b.stats_batting_hits) || 0;
              
              // Sort by hits in descending order
              if (hitsA > hitsB) return -1;
              if (hitsA < hitsB) return 1;
              
              // If hits are equal, sort by last name
              return ((a.last_name || '') as string).localeCompare((b.last_name || '') as string);
            });
            
            console.log('Players found for team:', teamData.abbreviation, ':', playersData.length);
            
            if (playersData.length > 0) {
              // Log first few player names for debugging
              playersData.slice(0, 3).forEach(player => {
                console.log('Player:', player.full_name, 
                          'Current Team Abbr:', player.player_current_team_abbreviation,
                          'Team Abbr:', (player as any).team_abbreviation);
              });
            }
          }
        } catch (error) {
          console.error('Exception while fetching players:', error);
          playersError = { message: String(error) };
        }

        console.log('Players found for team:', teamData.name, '(abbreviation:', teamData.abbreviation, '):', playersData?.length || 0);
        
        // If still no results, log a warning
        if (!playersData || playersData.length === 0) {
          console.warn('No players found for team after all search methods');
          playersData = [];
          playersError = null;
        }
        
        console.log('Final players data count:', playersData?.length || 0);

        if (playersError) {
          console.error('Error fetching players from Supabase:', playersError);
          toast({
            title: "Error fetching players",
            description: playersError.message,
            variant: "destructive",
          });
          setPlayers([]); // Clear players on error
          setTopPlayers([]); // Clear top players on error
        } else if (playersData && playersData.length > 0) {
          console.log('Processing player data:', playersData[0]);
          const typedPlayers = playersData.map((p: any) => {
            // Calculate impact score if not provided
            const calculatedImpactScore = p.impact_score !== undefined && p.impact_score !== null 
              ? p.impact_score 
              : calculateImpactScore({
                  stats_batting_hits: p.stats_batting_hits,
                  stats_batting_runs: p.stats_batting_runs,
                  stats_fielding_assists: p.stats_fielding_assists
                });

            const player: Player = {
              id: String(p.player_id || p.id || ''),
              player_id: String(p.player_id || ''),
              full_name: p.player_full_name || `${p.player_first_name || ''} ${p.player_last_name || ''}`.trim() || `Player ID: ${p.player_id || p.id || 'Unknown'}`,
              first_name: p.player_first_name || '',
              last_name: p.player_last_name || '',
              headshot_url: p.player_official_image_src || p.headshot_url || '/placeholder-player.png',
              position: p.player_primary_position || p.position || 'Unknown',
              number: p.player_jersey_number || p.number || 0,
              team_id: p.team_id ? String(p.team_id) : null,
              birth_date: p.player_birth_date || p.birth_date || null,
              is_active: p.player_current_roster_status !== 'Inactive',
              player_current_team_abbreviation: p.player_current_team_abbreviation || p.team_abbreviation || null,
              // Add optional properties if they exist
              ...(p.team_name && { team_name: p.team_name }),
              ...(p.team_abbreviation && { team_abbreviation: p.team_abbreviation }),
              ...(p.stats_batting_hits !== undefined && { stats_batting_hits: p.stats_batting_hits }),
              ...(p.stats_batting_runs !== undefined && { stats_batting_runs: p.stats_batting_runs }),
              ...(p.stats_fielding_assists !== undefined && { stats_fielding_assists: p.stats_fielding_assists }),
              ...(p.impact_score !== undefined && { impact_score: p.impact_score }),
              ...(p.astro_influence_score !== undefined && { astro_influence: p.astro_influence_score }), // Add astro influence from database
              impact_score: calculatedImpactScore
            };
            
            // Handle number conversion safely
            if (p.number !== undefined && p.number !== null) {
              const parsedNum = typeof p.number === 'string' 
                ? parseInt(p.number, 10) 
                : Number(p.number);
              if (!isNaN(parsedNum)) {
                player.number = parsedNum;
              }
            } else if (p.player_jersey_number !== undefined && p.player_jersey_number !== null) {
              const parsedNum = typeof p.player_jersey_number === 'string'
                ? parseInt(p.player_jersey_number, 10)
                : Number(p.player_jersey_number);
              if (!isNaN(parsedNum)) {
                player.number = parsedNum;
              }
            }
            
            return player;
          });
          
          console.log('Mapped players:', typedPlayers.length);
          
          // Update database with calculated impact scores for players that don't have them
          const updatePromises = typedPlayers.map(async (player, index) => {
            const originalPlayer = playersData[index];
            if (player.impact_score !== undefined && player.impact_score !== null && 
                (originalPlayer.impact_score === undefined || originalPlayer.impact_score === null || player.impact_score !== originalPlayer.impact_score)) {
              try {
                const { error } = await supabase
                  .from('baseball_players')
                  .update({ impact_score: player.impact_score })
                  .eq('id', player.id);
                
                if (error) {
                  console.error(`Error updating impact score for player ${player.full_name}:`, error);
                } else {
                  console.log(`Updated impact score for ${player.full_name}: ${player.impact_score}`);
                }
              } catch (err) {
                console.error(`Exception updating impact score for player ${player.full_name}:`, err);
              }
            }
          });
          
          // Wait for all updates to complete
          await Promise.all(updatePromises);
          
          setPlayers(typedPlayers);
          
          // Determine top players by position
          const sortedPlayers = [...typedPlayers].sort((a, b) => {
            const getPosValue = (pos?: string) => {
              if (!pos) return 0;
              const posLower = pos.toLowerCase();
              // Baseball positions prioritization (using primary_position)
              if (posLower.includes('pitcher') || posLower === 'p') return 10;
              if (posLower.includes('catcher') || posLower === 'c') return 9;
              if (posLower.includes('shortstop') || posLower === 'ss') return 8;
              if (posLower.includes('first') || posLower === '1b') return 7;
              if (posLower.includes('second') || posLower === '2b') return 6;
              if (posLower.includes('third') || posLower === '3b') return 5;
              if (posLower.includes('outfield') || posLower.includes('of')) return 4;
              return 3; // Default for other positions
            };
            return getPosValue(b.primary_position) - getPosValue(a.primary_position);
          });
          // Show top 4 players instead of 3
          setTopPlayers(sortedPlayers.slice(0, 4));
          
          // Fetch team chemistry data
          try {
            // First try to get chemistry data using the unified fetchTeamChemistry function
            console.log('[TeamPage] Fetching chemistry data for team ID:', teamData.id);
            const chemistry = await fetchTeamChemistry(teamData.id);
            
            if (chemistry) {
              console.log('[TeamPage] Setting chemistry data (from fetchTeamChemistry):', chemistry);
              setChemistry(chemistry);
            } else {
              // Fallback to direct query if fetchTeamChemistry returns null
              console.log('[TeamPage] No chemistry data from fetchTeamChemistry, trying direct query...');
              
              const { data: chemistryData, error: chemistryError } = await supabase
                .from('team_chemistry')
                .select('*')
                .or(`team_id.eq.${teamData.id}${teamData.external_id ? `,team_id.eq.${teamData.external_id}` : ''}`)
                .maybeSingle();

              console.log('[TeamPage] Direct chemistry data query result:', { chemistryData, chemistryError });

              if (chemistryData) {
                console.log('[TeamPage] Found chemistry data in direct query, score:', chemistryData.score);
                
                // Parse elements if it's a string
                let parsedElements: ElementalBalance = {
                  fire: 25,
                  earth: 25,
                  air: 25,
                  water: 25,
                  balance: 50
                };
                
                if (chemistryData.elements) {
                  try {
                    const elements = typeof chemistryData.elements === 'string' 
                      ? JSON.parse(chemistryData.elements) 
                      : chemistryData.elements;
                    
                    parsedElements = {
                      fire: elements.fire || 25,
                      earth: elements.earth || 25,
                      air: elements.air || 25,
                      water: elements.water || 25,
                      balance: elements.balance || 50
                    };
                  } catch (e) {
                    console.error('[TeamPage] Error parsing elements:', e);
                  }
                }

                const chemistry: TeamChemistryData = {
                  score: chemistryData.score || 50,
                  elements: parsedElements,
                  calculatedAt: chemistryData.calculated_at || chemistryData.last_updated || new Date().toISOString()
                };
                
                console.log('[TeamPage] Setting chemistry data from direct query:', chemistry);
                setChemistry(chemistry);
              } else {
                console.log('[TeamPage] No chemistry data found, using defaults');
                setChemistry({
                  score: 50,
                  elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
                  calculatedAt: new Date().toISOString()
                });
              }
            }
          } catch (error) {
            console.error('[TeamPage] Error fetching chemistry data:', error);
            setChemistry({
              score: 50,
              elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
              calculatedAt: new Date().toISOString()
            });
          } finally {
            setChemistryLoading(false);
          }
        } else {
          // No players found or playersData is null
          setPlayers([]);
          setTopPlayers([]);
          setChemistry({
            score: 50,
            elements: { fire: 25, earth: 25, air: 25, water: 25, balance: 50 },
            aspects: { harmonyScore: 50, challengeScore: 20, netHarmony: 50 },
            calculatedAt: new Date().toISOString()
          });
          setChemistryLoading(false);
        }

        // Fetch upcoming games with proper type handling
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            id,
            game_date,
            game_time_utc,
            status,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            home_team:home_team_id(id, name, abbreviation, logo_url, city),
            away_team:away_team_id(id, name, abbreviation, logo_url, city)
          `)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .gte('game_time_utc', new Date().toISOString())
          .order('game_time_utc', { ascending: true })
          .limit(6);

        if (gamesError) {
          console.error('Error fetching games:', gamesError);
          toast({
            title: 'Error loading games',
            description: gamesError.message,
            variant: 'destructive',
          });
        } else if (gamesData) {
          console.log('Fetched upcoming games:', gamesData);
          
          // Process games data to ensure it matches the Game type
          // Filter out error responses and ensure we have valid game data
          const processedGames = gamesData
            .filter((item): item is GameData => {
              // Check if this is a valid game object with required properties
              return typeof item === 'object' && 
                item !== null && 
                'id' in item && 
                !('error' in item);
            })
            .map((gameData: GameData): Game => {
            // Safely extract home team data
            const homeTeam: Team | null = gameData.home_team && 
              typeof gameData.home_team === 'object' && 
              !('error' in gameData.home_team)
                ? {
                    id: String(gameData.home_team.id || ''),
                    name: String(gameData.home_team.name || 'Unknown Team'),
                    abbreviation: String(gameData.home_team.abbreviation || 'TBD'),
                    city: String(gameData.home_team.city || 'Unknown'),
                    logo_url: gameData.home_team.logo_url,
                    primary_color: gameData.home_team.primary_color || '#000000',
                    secondary_color: gameData.home_team.secondary_color || '#FFFFFF',
                    league_id: String(gameData.home_team.league_id || gameData.league_id || 'unknown'),
                    external_id: String(gameData.home_team.external_id || gameData.home_team.id || '')
                  }
                : null;
            
            // Safely extract away team data
            const awayTeam: Team | null = gameData.away_team && 
              typeof gameData.away_team === 'object' && 
              !('error' in gameData.away_team)
                ? {
                    id: String(gameData.away_team.id || ''),
                    name: String(gameData.away_team.name || 'Unknown Team'),
                    abbreviation: String(gameData.away_team.abbreviation || 'TBD'),
                    city: String(gameData.away_team.city || 'Unknown'),
                    logo_url: gameData.away_team.logo_url,
                    primary_color: gameData.away_team.primary_color || '#000000',
                    secondary_color: gameData.away_team.secondary_color || '#FFFFFF',
                    league_id: String(gameData.away_team.league_id || gameData.league_id || 'unknown'),
                    external_id: String(gameData.away_team.external_id || gameData.away_team.id || '')
                  }
                : null;
            
            // Create the processed game object with all required fields
            const game: Game = {
              id: String(gameData.id || ''),
              game_date: String(gameData.game_date || ''),
              game_time_utc: String(gameData.game_time_utc || ''),
              status: String(gameData.status || 'Scheduled'),
              home_team_id: String(gameData.home_team_id || ''),
              away_team_id: String(gameData.away_team_id || ''),
              home_score: typeof gameData.home_score === 'number' ? gameData.home_score : null,
              away_score: typeof gameData.away_score === 'number' ? gameData.away_score : null,
              home_team: homeTeam,
              away_team: awayTeam,
              league_id: gameData.league_id ? String(gameData.league_id) : 'unknown',
              venue_id: gameData.venue_id ? String(gameData.venue_id) : 'unknown',
              // Include any additional properties with proper type handling
              ...Object.fromEntries(
                Object.entries(gameData)
                  .filter(([key]) => ![
                    'id', 'game_date', 'game_time_utc', 'status', 'home_team_id', 
                    'away_team_id', 'home_score', 'away_score', 'home_team', 'away_team',
                    'league_id', 'venue_id'
                  ].includes(key))
                  .map(([key, value]) => [key, value])
              )
            };
            
            return game;
          });
          
          setUpcomingGames(processedGames);
        }
      } catch (err: any) {
        console.error('Error in team page:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  // Zodiac sign calculation utility
  function getZodiacSign(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <div className="h-16 w-16 rounded-full bg-gray-200 mr-4" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>
          </div>
          
          <div className="mb-12">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-40 w-full bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
          
          <div className="mb-12">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
            <div className="h-64 w-full bg-gray-200 rounded-lg" />
          </div>
          
          <div className="mb-12">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 w-full bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  const teamColors = getTeamColorStyles(team);

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8"
      style={{ background: teamColors.gradientBg }}
    >
      <div className="container pb-12 pt-0 px-4 md:px-6 mx-auto">
        
        {/* Team Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 mt-1.5"
        >
          <div className="flex-shrink-0 w-32 h-32 md:w-42 md:h-42">
            {team?.logo_url ? (
              <img 
                src={team.logo_url} 
                alt={`${team.name} logo`} 
                className="w-full h-full object-contain" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                <span className="text-gray-600 font-bold text-2xl">{team?.abbreviation || '?'}</span>
              </div>
            )}
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-row items-start justify-center md:justify-start space-x-3 mb-3.5">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{team?.name}</h1>
                <p className="text-slate-500 text-sm">
                  {team?.city} • {team?.venue || 'Venue N/A'}
                </p>
              </div>
              {team?.league?.name && (
                <Badge 
                  variant="outline"
                  className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 mt-2"
                  style={{ borderColor: teamColors.secondary, color: teamColors.primary }}
                >
                  {team.league.name}
                </Badge>
              )}
            </div>
          

        </div>
      </motion.div>
      
      {/* Top Players */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="-mt-1.5 mb-8 md:mb-12"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
          <Star className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
          Top Players
        </h2>
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-4 md:space-x-0 md:mx-0 md:px-0 md:grid md:gap-4 md:grid-cols-2 lg:grid-cols-4 md:justify-items-center md:overflow-visible">
          {topPlayers.length > 0 ? topPlayers.slice(0, 4).map(player => {
            // Calculate team average astro influence for the glow effect
            const teamAverageAstroInfluence = players.length > 0 
              ? players.reduce((sum, p) => sum + (p.astro_influence || 0), 0) / players.length 
              : 0;
              
            return (
              <PlayerCardNew
                key={player.id}
                id={player.id}
                player_id={player.player_id}
                full_name={player.full_name}
                headshot_url={player.headshot_url || undefined}
                birth_date={player.birth_date || undefined}
                primary_number={player.number?.toString() || undefined}
                primary_position={player.position || undefined}
                impact_score={player.impact_score || 0}
                astro_influence={player.astro_influence || 0}
                teamAverageAstroInfluence={teamAverageAstroInfluence}
                linkPath={`/teams/${teamId}/players/${player.id}`}
              />
            );
          }) : (
            <p className="col-span-full text-slate-500 text-center py-10">No player data available</p>
          )}
        </div>
      </motion.div>
      
      {/* Team Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 md:mb-12"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
          <Info className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
          Team Insights
        </h2>
        
        <Card className="bg-white w-full">
          <CardContent className="p-0">
            {/* Team Chemistry Meter - Full Width */}
            <div className="w-full border rounded-lg overflow-hidden">
              {chemistry ? (
                <div className="p-4 bg-white">
                  <h3 className="font-semibold text-lg mb-4 text-slate-800 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-amber-500" />
                    Team Chemistry
                  </h3>
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <TeamChemistryMeter 
                      chemistry={chemistry} 
                      className="w-full" 
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-right">
                    Last updated: {new Date(chemistry.calculatedAt).toLocaleString()}
                  </p>
                </div>
              ) : chemistryLoading ? (
                <div className="p-6 md:p-8 rounded-lg bg-slate-50 animate-pulse w-full">
                  <h3 className="font-semibold mb-4 text-slate-700 text-lg">Team Chemistry</h3>
                  <div className="w-full h-48 md:h-64 bg-slate-200 rounded-md"></div>
                </div>
              ) : (
                <div className="p-6 md:p-8 rounded-lg bg-slate-50 border border-dashed border-slate-300 w-full">
                  <h3 className="font-semibold mb-4 text-slate-700 flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-amber-500" />
                    Team Chemistry
                  </h3>
                  <p className="text-slate-600 text-base mb-4">
                    No chemistry data is available for this team. The data needs to be generated first.
                  </p>
                  <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                    <h4 className="text-base font-medium text-amber-800 flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Admin Action Required
                    </h4>
                    <ol className="text-sm text-amber-700 list-decimal pl-5 space-y-1">
                      <li>For NBA teams, run <code className="bg-amber-100 px-1.5 py-0.5 rounded">node scripts/calculate_nba_team_chemistry_v2.js</code></li>
                      <li>For other teams, ensure the <code className="bg-amber-100 px-1.5 py-0.5 rounded">team_chemistry</code> table exists</li>
                      <li>Refresh this page to see the team chemistry meter</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional Insights - Now in a row below */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 border-t border-slate-100 mt-6 md:mt-8">
              <div className="p-4 md:p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100">
                <h3 className="font-semibold mb-3 md:mb-4 text-slate-800 text-base md:text-lg">Season Performance</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-blue-100 bg-opacity-50 border-2 border-blue-200 mr-4">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold">{Math.floor(Math.random() * 30) + 50}%</p>
                    <p className="text-xs md:text-sm text-slate-500">Win Rate</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-50">
                <h3 className="font-semibold mb-2 text-slate-700 text-sm md:text-base">Team Strength</h3>
                <p className="text-xs md:text-sm text-slate-600">
                  {team?.name} has shown exceptional performance in {
                    team?.league?.sport?.toLowerCase() === 'baseball' ? 'pitching and home runs' :
                    team?.league?.sport?.toLowerCase() === 'basketball' ? '3-point shooting and rebounding' :
                    team?.league?.sport?.toLowerCase() === 'football' ? 'rushing and defense' :
                    'key performance metrics'
                  } this season.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-50 md:col-span-2 lg:col-span-1">
                <h3 className="font-semibold mb-2 text-slate-700 text-sm md:text-base">Cosmic Influence</h3>
                <p className="text-xs md:text-sm text-slate-600">
                  The {team?.name} are currently under the influence of {
                    ['Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'][Math.floor(Math.random() * 5)]
                  }, suggesting favorable conditions for their upcoming games, especially during {
                    ['full moon', 'waxing moon', 'new moon'][Math.floor(Math.random() * 3)]
                  } periods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Upcoming Games */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8 md:mb-12 mt-8"
      >
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
          Upcoming Games
        </h2>
        
        {upcomingGames.length > 0 ? (
          <GameCarousel 
            games={upcomingGames
              .filter((game): game is GameWithTeams => (
                  !!game.home_team && 
                  !!game.away_team
                ))
                .map(game => ({
                  ...game,
                  home_team: game.home_team,
                  away_team: game.away_team,
                  astroInfluence: game.astroInfluence || ['Favorable Moon', 'Rising Mars', 'Jupiter Aligned'][Math.floor(Math.random() * 3)],
                  astroEdge: game.astroEdge || Math.random() * 15 + 5
                }))
              }
              defaultLogo="/placeholder-team.png"
              className="mt-6 -ml-5"
            />
          ) : (
            <p className="text-center py-8 text-slate-500">No upcoming games scheduled</p>
          )}
        </motion.div>
        
        {/* Team Roster */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-4 md:mb-6" 
        >
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
            <Users className="mr-2 h-5 w-5 md:h-6 md:w-6" style={{ color: teamColors.primary }} />
            Team Roster
          </h2>
          
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TeamRoster 
              players={players.map(player => ({
                id: player.id,
                player_id: player.player_id,
                full_name: player.full_name,
                first_name: player.first_name,
                last_name: player.last_name,
                position: player.position,
                number: player.number,
                headshot_url: player.headshot_url,
                is_active: player.is_active,
                team_id: player.team_id,
                team_name: player.team_name,
                stats_batting_hits: player.stats_batting_hits,
                stats_batting_runs: player.stats_batting_runs,
                stats_fielding_assists: player.stats_fielding_assists,
                impact_score: player.impact_score
              }))} 
              teamId={teamId || ''} 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeamPage;
