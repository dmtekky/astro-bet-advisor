import React from 'react';
import type { AstroData } from '../types/app.types';

interface BigThreeAstroCardsProps {
  astro: AstroData;
  playerName: string;
}

const elementStyles = {
  Earth: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    text: 'text-amber-800',
    accent: 'text-amber-600',
    bullet: 'before:bg-amber-400',
  },
  Fire: {
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    text: 'text-rose-800',
    accent: 'text-rose-600',
    bullet: 'before:bg-rose-400',
  },
  Air: {
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    text: 'text-sky-800',
    accent: 'text-sky-600',
    bullet: 'before:bg-sky-400',
  },
  Water: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    text: 'text-indigo-800',
    accent: 'text-indigo-600',
    bullet: 'before:bg-indigo-400',
  },
};

const modalityIcons = {
  Cardinal: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 20L20 4m0 0v16m0-16H4" />
    </svg>
  ),
  Fixed: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Mutable: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

const athleticInterpretations = {
  Capricorn: [
    'Exceptional discipline and strategic thinking under pressure',
    'Thrives in high-stakes, late-game situations',
    'Demonstrates consistent performance through rigorous preparation',
  ],
  Aries: [
    'Natural leader with explosive energy and initiative',
    'Excels in fast-paced, high-intensity moments',
    'Fearless competitor who rises to challenges',
  ],
  Leo: [
    'Charismatic presence that elevates team performance',
    'Delivers standout performances when the spotlight is brightest',
    'Inspires confidence and unity among teammates',
  ],
  // Add more signs as needed
};

const getSignCard = (
  label: string,
  sign: { sign: string; element: string; modality: string },
  playerName: string
) => {
  const styles = elementStyles[sign.element as keyof typeof elementStyles] || elementStyles.Earth;
  const bullets = athleticInterpretations[sign.sign as keyof typeof athleticInterpretations] || [
    'Brings unique strengths to their position',
    'Adapts well to different game situations',
    'Contributes to team success through consistent performance',
  ];
  const ModalityIcon = modalityIcons[sign.modality as keyof typeof modalityIcons] || null;

  return (
    <div
      key={label}
      className={`relative flex flex-col p-6 rounded-xl border ${styles.bg} ${styles.border} min-w-[280px] max-w-[320px] transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">{label}</div>
          <h3 className="text-2xl font-light text-gray-900">{sign.sign}</h3>
        </div>
        <div className={`p-2 rounded-full ${styles.accent} bg-opacity-20`}>
          {ModalityIcon}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm font-medium mb-2 flex items-center">
          <span className={`w-2 h-2 rounded-full ${styles.accent} mr-2`}></span>
          <span className={styles.text}>{sign.element} Energy</span>
        </div>
        <div className="text-sm font-medium mb-2 flex items-center">
          <span className={`w-2 h-2 rounded-full ${styles.accent} mr-2`}></span>
          <span className={styles.text}>{sign.modality} Modality</span>
        </div>
      </div>

      <ul className="space-y-2 mt-2">
        {bullets.map((bullet, i) => (
          <li key={i} className={`relative pl-4 text-sm text-gray-700 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full ${styles.bullet} before:opacity-70`}>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
};

const BigThreeAstroCards: React.FC<BigThreeAstroCardsProps> = ({ astro, playerName }) => {
  return (
    <div className="w-full">
      {/* Desktop - Horizontal Layout */}
      <div className="hidden md:flex flex-row justify-center items-stretch gap-6 w-full">
        {getSignCard('Sun Sign', astro.sunSign, playerName)}
        {getSignCard('Moon Sign', astro.moonSign, playerName)}
        {getSignCard('Ascendant', astro.ascendant, playerName)}
      </div>
      
      {/* Mobile - Scrollable Carousel */}
      <div className="md:hidden w-full overflow-x-auto pb-6 -mx-4 px-4">
        <div className="flex flex-row gap-4 w-max">
          {getSignCard('Sun', astro.sunSign, playerName)}
          {getSignCard('Moon', astro.moonSign, playerName)}
          {getSignCard('Asc', astro.ascendant, playerName)}
        </div>
      </div>
    </div>
  );
};

export default BigThreeAstroCards;
