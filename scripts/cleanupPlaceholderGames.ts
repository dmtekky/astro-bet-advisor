import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupPlaceholderGames() {
  try {
    console.log('Starting cleanup of placeholder games...');
    
    // 1. First, find and delete games with placeholder teams
    const { data: placeholderTeams, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .or('name.eq.Team A,name.eq.Team B');

    if (teamError) throw teamError;

    if (placeholderTeams && placeholderTeams.length > 0) {
      console.log(`Found ${placeholderTeams.length} placeholder teams to clean up`);
      
      // Delete games that reference these teams
      const teamIds = placeholderTeams.map(t => t.id);
      
      const { error: gameDeleteError } = await supabase
        .from('games')
        .delete()
        .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`);
        
      if (gameDeleteError) throw gameDeleteError;
      
      // Now delete the placeholder teams
      const { error: teamDeleteError } = await supabase
        .from('teams')
        .delete()
        .in('id', teamIds);
        
      if (teamDeleteError) throw teamDeleteError;
      
      console.log(`Successfully cleaned up ${placeholderTeams.length} placeholder teams and their games`);
    } else {
      console.log('No placeholder teams found');
    }
    
    // 2. Clean up any games from placeholder leagues
    const { data: placeholderLeagues, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('name', 'Premier League');
      
    if (leagueError) throw leagueError;
    
    if (placeholderLeagues && placeholderLeagues.length > 0) {
      const leagueIds = placeholderLeagues.map(l => l.id);
      
      // Delete games from these leagues
      const { error: leagueGameDeleteError } = await supabase
        .from('games')
        .delete()
        .in('league_id', leagueIds);
        
      if (leagueGameDeleteError) throw leagueGameDeleteError;
      
      // Delete the placeholder leagues
      const { error: leagueDeleteError } = await supabase
        .from('leagues')
        .delete()
        .in('id', leagueIds);
        
      if (leagueDeleteError) throw leagueDeleteError;
      
      console.log(`Successfully cleaned up ${placeholderLeagues.length} placeholder leagues and their games`);
    } else {
      console.log('No placeholder leagues found');
    }
    
    console.log('Cleanup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupPlaceholderGames();
