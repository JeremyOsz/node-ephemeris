import { calculateBirthChart } from '../src/chart';
import { BirthData } from '../src/types';

const birthData: BirthData = {
  date: '1991-12-10',
  time: '08:50',
  latitude: -37.8167,
  longitude: 144.9667,
  timezone: 11
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