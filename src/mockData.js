export const mockGames = [
  {
    id: '1',
    home_team: 'Lakers',
    away_team: 'Warriors',
    commence_time: new Date(Date.now() + 3600000 * 2).toISOString(),
    bookmakers: [{
      key: 'draftkings',
      title: 'DraftKings',
      markets: [{
        key: 'h2h',
        outcomes: [
          { name: 'Lakers', price: 150 },
          { name: 'Warriors', price: -130 }
        ]
      }]
    }],
    oas: 3.2,
    key_players: [
      { id: 'lebron-james', name: 'LeBron James', team: 'Lakers', position: 'SF', birth_date: '1984-12-30' },
      { id: 'steph-curry', name: 'Stephen Curry', team: 'Warriors', position: 'PG', birth_date: '1988-03-14' }
    ]
  },
  {
    id: '2',
    home_team: 'Celtics',
    away_team: 'Bucks',
    commence_time: new Date(Date.now() + 3600000 * 4).toISOString(),
    bookmakers: [{
      key: 'fanduel',
      title: 'FanDuel',
      markets: [{
        key: 'h2h',
        outcomes: [
          { name: 'Celtics', price: -110 },
          { name: 'Bucks', price: -110 }
        ]
      }]
    }],
    oas: -1.8,
    key_players: [
      { id: 'jayson-tatum', name: 'Jayson Tatum', team: 'Celtics', position: 'SF', birth_date: '1998-03-03' },
      { id: 'giannis', name: 'Giannis Antetokounmpo', team: 'Bucks', position: 'PF', birth_date: '1994-12-06' }
    ]
  }
];

export const mockAstroData = {
  date: new Date().toISOString().split('T')[0],
  moon_phase: 75,
  moon_sign: 'Aries',
  mercury_retrograde: true,
  venus_aspects: ['trine Mars', 'square Neptune'],
  mars_aspects: ['opposition Jupiter', 'trine Venus'],
  jupiter_aspects: ['trine Sun', 'sextile Saturn']
};

export const mockPlayerProps = {
  'lebron-james': {
    points: 27.5,
    rebounds: 8.5,
    assists: 9.5
  },
  'steph-curry': {
    points: 31.2,
    rebounds: 5.8,
    assists: 6.3,
    three_pointers: 5.1
  },
  'jayson-tatum': {
    points: 29.7,
    rebounds: 8.6,
    assists: 4.7
  },
  'giannis': {
    points: 32.1,
    rebounds: 12.5,
    assists: 5.8
  }
};
