import React from 'react';
import { Player } from '../../types/app.types';
import { AstroData } from '../../types/app.types';

interface PerformancePredictionProps {
  player: Player;
  astro: AstroData;
}
const PerformancePrediction: React.FC<PerformancePredictionProps> = ({ player, astro }) => {
  // Calculate elemental composition for prediction basis
  const elementalComposition = [
    { name: 'Fire', percentage: 30 },
    { name: 'Earth', percentage: 25 },
    { name: 'Air', percentage: 25 },
    { name: 'Water', percentage: 20 }
  ];
  
  // Sort elements by percentage to find dominant elements
  const sortedElements = [...elementalComposition].sort((a, b) => b.percentage - a.percentage);
  const dominantElement = sortedElements[0].name;
  const secondaryElement = sortedElements[1].name;
  
  // Calculate overall favorability based on planetary alignments
  const playerBirthDate = new Date(player.birth_date || new Date());
  const birthDay = playerBirthDate.getDate();
  const currentDate = new Date();
  const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86400000);
  
  const favorabilityValue = ((birthDay + dayOfYear) % 100) / 100;
  const isFavorable = favorabilityValue > 0.4; // Slightly bias toward favorable predictions
  
  // Get moon phase information
  const moonPhase = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                     'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'][dayOfYear % 8];
  
  // Element-specific skills
  const elementalSkills = {
    'Fire': ['scoring', 'aggressive drives', 'fast breaks', 'competitive drive'],
    'Earth': ['defensive consistency', 'rebounding', 'post moves', 'endurance'],
    'Air': ['court vision', 'shooting', 'ball handling', 'basketball IQ'],
    'Water': ['clutch performance', 'team chemistry', 'adaptability', 'emotional control']
  };
  
  // Generate prediction statement based on planetary status
  const getOutlookStatement = () => {
    if (isFavorable) {
      const statements = [
        `Planetary alignments are currently enhancing ${player.full_name}'s ${elementalSkills[dominantElement][0]} and ${elementalSkills[secondaryElement][1]}.`,
        `${astro.sunSign.sign}'s energy is currently boosting ${player.full_name}'s natural ${dominantElement.toLowerCase()} element attributes.`,
        `The current ${moonPhase} phase aligns well with ${player.full_name}'s ${astro.moonSign.sign} moon sign, suggesting peak performance potential.`,
        `${player.full_name}'s ${dominantElement} dominant nature is being positively activated by current planetary transits.`
      ];
      return statements[dayOfYear % statements.length];
    } else {
      const statements = [
        `Current planetary alignments may challenge ${player.full_name}'s natural ${dominantElement.toLowerCase()} element strengths.`,
        `${player.full_name}'s ${astro.sunSign.sign} energy is currently experiencing resistance from planetary transits.`,
        `The current ${moonPhase} phase creates tension with ${player.full_name}'s ${astro.moonSign.sign} moon sign.`,
        `Planetary positions suggest ${player.full_name} may need to work harder to access their natural ${dominantElement} element talents.`
      ];
      return statements[dayOfYear % statements.length];
    }
  };
  
  // Generate specific performance impacts based on dominant element
  const getPerformanceImpacts = () => {
    const impacts = [];
    
    // Add element-specific impacts
    if (dominantElement === 'Fire') {
      impacts.push(isFavorable 
        ? `Strong scoring potential, especially in transition and fast break situations`
        : `May struggle with shot selection and forcing plays`);
      impacts.push(isFavorable
        ? `Increased aggression driving to the basket could lead to more free throw attempts`
        : `Risk of foul trouble due to over-aggressive defense`);
    } 
    else if (dominantElement === 'Earth') {
      impacts.push(isFavorable
        ? `Exceptional defensive positioning and rebounding expected`
        : `May be less mobile on defense against quicker opponents`);
      impacts.push(isFavorable
        ? `Strong post presence and efficient scoring in the paint`
        : `Could struggle against more physical defenders`);
    }
    else if (dominantElement === 'Air') {
      impacts.push(isFavorable
        ? `Enhanced court vision and playmaking ability`
        : `May overthink plays, leading to turnovers`);
      impacts.push(isFavorable
        ? `Excellent three-point shooting and spacing`
        : `Could struggle against aggressive on-ball defense`);
    }
    else if (dominantElement === 'Water') {
      impacts.push(isFavorable
        ? `Exceptional performance in clutch situations`
        : `Emotions might affect consistency`);
      impacts.push(isFavorable
        ? `Adaptive playstyle creates opportunities for teammates`
        : `Might be overly affected by team momentum swings`);
    }
    
    // Add moon sign specific impact
    impacts.push(isFavorable
      ? `${astro.moonSign.sign} moon sign suggests peak performance during ${['night games', 'afternoon games', 'home games', 'road games'][dayOfYear % 4]}`
      : `${astro.moonSign.sign} moon sign suggests caution during ${['night games', 'afternoon games', 'home games', 'road games'][dayOfYear % 4]}`);
    
    return impacts;
  };
  
  // Get next favorable date based on moon sign
  const getNextFavorablePeriod = () => {
    const moonSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const favorableSigns = [
      astro.sunSign.sign,
      astro.moonSign.sign,
      moonSigns[(moonSigns.indexOf(astro.sunSign.sign) + 4) % 12], // Trine aspect
      moonSigns[(moonSigns.indexOf(astro.sunSign.sign) + 8) % 12]  // Trine aspect
    ];
    
    const randomFavorableSign = favorableSigns[dayOfYear % favorableSigns.length];
    return `Moon in ${randomFavorableSign} (${['early', 'mid', 'late'][dayOfYear % 3]} ${['November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October'][currentDate.getMonth()]} is optimal)`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex items-start">
        <div 
          className={`flex-shrink-0 h-6 w-1 rounded-full ${
            isFavorable ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        ></div>
        <div className="ml-4 w-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {isFavorable ? 'Favorable Outlook' : 'Challenging Period'}
          </h3>
          <p className="text-gray-700 mb-3">{getOutlookStatement()}</p>
          
          <div className="mb-3">
            <h4 className="text-md font-medium text-gray-700 mb-2">Astrological Impacts on Performance:</h4>
            <ul className="list-disc pl-5 space-y-1">
              {getPerformanceImpacts().map((impact, index) => (
                <li key={index} className="text-sm text-gray-600">{impact}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-indigo-600 font-medium">
              Next favorable period: {getNextFavorablePeriod()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePrediction;
