export interface InterpretationContent {
  title: string;
  description: string;
  keyThemes: string[];
  strengths: string[];
  challenges: string[];
}

export interface SignInterpretation {
  [key: string]: InterpretationContent;
}

export interface PlanetsInHouses {
  [planet: string]: {
    [house: string]: InterpretationContent;
  };
}

export interface AspectInterpretation {
  [aspectType: string]: {
    [planetCombination: string]: InterpretationContent;
  };
}

export interface AstroData {
  sun: SignInterpretation;
  moon: SignInterpretation;
  rising: SignInterpretation;
  houses: {
    planetsInHouses: PlanetsInHouses;
  };
  aspects: AspectInterpretation;
}

export interface KeyPlacementInterpretation {
  sun?: InterpretationContent;
  moon?: InterpretationContent;
  rising?: InterpretationContent;
  // Add properties for houses and aspects as needed
}
