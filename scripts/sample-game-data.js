// Sample MLB game data for testing article generation
export default {
  id: "4866c028-6ae9-417d-801a-356cbc288bea",
  status: "closed",
  scheduled: "2025-05-30T19:10:00Z",
  home: {
    name: "Dodgers",
    market: "Los Angeles",
    abbr: "LAD",
    id: "ef64da7f-cfaf-4300-87b0-9313386b977c",
    runs: 5,
    team: {
      name: "Dodgers",
      market: "Los Angeles",
      abbr: "LAD",
      id: "ef64da7f-cfaf-4300-87b0-9313386b977c",
      alias: "LAD"
    },
    players: [
      {
        id: "31e104ce-2c4a-4c15-a1a1-080c5512c7c4",
        position: "CF",
        first_name: "Mookie",
        last_name: "Betts",
        full_name: "Mookie Betts",
        batting_position: 1,
        statistics: {
          hitting: {
            overall: {
              ab: 4,
              h: 2,
              r: 1,
              hr: 1,
              rbi: 2,
              avg: ".300"
            }
          }
        },
        primary_position: "CF"
      },
      {
        id: "57c9ff0f-2a8b-4e0f-8631-551e35f8d6d3",
        position: "SS",
        first_name: "Corey",
        last_name: "Seager",
        full_name: "Corey Seager",
        batting_position: 2,
        statistics: {
          hitting: {
            overall: {
              ab: 4,
              h: 1,
              r: 1,
              hr: 0,
              rbi: 0,
              avg: ".275"
            }
          }
        },
        primary_position: "SS"
      },
      {
        id: "6de22dfd-5a2e-4d27-bd46-a5f6c3a8c48b",
        position: "1B",
        first_name: "Freddie",
        last_name: "Freeman",
        full_name: "Freddie Freeman",
        batting_position: 3,
        statistics: {
          hitting: {
            overall: {
              ab: 3,
              h: 2,
              r: 1,
              hr: 0,
              rbi: 1,
              avg: ".320"
            }
          }
        },
        primary_position: "1B"
      }
    ]
  },
  away: {
    name: "Yankees",
    market: "New York",
    abbr: "NYY",
    id: "a09ec676-f887-43dc-bbb3-cf4bbaee9a18",
    runs: 3,
    team: {
      name: "Yankees",
      market: "New York",
      abbr: "NYY",
      id: "a09ec676-f887-43dc-bbb3-cf4bbaee9a18",
      alias: "NYY"
    },
    players: [
      {
        id: "0d673e7f-cd90-4c14-9a05-e9b154c039fc",
        position: "RF",
        first_name: "Aaron",
        last_name: "Judge",
        full_name: "Aaron Judge",
        batting_position: 2,
        statistics: {
          hitting: {
            overall: {
              ab: 4,
              h: 1,
              r: 1,
              hr: 1,
              rbi: 1,
              avg: ".295"
            }
          }
        },
        primary_position: "RF"
      },
      {
        id: "ac7e77d8-7b1c-4e4a-a637-8e2d77ca5ba7",
        position: "SS",
        first_name: "Anthony",
        last_name: "Volpe",
        full_name: "Anthony Volpe",
        batting_position: 1,
        statistics: {
          hitting: {
            overall: {
              ab: 4,
              h: 1,
              r: 1,
              hr: 0,
              rbi: 0,
              avg: ".255"
            }
          }
        },
        primary_position: "SS"
      },
      {
        id: "3b5b7a94-9d48-47c9-b142-7a3e8a23e1e6",
        position: "1B",
        first_name: "Anthony",
        last_name: "Rizzo",
        full_name: "Anthony Rizzo",
        batting_position: 3,
        statistics: {
          hitting: {
            overall: {
              ab: 4,
              h: 1,
              r: 0,
              hr: 0,
              rbi: 1,
              avg: ".265"
            }
          }
        },
        primary_position: "1B"
      }
    ]
  },
  venue: {
    name: "Dodger Stadium",
    city: "Los Angeles",
    state: "CA",
    capacity: 56000,
    surface: "grass",
    roof_type: "open"
  },
  attendance: 52347,
  duration: "3:15",
  game_number: 1,
  day_night: "night",
  pitching: {
    win: {
      first_name: "Clayton",
      last_name: "Kershaw",
      full_name: "Clayton Kershaw"
    },
    loss: {
      first_name: "Gerrit",
      last_name: "Cole",
      full_name: "Gerrit Cole"
    },
    save: {
      first_name: "Evan",
      last_name: "Phillips",
      full_name: "Evan Phillips"
    }
  },
  scoring: [
    {
      type: "inning",
      number: 1,
      sequence: 1,
      home: {
        runs: 0,
        hits: 0,
        errors: 0
      },
      away: {
        runs: 1,
        hits: 1,
        errors: 0
      }
    },
    {
      type: "inning",
      number: 2,
      sequence: 2,
      home: {
        runs: 0,
        hits: 0,
        errors: 0
      },
      away: {
        runs: 0,
        hits: 0,
        errors: 0
      }
    },
    {
      type: "inning",
      number: 3,
      sequence: 3,
      home: {
        runs: 2,
        hits: 2,
        errors: 0
      },
      away: {
        runs: 0,
        hits: 0,
        errors: 1
      }
    },
    {
      type: "inning",
      number: 4,
      sequence: 4,
      home: {
        runs: 0,
        hits: 1,
        errors: 0
      },
      away: {
        runs: 0,
        hits: 0,
        errors: 0
      }
    },
    {
      type: "inning",
      number: 5,
      sequence: 5,
      home: {
        runs: 3,
        hits: 3,
        errors: 0
      },
      away: {
        runs: 0,
        hits: 0,
        errors: 0
      }
    },
    {
      type: "inning",
      number: 6,
      sequence: 6,
      home: {
        runs: 0,
        hits: 0,
        errors: 0
      },
      away: {
        runs: 2,
        hits: 2,
        errors: 0
      }
    },
    {
      type: "inning",
      number: 7,
      sequence: 7,
      home: {
        runs: 0,
        hits: 0,
        errors: 0
      },
      away: {
        runs: 0,
        hits: 1,
        errors: 0
      }
    },
    {
      type: "inning",
      number: 8,
      sequence: 8,
      home: {
        runs: 0,
        hits: 0,
        errors: 0
      },
      away: {
        runs: 0,
        hits: 0,
        errors: 0
      }
    },
    {
      type: "inning",
      number: 9,
      sequence: 9,
      home: {
        runs: 0,
        hits: 0,
        errors: 0
      },
      away: {
        runs: 0,
        hits: 0,
        errors: 0
      }
    }
  ]
};
