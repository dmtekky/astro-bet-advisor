import type { ElementsDistribution } from '@/types/astrology';

/**
 * Calculates the distribution of elements based on planetary positions
 */
export const getElementsDistribution = (data: any): ElementsDistribution => {
  const distribution: ElementsDistribution = { fire: 0, earth: 0, water: 0, air: 0 };
  
  if (!data?.planets) {
    // Return a default balanced distribution if no data is available
    return { fire: 25, earth: 25, water: 25, air: 25 };
  }

  const signToElement: { [key: string]: keyof ElementsDistribution } = {
    'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
    'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
    'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
    'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water',
  };

  let totalPoints = 0;
  
  // Count planets in each element
  for (const planetKey in data.planets) {
    const planet = data.planets[planetKey];
    if (planet?.sign) {
      const element = signToElement[planet.sign];
      if (element) {
        distribution[element]++;
        totalPoints++;
      }
    }
  }

  if (totalPoints === 0) {
    return { fire: 25, earth: 25, water: 25, air: 25 }; // Default if no planets contributed
  }

  // Calculate percentages and round them
  let firePct = Math.round((distribution.fire / totalPoints) * 100);
  let earthPct = Math.round((distribution.earth / totalPoints) * 100);
  let waterPct = Math.round((distribution.water / totalPoints) * 100);
  let airPct = Math.round((distribution.air / totalPoints) * 100);

  // Adjust to ensure sum is 100 due to rounding
  const sumPct = firePct + earthPct + waterPct + airPct;
  if (sumPct !== 100) {
    const diff = 100 - sumPct;
    // Adjust the largest percentage to account for rounding
    const percentages = [
      { name: 'fire', value: firePct },
      { name: 'earth', value: earthPct },
      { name: 'water', value: waterPct },
      { name: 'air', value: airPct }
    ];
    
    percentages.sort((a, b) => b.value - a.value);
    
    // Add the difference to the largest percentage
    switch (percentages[0].name) {
      case 'fire': firePct += diff; break;
      case 'earth': earthPct += diff; break;
      case 'water': waterPct += diff; break;
      case 'air': airPct += diff; break;
    }
  }

  return {
    fire: firePct,
    earth: earthPct,
    water: waterPct,
    air: airPct,
  };
};

/**
 * Generates an interpretation of the elemental distribution
 */
export const getElementalInterpretation = (distribution: ElementsDistribution): string => {
  const { fire, earth, water, air } = distribution;
  
  const elements = [
    { name: 'Fire', value: fire },
    { name: 'Earth', value: earth },
    { name: 'Water', value: water },
    { name: 'Air', value: air },
  ];

  const sortedElements = [...elements].sort((a, b) => b.value - a.value);
  const [first, second, third, fourth] = sortedElements;

  const dominantThr = 35;
  const strongThr = 28;
  const lackingThr = 15;

  let interpretation = '';

  // Scenario 1: Two Dominant Elements
  if (first.value >= dominantThr && second.value >= strongThr) {
    if ((first.name === 'Fire' && second.name === 'Air') || (first.name === 'Air' && second.name === 'Fire')) {
      interpretation = "An absolute inferno of Fire meeting a whirlwind of Air! Brace for a spectacle of breathtaking speed, audacious offensive assaults, and genius-level playmaking. Star players will be gunning for legendary status. But this high-wire act courts disaster: expect shocking defensive breakdowns, high-profile errors under pressure, and teams risking burnout. This is a matchup where the scoreboard might explode!";
    } else if ((first.name === 'Fire' && second.name === 'Earth') || (first.name === 'Earth' && second.name === 'Fire')) {
      interpretation = "A titanic clash of raw Firepower against immovable Earth! Expect brutal physicality, where explosive offensive bursts meet ironclad defensive stands. Games could turn on moments of individual brilliance overcoming sheer resilience, or disciplined strategy quelling aggressive onslaughts. Player endurance and the ability to absorb punishment will be paramount.";
    } else if ((first.name === 'Fire' && second.name === 'Water') || (first.name === 'Water' && second.name === 'Fire')) {
      interpretation = "A seething cauldron of Fire and Water! Today's contests will be fought with raw, untamed emotion. Expect simmering rivalries to erupt, with players riding a tidal wave of adrenaline. This volatile brew can forge legendary, clutch moments OR trigger epic meltdowns under the spotlight. Psychological fortitude will be as crucial as physical skill.";
    } else if ((first.name === 'Earth' && second.name === 'Air') || (first.name === 'Air' && second.name === 'Earth')) {
      interpretation = "Strategic Air intellect versus methodical Earth power! This is a chess match on the grandest scale. Expect calculated risks and innovative game plans trying to dismantle disciplined, resilient opponents. Will quick thinking and adaptability outmaneuver sheer persistence, or will relentless pressure expose tactical flaws? Mental toughness meets physical grind.";
    } else if ((first.name === 'Earth' && second.name === 'Water') || (first.name === 'Water' && second.name === 'Earth')) {
      interpretation = "Deep Water intuition flows into formidable Earth structures. Teams might display incredible synergy, turning disciplined defense into fluid, opportunistic attacks. Player instincts combined with unwavering team strategy can create an almost unbreakable force. However, if the emotional Water gets muddied or Earth's foundations crack, it could lead to surprising collapses.";
    } else if ((first.name === 'Air' && second.name === 'Water') || (first.name === 'Water' && second.name === 'Air')) {
      interpretation = "The unpredictable currents of Water meet the strategic gusts of Air! Expect a dazzling display of creative playmaking, where intuitive flashes are backed by intelligent execution. Teams that can 'feel' the game's rhythm while outthinking their opponents will thrive. However, this blend can also lead to over-complication or emotional decisions overriding sound strategy. Genius or chaos could prevail.";
    }
  } 
  // Scenario 2: One Element Clearly Dominant
  else if (first.value >= dominantThr) {
    if (first.name === 'Fire') {
      interpretation = "Pure Fire fuels the arena today! This is where individual brilliance can single-handedly dominate. Expect aggressive, attacking play from the get-go, with teams pushing the tempo relentlessly. Records could be challenged, but so could composure – watch for explosive tempers or costly, overzealous penalties. Underdogs banking on a defensive grind will struggle immensely.";
    } else if (first.name === 'Earth') {
      interpretation = "The relentless power of Earth shapes today's battlefield! Expect a masterclass in defensive discipline, physical dominance, and unwavering resolve. Teams built on solid foundations and methodical execution will grind opponents into submission. Low-scoring, gritty affairs are likely, where every inch is fought for. Flashy plays give way to sheer willpower.";
    } else if (first.name === 'Air') {
      interpretation = "The game will be played at the speed of thought with Air ascendant! Prepare for strategic masterminds to dictate play, with dazzling displays of skill, quick adaptation, and telepathic teamwork. Teams that can out-think and outmaneuver their rivals will soar. However, an over-reliance on intellect can lead to paralysis by analysis or vulnerability to raw, unpredictable power.";
    } else if (first.name === 'Water') {
      interpretation = "A tidal wave of Water energy floods the competition! Intuition, team synergy, and emotional intensity will define victory. Expect players to tap into a collective consciousness, making instinctive, game-changing plays. Momentum will be king, capable of carrying teams to stunning heights or dragging them into despair. Clutch performances under immense pressure are on the cards.";
    }
  }

  // Scenario 3: One Element Lacking
  let lackingInterpretation = '';
  if (fourth.value <= lackingThr) {
    const lackingElement = fourth.name;
    if (lackingElement === 'Fire') {
      lackingInterpretation = "A critical lack of Fire could extinguish offensive sparks! Teams might struggle for aggression, killer instinct, and the individual brilliance needed to break deadlocks. Expect cautious play, possibly leading to stalemates or low-energy contests decided by errors rather than daring.";
    } else if (lackingElement === 'Earth') {
      lackingInterpretation = "Dangerously low Earth energy means the very foundation of disciplined play is crumbling! Watch for chaotic execution, a shocking lack of fundamentals, and teams utterly failing to protect a lead. This is prime territory for monumental upsets, as even elite teams might look amateurish.";
    } else if (lackingElement === 'Air') {
      lackingInterpretation = "A deficit in Air could lead to strategic meltdowns! Teams may suffer from poor decision-making, an inability to adapt, and breakdowns in communication. Expect sloppy plays, mental errors, and an inability to exploit opponents' weaknesses. Raw talent alone won't save the day if the game plan is incoherent.";
    } else if (lackingElement === 'Water') {
      lackingInterpretation = "Low Water energy can drain the passion from the game! Teams might lack cohesion, struggle to find rhythm, or fail to connect emotionally with the stakes. Expect mechanical performances, a lack of intuitive plays, and difficulty mounting comebacks when adversity strikes. Resilience will be tested.";
    }
    
    if (interpretation && lackingInterpretation) {
      interpretation += ` Additionally, ${lackingInterpretation.charAt(0).toLowerCase() + lackingInterpretation.slice(1)}`;
    } else if (lackingInterpretation) {
      interpretation = lackingInterpretation;
    }
  }

  // Scenario 4: Balanced State (if no other strong scenarios hit)
  if (!interpretation && elements.every(el => el.value > lackingThr && el.value < dominantThr)) {
    // Check for a more tightly balanced scenario
    const allModerate = elements.every(el => el.value >= (lackingThr + 5) && el.value <= (strongThr - 3));
    if (allModerate) {
      interpretation = "A truly balanced elemental field means today's victory will be forged by superior all-around execution and strategic genius. No single approach will dominate; teams must be masters of adaptation, exploiting subtle shifts in momentum. This is where coaching prowess and deep rosters shine, potentially leading to a chess match decided by fine margins.";
    } else {
      // General prominent element if not strictly balanced but no other rule hit
      if (first.value >= strongThr) {
        let prominentQuality = '';
        switch (first.name) {
          case 'Fire': prominentQuality = 'aggressive plays and individual efforts'; break;
          case 'Earth': prominentQuality = 'strong defensive plays and resilience'; break;
          case 'Air': prominentQuality = 'smart strategies and adaptability'; break;
          case 'Water': prominentQuality = 'intuitive teamwork and emotional drive'; break;
        }
        interpretation = `While no single element overwhelmingly dominates, ${first.name} provides a significant undercurrent of ${prominentQuality}. Expect this to subtly shape game dynamics, favoring teams that can tap into this leading energy while remaining versatile against other influences.`;
      }
    }
  }

  // Fallback if no specific interpretation was set
  if (!interpretation) {
    interpretation = "Today's unique elemental cocktail creates an unpredictable arena! Elite athletes will need to draw on every ounce of skill, strategy, and instinct. Look for moments where the sheer will to win defies the patterns, and where unexpected heroes can emerge from the complex interplay of energies. Anything can happen!";
  }

  return interpretation;
};
