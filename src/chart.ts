import * as swisseph from 'swisseph';
import { BirthData, BirthChart, PlanetPosition } from './types';

// Initialize Swiss Ephemeris with ephemeris files path
// For production, you would need to include ephemeris files in your deployment
// or use a cloud storage solution to access them
swisseph.swe_set_ephe_path(process.env.EPHE_PATH || './assets/ephe');

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const PLANETS = [
  { id: swisseph.SE_SUN, name: 'Sun' },
  { id: swisseph.SE_MOON, name: 'Moon' },
  { id: swisseph.SE_MERCURY, name: 'Mercury' },
  { id: swisseph.SE_VENUS, name: 'Venus' },
  { id: swisseph.SE_MARS, name: 'Mars' },
  { id: swisseph.SE_JUPITER, name: 'Jupiter' },
  { id: swisseph.SE_SATURN, name: 'Saturn' },
  { id: swisseph.SE_URANUS, name: 'Uranus' },
  { id: swisseph.SE_NEPTUNE, name: 'Neptune' },
  { id: swisseph.SE_PLUTO, name: 'Pluto' },
  { id: swisseph.SE_MEAN_NODE, name: 'North Node' }
];

export function calculateBirthChart(birthData: BirthData): BirthChart {
  // Validate date format and values
  const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
  if (!dateRegex.test(birthData.date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }

  // Parse birth date and time
  const [year, month, day] = birthData.date.split('-').map(Number);
  const [hour, minute] = birthData.time.split(':').map(Number);
  
  // Validate date values
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('Invalid date values');
  }
  
  // Calculate Julian day (UT)
  let julianDay = swisseph.swe_julday(
    year,
    month,
    day,
    hour + minute / 60 - birthData.timezone,
    swisseph.SE_GREG_CAL
  );
  
  // Try Placidus first, fall back to Porphyry for extreme latitudes
  let houses = swisseph.swe_houses(
    julianDay,
    birthData.latitude,
    birthData.longitude,
    'P' // Placidus house system
  );

  if ('error' in houses) {
    // Try Porphyry house system for extreme latitudes
    houses = swisseph.swe_houses(
      julianDay,
      birthData.latitude,
      birthData.longitude,
      'O' // Porphyry house system
    );
    
    if ('error' in houses) {
      throw new Error(`Failed to calculate houses: ${houses.error}`);
    }
  }
  
  // Extract ascendant and midheaven
  const ascendant = houses.ascendant;
  const midheaven = houses.mc;
  
  // Calculate planet positions
  const planets: PlanetPosition[] = PLANETS.map(planet => {
    const result = swisseph.swe_calc_ut(julianDay, planet.id, swisseph.SEFLG_SPEED);
    
    if ('error' in result) {
      throw new Error(`Failed to calculate position for ${planet.name}: ${result.error}`);
    }

    // Assert the type to handle the union type correctly
    const calcResult = result as { longitude: number; longitudeSpeed: number };

    // Determine zodiac sign
    const signIndex = Math.floor(calcResult.longitude / 30);
    const sign = ZODIAC_SIGNS[signIndex];
    
    // Determine house
    let house = 1;
    for (let i = 1; i <= 12; i++) {
      const nextHouse = i % 12 + 1;
      if (isBetween(calcResult.longitude, houses.house[i], houses.house[nextHouse])) {
        house = i;
        break;
      }
    }
    
    return {
      name: planet.name,
      longitude: calcResult.longitude,
      sign,
      house,
      retrograde: calcResult.longitudeSpeed < 0
    };
  });
  
  return {
    ascendant,
    midheaven,
    houses: [...houses.house], // Use spread operator to get all houses
    planets,
    latitude: birthData.latitude,
    longitude: birthData.longitude
  };
}

// Helper function to check if a longitude is between two house cusps
function isBetween(longitude: number, start: number, end: number): boolean {
  if (start <= end) {
    return longitude >= start && longitude < end;
  } else {
    // Handle case where the range crosses 0°
    return longitude >= start || longitude < end;
  }
}