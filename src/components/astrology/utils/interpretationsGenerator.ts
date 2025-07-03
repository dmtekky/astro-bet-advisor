import { ZODIAC_SIGNS } from './types.js'; // Assuming types.ts exports ZODIAC_SIGNS

export interface InterpretationDetail {
  title: string;
  description: string;
}

export interface AspectInterpretationDetail extends InterpretationDetail {
  planet1: string;
  planet2: string;
  aspect: string;
}

export interface KeyPlacementInterpretation {
  sun?: InterpretationDetail;
  moon?: InterpretationDetail;
  rising?: InterpretationDetail;
  planets?: {
    mercury?: InterpretationDetail;
    venus?: InterpretationDetail;
    mars?: InterpretationDetail;
    jupiter?: InterpretationDetail;
    saturn?: InterpretationDetail;
    uranus?: InterpretationDetail;
    neptune?: InterpretationDetail;
    pluto?: InterpretationDetail;
  };
  aspects?: AspectInterpretationDetail[];
}

// A simplified mapping for demonstration. In a real app, this would be much larger
// and potentially loaded from a JSON file or database.
const INTERPRETATION_DATA: {
  sun: Record<string, string>;
  moon: Record<string, string>;
  rising: Record<string, string>;
  mercury: Record<string, string>;
  venus: Record<string, string>;
  mars: Record<string, string>;
  jupiter: Record<string, string>;
  saturn: Record<string, string>;
  uranus: Record<string, string>;
  neptune: Record<string, string>;
  pluto: Record<string, string>;
  aspects: Record<string, Record<string, Record<string, string>>>; // planet1 -> planet2 -> aspect -> description
} = {
  sun: {
    Aries: "The Sun in Aries indicates a pioneering spirit, a strong drive for independence, and a natural leadership ability. You are energetic, enthusiastic, and often impulsive, with a desire to initiate and conquer. You value directness and authenticity, and can be quite competitive.",
    Taurus: "With the Sun in Taurus, you are grounded, practical, and possess a strong appreciation for stability and comfort. You are patient and persistent, often moving at your own pace, and value security and material well-being. Loyalty and sensuality are key traits.",
    Gemini: "A Sun in Gemini suggests a curious, adaptable, and intellectual nature. You are a natural communicator, always seeking new information and connections. Your mind is quick and versatile, though you may sometimes struggle with indecision or superficiality.",
    Cancer: "The Sun in Cancer signifies a deeply emotional, nurturing, and sensitive individual. You are strongly connected to your roots, family, and home, and possess a protective instinct. Your moods can be cyclical, and you seek emotional security and comfort.",
    Leo: "With the Sun in Leo, you are a natural leader, charismatic, and possess a strong desire for self-expression and recognition. You are generous, warm-hearted, and enjoy being in the spotlight. Creativity and loyalty are hallmarks, though pride can be a challenge.",
    Virgo: "A Sun in Virgo points to a practical, analytical, and detail-oriented personality. You are diligent, service-oriented, and strive for perfection in all you do. You have a keen eye for efficiency and improvement, and value health and order.",
    Libra: "The Sun in Libra indicates a desire for balance, harmony, and justice. You are diplomatic, charming, and seek partnership and fairness in all relationships. You appreciate beauty and aesthetics, and can sometimes struggle with indecision.",
    Scorpio: "With the Sun in Scorpio, you are intense, passionate, and possess a powerful will. You are drawn to depth, mystery, and transformation, and have a strong capacity for regeneration. Loyalty and determination are key, though you can be secretive or possessive.",
    Sagittarius: "A Sun in Sagittarius suggests an adventurous, optimistic, and freedom-loving spirit. You are drawn to exploration, philosophy, and higher learning, and seek truth and meaning. You are enthusiastic and open-minded, though can sometimes be restless or tactless.",
    Capricorn: "The Sun in Capricorn signifies a disciplined, ambitious, and responsible individual. You are driven by a desire for achievement and recognition, and possess a strong work ethic. You are practical and resourceful, and value tradition and structure.",
    Aquarius: "With the Sun in Aquarius, you are independent, innovative, and humanitarian. You are drawn to social causes and intellectual pursuits, and value freedom and originality. You are often unconventional and forward-thinking, though can sometimes be detached.",
    Pisces: "A Sun in Pisces points to a compassionate, intuitive, and imaginative nature. You are highly sensitive and empathetic, often drawn to creative or spiritual paths. You are adaptable and dreamy, though can sometimes be escapist or easily influenced.",
  },
  moon: {
    Aries: "The Moon in Aries indicates an emotional nature that is impulsive, independent, and quick to react. You feel things intensely and express your emotions directly, often with a pioneering spirit. You need emotional freedom and can be restless.",
    Taurus: "With the Moon in Taurus, your emotional needs are centered around security, comfort, and stability. You are deeply loyal and nurturing, finding solace in familiar routines and sensory pleasures. You can be resistant to change.",
    Gemini: "A Moon in Gemini suggests an emotional nature that is curious, adaptable, and intellectual. You process feelings through communication and need mental stimulation to feel secure. Your moods can be changeable, reflecting your versatile mind.",
    Cancer: "The Moon in Cancer is in its domicile, indicating a deeply nurturing, sensitive, and protective emotional core. You are highly empathetic and intuitive, with a strong need for emotional security and connection to family and home. Moods can fluctuate.",
    Leo: "With the Moon in Leo, your emotional expression is dramatic, warm, and seeks recognition. You need to feel appreciated and loved, and express your feelings generously. You are loyal and proud, and enjoy being the center of emotional attention.",
    Virgo: "A Moon in Virgo points to an emotional nature that is practical, analytical, and service-oriented. You find security in order and routine, and express care through helpfulness. You can be prone to worry and self-criticism.",
    Libra: "The Moon in Libra indicates an emotional need for balance, harmony, and partnership. You seek emotional security through relationships and strive for fairness. You are charming and diplomatic, though can struggle with emotional indecision.",
    Scorpio: "With the Moon in Scorpio, your emotional nature is intense, private, and deeply passionate. You feel things profoundly and are drawn to emotional depth and transformation. You are fiercely loyal but can be secretive or prone to jealousy.",
    Sagittarius: "A Moon in Sagittarius suggests an emotional nature that is adventurous, optimistic, and freedom-loving. You need emotional space and thrive on new experiences and learning. You are enthusiastic and philosophical, though can be restless.",
    Capricorn: "The Moon in Capricorn signifies an emotional nature that is disciplined, reserved, and responsible. You find emotional security through achievement and structure, and can be emotionally cautious. You are practical and resilient.",
    Aquarius: "With the Moon in Aquarius, your emotional needs are for freedom, intellectual connection, and humanitarian causes. You express emotions in an unconventional way and value objectivity. You can sometimes be emotionally detached.",
    Pisces: "A Moon in Pisces points to an emotional nature that is compassionate, intuitive, and highly sensitive. You absorb the feelings of others and are drawn to spiritual or creative expression. You can be prone to escapism or emotional boundaries.",
  },
  rising: {
    Aries: "An Aries Rising indicates a dynamic, energetic, and assertive first impression. You come across as a pioneer, direct, and courageous, with a strong independent streak. You are quick to act and eager to take on challenges.",
    Taurus: "With a Taurus Rising, you project an image of stability, calm, and practicality. You appear grounded and reliable, with a strong appreciation for comfort and beauty. You move deliberately and value security.",
    Gemini: "A Gemini Rising suggests a curious, communicative, and versatile demeanor. You come across as intellectual, witty, and always eager to learn and exchange ideas. You are adaptable and often appear youthful.",
    Cancer: "With a Cancer Rising, you project a nurturing, sensitive, and empathetic aura. You appear approachable and protective, with a strong connection to your emotions and home. You may seem shy at first.",
    Leo: "A Leo Rising indicates a charismatic, confident, and dramatic first impression. You command attention and project warmth, generosity, and a desire to be admired. You are naturally expressive and enjoy being in the spotlight.",
    Virgo: "With a Virgo Rising, you project an image of practicality, modesty, and attentiveness to detail. You appear organized and analytical, with a helpful and discerning demeanor. You may seem reserved or critical at first.",
    Libra: "A Libra Rising suggests a charming, diplomatic, and aesthetically pleasing first impression. You come across as balanced, fair-minded, and eager for connection. You value harmony and often seek partnership.",
    Scorpio: "With a Scorpio Rising, you project an intense, mysterious, and powerful aura. You appear private and perceptive, with a deep and magnetic presence. You are observant and can seem unapproachable.",
    Sagittarius: "A Sagittarius Rising indicates an enthusiastic, adventurous, and open-minded first impression. You come across as philosophical, freedom-loving, and always seeking new horizons. You are optimistic and direct.",
    Capricorn: "With a Capricorn Rising, you project an image of seriousness, responsibility, and ambition. You appear disciplined and capable, with a strong sense of purpose. You are often seen as mature and reserved.",
    Aquarius: "An Aquarius Rising suggests an independent, unconventional, and intellectual first impression. You come across as unique, progressive, and detached. You are friendly but may maintain a certain emotional distance.",
    Pisces: "With a Pisces Rising, you project a compassionate, dreamy, and sensitive aura. You appear empathetic and adaptable, with a gentle and sometimes elusive demeanor. You are highly intuitive and can be impressionable.",
  },
  mercury: {},
  venus: {},
  mars: {},
  jupiter: {},
  saturn: {},
  uranus: {},
  neptune: {},
  pluto: {},
  aspects: {},
};

export const generateInterpretations = (planetaryData: any): KeyPlacementInterpretation => {
  const interpretations: KeyPlacementInterpretation = {};

  if (!planetaryData || !planetaryData.planets || !Array.isArray(planetaryData.planets)) {
    console.warn('Invalid planetary data provided to interpretationsGenerator.');
    return interpretations;
  }

  // Helper to find a planet by name (case-insensitive)
  const findPlanet = (name: string) =>
    planetaryData.planets.find((p: any) => p.name?.toLowerCase() === name.toLowerCase());

  // Sun interpretation
  const sun = findPlanet('sun');
  if (sun && sun.sign) {
    const description = INTERPRETATION_DATA.sun?.[sun.sign];
    if (description) {
      interpretations.sun = { title: `Sun in ${sun.sign}`, description };
    }
  }

  // Moon interpretation
  const moon = findPlanet('moon');
  if (moon && moon.sign) {
    const description = INTERPRETATION_DATA.moon?.[moon.sign];
    if (description) {
      interpretations.moon = { title: `Moon in ${moon.sign}`, description };
    }
  }

  // Rising (Ascendant) interpretation
  // The ascendant is usually a direct property, not a planet in the 'planets' array
  // We need to derive the sign from the ascendant degree.
  if (typeof planetaryData.ascendant === 'number') {
    const ascendantDegree = planetaryData.ascendant;
    const signIndex = Math.floor(ascendantDegree / 30);
    const risingSign = ZODIAC_SIGNS[signIndex];

    if (risingSign) {
      const description = INTERPRETATION_DATA.rising?.[risingSign];
      if (description) {
        interpretations.rising = { title: `Rising in ${risingSign}`, description };
      }
    }
  }

  return interpretations;
};
