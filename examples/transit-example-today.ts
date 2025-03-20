import { calculateBirthChart } from '../src/chart';
import { BirthChartTransits } from '../src/birth-chart-transits';
import { BirthData } from '../src/types';

// Example birth data
// Date of Birth (local time):10 December 1991 - 04:59  (AEDT, DST)Universal Time (UT/GMT):9 December 1991 - 17:59  Local Sidereal Time (LST):08:50:46House system:Whole Sign systemLatitude, Longitude:37°49'S, 144°58'ECity:Melbourne
// Country:Australia Australia (AU)

const birthData: BirthData = {
  date: '1991-12-10',
  time: '08:50',
  latitude: -37.8167,
  longitude: 144.9667,
  timezone: 11
};

try {
  // Calculate birth chart
  const birthChart = calculateBirthChart(birthData);
  console.log('Birth Chart Details:');
  console.log(`Ascendant: ${birthChart.ascendant.toFixed(1)}°`);
  console.log(`Midheaven: ${birthChart.midheaven.toFixed(1)}°`);
  console.log('\nPlanet Positions:');
  birthChart.planets.forEach(planet => {
    console.log(`${planet.name}: ${planet.sign} in House ${planet.house}${planet.retrograde ? ' (R)' : ''}`);
  });
  console.log('\n');

  // Create transit calculator for today
  const today = new Date();
  const transitCalculator = new BirthChartTransits(birthChart, today, today);

  // Generate single-day report
  console.log('=== Today\'s Transits ===');
  console.log(transitCalculator.generateSingleDayReport(today));

} catch (error) {
  console.error('Error calculating transits:', error);
} 