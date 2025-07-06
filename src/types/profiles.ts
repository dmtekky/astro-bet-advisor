
import { AstroData } from './app.types.js'; // Import AstroData

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  member_since: string | null;
  last_login: string | null;
  account_type: string | null;
  favorite_sports: string[] | null;
  notification_email: string | null;
  theme: string | null;

  birth_date: string | null;
  birth_time: string | null;
  birth_city: string | null;
  time_unknown: boolean | null;
  birth_latitude: number | null;
  birth_longitude: number | null;
  planetary_data: any | null;
  planetary_count: any | null;
  planets_per_sign: any | null;
  created_at: string | null;
}

export interface BirthData {
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthLatitude: number;
  birthLongitude: number;
  timeUnknown: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  memberSince: string;
  lastLogin: string;
  accountType: string;
  preferences: {
    favoriteSports: string[];
    notificationEmail: string;
    theme: string;
  };
  isPremium: boolean;
  stats: {
    predictions: number;
    accuracy: string;
    followers: number;
    following: number;
  };
  birthData?: BirthData;
  planetary_data?: AstroData | null;
  interpretations: AstroData | null;
  planets_per_sign?: { [key: string]: number };
  // Add other fields as needed
}
