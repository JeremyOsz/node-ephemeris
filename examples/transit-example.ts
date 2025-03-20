import { calculateBirthChart } from '../src/chart';
import { BirthChartTransits } from '../src/birth-chart-transits';
import { BirthData } from '../src/types';

// Example birth data
const birthData: BirthData = {
  date: '2000-01-01',
  time: '12:00',
  latitude: 40.7128,  // New York City
  longitude: -74.0060, // Negative for West
  timezone: -5 // EST
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
  console.log('\n');

  // Create transit calculator for next 7 days
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  const weeklyTransitCalculator = new BirthChartTransits(birthChart, today, endDate);

  // Generate weekly report
  console.log('=== Next 7 Days Transits ===');
  console.log(weeklyTransitCalculator.generateReport());

} catch (error) {
  console.error('Error calculating transits:', error);
} 