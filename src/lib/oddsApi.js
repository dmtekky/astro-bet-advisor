import { mockGames } from '../mockData';

export async function fetchOdds(sport = 'basketball_nba') {
  // In a real app, this would make an API call to your backend or directly to the odds API
  // For now, we'll return mock data
  console.log(`Fetching odds for ${sport}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data for now
  return mockGames;
}

export async function fetchGameDetails(gameId) {
  // In a real app, this would fetch game details by ID
  console.log(`Fetching details for game ${gameId}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Find the game in our mock data
  const game = mockGames.find(g => g.id === gameId);
  return game || null;
}
