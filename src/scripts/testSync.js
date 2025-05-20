/**
 * Test script for verifying the sync implementation
 * 
 * This script tests:
 * 1. Connection to The Odds API
 * 2. Connection to Supabase
 * 3. The sync process
 * 4. Data retrieval from Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { syncGameSchedules } from './syncGames.js';

// Load environment variables
dotenv.config();

// API key for The Odds API
const API_KEY = process.env.VITE_THE_ODDS_API_KEY;

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test API connection
 */
async function testApiConnection() {
  console.log('Testing connection to The Odds API...');
  
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports?apiKey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    const sports = await response.json();
    console.log(`✅ Successfully connected to The Odds API. Found ${sports.length} sports.`);
    
    // Find NBA and MLB
    const nba = sports.find(s => s.key === 'basketball_nba');
    const mlb = sports.find(s => s.key === 'baseball_mlb');
    
    console.log(`NBA: ${nba ? '✅ Found' : '❌ Not found'}`);
    console.log(`MLB: ${mlb ? '✅ Found' : '❌ Not found'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to The Odds API:', error);
    return false;
  }
}

/**
 * Test Supabase connection
 */
async function testSupabaseConnection() {
  console.log('Testing connection to Supabase...');
  
  try {
    // Check if we can query the schedules table
    const { data, error } = await supabase
      .from('schedules')
      .select('count(*)')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    return false;
  }
}

/**
 * Test sync process
 */
async function testSync() {
  console.log('Testing sync process...');
  
  try {
    // Sync NBA games
    const result = await syncGameSchedules(supabase, 'basketball_nba');
    
    if (!result.success) {
      throw new Error(`Sync failed: ${result.error}`);
    }
    
    console.log(`✅ Successfully synced ${result.gameCount} NBA games`);
    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
}

/**
 * Test data retrieval
 */
async function testDataRetrieval() {
  console.log('Testing data retrieval from Supabase...');
  
  try {
    // Get upcoming NBA games
    const { data: games, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('sport', 'nba')
      .order('game_time', { ascending: true })
      .limit(5);
    
    if (error) throw error;
    
    console.log(`✅ Successfully retrieved ${games.length} NBA games from Supabase`);
    
    if (games.length > 0) {
      console.log('Sample game:');
      console.log({
        id: games[0].id,
        espn_id: games[0].espn_id,
        sport: games[0].sport,
        teams: `${games[0].home_team} vs ${games[0].away_team}`,
        game_time: games[0].game_time,
        status: games[0].status
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Data retrieval failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== STARTING TESTS ===');
  
  const apiResult = await testApiConnection();
  const supabaseResult = await testSupabaseConnection();
  
  if (!apiResult || !supabaseResult) {
    console.log('❌ Prerequisite tests failed. Stopping tests.');
    return;
  }
  
  const syncResult = await testSync();
  
  if (!syncResult) {
    console.log('❌ Sync test failed. Stopping tests.');
    return;
  }
  
  const retrievalResult = await testDataRetrieval();
  
  console.log('=== TEST SUMMARY ===');
  console.log(`API Connection: ${apiResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Supabase Connection: ${supabaseResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sync Process: ${syncResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Data Retrieval: ${retrievalResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (apiResult && supabaseResult && syncResult && retrievalResult) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('Tests completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
