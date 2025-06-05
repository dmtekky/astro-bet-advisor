import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://awoxkynorbspcrrggbca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3hreW5vcmJzcGNycmdnYmNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI2NDMzNCwiZXhwIjoyMDYyODQwMzM0fQ.cdBzpp7ASlwN8PSxvGSUn9Wbx9lqDBsTIC5U-psel8w';
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAME = 'nba_player_season_stats_2025';

async function checkStatsData() {
  console.log('Checking NBA player stats data...\n');

  // Count total records
  const { data: count } = await supabase
    .from(TABLE_NAME)
    .select('count');
  
  console.log(`Total records: ${count[0].count}`);
  
  // Check for null points
  const { data: nullPoints } = await supabase
    .from(TABLE_NAME)
    .select('count')
    .is('points', null);
  
  console.log(`Records with null points: ${nullPoints[0].count}`);
  
  // Check for zero points
  const { data: zeroPoints } = await supabase
    .from(TABLE_NAME)
    .select('count')
    .eq('points', 0);
  
  console.log(`Records with zero points: ${zeroPoints[0].count}`);
  
  // Get specific player as example
  const { data: lebron } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .ilike('player_name', '%LeBron%')
    .limit(1);
  
  if (lebron && lebron.length > 0) {
    console.log('\nExample player data:');
    console.log(JSON.stringify(lebron[0], null, 2));
  } else {
    console.log('\nLeBron not found, getting another example player');
    const { data: anyPlayer } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1);
    
    if (anyPlayer && anyPlayer.length > 0) {
      console.log('\nExample player data:');
      console.log(JSON.stringify(anyPlayer[0], null, 2));
    }
  }
  
  // Get top 5 scorers
  const { data: topScorers } = await supabase
    .from(TABLE_NAME)
    .select('player_name, team_abbreviation, points')
    .order('points', { ascending: false })
    .limit(5);
  
  console.log('\nTop 5 scorers:');
  console.log(topScorers);
}

checkStatsData()
  .then(() => {
    console.log('\nCheck completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error checking stats:', error);
    process.exit(1);
  });
