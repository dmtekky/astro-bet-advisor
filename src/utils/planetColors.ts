export const getPlanetColor = (planetName: string): string => {
  const planet = planetName.toLowerCase();
  switch (planet) {
    case 'sun':
      return '#F59E0B'; // Amber-500
    case 'moon':
      return '#A5B4FC'; // Indigo-300
    case 'mercury':
      return '#6EE7B7'; // Emerald-400
    case 'venus':
      return '#F472B6'; // Pink-400
    case 'mars':
      return '#F87171'; // Red-400
    case 'jupiter':
      return '#A78BFA'; // Violet-400
    case 'saturn':
      return '#FBBF24'; // Amber-400
    case 'uranus':
      return '#60A5FA'; // Blue-400
    case 'neptune':
      return '#67E8F9'; // Cyan-400
    case 'pluto':
      return '#C084FC'; // Purple-400
    default:
      return '#9CA3AF'; // Gray-400
  }
};

export const getPlanetGradient = (planetName: string): string => {
  const color = getPlanetColor(planetName);
  // Create a slightly lighter version of the color for the gradient
  return `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`;
};
