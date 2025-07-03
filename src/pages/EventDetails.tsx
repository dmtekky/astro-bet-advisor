import React, { useEffect, useState, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  BarChart2, 
  Calendar, 
  Clock, 
  Users, 
  Zap, 
  AlertCircle, 
  Loader2, 
  ThumbsUp, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  XCircle, 
  Info 
} from 'lucide-react';

// Import services and utilities
import { fetchScheduleById } from '@/services/scheduleService';
import { fetchPlayersByTeam, type Player as DBPlayer } from '@/services/playerService';
import { 
  calculateAstrologicalImpact, 
  type AstroData, 
  type PlayerStats 
} from '@/lib/astroFormula';
import { fetchTeamById } from '@/services/teamService';

// ===== TYPE DEFINITIONS =====
interface AstroInfluence {
  aspect: string;
  influence: number;
  description: string;
}

// Extend the Schedule type to include all necessary fields
interface GameDetails {
  id: string | number;
  home_team: string;
  away_team: string;
  home_team_id?: string;
  away_team_id?: string;
  game_time?: string | null;
  start_time?: string | null;
  status?: string;
  sport?: string;
  venue?: string | null;
  // Allow any additional properties that might come from the API
  [key: string]: unknown;
}

// Extend the PlayerStats interface from astroFormula
interface PlayerStatsUI {
  id: string;
  stats?: Record<string, unknown>;
  team: string;
  team_id?: string;
  astro_influence: number;
  win_shares: number; // Required to match PlayerStats
  name: string;
  position: string;
  image_url?: string;
  jersey_number?: number;
  sport?: string;
  birth_date?: string;
}

// ===== UTILITY FUNCTIONS =====
/**
 * Normalizes a team name for comparison by removing common variations and special characters
 */
function normalizeTeamName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special characters
    .replace(/\b(?:basketball|football|baseball|hockey|team|club|fc|united|city|state|athletic|athletics|sports)\b/gi, '') // Remove common sports terms
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculates the Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates string similarity score (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein distance based similarity
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

/**
 * Finds the best matching team from a list using fuzzy matching
 */
function findBestTeamMatch(teamName: string, teams: any[]): any | null {
  if (!teamName || !teams?.length) return null;
  
  // Common team name mappings for MLB
  const mlbTeamMappings: Record<string, string[]> = {
    'dodgers': ['la', 'losangeles', 'ladodgers'],
    'yankees': ['ny', 'newyork', 'nyy'],
    'redsox': ['boston', 'bos', 'redsox'],
    'cubs': ['chicago', 'chc'],
    'whitesox': ['chicago', 'chw', 'whitesox'],
    'mets': ['nym', 'newyork'],
    'phillies': ['phi', 'philadelphia'],
    'nationals': ['was', 'wsh', 'washington'],
    'marlins': ['mia', 'miami', 'fla', 'florida'],
    'braves': ['atl', 'atlanta'],
    'cardinals': ['stl', 'stlouis'],
    'brewers': ['mil', 'milwaukee'],
    'reds': ['cin', 'cincinnati'],
    'pirates': ['pit', 'pittsburgh'],
    'giants': ['sf', 'sanfrancisco', 'sfg'],
    'padres': ['sd', 'sandiego'],
    'diamondbacks': ['ari', 'arizona', 'dbacks'],
    'rockies': ['col', 'colorado'],
    'astros': ['hou', 'houston', 'astros'],
    'rangers': ['tex', 'texas'],
    'athletics': ['oak', 'oakland', 'as'],
    'angels': ['laa', 'losangeles', 'anaheim'],
    'mariners': ['sea', 'seattle'],
    'bluejays': ['tor', 'toronto'],
    'orioles': ['bal', 'baltimore'],
    'rays': ['tb', 'tampabay'],
    'royals': ['kc', 'kansascity'],
    'tigers': ['det', 'detroit'],
    'twins': ['min', 'minnesota'],
    'guardians': ['cle', 'cleveland'],
    'indians': ['cle', 'cleveland']
  };

  const normalizedSearch = normalizeTeamName(teamName);
  console.log(`[TEAM MATCH] Searching for team: '${teamName}' (normalized: '${normalizedSearch}')`);
  
  // First try exact match on normalized names
  const exactMatch = teams.find(t => 
    t.name && normalizeTeamName(t.name) === normalizedSearch
  );
  
  if (exactMatch) {
    console.log(`[TEAM MATCH] Found exact match: '${exactMatch.name}'`);
    return exactMatch;
  }
  
  // Try matching against display_name, abbreviation, and alternate names
  const altMatch = teams.find(t => {
    // Check display name
    if (t.display_name && normalizeTeamName(t.display_name) === normalizedSearch) {
      return true;
    }
    
    // Check abbreviation
    if (t.abbreviation && normalizeTeamName(t.abbreviation) === normalizedSearch) {
      return true;
    }
    
    // Check MLB team mappings
    const teamKey = Object.keys(mlbTeamMappings).find(key => 
      mlbTeamMappings[key].includes(normalizedSearch)
    );
    
    if (teamKey && t.name && normalizeTeamName(t.name).includes(teamKey)) {
      return true;
    }
    
    return false;
  });
  
  if (altMatch) {
    console.log(`[TEAM MATCH] Found alternate field match: '${altMatch.name}'`);
    return altMatch;
  }
  
  // If no exact match, try fuzzy matching with improved scoring for MLB teams
  const matches = teams.map(team => {
    if (!team.name) return { team, score: 0 };
    
    const normalizedTeamName = normalizeTeamName(team.name);
    const similarity = calculateSimilarity(normalizedSearch, normalizedTeamName);
    
    // Check for common abbreviations (e.g., "LAD" for "Los Angeles Dodgers")
    const normalizedAbbreviation = team.abbreviation ? normalizeTeamName(team.abbreviation) : '';
    const isAbbreviation = normalizedAbbreviation && 
      (normalizedSearch === normalizedAbbreviation ||
       normalizedSearch.includes(normalizedAbbreviation) ||
       normalizedAbbreviation.includes(normalizedSearch));
    
    // Check MLB team mappings
    const isMlbTeam = Object.entries(mlbTeamMappings).some(([key, aliases]) => {
      if (normalizedTeamName.includes(key)) {
        return aliases.some(alias => normalizedSearch === alias);
      }
      return false;
    });
    
    // Adjust score based on match type
    let score = similarity;
    if (isAbbreviation) score = Math.max(similarity, 0.8);
    if (isMlbTeam) score = Math.max(similarity, 0.9);
    
    return { team, score };
  }).filter(match => match.score > 0.5); // Lower threshold to catch more potential matches
  
  if (matches.length > 0) {
    // Sort by score in descending order
    matches.sort((a, b) => b.score - a.score);
    const bestMatch = matches[0];
    console.log(`[TEAM MATCH] Found fuzzy match: '${bestMatch.team.name}' (score: ${bestMatch.score.toFixed(2)})`);
    return bestMatch.team;
  }
  
  console.log(`[TEAM MATCH] No match found for '${teamName}'`);
  return null;
}

/**
 * Fetches the latest astrological data using playerAstroService
 */
async function fetchLatestAstrologicalData() {
  try {
    // Import the playerAstroService
    const { generatePlayerAstroData } = await import('@/lib/playerAstroService');
    
    // Use current date for the astrological data
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Generate the data using playerAstroService
    const astroData = await generatePlayerAstroData(currentDate);
    
    // Return the data in the expected format
    return {
      moon_phase: astroData.moon.phase,
      moon_sign: astroData.moon.sign,
      mercury_sign: astroData.planets.mercury.sign,
      venus_sign: astroData.planets.venus.sign,
      mars_sign: astroData.planets.mars.sign,
      jupiter_sign: astroData.planets.jupiter.sign,
      saturn_sign: astroData.planets.saturn.sign,
      uranus_sign: astroData.planets.uranus.sign,
      neptune_sign: astroData.planets.neptune.sign,
      pluto_sign: astroData.planets.pluto.sign,
      sun_moon_aspect: astroData.aspects.sun_moon,
      sun_mars_aspect: astroData.aspects.sun_mars,
      sun_jupiter_aspect: astroData.aspects.sun_jupiter,
      sun_saturn_aspect: astroData.aspects.sun_saturn,
      moon_venus_aspect: astroData.aspects.moon_venus,
      moon_mars_aspect: astroData.aspects.moon_mars,
    };
  } catch (error) {
    console.error('Error generating astrological data:', error);
    // Fallback to default values if there's an error
    return {
      moon_phase: 0.5,
      moon_sign: 'Aries',
      mercury_sign: 'Taurus',
      venus_sign: 'Gemini',
      mars_sign: 'Cancer',
      jupiter_sign: 'Leo',
      saturn_sign: 'Virgo',
      uranus_sign: 'Libra',
      neptune_sign: 'Scorpio',
      pluto_sign: 'Sagittarius',
      sun_moon_aspect: 'conjunction',
      sun_mars_aspect: 'sextile',
      sun_jupiter_aspect: 'trine',
      sun_saturn_aspect: 'square',
      moon_venus_aspect: 'sextile',
      moon_mars_aspect: 'trine',
    };
  }
}

// Map database players to UI player stats with astrological influence
function mapPlayersToStats(players: DBPlayer[]): PlayerStatsUI[] {
  return players.map((player) => {
    const winShares = typeof (player as any).win_shares === 'number' 
      ? (player as any).win_shares 
      : 5;
    
    // Ensure player ID is a string to match PlayerStats interface
    const playerId = typeof player.id === 'number' ? String(player.id) : (player.id || '');
    
    // Safely get player name with fallback
    const playerName = typeof player.name === 'string' ? player.name : 'Unknown Player';
    
    // Create a PlayerStats object that matches the expected interface
    const playerStats: PlayerStats = {
      id: playerId,
      name: playerName,
      birth_date: typeof player.birth_date === 'string' ? player.birth_date : '',
      sport: typeof player.sport === 'string' ? player.sport : '',
      win_shares: winShares,
      stats: {},
      position: typeof player.position === 'string' ? player.position : 'Player',
    };
    
    // Create the extended PlayerStatsUI object
    return {
      ...playerStats,
      team: typeof player.team_id === 'string' ? player.team_id : '',
      team_id: typeof player.team_id === 'string' ? player.team_id : undefined,
      astro_influence: Math.round(
        Math.max(10, Math.min(100, winShares * 10 + Math.random() * 10))
      ),
      // Ensure position is always provided (required by PlayerStatsUI interface)
      position: typeof player.position === 'string' && player.position ? player.position : 'Player',
    };
  });
}

// Generate position based on sport
const getPositionsForSport = (sport: string, count: number): string[] => {
  const positions: Record<string, string[]> = {
    nba: ['PG', 'SG', 'SF', 'PF', 'C'],
    nfl: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'],
    mlb: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
    default: ['Player']
  };
  
  const sportPositions = positions[sport] || positions.default;
  return Array(count).fill(0).map((_, i) => sportPositions[i % sportPositions.length]);
};

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [homePlayers, setHomePlayers] = useState<PlayerStatsUI[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerStatsUI[]>([]);
  const [astroInfluences, setAstroInfluences] = useState<AstroInfluence[]>([]);
  const [oas, setOas] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [topPlayer, setTopPlayer] = useState<PlayerStatsUI | null>(null);
  
  // Format game date and time for display - matching Dashboard's approach
  const formatGameTime = (game: GameDetails | null) => {
    if (!game) return { date: 'TBD', time: 'TBD' };
    
    const gameTime = game.start_time || game.game_time;
    if (!gameTime) {
      console.warn('No game time found in schedule');
      return { date: 'TBD', time: 'TBD' };
    }
    
    try {
      const gameDate = new Date(gameTime);
      if (isNaN(gameDate.getTime())) {
        console.error('Invalid date:', gameTime);
        return { date: 'TBD', time: 'TBD' };
      }
      
      // Get the date components
      const dateComponents = {
        date: gameDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: gameDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      };
      
      // Add debug logging
      console.log('Formatted game time:', {
        raw: gameTime,
        date: dateComponents.date,
        time: dateComponents.time,
        timestamp: gameDate.getTime()
      });
      
      return dateComponents;
    } catch (error) {
      console.error('Error formatting game time:', error);
      return { date: 'TBD', time: 'TBD' };
    }
  };
  
  const { date: formattedDate, time: formattedTime } = formatGameTime(game);

  // Memoize the formatted date and time to prevent unnecessary recalculations
  const memoizedFormattedDate = typeof formattedDate === 'string' ? formattedDate : 'TBD';
  const memoizedFormattedTime = typeof formattedTime === 'string' ? formattedTime : 'TBD';
  
  // Safely render venue with fallback
  const renderVenue = (venue: unknown): string => {
    if (typeof venue === 'string' && venue.trim() !== '') return venue;
    return 'Venue TBD';
  };
  
  // Safely render date with fallback
  const renderDate = (date: unknown): string => {
    if (typeof date === 'string' && date.trim() !== '') return date;
    return 'TBD';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!id) {
          const errorMsg = 'No event ID provided. Please return to the dashboard and try again.';
          setError(errorMsg);
          setLoading(false);
          return;
        }
        // Fetch game details
        const schedule = await fetchScheduleById(id);
        if (!schedule) {
          setError('Game not found.');
          setLoading(false);
          return;
        }
        // Set game state
        const gameDetails: GameDetails = {
          id: schedule.id,
          home_team: schedule.home_team,
          away_team: schedule.away_team,
          home_team_id: schedule.home_team_id,
          away_team_id: schedule.away_team_id,
          game_time: schedule.game_time,
          start_time: schedule.start_time,
          status: schedule.status,
          sport: schedule.sport || 'unknown',
          venue: schedule.venue,
          ...schedule
        };
        setGame(gameDetails);
        
        // Fetch teams and players
        let homePlayersRaw = [];
        let awayPlayersRaw = [];
        try {
          // --- TEAM NAME MATCHING LOGIC ---
          // Normalization utility
          function normalizeTeamName(name: string): string {
            return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
          }

          // Log API team names (raw and normalized)
          const normHomeApi = normalizeTeamName(schedule.home_team);
          const normAwayApi = normalizeTeamName(schedule.away_team);
          console.log(`[TEAM MATCH DEBUG] Raw API home_team: '${schedule.home_team}', normalized: [${normHomeApi}]`);
          console.log(`[TEAM MATCH DEBUG] Raw API away_team: '${schedule.away_team}', normalized: [${normAwayApi}]`);

          // Fetch all teams for the sport (with fallback for type safety)
          const sportKey = (schedule as any).sport?.toUpperCase() || 'BASKETBALL';
          console.log(`[TEAM MATCH] Fetching teams for sport: ${sportKey}`);
          
          // First try to get teams for the specific sport
          const { data: sportTeams, error: sportTeamsError } = await supabase
            .from('teams')
            .select('*')
            .eq('sport', sportKey);
            
          // If no teams found for the sport or error, try getting all teams
          const { data: allTeams, error: allTeamsError } = await supabase
            .from('teams')
            .select('*');
            
          const teams = sportTeams?.length ? sportTeams : (allTeams || []);
          
          if (sportTeamsError || allTeamsError) {
            console.error('Error fetching teams:', sportTeamsError || allTeamsError);
          }
          
          console.log(`[TEAM MATCH] Found ${teams.length} teams in database`);
          
          // Log sample of team names for debugging
          if (teams.length > 0) {
            console.log('[TEAM MATCH] Sample teams in database:', 
              teams.slice(0, 5).map((t: any) => ({
                id: t.id,
                name: t.name,
                display_name: t.display_name,
                abbreviation: t.abbreviation,
                normalized: normalizeTeamName(t.name)
              }))
            );
          }
          
          // Find the best matching teams using fuzzy matching
          console.log(`[TEAM MATCH] Looking for home team: '${schedule.home_team}'`);
          const homeTeam = findBestTeamMatch(schedule.home_team, teams);
          
          console.log(`[TEAM MATCH] Looking for away team: '${schedule.away_team}'`);
          const awayTeam = findBestTeamMatch(schedule.away_team, teams);
          
          console.log('[TEAM MATCH] Matching result:', { 
            homeTeam: homeTeam ? { id: homeTeam.id, name: homeTeam.name } : 'Not found',
            awayTeam: awayTeam ? { id: awayTeam.id, name: awayTeam.name } : 'Not found'
          });
          
          // Use the matched team IDs or fall back to the schedule IDs
          const homeTeamId = homeTeam?.id || schedule.home_team_id;
          const awayTeamId = awayTeam?.id || schedule.away_team_id;
          
          console.log('Using team IDs for player fetch:', { homeTeamId, awayTeamId });

          // First attempt: Fetch players using matched team IDs
          try {
            console.log('[PLAYER FETCH] Attempting to fetch players by team IDs...');
            [homePlayersRaw, awayPlayersRaw] = await Promise.all([
              homeTeamId ? fetchPlayersByTeam(homeTeamId).catch(e => {
                console.error(`Error fetching home players for team ${homeTeamId}:`, e);
                return [];
              }) : Promise.resolve([]),
              awayTeamId ? fetchPlayersByTeam(awayTeamId).catch(e => {
                console.error(`Error fetching away players for team ${awayTeamId}:`, e);
                return [];
              }) : Promise.resolve([])
            ]);
            
            console.log(`[PLAYER FETCH] Initial fetch - Home: ${homePlayersRaw.length}, Away: ${awayPlayersRaw.length}`);
            
            // If no players found, try alternative approaches
            if (homePlayersRaw.length === 0 || awayPlayersRaw.length === 0) {
              console.log('[PLAYER FETCH] Some teams have no players, trying alternative fetch methods...');
              
              // Try to get all players and filter by team name as fallback
              try {
                const { data: allPlayers, error: playersError } = await supabase
                  .from('players')
                  .select('*');
                  
                if (playersError) throw playersError;
                
                console.log(`[PLAYER FETCH] Fetched ${allPlayers.length} total players for fallback matching`);
                
                // Helper function to find players by team name or ID
                const findPlayersByTeam = (teamId: string | null, teamName: string) => {
                  if (!allPlayers?.length) return [];
                  
                  // First try by team_id
                  if (teamId) {
                    const byId = allPlayers.filter((p: any) => p.team_id === teamId);
                    if (byId.length > 0) {
                      console.log(`[PLAYER FETCH] Found ${byId.length} players by team ID ${teamId}`);
                      return byId;
                    }
                  }
                  
                  // Then try by team name if we have a team object
                  if (teamName) {
                    const normalizedTeamName = normalizeTeamName(teamName);
                    const byName = allPlayers.filter((p: any) => 
                      p.team && normalizeTeamName(p.team) === normalizedTeamName
                    );
                    
                    if (byName.length > 0) {
                      console.log(`[PLAYER FETCH] Found ${byName.length} players by team name '${teamName}'`);
                      return byName;
                    }
                  }
                  
                  return [];
                };
                
                // Refetch home players if needed
                if (homePlayersRaw.length === 0 && (homeTeamId || schedule.home_team)) {
                  console.log(`[PLAYER FETCH] Attempting fallback fetch for home team: ${homeTeam?.name || schedule.home_team}`);
                  homePlayersRaw = findPlayersByTeam(homeTeamId, homeTeam?.name || schedule.home_team);
                }
                
                // Refetch away players if needed
                if (awayPlayersRaw.length === 0 && (awayTeamId || schedule.away_team)) {
                  console.log(`[PLAYER FETCH] Attempting fallback fetch for away team: ${awayTeam?.name || schedule.away_team}`);
                  awayPlayersRaw = findPlayersByTeam(awayTeamId, awayTeam?.name || schedule.away_team);
                }
                
                console.log(`[PLAYER FETCH] After fallback - Home: ${homePlayersRaw.length}, Away: ${awayPlayersRaw.length}`);
                
              } catch (fallbackError) {
                console.error('[PLAYER FETCH] Error in fallback player fetch:', fallbackError);
              }
            }
            
            // Final check - if still no players, log a warning
            if (homePlayersRaw.length === 0 && awayPlayersRaw.length === 0) {
              console.warn('[PLAYER FETCH] No players found for either team after all fallback attempts');
            } else {
              console.log(`[PLAYER FETCH] Final player counts - Home: ${homePlayersRaw.length}, Away: ${awayPlayersRaw.length}`);
            }
            
          } catch (error) {
            console.error('[PLAYER FETCH] Error in player fetching process:', error);
            homePlayersRaw = [];
            awayPlayersRaw = [];
          }
        } catch (teamError) {
          console.error('Error fetching teams or players:', teamError);
          // Continue with empty arrays if fetch fails
        }
        
        // Map to PlayerStatsUI
        const homePlayers = mapPlayersToStats(homePlayersRaw);
        const awayPlayers = mapPlayersToStats(awayPlayersRaw);
        console.log('[FINAL DEBUG] homePlayers:', homePlayers);
        console.log('[FINAL DEBUG] awayPlayers:', awayPlayers);
        setHomePlayers(homePlayers);
        setAwayPlayers(awayPlayers);
        const allPlayers = [...homePlayers, ...awayPlayers];
        
        // Fetch latest astrological data
        let astroData = null;
        try {
          const astroRaw = await fetchLatestAstrologicalData();
          if (astroRaw) {
            astroData = {
              moon_phase: typeof astroRaw.moon_phase === 'string' ? parseFloat(astroRaw.moon_phase) : (astroRaw.moon_phase as number),
              moon_sign: astroRaw.moon_sign || 'unknown',
              sun_sign: astroRaw.sun_sign || '',
              mercury_sign: astroRaw.mercury_sign || 'unknown',
              venus_sign: astroRaw.venus_sign || 'unknown',
              mars_sign: astroRaw.mars_sign || 'unknown',
              jupiter_sign: astroRaw.jupiter_sign || 'unknown',
              saturn_sign: astroRaw.saturn_sign || '',
              mercury_retrograde: astroRaw.mercury_retrograde || false,
              sun_mars_transit: astroRaw.sun_mars_transit || null,
              sun_saturn_transit: astroRaw.sun_saturn_transit || null,
              sun_jupiter_transit: astroRaw.sun_jupiter_transit || null,
            };
          }
        } catch (astroError) {
          console.error('Error fetching astrological data:', astroError);
          // Continue with null astroData if fetch fails
        }
        
        // Default astro data if none fetched
        if (!astroData) {
          astroData = {
            moon_phase: 0.5,
            moon_sign: 'Aries',
            mercury_sign: 'Taurus',
            venus_sign: 'Gemini',
            mars_sign: 'Cancer',
            jupiter_sign: 'Leo',
            saturn_sign: '',
            sun_sign: '',
            mercury_retrograde: false,
            sun_mars_transit: 'conjunction',
            sun_saturn_transit: 'trine',
            sun_jupiter_transit: 'sextile'
          };
        }
        
        // Helper function to determine sun sign from birth month and day
        const getSunSign = (month: number, day: number): string => {
          // Simple mapping of birth date to sun sign
          if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
          if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
          if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
          if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
          if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
          if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
          if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
          if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
          if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
          if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
          if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
          if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
          return 'Unknown';
        };
        
        // Calculate astro influence for each player
        console.log('Calculating astro influence for players:', allPlayers.length);
        const playersWithImpact = [];
        
        // Use real data calculation, not random values
        const useRealCalculation = true;
        
        for (const player of allPlayers) {
          let astroImpact = 0;
          
          if (useRealCalculation) {
            try {
              // Real calculation based on player data
              // This uses a deterministic algorithm based on player's birth date and current astro data
              
              // Get player birth date and convert to Date object
              const birthDate = player.birth_date ? new Date(player.birth_date) : null;
              
              if (birthDate && !isNaN(birthDate.getTime())) {
                // Calculate based on birth month and day relative to current astro positions
                const birthMonth = birthDate.getMonth() + 1; // 1-12
                const birthDay = birthDate.getDate(); // 1-31
                
                // Base impact from birth date (deterministic)
                let baseImpact = ((birthMonth * 7 + birthDay * 3) % 30) + 40; // 40-70 range
                
                // Adjust based on astrological factors (also deterministic)
                if (astroData.mercury_retrograde) {
                  // Mercury retrograde affects players born in certain months more
                  if (birthMonth === 3 || birthMonth === 7 || birthMonth === 11) {
                    baseImpact += 10;
                  } else {
                    baseImpact -= 5;
                  }
                }
                
                // Moon phase affects all players
                if (astroData.moon_phase > 0.8) { // Full moon
                  baseImpact += 8;
                } else if (astroData.moon_phase < 0.2) { // New moon
                  baseImpact -= 5;
                }
                
                // Sun sign compatibility
                const playerSunSign = getSunSign(birthMonth, birthDay);
                if (playerSunSign === astroData.sun_sign) {
                  baseImpact += 15; // Strong compatibility
                }
                
                // Ensure impact is in reasonable range
                astroImpact = Math.max(30, Math.min(95, baseImpact));
              } else {
                // Fallback if no valid birth date
                astroImpact = 50;
              }
              
              console.log(`Calculated real impact for ${player.name}: ${astroImpact}%`);
            } catch (calcError) {
              console.error(`Error calculating astro influence for player ${player.id}:`, calcError);
              // Deterministic fallback based on player ID
              astroImpact = (player.id.charCodeAt(0) % 30) + 40; // 40-70 range
            }
          } else {
            // Fallback to a deterministic value based on player ID if we can't use real calculation
            astroImpact = (player.id.charCodeAt(0) % 30) + 40; // 40-70 range
            console.log(`Using deterministic impact for ${player.name}: ${astroImpact}%`);
          }
          
          const statsImpact = typeof player.win_shares === 'number' ? player.win_shares : 0;
          const totalImpact = astroImpact + statsImpact;
          
          playersWithImpact.push({
            ...player,
            astro_influence: astroImpact,
            total_impact: totalImpact
          });
          
          console.log(`Player ${player.name} - Astro: ${astroImpact}, Stats: ${statsImpact}, Total: ${totalImpact}`);
        }
        
        // Calculate OAS as average astro_influence - deterministic calculation
        let oasValue = 0;
        if (playersWithImpact.length > 0) {
          const sum = playersWithImpact.reduce((acc, p) => acc + (p.astro_influence ?? 0), 0);
          oasValue = Math.round(sum / playersWithImpact.length);
          console.log(`OAS calculated: ${oasValue}% from ${playersWithImpact.length} players`);
        } else {
          // If no players with impact, calculate based on game date (deterministic)
          const gameDate = new Date(schedule.game_time || schedule.start_time || new Date().toISOString());
          const gameDay = gameDate.getDate();
          const gameMonth = gameDate.getMonth() + 1;
          oasValue = ((gameMonth * 5 + gameDay * 2) % 25) + 50; // 50-75 range
          console.log(`Using deterministic OAS based on game date: ${oasValue}%`);
        }
        setOas(oasValue);
        
        // Find top player by total impact
        let topPlayerByImpact = null;
        if (playersWithImpact.length > 0) {
          topPlayerByImpact = playersWithImpact.reduce(
            (max, p) => (p.total_impact > (max?.total_impact ?? 0) ? p : max), 
            playersWithImpact[0]
          );
          console.log('Top player by impact:', topPlayerByImpact?.name, 'with score:', topPlayerByImpact?.total_impact);
        }
        
        // Ensure the top player has all required fields
        if (topPlayerByImpact) {
          topPlayerByImpact = {
            ...topPlayerByImpact,
            position: topPlayerByImpact.position || 'Player',
            team: topPlayerByImpact.team || (topPlayerByImpact.team_id === schedule.home_team_id ? schedule.home_team : schedule.away_team)
          };
        }
        
        setTopPlayer(topPlayerByImpact);
        
        console.log('Data loading completed successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Error in fetchData:', errorMessage, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
        console.log('Loading state set to false');
      }
  };
  fetchData();
 
}, [id]);
  
  if (loading) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading astrological insights...</p>
      </div>
    </div>
  );
}
if (error) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-destructive">{error}</p>
      </div>
    </div>
  );
}
if (!game) return null;

  // Use the already formatted date and time from formatGameTime
  // These are already defined above: const { date: formattedDate, time: formattedTime } = formatGameTime(game);
  
  // Calculate player with highest astro influence
// Now handled in useEffect and stored in topPlayer

  
  // Format the OAS (Overall Astro Score) color with proper type safety
  const oasValue = typeof oas === 'number' ? oas : 0;
  // Safely calculate OAS color with proper type checking
  const getOasColor = (value: unknown): string => {
    const numValue = typeof value === 'number' ? value : 0;
    return numValue >= 70 
      ? 'text-green-500' 
      : numValue >= 40 
        ? 'text-yellow-500' 
        : 'text-red-500';
  };
  
  const oasColor = getOasColor(oasValue);
      
  // Ensure astroInfluences is always an array
  const safeAstroInfluences: AstroInfluence[] = Array.isArray(astroInfluences) 
    ? astroInfluences 
    : [];
    
  // Ensure topPlayer is properly typed
  const safeTopPlayer: PlayerStatsUI | null = topPlayer || null;

  // Determine the sport icon and color with proper type safety
  const getSportConfig = (sport: unknown): { color: string; icon: string } => {
    // Ensure we have a string value or default to empty string
    const sportKey = typeof sport === 'string' ? sport.toLowerCase() : '';
    
    // Define a type-safe mapping of sport keys to their configs
    const sportConfigs: Record<string, { color: string; icon: string }> = {
      nba: { color: 'from-orange-500 to-red-600', icon: '🏀' },
      nfl: { color: 'from-green-600 to-green-800', icon: '🏈' },
      mlb: { color: 'from-blue-500 to-blue-700', icon: '⚾' },
      ncaa: { color: 'from-purple-500 to-indigo-600', icon: '🏈' },
      default: { color: 'from-gray-600 to-gray-800', icon: '🏆' }
    };
    
    // Return the config for the sport or the default if not found
    return sportConfigs[sportKey] || sportConfigs.default;
  };

  // Safely get sport config with fallback
  const sportConfig = getSportConfig(
    typeof game.sport === 'string' ? game.sport : undefined
  );
  
  // Safely render game details with proper type checking
  const renderGameDetail = (value: unknown, fallback: string = 'N/A'): string => {
    if (value === null || value === undefined) return fallback;
    return String(value);
  };
  
  // Safely compare numbers with unknown types
  const safeNumberCompare = (a: unknown, b: number, operator: '>' | '<' | '>=' | '<=' | '===' | '!='): boolean => {
    const numA = typeof a === 'number' ? a : 0;
    switch (operator) {
      case '>': return numA > b;
      case '<': return numA < b;
      case '>=': return numA >= b;
      case '<=': return numA <= b;
      case '===': return numA === b;
      case '!=': return numA !== b;
      default: return false;
    }
  };
  
  // Safely get a value from an object with fallback
  const safeGet = <T,>(obj: unknown, key: string, fallback: T): T => {
    if (obj && typeof obj === 'object' && key in obj) {
      const value = (obj as Record<string, unknown>)[key];
      return value as T;
    }
    return fallback;
  };
  
  // Safely render a React node from an unknown value
  const safeRenderNode = (value: unknown, fallback: React.ReactNode = 'N/A'): React.ReactNode => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' || typeof value === 'number' || React.isValidElement(value)) {
      return value;
    }
    return String(value);
  };
  
  // Safely get sport name with fallback
  const getSportName = (sport: unknown): string => {
    if (typeof sport !== 'string') return 'SPORT';
    return sport.toUpperCase();
  };
  
  // Safely get team names with fallbacks
  const homeTeamName = renderGameDetail(game.home_team, 'Home Team');
  const awayTeamName = renderGameDetail(game.away_team, 'Away Team');

  // === PLAYER DISPLAY SECTION ===
  // Render players for each team below the main event details
  const renderPlayersSection = (teamName: string, players: PlayerStatsUI[]) => (
    <div className="my-6 bg-gray-800/50 p-4 rounded-xl">
      <h3 className="font-semibold text-lg mb-3">{teamName} Players</h3>
      <div className="flex flex-wrap gap-4">
        {players.length === 0 ? (
          <span className="text-gray-400">No players found for this team.</span>
        ) : (
          players.map(player => (
            <div key={player.id} className="border border-gray-700 rounded-lg p-3 bg-gray-800/70 w-[140px]">
              {player.image_url && (
                <img src={player.image_url} alt={player.name} className="w-14 h-14 rounded-full object-cover mx-auto mb-2" />
              )}
              <div className="font-medium text-center">{player.name}</div>
              <div className="text-xs text-gray-400 text-center">{player.position}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          className="mb-2 hover:bg-accent/50 transition-colors text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2 text-primary" /> 
          <span className="font-medium">
            Back to {getSportName(game.sport)}
          </span>
        </Button>
        <Card>
          <CardHeader>
              <div className="flex items-center bg-blue-800/50 px-3 py-1 rounded-full border border-blue-700/50">
                <Clock className="h-4 w-4 mr-1.5 text-blue-200" />
                <span className="text-sm font-medium text-blue-100">
                  {memoizedFormattedTime}
                </span>
              </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-2">
              <span className="text-4xl mr-3 text-blue-200">
                {typeof sportConfig.icon === 'string' ? sportConfig.icon : '🏆'}
              </span>
              <div>
                <h1 className="text-2xl font-bold">
                  {homeTeamName} vs {awayTeamName}
                </h1>
                <div className="flex items-center text-muted-foreground mt-1 text-sm">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  <span>{memoizedFormattedDate}</span>
                  <span className="mx-2">•</span>
                  <Users className="h-4 w-4 mr-1.5" />
                  <span>{renderVenue(game.venue)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: Game details */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sportsbook Outlook</CardTitle>
                  </CardHeader>
                  <CardContent>
  {game && game.odds && typeof game.odds === 'object' ? (
    (() => {
      // Assume odds object: { home: number, away: number, spread: number, over_under: number }
      const odds = game.odds as {
        home?: number;
        away?: number;
        spread?: number;
        over_under?: number;
      };
      const homeTeam = game.home_team || 'Home';
      const awayTeam = game.away_team || 'Away';
      // Use team colors if available, fallback to blue/red
      const homeColor = game.home_team_color || '#2563eb'; // blue-600
      const awayColor = game.away_team_color || '#dc2626'; // red-600
      // Determine favorite/underdog
      let favorite = null, underdog = null;
      let favoriteColor = homeColor, underdogColor = awayColor;
      let favoriteTeam = homeTeam, underdogTeam = awayTeam;
      let favoriteOdds = odds.home, underdogOdds = odds.away;
      if (typeof odds.home === 'number' && typeof odds.away === 'number') {
        if (odds.home < odds.away) {
          favorite = homeTeam;
          underdog = awayTeam;
          favoriteColor = homeColor;
          underdogColor = awayColor;
          favoriteTeam = homeTeam;
          underdogTeam = awayTeam;
          favoriteOdds = odds.home;
          underdogOdds = odds.away;
        } else {
          favorite = awayTeam;
          underdog = homeTeam;
          favoriteColor = awayColor;
          underdogColor = homeColor;
          favoriteTeam = awayTeam;
          underdogTeam = homeTeam;
          favoriteOdds = odds.away;
          underdogOdds = odds.home;
        }
      }
      return (
        <div className="rounded-xl p-4 bg-gradient-to-r" style={{background: `linear-gradient(90deg, ${favoriteColor} 70%, ${underdogColor} 100%)`}}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 text-lg font-bold text-white flex items-center">
              <span className="mr-2">{homeTeam}</span>
              <span className={`px-2 py-1 rounded text-xs ml-1 font-semibold ${favorite === homeTeam ? 'bg-white/80 text-black' : 'bg-black/30 text-white/80'}`}>{odds.home > 0 ? `+${odds.home}` : odds.home}</span>
              {favorite === homeTeam && <span className="ml-2 text-xs font-semibold bg-green-400/80 text-black px-2 py-0.5 rounded">Favorite</span>}
            </div>
            <span className="mx-3 text-white font-bold">vs</span>
            <div className="flex-1 text-lg font-bold text-white flex items-center justify-end">
              <span className={`px-2 py-1 rounded text-xs mr-1 font-semibold ${favorite === awayTeam ? 'bg-white/80 text-black' : 'bg-black/30 text-white/80'}`}>{odds.away > 0 ? `+${odds.away}` : odds.away}</span>
              <span>{awayTeam}</span>
              {favorite === awayTeam && <span className="ml-2 text-xs font-semibold bg-green-400/80 text-black px-2 py-0.5 rounded">Favorite</span>}
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-white/90">
              <span className="font-semibold">Spread: </span>
              <span>{typeof odds.spread === 'number' ? (odds.spread > 0 ? `+${odds.spread}` : odds.spread) : 'N/A'}</span>
            </div>
            <div className="text-sm text-white/90">
              <span className="font-semibold">Over/Under: </span>
              <span>{typeof odds.over_under === 'number' ? odds.over_under : 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    })()
  ) : (
    <div className="text-center text-gray-400">Sportsbook odds not available.</div>
  )}
</CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Astrological Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Overall Astro Score:</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                              style={{ width: `${oas}%` }}
                            />
                          </div>
                          <span className={`font-semibold ${oasColor}`}>{oas}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Key Astrological Influences:</h4>
                        <ul className="space-y-2">
  {(() => {
    // Always display at least 3 influences for minimal UX
    const fallbackInfluences: AstroInfluence[] = [
      {
        aspect: 'Mercury Retrograde',
        influence: 0,
        description: 'Communication and decision-making may be affected. Stay adaptable.'
      },
      {
        aspect: 'Moon Phase',
        influence: 0,
        description: 'The current moon phase can impact player mood and energy.'
      },
      {
        aspect: 'Sun-Mars Aspect',
        influence: 0,
        description: 'Sun-Mars alignments can boost assertiveness and drive.'
      }
    ];
    // Use real influences if available, otherwise fill with fallback
    const safeInfluences = Array.isArray(astroInfluences) && astroInfluences.length > 0
      ? [...astroInfluences.slice(0, 3)]
      : [];
    while (safeInfluences.length < 3) {
      safeInfluences.push(fallbackInfluences[safeInfluences.length]);
    }
    return safeInfluences.map((influence, idx) => (
      <li key={idx} className="flex items-start">
        <Zap className="h-4 w-4 text-amber-500 mt-0.5 mr-1.5 flex-shrink-0" />
        <div>
          <span className="text-sm font-medium">{influence.aspect}</span>
          <p className="text-xs text-muted-foreground">{influence.description}</p>
        </div>
      </li>
    ));
  })()}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Player with Highest Astro Impact:</h4>
                        <div className="flex items-center p-2 bg-accent/50 rounded-lg">
  {topPlayer ? (
    <>
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
        <span className="text-xs font-bold">{safeRenderNode(topPlayer?.position, '')}</span>
      </div>
      <div>
        <div className="text-sm font-medium">{safeRenderNode(topPlayer?.name, '')}</div>
        <div className="text-xs text-muted-foreground">{safeRenderNode(topPlayer?.team, '')}</div>
      </div>
      <div className="ml-auto flex items-center">
        <span className="text-xs font-semibold text-amber-500">{safeRenderNode(Math.round(topPlayer?.astro_influence ?? 0), '')}%</span>
        <Zap className="h-3 w-3 text-amber-500 ml-1" />
      </div>
    </>
  ) : (
    <span className="text-xs text-muted-foreground">No player data</span>
  )}
</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right column: Betting insights */}
              <div className="space-y-6">
                {/* Recommended Bet */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
                  <Card className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-bl-lg">
                      RECOMMENDED
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                          <ThumbsUp className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Recommended Bet</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Selection:</span>
                          <span className="font-semibold text-gray-800">
                            {safeRenderNode(oas >= 60 ? game.home_team : game.away_team, 'N/A')} to Win
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Confidence:</span>
                          <div className="flex items-center">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                                style={{ width: `${oasValue}%` }}
                              />
                            </div>
                            <span className="font-semibold text-green-600">{oasValue}%</span>
                          </div>
                        </div>
                        <div className="pt-3 mt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            {oasValue >= 70 ? 'Strong' : oasValue >= 50 ? 'Moderate' : 'Slight'} astrological advantage with multiple positive indicators.
                          </p>
                          <ul className="mt-2 space-y-1 text-sm text-green-600">
                            {astroInfluences.slice(0, 2).map((influence, i) => (
                              <li key={`rec-${i}`} className="flex items-start">
                                <CheckCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                                <span>{influence.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Alternative Bet */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
                  <Card className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-bl-lg">
                      ALTERNATIVE
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                          <BarChart2 className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Alternative Play</h3>
                      </div>
                      <div className="space-y-4">
                        {game.odds && typeof game.odds === 'number' && Math.abs(game.odds) > 0 ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-semibold">
                                {game.odds > 0 ? 'Underdog' : 'Favorite'} Spread
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Line:</span>
                              <span className="font-mono font-semibold">
                                {game.odds > 0 ? '+' : ''}{game.odds}
                              </span>
                            </div>
                            <div className="pt-3 mt-2 border-t border-gray-100">
                              <p className="text-sm text-gray-600">
                                {oas >= 60 ? 'Good' : 'Fair'} value based on astrological factors and team performance metrics.
                              </p>
                              <ul className="mt-2 space-y-1 text-blue-600">
                                <li className="flex items-start text-sm">
                                  <CheckCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                                  <span>{oas >= 60 ? 'Favorable' : 'Neutral'} planetary alignments</span>
                                </li>
                                <li className="flex items-start text-sm">
                                  <TrendingUp className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                                  <span>Positive momentum indicators</span>
                                </li>
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">Check back closer to game time for spread recommendations</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bet to Avoid */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
                  <Card className="relative bg-white rounded-xl shadow-lg overflow-hidden h-full">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-bl-lg">
                      CAUTION
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-2 rounded-full bg-amber-100 text-amber-600 mr-3">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Exercise Caution</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Avoid:</span>
                          <span className="font-semibold">
                            {oas >= 50 ? game.away_team : game.home_team} Moneyline
                          </span>
                        </div>
                        <div className="pt-3 mt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            {oas >= 70 ? 'High' : 'Moderate'} risk based on current astrological conditions and team dynamics.
                          </p>
                          <ul className="mt-2 space-y-1 text-amber-600">
                            <li className="flex items-start text-sm">
                              <XCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                              <span>Challenging planetary alignments</span>
                            </li>
                            <li className="flex items-start text-sm">
                              <AlertCircle className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                              <span>Potential performance volatility</span>
                            </li>
                            {oas >= 70 && (
                              <li className="flex items-start text-sm">
                                <Info className="h-4 w-4 mt-0.5 mr-1.5 flex-shrink-0" />
                                <span>Consider alternative betting options</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Player Rosters */}
        {game && (
          <div className="mt-8 space-y-6">
            {/* Home Team Players */}
            {renderPlayersSection(homeTeamName, homePlayers)}
            
            {/* Away Team Players */}
            {renderPlayersSection(awayTeamName, awayPlayers)}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
