// src/utils/elementUtils.ts

import { AstroData } from '../types/app.types';

export interface ElementComposition {
  name: string;
  percentage: number;
}

export interface ElementInfluence {
  element: string;
  percentage: number;
  strength: string;
  description: string;
}

export const getElementForSign = (sign: string): string => {
  const elementMap: Record<string, string> = {
    'Aries': 'Fire',
    'Taurus': 'Earth',
    'Gemini': 'Air',
    'Cancer': 'Water',
    'Leo': 'Fire',
    'Virgo': 'Earth',
    'Libra': 'Air',
    'Scorpio': 'Water',
    'Sagittarius': 'Fire',
    'Capricorn': 'Earth',
    'Aquarius': 'Air',
    'Pisces': 'Water'
  };
  return elementMap[sign] || 'Earth'; // Default to Earth if sign not found
};

export const calculateElementalComposition = (astro: AstroData): ElementComposition[] => {
  const elements = ['Fire', 'Earth', 'Air', 'Water'];
  const elementCounts: Record<string, number> = {
    'Fire': 0,
    'Earth': 0,
    'Air': 0,
    'Water': 0
  };

  // Count elements from sun, moon, and ascendant signs
  elementCounts[getElementForSign(astro.sunSign.sign)] += 1.5; // Sun has more weight
  elementCounts[getElementForSign(astro.moonSign.sign)] += 1.2; // Moon has medium weight
  elementCounts[getElementForSign(astro.ascendant.sign)] += 1.0; // Ascendant has base weight

  // Calculate raw percentages
  const total = Object.values(elementCounts).reduce((sum, count) => sum + count, 0);
  
  // Calculate raw percentages and keep track of the sum for adjustment
  let sum = 0;
  const rawPercentages = elements.map(element => {
    const percentage = (elementCounts[element] / total) * 100;
    sum += percentage;
    return { name: element, raw: percentage };
  });

  // Calculate rounded values and track the difference
  const rounded = rawPercentages.map(item => ({
    name: item.name,
    value: Math.round(item.raw),
    diff: Math.round(item.raw) - item.raw
  }));

  // Sort by the difference to distribute rounding errors fairly
  rounded.sort((a, b) => a.diff - b.diff);
  
  // Calculate the total of rounded values
  const totalRounded = rounded.reduce((sum, item) => sum + item.value, 0);
  
  // Distribute the rounding error (100 - totalRounded) to the elements with the largest differences
  const error = 100 - totalRounded;
  for (let i = 0; i < Math.abs(error); i++) {
    const index = error > 0 ? i : rounded.length - 1 - i;
    rounded[index].value += error > 0 ? 1 : -1;
  }
  
  // Return the final percentages
  return rounded.map(item => ({
    name: item.name,
    percentage: item.value
  }));
};

export const getElementColor = (element: string): string => {
  const colors: Record<string, string> = {
    'Fire': '#ef4444',    // Red
    'Earth': '#22c55e',   // Green
    'Air': '#3b82f6',     // Blue
    'Water': '#8b5cf6'    // Purple
  };
  return colors[element] || '#6b7280'; // Default to gray
};

export const getElementColorClass = (element: string): string => {
  const classes: Record<string, string> = {
    'Fire': 'bg-red-500',
    'Earth': 'bg-green-500',
    'Air': 'bg-blue-500',
    'Water': 'bg-purple-500'
  };
  return classes[element] || 'bg-gray-400';
};

export const getElementEmoji = (element: string): string => {
  const emojis: Record<string, string> = {
    'Fire': '🔥',
    'Earth': '🌍',
    'Air': '💨',
    'Water': '💧'
  };
  return emojis[element] || '✨';
};

export const getElementStrength = (percentage: number): string => {
  if (percentage >= 35) return 'Strong Influence';
  if (percentage >= 20) return 'Moderate Influence';
  return 'Minimal Influence';
};

export const getElementDescription = (element: string, percentage: number, playerName: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    'Fire': {
      strong: `${playerName} has a powerful Fire presence (${percentage}%), bringing intense energy, passion, and competitive drive to the game. This makes ${playerName} a natural leader with a strong will to win.`,
      moderate: `A balanced Fire presence (${percentage}%) gives ${playerName} good energy and motivation, though they may need to be mindful of maintaining consistency.`,
      minimal: `With minimal Fire (${percentage}%), ${playerName} may need to work on bringing more energy and assertiveness to their game.`
    },
    'Earth': {
      strong: `A strong Earth presence (${percentage}%) gives ${playerName} exceptional reliability, consistency, and practical skills. They're the rock of the team, always delivering solid performances.`,
      moderate: `A balanced Earth presence (${percentage}%) helps ${playerName} stay grounded and focused, though they may need to work on being more adaptable.`,
      minimal: `With minimal Earth (${percentage}%), ${playerName} may need to focus on developing more consistency and reliability in their performance.`
    },
    'Air': {
      strong: `A dominant Air presence (${percentage}%) gives ${playerName} excellent mental agility, communication skills, and the ability to understand complex plays and strategies.`,
      moderate: `A good balance of Air (${percentage}%) gives ${playerName} solid mental agility and the ability to understand complex plays.`,
      minimal: `With minimal Air (${percentage}%), ${playerName} may need to work on their strategic thinking and communication on the field.`
    },
    'Water': {
      strong: `A strong Water presence (${percentage}%) gives ${playerName} exceptional emotional intelligence, intuition, and team chemistry. They're able to read the game and their teammates with ease.`,
      moderate: `A balanced Water presence (${percentage}%) helps ${playerName} connect with teammates and understand the flow of the game.`,
      minimal: `Minimal Water (${percentage}%) suggests ${playerName} may need to work on emotional awareness and team chemistry.`
    }
  };

  const strength = percentage >= 35 ? 'strong' : percentage >= 20 ? 'moderate' : 'minimal';
  return descriptions[element]?.[strength] || `${playerName}'s ${element} influence is ${strength}.`;
};

export const getInfluenceStrength = (score: number): string => {
  if (score >= 90) return 'exceptionally influenced';
  if (score >= 70) return 'strongly influenced';
  if (score >= 50) return 'moderately influenced';
  if (score >= 30) return 'slightly influenced';
  return 'minimally influenced';
};

export const getElementalInfluences = (astro: AstroData, playerName: string): ElementInfluence[] => {
  const elements = calculateElementalComposition(astro);
  
  return elements.map(element => ({
    element: element.name,
    percentage: element.percentage,
    strength: getElementStrength(element.percentage),
    description: getElementDescription(element.name, element.percentage, playerName)
  }));
};
