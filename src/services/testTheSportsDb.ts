import { fetchLeagueScheduleFromSportsDB } from './theSportsDbService';

async function testSportsDbApi() {
  console.log('=== Testing TheSportsDB API ===');
  
  // Test with MLB 2025
  console.log('\nFetching MLB 2025 schedule...');
  const mlbSchedule = await fetchLeagueScheduleFromSportsDB('4424-mlb', '2025');
  
  if (mlbSchedule) {
    if (mlbSchedule.events && mlbSchedule.events.length > 0) {
      console.log('✅ Success! First MLB event:', {
        homeTeam: mlbSchedule.events[0].strHomeTeam,
        awayTeam: mlbSchedule.events[0].strAwayTeam,
        date: mlbSchedule.events[0].dateEvent,
        time: mlbSchedule.events[0].strTime,
      });
    } else {
      console.log('ℹ️ No MLB events found or empty response.');
    }
  } else {
    console.error('❌ Failed to fetch MLB schedule');
  }

  // Test with EPL 2024-2025
  console.log('\nFetching EPL 2024-2025 schedule...');
  const eplSchedule = await fetchLeagueScheduleFromSportsDB('4328', '2024-2025');
  
  if (eplSchedule) {
    if (eplSchedule.events && eplSchedule.events.length > 0) {
      console.log('✅ Success! First EPL event:', {
        homeTeam: eplSchedule.events[0].strHomeTeam,
        awayTeam: eplSchedule.events[0].strAwayTeam,
        date: eplSchedule.events[0].dateEvent,
        time: eplSchedule.events[0].strTime,
      });
    } else {
      console.log('ℹ️ No EPL events found or empty response.');
    }
  } else {
    console.error('❌ Failed to fetch EPL schedule');
  }
}

testSportsDbApi().catch(console.error);
