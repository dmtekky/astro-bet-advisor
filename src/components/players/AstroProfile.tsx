import React from 'react';
import { AstroData } from '../../types/app.types';
import BigThreeAstroCards from '../../pages/BigThreeAstroCards';
import AstroPeakDay from '../../pages/AstroPeakDay';

// Import Player interface
import { Player } from '../../types/app.types';

// Define interfaces for the component props
interface AstroProfileProps {
  player: Player & {
    full_name: string | null;
    birth_date?: string | null;
  };
  astro: AstroData;
}

// Helper function to calculate elemental composition
const calculateElementalComposition = (astro: AstroData) => {
  const elements = ['Fire', 'Earth', 'Air', 'Water'] as const;
  return elements.map(element => ({
    name: element,
    percentage: Math.round(Math.random() * 30 + 10) // Replace with actual calculation
  }));
};

// Element-specific skills for performance prediction
const elementalSkills = {
  'Fire': ['power hitting', 'aggressive base running', 'fastball velocity', 'competitive drive'],
  'Earth': ['defensive consistency', 'plate discipline', 'ground ball pitching', 'endurance'],
  'Air': ['pitch recognition', 'bat speed', 'breaking ball movement', 'strategic thinking'],
  'Water': ['adaptability', 'clutch performance', 'changeup effectiveness', 'team chemistry']
};

// Moon phases for prediction
const moonPhases = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
];

const AstroProfile: React.FC<AstroProfileProps> = ({ player, astro }) => {
  // Calculate elemental composition for prediction basis
  const elementalComposition = calculateElementalComposition(astro);
  const sortedElements = [...elementalComposition].sort((a, b) => b.percentage - a.percentage);
  const dominantElement = sortedElements[0].name;
  const secondaryElement = sortedElements[1].name;
  
  // Calculate deterministic values based on birth date and current date
  const playerBirthDate = new Date(player.birth_date || new Date());
  const birthDay = playerBirthDate.getDate();
  const currentDate = new Date();
  const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86400000);
  
  const favorabilityValue = ((birthDay + dayOfYear) % 100) / 100;
  const isFavorable = favorabilityValue > 0.4;
  const moonPhase = moonPhases[dayOfYear % 8];
  
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
        ? `Strong power hitting potential, especially against ${['left-handed', 'right-handed'][dayOfYear % 2]} pitchers`
        : `May struggle with timing on breaking balls, affecting power numbers`);
      impacts.push(isFavorable
        ? `Increased aggression on the basepaths could lead to extra bases`
        : `Risk of overaggression could lead to baserunning errors`);
    } 
    else if (dominantElement === 'Earth') {
      impacts.push(isFavorable
        ? `Exceptional defensive positioning and fielding consistency expected`
        : `May play too conservatively in high-pressure defensive situations`);
      impacts.push(isFavorable
        ? `Excellent pitch selection and plate discipline likely`
        : `Could be overly patient at the plate, missing hittable pitches`);
    }
    else if (dominantElement === 'Air') {
      impacts.push(isFavorable
        ? `Enhanced ability to read and react to complex pitch sequences`
        : `May overthink at-bats, leading to mental fatigue late in games`);
      impacts.push(isFavorable
        ? `Quick adjustments to opposing pitchers' strategies`
        : `Could struggle against pitchers with unpredictable patterns`);
    }
    else if (dominantElement === 'Water') {
      impacts.push(isFavorable
        ? `Exceptional performance in high-pressure, clutch situations`
        : `Emotional fluctuations might affect consistency`);
      impacts.push(isFavorable
        ? `Adaptive approach allows quick recovery from slumps`
        : `Might be overly influenced by team momentum swings`);
    }
    
    // Add moon sign specific impact
    impacts.push(isFavorable
      ? `${astro.moonSign.sign} moon sign suggests peak performance during ${['night games', 'day games', 'home stands', 'road trips'][dayOfYear % 4]}`
      : `${astro.moonSign.sign} moon sign suggests caution during ${['night games', 'day games', 'home stands', 'road trips'][dayOfYear % 4]}`);
    
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
    return `Moon in ${randomFavorableSign} (${['early', 'mid', 'late'][dayOfYear % 3]} ${['June', 'July', 'August', 'September', 'October'][dayOfYear % 5]} is optimal)`;
  };

  // Get compatibility text
  const getCompatibilityText = () => {
    const elementToCompatibles: Record<string, string[]> = {
      Fire: ['Aries', 'Leo', 'Sagittarius'],
      Earth: ['Taurus', 'Virgo', 'Capricorn'],
      Air: ['Gemini', 'Libra', 'Aquarius'],
      Water: ['Cancer', 'Scorpio', 'Pisces'],
    };
    const sunElement = astro.sunSign.element;
    const compatibleSigns = elementToCompatibles[sunElement] || [];
    return `${player.full_name}'s astrological profile suggests strongest team chemistry with players born under ${compatibleSigns.join(', ')} signs.`;
  };

  return (
    <>
      {/* Performance Prediction Card */}
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

      {/* Astrological Profile */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Astrological Profile</h2>
        <div className="mt-4">
          <BigThreeAstroCards astro={astro} playerName={player.full_name || ''} />
        </div>
        
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
          <h3 className="font-semibold text-indigo-800 mb-2">Astrological Interpretation</h3>
          <AstroPeakDay
            player={player}
            astro={astro}
          />
        </div>
        
        <div className="mt-6">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-2">Compatibility</h3>
            <p className="text-gray-700">
              {getCompatibilityText()}
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default AstroProfile;
