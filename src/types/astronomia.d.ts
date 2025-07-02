declare module 'astronomia' {
  export class JulianDay {
    constructor(jdValue: number);
    constructor(year: number, month: number, day: number, hour: number, minute: number, second: number);
    static fromDate(date: Date): JulianDay;
    static fromGregorian(year: number, month: number, day: number, hour: number, minute: number, second: number): JulianDay;
    static fromTime(time: Time): JulianDay;
    value: number; // Julian day value
  }

  export class Time {
    constructor(jd: JulianDay);
    constructor(date: Date);
    constructor(year: number, month: number, day: number, hour?: number, minute?: number, second?: number);
    static fromDate(date: Date): Time;
    static fromJulianDay(jd: JulianDay): Time;
    date: Date; // The internal Date object
    jd: JulianDay; // The JulianDay object
  }

  export class Observer {
    constructor(latitude: number, longitude: number, elevation?: number);
    latitude: number;
    longitude: number;
    elevation: number;
  }

  export namespace Planet {
    interface PositionResult {
      longitude: number;
      latitude: number;
      range: number; // distance in AU
      speed: number; // degrees per day
      retrograde: boolean;
      declination: number; // degrees
    }

    function position(time: Time, planetName: string): PositionResult;

    const Sun: string;
    const Moon: string;
    const Mercury: string;
    const Venus: string;
    const Mars: string;
    const Jupiter: string;
    const Saturn: string;
    const Uranus: string;
    const Neptune: string;
    const Pluto: string;
  }

  export namespace House {
    interface HouseCuspsResult {
      cusps: number[]; // Array of cusp longitudes
      ascendant: number;
      mc: number;
    }
    function Placidus(time: Time, observer: Observer): HouseCuspsResult;
  }

  export namespace Const {
    const AU: number;
  }
}
