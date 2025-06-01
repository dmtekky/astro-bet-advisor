export interface ZodiacColorScheme {
  bg: string; // Background color for the card
  text: string; // Primary text color
  accent: string; // Accent color for borders, icons, highlights
  border: string; // Border color, often a slightly darker or lighter shade of accent or bg
  gradient: string; // A gradient, perhaps for a subtle background effect or a bottom bar
}

export const getZodiacSign = (dateString?: string | null): string => {
  if (!dateString) return 'Aries'; // Default or handle as error
  try {
    const date = new Date(dateString);
    // Ensure date is valid
    if (isNaN(date.getTime())) {
      // Try parsing with T instead of space for ISO 8601 compatibility
      const isoDate = new Date(dateString.replace(' ', 'T'));
      if (isNaN(isoDate.getTime())) {
        console.warn(`Invalid date string provided to getZodiacSign: ${dateString}`);
        return 'Aries'; // Default or handle as error
      }
      date.setTime(isoDate.getTime());
    }

    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // JavaScript months are 0-indexed

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    // Capricorn: (month === 12 && day >= 22) || (month === 1 && day <= 19)
    return 'Capricorn';
  } catch (error) {
    console.error(`Error parsing date string in getZodiacSign: ${dateString}`, error);
    return 'Aries'; // Fallback zodiac sign
  }
};

const zodiacColorSchemes: Record<string, ZodiacColorScheme> = {
  aries: {
    bg: 'bg-gradient-to-br from-red-400 via-red-500 to-orange-500',
    text: 'text-white',
    accent: '#EF4444', // Red-500
    border: 'border-red-600',
    gradient: 'linear-gradient(to right, #F87171, #F97316)' // red-400 to orange-600
  },
  taurus: {
    bg: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-500',
    text: 'text-white',
    accent: '#10B981', // Emerald-500
    border: 'border-emerald-600',
    gradient: 'linear-gradient(to right, #34D399, #22C55E)' // emerald-400 to green-500
  },
  gemini: {
    bg: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-400',
    text: 'text-neutral-800',
    accent: '#F59E0B', // Amber-500
    border: 'border-yellow-500',
    gradient: 'linear-gradient(to right, #FCD34D, #FBBF24)' // yellow-300 to amber-400
  },
  cancer: {
    bg: 'bg-gradient-to-br from-slate-300 via-slate-400 to-gray-400',
    text: 'text-neutral-800',
    accent: '#94A3B8', // Slate-400
    border: 'border-slate-500',
    gradient: 'linear-gradient(to right, #D1D5DB, #9CA3AF)' // gray-300 to gray-400
  },
  leo: {
    bg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500',
    text: 'text-white',
    accent: '#F97316', // Orange-500
    border: 'border-orange-600',
    gradient: 'linear-gradient(to right, #FB923C, #F59E0B)' // orange-400 to amber-500
  },
  virgo: {
    bg: 'bg-gradient-to-br from-lime-300 via-lime-400 to-green-400',
    text: 'text-neutral-800',
    accent: '#84CC16', // Lime-500
    border: 'border-lime-500',
    gradient: 'linear-gradient(to right, #A3E635, #4ADE80)' // lime-400 to green-400
  },
  libra: {
    bg: 'bg-gradient-to-br from-pink-300 via-pink-400 to-rose-400',
    text: 'text-white',
    accent: '#F472B6', // Pink-400
    border: 'border-pink-500',
    gradient: 'linear-gradient(to right, #F9A8D4, #FB7185)' // pink-300 to rose-400
  },
  scorpio: {
    bg: 'bg-gradient-to-br from-neutral-700 via-neutral-800 to-black',
    text: 'text-slate-100',
    accent: '#78716C', // Stone-500 (using as a dark, intense accent)
    border: 'border-neutral-900',
    gradient: 'linear-gradient(to right, #404040, #171717)' // neutral-700 to neutral-900
  },
  sagittarius: {
    bg: 'bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500',
    text: 'text-white',
    accent: '#8B5CF6', // Purple-500
    border: 'border-purple-600',
    gradient: 'linear-gradient(to right, #A78BFA, #6366F1)' // purple-400 to indigo-500
  },
  capricorn: {
    bg: 'bg-gradient-to-br from-stone-400 via-stone-500 to-neutral-500',
    text: 'text-white',
    accent: '#78716C', // Stone-500
    border: 'border-stone-600',
    gradient: 'linear-gradient(to right, #A8A29E, #737373)' // stone-400 to neutral-500
  },
  aquarius: {
    bg: 'bg-gradient-to-br from-sky-300 via-sky-400 to-cyan-400',
    text: 'text-neutral-800',
    accent: '#38BDF8', // Sky-400
    border: 'border-sky-500',
    gradient: 'linear-gradient(to right, #7DD3FC, #67E8F9)' // sky-300 to cyan-300
  },
  pisces: {
    bg: 'bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-500',
    text: 'text-white',
    accent: '#2DD4BF', // Teal-400
    border: 'border-teal-500',
    gradient: 'linear-gradient(to right, #5EEAD4, #22D3EE)' // teal-300 to cyan-400
  },
  unknown: {
    bg: 'bg-gradient-to-br from-slate-200 via-slate-300 to-gray-300',
    text: 'text-neutral-800',
    accent: '#9CA3AF', // Gray-400
    border: 'border-slate-400',
    gradient: 'linear-gradient(to right, #E5E7EB, #D1D5DB)' // slate-200 to gray-300
  }
};

export const getZodiacColorScheme = (zodiacSign: string): ZodiacColorScheme => {
  const sign = zodiacSign?.toLowerCase() || 'unknown';
  return zodiacColorSchemes[sign] || zodiacColorSchemes.unknown;
};
