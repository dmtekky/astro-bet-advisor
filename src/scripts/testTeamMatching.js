import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import TeamMatchingService from '../services/teamMatching.js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

async function testTeamMatching() {
  const teamMatching = new TeamMatchingService(supabase);
  
  try {
    console.log('Initializing team matching service...');
    await teamMatching.initialize();
    console.log('✅ Team matching service initialized');
    
    // Test cases
    const testCases = [
      { name: 'Lakers', sport: 'basketball' },
      { name: 'LA Lakers', sport: 'basketball' },
      { name: 'New York Yankees', sport: 'baseball' },
      { name: 'Yankees', sport: 'baseball' },
      { name: 'Nonexistent Team 123', sport: 'basketball' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\nTesting team: ${testCase.name} (${testCase.sport})`);
      
      try {
        // Test findBestTeamMatch
        console.log('Testing findBestTeamMatch...');
        const match = await teamMatching.findBestTeamMatch(testCase.name, testCase.sport);
        if (match) {
          console.log(`✅ Found match: ${match.team.name} (ID: ${match.team.id}, Confidence: ${match.confidence.toFixed(2)})`);
          console.log(`   Is exact match: ${match.isExactMatch ? 'Yes' : 'No'}`);
        } else {
          console.log('❌ No match found');
        }
        
        // Test findOrCreateTeam
        console.log('\nTesting findOrCreateTeam...');
        const team = await teamMatching.findOrCreateTeam(testCase.name, testCase.sport, testCase.sport.toUpperCase());
        console.log(`✅ Team: ${team.name} (ID: ${team.id})`);
        console.log(`   Is new: ${team.isNew ? 'Yes' : 'No'}`);
        console.log(`   Confidence: ${team.confidence.toFixed(2)}`);
        
      } catch (error) {
        console.error(`❌ Error testing ${testCase.name}:`, error.message);
      }
    }
    
    // Test listing aliases
    console.log('\nListing team aliases...');
    const { data: aliases, error: aliasError } = await supabase
      .from('team_aliases')
      .select('alias, team:teams(name), confidence, is_auto_generated')
      .order('alias');
    
    if (aliasError) {
      console.error('Error fetching aliases:', aliasError);
    } else {
      console.log('\nTeam Aliases:');
      console.table(aliases.map(a => ({
        Alias: a.alias,
        'Team': a.team?.name || 'Unknown',
        'Confidence': a.confidence,
        'Auto': a.is_auto_generated ? 'Yes' : 'No'
      })));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testTeamMatching().catch(console.error);
