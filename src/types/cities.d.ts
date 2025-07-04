declare module '@/data/cities-clean.json' {
  interface CityData {
    name: string;
    admin1?: string; // Assuming admin1 might be optional
    lat: number | string; // Can be string or number based on current usage
    lng: number | string; // Can be string or number based on current usage
  }
  const cities: CityData[];
  export default cities;
}
