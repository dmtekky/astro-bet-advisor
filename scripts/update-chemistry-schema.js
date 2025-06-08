import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchema() {
  console.log('🔍 Checking team_chemistry table schema...');
  
  try {
    // Check if the column exists
    const { data: columnCheck, error: checkError } = await supabase
      .rpc('column_exists', { 
        table_name: 'team_chemistry',
        column_name: 'overall_score' 
      });
    
    if (checkError) {
      console.log('ℹ️ Could not check column existence, trying to add it...');
    } else if (columnCheck) {
      console.log('✅ overall_score column already exists');
      return;
    }
    
    // Add the column
    console.log('➕ Adding overall_score column to team_chemistry table...');
    const { data, error } = await supabase.rpc('exec', {
      query: `
        ALTER TABLE team_chemistry 
        ADD COLUMN IF NOT EXISTS overall_score DECIMAL(5,2);
        
        UPDATE team_chemistry 
        SET overall_score = score;
        
        ALTER TABLE team_chemistry 
        ALTER COLUMN overall_score SET NOT NULL;
      `
    });
    
    if (error) {
      console.error('❌ Error updating schema:', error);
      
      // Try an alternative approach if the first one fails
      console.log('🔄 Trying alternative approach...');
      await updateSchemaAlternative();
      return;
    }
    
    console.log('✅ Successfully updated team_chemistry table schema');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('🔄 Trying alternative approach...');
    await updateSchemaAlternative();
  }
}

async function updateSchemaAlternative() {
  try {
    // Try to update the schema using a different approach
    console.log('🔄 Using alternative approach to update schema...');
    
    // First, check if the column exists
    const { data: checkData, error: checkError } = await supabase
      .from('team_chemistry')
      .select('id')
      .limit(1);
      
    if (checkError) {
      console.error('❌ Error checking table:', checkError);
      return;
    }
    
    console.log('ℹ️ Table exists, attempting to add column...');
    
    // Try to add the column
    const { data: addColumnData, error: addColumnError } = await supabase
      .from('team_chemistry')
      .select('overall_score')
      .limit(1);
      
    if (addColumnError) {
      console.log('ℹ️ Column does not exist, attempting to add it...');
      
      // If we get here, the column doesn't exist, so we need to add it
      // This is a bit of a hack - we'll try to insert a dummy record with the new column
      // and let the error tell us if the column exists
      const { data: dummyData, error: dummyError } = await supabase
        .from('team_chemistry')
        .insert([{ id: 'dummy-id', team_id: 'dummy-team', overall_score: 50 }])
        .select();
        
      if (dummyError && dummyError.message.includes('column "overall_score" of relation "team_chemistry" does not exist')) {
        console.log('❌ Column does not exist and could not be added automatically');
        console.log('💡 Please run the following SQL in your Supabase SQL editor:');
        console.log(`
          ALTER TABLE team_chemistry 
          ADD COLUMN overall_score DECIMAL(5,2) NOT NULL DEFAULT 50;
          
          UPDATE team_chemistry 
          SET overall_score = score;
        `);
      } else if (dummyError) {
        console.error('❌ Error adding dummy record:', dummyError);
      } else {
        console.log('✅ Successfully added overall_score column');
        
        // Clean up the dummy record
        await supabase
          .from('team_chemistry')
          .delete()
          .eq('id', 'dummy-id');
      }
    } else {
      console.log('✅ overall_score column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error in alternative approach:', error);
  }
}

updateSchema();
