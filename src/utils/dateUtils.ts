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

export const formatGameTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

export const groupGamesByDate = (games: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  
  games.forEach(game => {
    const gameDate = new Date(game.start_time);
    const dateKey = gameDate.toDateString();
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(game);
  });
  
  // Convert to array and sort by date
  return Object.entries(grouped)
    .map(([date, games]) => ({
      date: new Date(date),
      games: games.sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};
