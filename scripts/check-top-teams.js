import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function getTopTeams() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('team_chemistry')
      .select('team_name, score, calculated_at')
      .order('score', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('Top 10 Teams by Chemistry Score:');
    console.log('--------------------------------');
    data.forEach((team, index) => {
      console.log(`${index + 1}. ${team.team_name.padEnd(20)} ${team.score}/100`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getTopTeams();
