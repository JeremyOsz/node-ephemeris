import { calculateBirthChart } from '../chart';
import { BirthData } from '../types';

describe('Birth Chart Calculations', () => {
  // Einstein's birth data
  const einsteinData: BirthData = {
    date: '1879-03-14',
    time: '11:30',
    latitude: 48.4010822,  // Ulm, Germany
    longitude: 10.0015144,
    timezone: -1  // Historical timezone for Germany
  };

  // Modern test case - Leonard Cohen
  const cohenData: BirthData = {
    date: '1934-09-21',
    time: '06:45',
    latitude: 45.5017,  // Montreal, Canada
    longitude: -73.5673,
    timezone: -4  // Eastern Time
  };

  test('calculates Einstein\'s birth chart', () => {
    const chart = calculateBirthChart(einsteinData);
    
    // Basic structure checks
    expect(chart).toHaveProperty('ascendant');
    expect(chart).toHaveProperty('midheaven');
    expect(chart).toHaveProperty('houses');
    expect(chart).toHaveProperty('planets');
    
    // Verify planets array
    expect(chart.planets).toHaveLength(11); // Sun through North Node
    
    // Check specific planet properties
    chart.planets.forEach(planet => {
      expect(planet).toHaveProperty('name');
      expect(planet).toHaveProperty('longitude');
      expect(planet).toHaveProperty('sign');
      expect(planet).toHaveProperty('house');
      expect(planet).toHaveProperty('retrograde');
      
      // Validate ranges
      expect(planet.longitude).toBeGreaterThanOrEqual(0);
      expect(planet.longitude).toBeLessThan(360);
      expect(planet.house).toBeGreaterThanOrEqual(1);
      expect(planet.house).toBeLessThanOrEqual(12);
    });

    // Known positions for Einstein (approximate)
    const sun = chart.planets.find(p => p.name === 'Sun');
    expect(sun?.sign).toBe('Pisces');
  });

  test('calculates Leonard Cohen\'s birth chart', () => {
    const chart = calculateBirthChart(cohenData);
    
    // Basic structure checks
    expect(chart).toHaveProperty('ascendant');
    expect(chart).toHaveProperty('midheaven');
    expect(chart).toHaveProperty('houses');
    expect(chart).toHaveProperty('planets');
    
    // Known positions for Cohen (approximate)
    const sun = chart.planets.find(p => p.name === 'Sun');
    expect(sun?.sign).toBe('Virgo');
  });

  test('handles invalid dates gracefully', () => {
    // Test invalid date format
    const invalidFormatData: BirthData = {
      ...einsteinData,
      date: '2024-13-45', // Invalid date format
    };
    expect(() => calculateBirthChart(invalidFormatData)).toThrow('Invalid date format');

    // Test invalid date values
    const invalidValueData: BirthData = {
      ...einsteinData,
      date: '2024-02-30', // Invalid day for February
    };
    expect(() => calculateBirthChart(invalidValueData)).toThrow('Invalid date values');
  });

  test('handles extreme latitudes by falling back to Porphyry houses', () => {
    const polarData: BirthData = {
      ...einsteinData,
      latitude: 89, // Near North Pole
    };

    const chart = calculateBirthChart(polarData);
    expect(chart).toHaveProperty('houses');
    expect(chart.houses).toHaveLength(12);
  });
}); 