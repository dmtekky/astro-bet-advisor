import { mockPlayerProps } from '../mockData';

export async function fetchPlayerProps(sport, playerIds) {
  // In a real app, this would make an API call to fetch player props
  console.log(`Fetching player props for ${playerIds.length} ${sport} players`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock data for now, filtered to only include the requested player IDs
  const props = {};
  playerIds.forEach(id => {
    if (mockPlayerProps[id]) {
      props[id] = mockPlayerProps[id];
    }
  });
  
  return props;
}

export function calculatePlayerImpact(player, astroData) {
  // This would calculate how astrological factors impact a player's performance
  // For now, return a simple score based on player ID (just for demo)
  const baseScore = Math.random() * 10 - 5; // Random score between -5 and 5
  return {
    score: parseFloat(baseScore.toFixed(1)),
    factors: [
      { name: 'Moon Phase', impact: 0.5, description: 'Favorable moon phase for performance' },
      { name: 'Mercury Retrograde', impact: -0.3, description: 'May affect communication and coordination' },
      { name: 'Mars Energy', impact: 0.8, description: 'High energy levels expected' },
    ]
  };
}
