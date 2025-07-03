export const formatGameDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if the date is today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if the date is tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // For other dates, return the full date
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

export const formatGameTime = (dateString: string | undefined | null): string => {
  const date = parseSupabaseDate(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

// Helper function to reliably parse Supabase date strings
const parseSupabaseDate = (dateString: string | undefined | null): Date => {
  if (!dateString) {
    return new Date(NaN); // Return an invalid date object if input is bad
  }
  // Replace space with 'T' and ensure timezone is correctly formatted for ISO parsing
  // Handles 'YYYY-MM-DD HH:MM:SS+ZZ' and 'YYYY-MM-DD HH:MM:SSZ'
  const normalizedDateString = dateString.replace(' ', 'T');
  // If it ends with +ZZ (e.g., +00), ensure it's +ZZ:00 for broader compatibility if needed, though parseISO should handle +00
  // For simplicity, we assume the +ZZ or Z is sufficient for parseISO or new Date()
  // If it's already ISO (contains 'T' and 'Z' or +/- offset), new Date() should handle it.
  // If it's the PostgreSQL format 'YYYY-MM-DD HH:MM:SS+ZZ', replacing space with 'T' helps.
  return new Date(normalizedDateString);
};

export const groupGamesByDate = (games: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  
  games.forEach(game => {
    // Use game.game_date and parse it reliably
    const gameDate = parseSupabaseDate(game.game_date);
    const dateKey = gameDate.toDateString(); // Will be 'Invalid Date' if parseSupabaseDate returned an invalid date
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(game);
  });
  
  // Convert to array and sort by date
  return Object.entries(grouped)
    .map(([dateString, gameList]) => ({
      // dateString here is the result of gameDate.toDateString()
      // If gameDate was invalid, dateString is 'Invalid Date', and new Date(dateString) will be Invalid Date
      date: new Date(dateString), 
      games: gameList.sort((a, b) => 
        parseSupabaseDate(a.game_date).getTime() - parseSupabaseDate(b.game_date).getTime()
      )
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};
