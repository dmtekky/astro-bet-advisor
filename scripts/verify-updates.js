import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Verify updates in the database
async function verifyUpdates() {
  try {
    console.log('\n📊 Update Verification Results');
    console.log('==================================================');

    // First, check if the table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'baseball_players');

    if (tableError) {
      console.error('Error checking table structure:', tableError);
    } else {
      console.log('\n📋 Database Table Structure:');
      console.log('----------------------------------------');
      tableInfo.forEach(col => {
        console.log(`${col.column_name.padEnd(30)} ${col.data_type}`);
      });
      console.log('----------------------------------------');
    }

    // Get total count of players
    const { count: totalPlayers, error: countError } = await supabase
      .from('baseball_players')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting players:', countError);
      return;
    }

    // Count players with astro scores
    const { count: playersWithAstro, error: astroCountError } = await supabase
      .from('baseball_players')
      .select('*', { count: 'exact', head: true })
      .not('astro_influence_score', 'is', null);

    if (astroCountError) {
      console.error('Error counting players with astro scores:', astroCountError);
      return;
    }

    console.log(`\n👥 Player Counts:`);
    console.log('----------------------------------------');
    console.log(`Total players in database: ${totalPlayers}`);
    console.log(`Players with astro scores: ${playersWithAstro} (${Math.round((playersWithAstro / totalPlayers) * 100)}%)`);
    console.log('----------------------------------------');
    
    // Get a sample of players with non-null astro scores
    const { data: samplePlayers, error: sampleError } = await supabase
      .from('baseball_players')
      .select('*')
      .not('astro_influence_score', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (sampleError) {
      console.error('Error fetching sample players:', sampleError);
      return;
    }

    console.log('\n🔍 Sample of recently updated players:');
    if (samplePlayers && samplePlayers.length > 0) {
      samplePlayers.forEach(player => {
        console.log('\nPlayer Record:');
        console.log('----------------------------------------');
        console.log(`ID: ${player.id || player.player_id}`);
        
        // Try to find the name field
        const nameFields = [
          'player_name', 'name', 'full_name', 'player_full_name',
          'first_name', 'last_name', 'player_first_name', 'player_last_name'
        ];
        const name = nameFields.map(f => player[f]).find(Boolean) || 'Unknown';
        
        console.log(`Name: ${name}`);
        console.log(`Birth Date: ${player.birth_date || player.player_birth_date || 'N/A'}`);
        console.log(`Astro Score: ${player.astro_influence_score !== undefined ? player.astro_influence_score : 'undefined'}`);
        console.log(`Impact Score: ${player.impact_score !== undefined ? player.impact_score : 'undefined'}`);
        console.log(`Updated: ${player.updated_at ? new Date(player.updated_at).toISOString() : 'N/A'}`);
        
        // Log all available fields for debugging
        console.log('\nAvailable Fields:');
        Object.entries(player).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            console.log(`- ${key}: ${value}`);
          }
        });
        
        console.log('----------------------------------------');
      });
    } else {
      console.log('No players found with astro scores');
    }
    
    // Get score distribution
    const { data: scoreStats, error: statsError } = await supabase
      .from('baseball_players')
      .select('astro_influence_score')
      .not('astro_influence_score', 'is', null);
      
    if (!statsError && scoreStats && scoreStats.length > 0) {
      const scores = scoreStats.map(p => p.astro_influence_score).filter(s => s !== null && !isNaN(s));
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);
      
      console.log('\n📊 Astro Score Statistics:');
      console.log('----------------------------------------');
      console.log(`Players with scores: ${scores.length}`);
      console.log(`Average Score: ${avgScore.toFixed(2)}`);
      console.log(`Highest Score: ${maxScore}`);
      console.log(`Lowest Score: ${minScore}`);
      console.log('----------------------------------------');
    }

  } catch (error) {
    console.error('❌ Error verifying updates:', error);
    process.exit(1);
  }
}

verifyUpdates();
