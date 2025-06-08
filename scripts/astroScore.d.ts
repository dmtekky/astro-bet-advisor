declare module './astroScore_2025-06-07.cjs' {
  interface Player {
    player_id: string;
    player_birth_date?: string;
    birth_city?: string;
    birth_country?: string;
    [key: string]: any;
  }

  interface AstroInfluenceResult {
    score: number;
    [key: string]: any;
  }

  export function calculateAstroInfluenceScore(
    player: Player,
    currentDate?: Date
  ): Promise<AstroInfluenceResult>;
}
