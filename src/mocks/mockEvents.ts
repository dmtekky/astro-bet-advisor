import { Game, Sport } from '@/types';

// Extended Game interface to include additional mock data properties
interface MockGame extends Game {
  home_team: string;
  away_team: string;
  commence_time: string;
  odds?: number;
  oas?: number;
  weight_class?: string;
}

// Helper function to generate random date within the next 7 days
const getRandomDate = (daysFromNow: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(19, 0, 0, 0); // Set to 7 PM
  return date.toISOString();
};

// Deterministic random number generator based on a seed
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Simple pseudo-random number generator
  const random = () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
  
  return random;
};

// Helper function to generate consistent odds based on game ID
const getRandomOdds = (gameId: string) => {
  const random = seededRandom(gameId);
  const isPositive = random() > 0.5;
  const value = Math.floor(random() * 200) + 100;
  return isPositive ? value : -value;
};

// Helper function to generate consistent OAS based on game ID
const getRandomOAS = (gameId: string) => {
  const random = seededRandom(gameId + '-oas'); // Different seed for OAS
  return Math.floor(random() * 30) + 50; // Between 50-80
};

// NBA Teams
const nbaTeams = [
  'Los Angeles Lakers', 'Brooklyn Nets', 'Golden State Warriors', 'Milwaukee Bucks',
  'Phoenix Suns', 'Philadelphia 76ers', 'Denver Nuggets', 'Boston Celtics'
];

// MLB Teams
const mlbTeams = [
  'New York Yankees', 'Los Angeles Dodgers', 'Houston Astros', 'Atlanta Braves',
  'Boston Red Sox', 'Chicago White Sox', 'San Francisco Giants', 'Tampa Bay Rays'
];

// NFL Teams
const nflTeams = [
  'Kansas City Chiefs', 'Tampa Bay Buccaneers', 'Green Bay Packers', 'Buffalo Bills',
  'Los Angeles Rams', 'Dallas Cowboys', 'San Francisco 49ers', 'Baltimore Ravens'
];

// Boxing Matches
const boxers = [
  { name: 'Tyson Fury', weight: 'Heavyweight' },
  { name: 'Oleksandr Usyk', weight: 'Heavyweight' },
  { name: 'Saul Alvarez', weight: 'Super Middleweight' },
  { name: 'Gervonta Davis', weight: 'Lightweight' },
  { name: 'Terence Crawford', weight: 'Welterweight' },
  { name: 'Errol Spence Jr', weight: 'Welterweight' }
];

// Soccer Teams
const soccerTeams = [
  'Manchester City', 'Liverpool', 'Real Madrid', 'Bayern Munich',
  'Paris Saint-Germain', 'Chelsea', 'Barcelona', 'Juventus'
];

// NCAA Football Teams
const ncaaTeams = [
  'Alabama Crimson Tide', 'Georgia Bulldogs', 'Ohio State Buckeyes',
  'Clemson Tigers', 'Oklahoma Sooners', 'Notre Dame Fighting Irish'
];

// Generate mock games for a league
const generateMockGames = (leagueId: Sport, count: number): MockGame[] => {
  let teams: string[] = [];
  
  switch (leagueId) {
    case 'nba':
      teams = nbaTeams;
      break;
    case 'mlb':
      teams = mlbTeams;
      break;
    case 'nfl':
      teams = nflTeams;
      break;
    case 'soccer':
      teams = soccerTeams;
      break;
    case 'ncaa':
      teams = ncaaTeams;
      break;
    case 'boxing':
            // Special handling for boxing
      return Array.from({ length: Math.min(count, 4) }, (_, i) => {
        const boxer1 = boxers[i % boxers.length];
        const boxer2 = boxers[(i + 2) % boxers.length];
        const gameId = `box-${i + 1}`;
        return {
          id: gameId,
          sport: 'boxing' as const,
          home_team_id: `boxer-${i * 2 + 1}`,
          away_team_id: `boxer-${i * 2 + 2}`,
          start_time: getRandomDate(i + 1),
          status: 'scheduled',
          home_team: boxer1.name,
          away_team: boxer2.name,
          commence_time: getRandomDate(i + 1),
          odds: getRandomOdds(gameId),
          oas: getRandomOAS(gameId),
          weight_class: boxer1.weight
        } as MockGame;
      });
    default:
      return [];
  }

  // For team sports
  return Array.from({ length: Math.min(count, teams.length / 2) }, (_, i) => {
    const gameId = `${leagueId}-${i + 1}`;
    return {
      id: gameId,
      sport: leagueId,
      home_team_id: `${leagueId}-team-${i * 2 + 1}`,
      away_team_id: `${leagueId}-team-${i * 2 + 2}`,
      start_time: getRandomDate(i + 1),
      status: 'scheduled',
      home_team: teams[i * 2],
      away_team: teams[i * 2 + 1],
      commence_time: getRandomDate(i + 1),
      odds: getRandomOdds(gameId),
      oas: getRandomOAS(gameId)
    } as MockGame;
  });
};

// Generate mock events for all leagues
export const mockEvents: Record<Sport, MockGame[]> = {
  nba: generateMockGames('nba', 4),
  mlb: generateMockGames('mlb', 4),
  nfl: generateMockGames('nfl', 4),
  boxing: generateMockGames('boxing', 4),
  soccer: generateMockGames('soccer', 4),
  ncaa: generateMockGames('ncaa', 4)
};

// Get mock events for a specific league
export const getMockEvents = (leagueId: string): MockGame[] => {
  // Type assertion to handle dynamic leagueId
  const sport = leagueId as Sport;
  return mockEvents[sport] || [];
};

// Get a single mock event by ID
export const getMockEventById = (id: string): MockGame | undefined => {
  return Object.values(mockEvents)
    .flat()
    .find(event => event.id === id);
};
