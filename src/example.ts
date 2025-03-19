import { calculateBirthChart } from './chart';
import { BirthData } from './types';

// Example birth data
const birthData: BirthData = {
  date: '1990-06-15',    // Format: YYYY-MM-DD
  time: '14:30',         // Format: HH:mm (24-hour)
  latitude: 40.7128,     // New York City
  longitude: -74.0060,   // Negative for West, positive for East
  timezone: -4          // EDT (Eastern Daylight Time)
};

try {
  const chart = calculateBirthChart(birthData);
  
  // Print the results
  console.log('\nBirth Chart Results:');
  console.log('==================');
  
  console.log(`\nAscendant: ${chart.ascendant.toFixed(2)}°`);
  console.log(`Midheaven: ${chart.midheaven.toFixed(2)}°`);
  
  console.log('\nPlanets:');
  console.log('---------');
  chart.planets.forEach(planet => {
    console.log(`${planet.name}: ${planet.longitude.toFixed(2)}° ${planet.sign} in House ${planet.house}${planet.retrograde ? ' (Retrograde)' : ''}`);
  });
  
  console.log('\nHouse Cusps:');
  console.log('------------');
  chart.houses.forEach((cusp, index) => {
    console.log(`House ${index + 1}: ${cusp.toFixed(2)}°`);
  });

} catch (err) {
  console.error('Error calculating birth chart:', err instanceof Error ? err.message : 'Unknown error');
} 