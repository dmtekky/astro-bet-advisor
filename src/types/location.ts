export interface City {
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  admin1?: string; // State/region/province
  population?: number;
}

export interface LocationSuggestion extends Omit<City, 'population'> {
  formatted: string;
}

export interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}
