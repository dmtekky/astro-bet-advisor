// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

// Function to check table structure by getting one row
async function checkTableStructure() {
  try {
    console.log('Fetching a sample row from baseball_players...');
    
    // Get one row from the table
    const { data: player, error } = await supabase
      .from('baseball_players')
      .select('*')
      .not('astro_influence_score', 'is', null)
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching row:', error);
      
      // Try to get any row if the above fails
      const { data: anyPlayer, error: anyError } = await supabase
        .from('baseball_players')
        .select('*')
        .limit(1)
        .single();
        
      if (anyError) {
        throw anyError;
      }
      
      console.log('\n📊 Sample row (no astro score found):');
      console.log(anyPlayer);
      return;
    }

    console.log('\n📊 Sample row with astro score:');
    console.log(player);
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

// Run the function
checkTableStructure();
