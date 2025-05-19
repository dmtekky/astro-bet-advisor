export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  logo?: string;
}

export interface GameData {
  id: string;
  league: string;
  homeTeam: string | Team;
  awayTeam: string | Team;
  start_time?: string;
  startTime?: string;
  homeOdds?: number;
  awayOdds?: number;
  spread?: number;
  total?: number;
  homeRecord?: string;
  awayRecord?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'suspended' | 'canceled';
  period?: number;
  astroEdge: number;
  astroInfluence: string;
  homeAstroScore?: number;
  awayAstroScore?: number;
  homeTrend?: 'up' | 'down' | 'neutral';
  awayTrend?: 'up' | 'down' | 'neutral';
  homeTrendValue?: number;
  awayTrendValue?: number;
  homeInjuries?: number;
  awayInjuries?: number;
  homeRestDays?: number;
  awayRestDays?: number;
  homeLast5?: string[];
  awayLast5?: string[];
  homeStats?: {
    pointsPerGame: number;
    pointsAllowed: number;
    offensiveRating: number;
    defensiveRating: number;
    pace: number;
    offensiveReboundPct: number;
    defensiveReboundPct: number;
    assistPct: number;
    turnoverPct: number;
    effectiveFieldGoalPct: number;
    trueShootingPct: number;
  };
  awayStats?: {
    pointsPerGame: number;
    pointsAllowed: number;
    offensiveRating: number;
    defensiveRating: number;
    pace: number;
    offensiveReboundPct: number;
    defensiveReboundPct: number;
    assistPct: number;
    turnoverPct: number;
    effectiveFieldGoalPct: number;
    trueShootingPct: number;
  };
  homeTrends?: {
    straightUp: string;
    againstSpread: string;
    overUnder: string;
  };
  awayTrends?: {
    straightUp: string;
    againstSpread: string;
    overUnder: string;
  };
  homePlayers?: Array<{
    id: string;
    name: string;
    position: string;
    status: 'active' | 'inactive' | 'injured';
    injuryStatus?: string;
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPct: number;
    threePointPct: number;
    freeThrowPct: number;
    plusMinus: number;
  }>;
  awayPlayers?: Array<{
    id: string;
    name: string;
    position: string;
    status: 'active' | 'inactive' | 'injured';
    injuryStatus?: string;
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPct: number;
    threePointPct: number;
    freeThrowPct: number;
    plusMinus: number;
  }>;
  lastMeeting?: {
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    winner: 'home' | 'away';
    spreadCover: 'home' | 'away' | 'push';
    total: number;
    overUnder: 'over' | 'under' | 'push';
  };
  weather?: {
    temperature: number;
    condition: string;
    windSpeed: number;
    windDirection: string;
    humidity: number;
    precipitationChance: number;
  };
  venue?: {
    name: string;
    city: string;
    state: string;
    capacity: number;
    surface: string;
    roofType: 'retractable' | 'fixed' | 'open' | 'dome';
  };
  officials?: Array<{
    id: string;
    name: string;
    jerseyNumber: number;
    position: 'referee' | 'umpire' | 'linesman' | 'line_judge' | 'back_judge' | 'side_judge' | 'field_judge';
    experience: number;
    homeTeamFouls: number;
    awayTeamFouls: number;
    homeTeamTechs: number;
    awayTeamTechs: number;
    homeTeamEjections: number;
    awayTeamEjections: number;
    homeTeamWinPct: number;
    awayTeamWinPct: number;
    overUnderRecord: string;
  }>;
  broadcast?: {
    network: string;
    channel: string;
    streaming: string[];
    radio: {
      home: string[];
      away: string[];
    };
  };
  odds?: {
    moneyline: {
      home: number;
      away: number;
      draw?: number;
    };
    spread: {
      home: number;
      away: number;
      homePoints: number;
      awayPoints: number;
    };
    total: {
      points: number;
      over: number;
      under: number;
    };
    openingOdds?: {
      moneyline: {
        home: number;
        away: number;
        draw?: number;
      };
      spread: {
        home: number;
        away: number;
        homePoints: number;
        awayPoints: number;
      };
      total: {
        points: number;
        over: number;
        under: number;
      };
    };
    consensus?: {
      moneyline: {
        homePct: number;
        awayPct: number;
        drawPct?: number;
      };
      spread: {
        homePct: number;
        awayPct: number;
      };
      total: {
        overPct: number;
        underPct: number;
      };
    };
    publicBetting?: {
      moneyline: {
        homePct: number;
        awayPct: number;
        drawPct?: number;
      };
      spread: {
        homePct: number;
        awayPct: number;
      };
      total: {
        overPct: number;
        underPct: number;
      };
    };
    sharpMoney?: {
      moneyline: {
        homePct: number;
        awayPct: number;
        drawPct?: number;
      };
      spread: {
        homePct: number;
        awayPct: number;
      };
      total: {
        overPct: number;
        underPct: number;
      };
    };
  };
  predictions?: {
    homeWinPct: number;
    awayWinPct: number;
    projectedScore: {
      home: number;
      away: number;
    };
    projectedTotal: number;
    projectedSpread: number;
    valuePlays: string[];
    keyMatchups: Array<{
      position: string;
      homePlayer: string;
      awayPlayer: string;
      advantage: 'home' | 'away' | 'even';
      description: string;
    }>;
    injuryImpact: {
      home: number;
      away: number;
      description: string;
    };
    paceImpact: {
      description: string;
      advantage: 'home' | 'away' | 'neutral';
    };
    coachingMatchup: {
      homeCoach: string;
      awayCoach: string;
      homeRecord: string;
      awayRecord: string;
      headToHead: string;
      advantage: 'home' | 'away' | 'even';
    };
    restAdvantage: {
      homeRestDays: number;
      awayRestDays: number;
      advantage: 'home' | 'away' | 'even';
      description: string;
    };
    travelImpact: {
      homeMiles: number;
      awayMiles: number;
      homeDaysSinceLastTravel: number;
      awayDaysSinceLastTravel: number;
      advantage: 'home' | 'away' | 'neutral';
      description: string;
    };
    weatherImpact?: {
      description: string;
      affects: 'offense' | 'defense' | 'both' | 'none';
      impact: 'positive' | 'negative' | 'neutral';
    };
    venueImpact?: {
      description: string;
      advantage: 'home' | 'away' | 'neutral';
    };
    officiatingCrew?: {
      referee: string;
      homeTeamRecord: string;
      awayTeamRecord: string;
      homeCoverPct: number;
      awayCoverPct: number;
      overPct: number;
      underPct: number;
      homeFoulsPerGame: number;
      awayFoulsPerGame: number;
      description: string;
    };
    situationalTrends: Array<{
      situation: string;
      homeRecord: string;
      awayRecord: string;
      homeWinPct: number;
      awayWinPct: number;
      description: string;
    }>;
    bettingTrends: {
      home: {
        ats: string;
        overUnder: string;
        asFavorite: string;
        asUnderdog: string;
        vsConference: string;
        vsDivision: string;
      };
      away: {
        ats: string;
        overUnder: string;
        asFavorite: string;
        asUnderdog: string;
        vsConference: string;
        vsDivision: string;
      };
      headToHead: {
        homeTeam: string;
        awayTeam: string;
        homeRecord: string;
        awayRecord: string;
        overUnder: string;
        trends: string[];
      };
    };
    expertPicks: Array<{
      source: string;
      pick: 'home' | 'away' | 'over' | 'under';
      confidence: number;
      analysis: string;
      expert: string;
      record: string;
    }>;
    modelProjections: {
      elo: {
        homeWinPct: number;
        projectedScore: string;
      };
      srs: {
        homeWinPct: number;
        projectedScore: string;
      };
      ortgDrtg: {
        homeWinPct: number;
        projectedScore: string;
      };
      average: {
        homeWinPct: number;
        projectedScore: string;
      };
    };
    keyInjuries: Array<{
      team: 'home' | 'away';
      player: string;
      position: string;
      status: 'out' | 'questionable' | 'doubtful' | 'probable';
      injury: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
    }>;
    revengeNarrative?: {
      exists: boolean;
      team: 'home' | 'away';
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    letdownSpot?: {
      exists: boolean;
      team: 'home' | 'away';
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    lookaheadSpot?: {
      exists: boolean;
      team: 'home' | 'away';
      nextOpponent: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    };
    scheduleSpot?: {
      home: {
        previousOpponent: string;
        nextOpponent: string;
        restDays: number;
        description: string;
      };
      away: {
        previousOpponent: string;
        nextOpponent: string;
        restDays: number;
        description: string;
      };
    };
    divisionRaceImpact?: {
      home: {
        divisionStanding: number;
        gamesBack: number;
        magicNumber: number | null;
        playoffOdds: number;
        description: string;
      };
      away: {
        divisionStanding: number;
        gamesBack: number;
        magicNumber: number | null;
        playoffOdds: number;
        description: string;
      };
    };
    historicalTrends: Array<{
      scenario: string;
      record: string;
      winPct: number;
      atsRecord: string;
      overUnderRecord: string;
      sampleSize: number;
      description: string;
    }>;
    bettingValue: {
      moneyline: {
        value: 'home' | 'away' | 'none';
        confidence: number;
        description: string;
      };
      spread: {
        value: 'home' | 'away' | 'none';
        confidence: number;
        description: string;
      };
      total: {
        value: 'over' | 'under' | 'none';
        confidence: number;
        description: string;
      };
    };
    finalPrediction: {
      winner: 'home' | 'away';
      score: string;
      spread: string;
      total: string;
      confidence: number;
      keyFactors: string[];
      bestBet: {
        type: 'moneyline' | 'spread' | 'total';
        side: 'home' | 'away' | 'over' | 'under';
        odds: number;
        confidence: number;
        description: string;
      };
    };
  };
  astroData?: {
    moonPhase: string;
    moonSign: string;
    mercuryRetrograde: boolean;
    mercurySign: string;
    aspects: Record<string, string | null>;
    planetaryHour: string;
    elements: { fire: number; earth: number; air: number; water: number };
    northNode: string;
    southNode: string;
    nextEvent: {
      name: string;
      date: string;
      intensity?: 'low' | 'medium' | 'high';
      description?: string;
    };
    sunSign: string;
    sunIcon: string;
  };
  lastUpdated?: string;
}
