import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

async function getNbaLeagueId() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is not defined.');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Fetching NBA league ID...');
  const { data, error } = await supabase
    .from('leagues')
    .select('id, name, key')
    .or('name.eq.National Basketball Association,key.eq.nba,name.eq.NBA')
    .limit(1);

  if (error) {
    console.error('Error fetching league ID:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('NBA League Info:', data[0]);
  } else {
    console.log('NBA league not found.');
  }
}

getNbaLeagueId();
