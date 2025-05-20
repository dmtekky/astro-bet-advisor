// Team logo utility functions

/**
 * Get the URL for a team's logo
 * @param teamId - The team's ID or abbreviation
 * @param size - Preferred size of the logo (width in pixels)
 * @returns URL string for the team logo
 */
export const getTeamLogo = (teamId: string, size: number = 200): string => {
  if (!teamId) return '/team-logo-placeholder.png';
  
  // Try different logo sources in order of preference
  const sources = [
    // From your Supabase storage
    `https://your-supabase-url/storage/v1/object/public/team-logos/${teamId.toLowerCase()}.png`,
    
    // From a CDN (example - replace with actual CDN)
    `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`,
    `https://www.mlbstatic.com/team-logos/team-cap-on-light/${teamId}.svg`,
    `https://a.espncdn.com/i/teamlogos/nfl/500/${teamId}.png`,
    
    // Fallback to placeholder
    '/team-logo-placeholder.png'
  ];
  
  return sources[0]; // For now, just return the first source
};

/**
 * Get team colors for UI theming
 * @param teamId - The team's ID
 * @returns Object with primary and secondary colors
 */
export const getTeamColors = (teamId: string) => {
  // This could be expanded with actual team color schemes
  const defaultColors = {
    primary: '#3b82f6', // blue-500
    secondary: '#1e40af', // blue-700
    text: '#ffffff' // white
  };
  
  const teamColors: Record<string, {primary: string, secondary: string, text: string}> = {
    // Example team colors - expand this with actual team data
    'lal': { primary: '#552583', secondary: '#FDB927', text: '#ffffff' },
    'gsw': { primary: '#1D428A', secondary: '#FFC72C', text: '#ffffff' },
    'bos': { primary: '#007A33', secondary: '#BA9653', text: '#ffffff' },
    // Add more teams as needed
  };
  
  return teamColors[teamId.toLowerCase()] || defaultColors;
};

/**
 * Format team record (wins-losses)
 */
export const formatRecord = (wins: number, losses: number, ties?: number): string => {
  return ties !== undefined 
    ? `${wins}-${losses}-${ties}`
    : `${wins}-${losses}`;
};
