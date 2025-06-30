import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the cities.json file
const citiesPath = join(__dirname, 'src', 'data', 'cities.json');
const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf8'));

console.log(`Original cities count: ${cities.length}`);

// Filter out cities without valid coordinates
const validCities = cities.filter(city => {
  const lat = parseFloat(city.lat);
  const lng = parseFloat(city.lng);
  return (
    city.name && 
    city.country && 
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  );
});

console.log(`Cities with valid coordinates: ${validCities.length}`);

// Create a unique key for each city to identify duplicates
const uniqueCities = [];
const seen = new Set();

validCities.forEach(city => {
  // Create a unique key using name, admin1, and country
  const key = `${city.name.toLowerCase()}-${(city.admin1 || '').toLowerCase()}-${city.country.toLowerCase()}`;
  
  if (!seen.has(key)) {
    uniqueCities.push(city);
    seen.add(key);
  }
});

console.log(`Unique cities after deduplication: ${uniqueCities.length}`);

// Sort cities alphabetically by name
uniqueCities.sort((a, b) => {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
});

// Write the cleaned data back to a new file
const outputPath = join(__dirname, 'src', 'data', 'cities-clean.json');
fs.writeFileSync(outputPath, JSON.stringify(uniqueCities, null, 2), 'utf8');

console.log(`Cleaned cities data written to ${outputPath}`);
