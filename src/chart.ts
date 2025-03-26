import * as swisseph from 'swisseph';
import { BirthData, BirthChart, PlanetPosition } from './types';
import { ZODIAC_SIGNS, PLANETS, WHOLE_SIGN_HOUSES, DEGREES_PER_SIGN, getSignByDegree } from './static/astrology';

// Initialize Swiss Ephemeris with ephemeris files path
// For production, you would need to include ephemeris files in your deployment
// or use a cloud storage solution to access them
swisseph.swe_set_ephe_path(process.env.EPHE_PATH || './assets/ephe');

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
  
  // Use Whole Sign system
  const houseResult = swisseph.swe_houses(
    julianDay,
    birthData.latitude,
    birthData.longitude,
    'W' // Whole Sign system
  );

  if ('error' in houseResult) {
    throw new Error(`Failed to calculate ascendant: ${houseResult.error}`);
  }

  const ascendant = houseResult.ascendant;

  // Calculate planet positions
  const planets: PlanetPosition[] = PLANETS.map(planet => {
    const result = swisseph.swe_calc_ut(julianDay, planet.id, swisseph.SEFLG_SPEED);
    
    if ('error' in result) {
      throw new Error(`Failed to calculate position for ${planet.name}: ${result.error}`);
    }

    // Assert the type to handle the union type correctly
    const calcResult = result as { longitude: number; longitudeSpeed: number };

    // Determine zodiac sign using the new helper function
    const sign = getSignByDegree(calcResult.longitude);
    
    // Determine house in Whole Sign system
    // House 1 starts at the ascendant's sign
    const ascendantSign = getSignByDegree(ascendant);
    const ascendantIndex = ZODIAC_SIGNS.findIndex(s => s.name === ascendantSign.name);
    const planetIndex = ZODIAC_SIGNS.findIndex(s => s.name === sign.name);
    let house = ((planetIndex - ascendantIndex + 12) % 12) + 1;
    
    return {
      name: planet.name,
      longitude: calcResult.longitude,
      sign: sign.name,
      house,
      retrograde: calcResult.longitudeSpeed < 0
    };
  });
  
  return {
    ascendant,
    midheaven: ascendant + 90, // In Whole Sign, MC is 90° from Ascendant
    houses: [...WHOLE_SIGN_HOUSES], // Use the static Whole Sign house array
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