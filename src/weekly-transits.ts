// Calculate weekly transits to create a general report  - not for a particular chart
// Fetch planetary data for a week/month using sweph.
// Check for transits (e.g., any planets forming aspects within a 1°-3° orb).
// Generate a human-readable report dynamically.
// Output the report in the terminal or export it as a text/markdown file.

import * as swisseph from 'swisseph';

// Define the planets we want to track
const PLANETS = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9
};

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Define major aspects and their orbs
const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 8 },
  { name: 'Trine', angle: 120, orb: 6 },
  { name: 'Square', angle: 90, orb: 6 },
  { name: 'Sextile', angle: 60, orb: 4 }
];

interface Transit {
  date: Date;
  planet1: string;
  planet2: string;
  aspect: string;
  orb: number;
  planet1Retrograde?: boolean;
  planet2Retrograde?: boolean;
}

interface DailyTransits {
  date: Date;
  transits: Transit[];
  aspectChanges: {
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
    planet1Retrograde: boolean;
    planet2Retrograde: boolean;
  }[];
}

interface SwissEphResult {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
  rflag: number;
}

export class WeeklyTransits {
  private startDate: Date;
  private endDate: Date;
  private previousAspects: Map<string, string> = new Map();

  constructor(startDate: Date, endDate: Date) {
    this.startDate = startDate;
    this.endDate = endDate;
  }

  private getPlanetName(planetId: number): string {
    return Object.entries(PLANETS).find(([_, id]) => id === planetId)?.[0] || 'Unknown';
  }

  private getAspectKey(planet1: string, planet2: string): string {
    return `${planet1}-${planet2}`;
  }

  private calculateAspect(angle1: number, angle2: number): number {
    let diff = Math.abs(angle1 - angle2);
    if (diff > 180) {
      diff = 360 - diff;
    }
    return diff;
  }

  private findAspect(diff: number): { name: string; orb: number; angle: number } | null {
    for (const aspect of ASPECTS) {
      if (Math.abs(diff - aspect.angle) <= aspect.orb) {
        return aspect;
      }
    }
    return null;
  }

  private getRetrogradePlanets(date: Date): string[] {
    const retrogradePlanets: string[] = [];
    
    const julianDay = swisseph.swe_julday(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours() + date.getMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

    for (const [planetName, planetId] of Object.entries(PLANETS)) {
      const result = swisseph.swe_calc_ut(julianDay, planetId, flags) as SwissEphResult;
      // A planet is retrograde when its longitudinal speed is negative
      if (result.longitudeSpeed < 0) {
        retrogradePlanets.push(planetName);
      }
    }

    return retrogradePlanets;
  }

  private checkAspects(planet1: number, planet2: number, date: Date): Transit[] {
    const transits: Transit[] = [];
    
    const julianDay = swisseph.swe_julday(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours() + date.getMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

    const planet1Result = swisseph.swe_calc_ut(julianDay, planet1, flags) as SwissEphResult;
    const planet2Result = swisseph.swe_calc_ut(julianDay, planet2, flags) as SwissEphResult;
    const planet1Pos = planet1Result.longitude;
    const planet2Pos = planet2Result.longitude;
    const planet1Retrograde = planet1Result.longitudeSpeed < 0;
    const planet2Retrograde = planet2Result.longitudeSpeed < 0;

    // Check each aspect
    for (const aspect of ASPECTS) {
      const diff = this.calculateAspect(planet1Pos, planet2Pos);
      if (Math.abs(diff - aspect.angle) <= aspect.orb) {
        transits.push({
          date,
          planet1: this.getPlanetName(planet1),
          planet2: this.getPlanetName(planet2),
          aspect: aspect.name,
          orb: Math.abs(diff - aspect.angle),
          planet1Retrograde,
          planet2Retrograde
        });
      }
    }

    return transits;
  }

  private checkAspectChanges(planet1: number, planet2: number, date: Date): { planet1: string; planet2: string; aspect: string; orb: number; planet1Retrograde: boolean; planet2Retrograde: boolean } | null {
    const julianDay = swisseph.swe_julday(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours() + date.getMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

    const planet1Result = swisseph.swe_calc_ut(julianDay, planet1, flags) as SwissEphResult;
    const planet2Result = swisseph.swe_calc_ut(julianDay, planet2, flags) as SwissEphResult;
    const planet1Pos = planet1Result.longitude;
    const planet2Pos = planet2Result.longitude;
    const planet1Retrograde = planet1Result.longitudeSpeed < 0;
    const planet2Retrograde = planet2Result.longitudeSpeed < 0;

    const diff = this.calculateAspect(planet1Pos, planet2Pos);
    const aspect = this.findAspect(diff);

    if (aspect) {
      const planet1Name = this.getPlanetName(planet1);
      const planet2Name = this.getPlanetName(planet2);
      const aspectKey = this.getAspectKey(planet1Name, planet2Name);
      const previousAspect = this.previousAspects.get(aspectKey);

      if (previousAspect !== aspect.name) {
        this.previousAspects.set(aspectKey, aspect.name);
        return {
          planet1: planet1Name,
          planet2: planet2Name,
          aspect: aspect.name,
          orb: Math.abs(diff - aspect.angle),
          planet1Retrograde,
          planet2Retrograde
        };
      }
    }

    return null;
  }

  public calculateTransits(): DailyTransits[] {
    const dailyTransits: DailyTransits[] = [];
    const currentDate = new Date(this.startDate);

    while (currentDate <= this.endDate) {
      const dayTransits: Transit[] = [];
      const aspectChanges = [];

      // Check aspects between all planet pairs
      for (const [planet1Name, planet1Id] of Object.entries(PLANETS)) {
        for (const [planet2Name, planet2Id] of Object.entries(PLANETS)) {
          if (planet1Id < planet2Id) { // Avoid checking same planet and duplicate pairs
            const transits = this.checkAspects(planet1Id, planet2Id, currentDate);
            dayTransits.push(...transits);

            const aspectChange = this.checkAspectChanges(planet1Id, planet2Id, currentDate);
            if (aspectChange) {
              aspectChanges.push(aspectChange);
            }
          }
        }
      }

      if (dayTransits.length > 0 || aspectChanges.length > 0) {
        dailyTransits.push({
          date: new Date(currentDate),
          transits: dayTransits,
          aspectChanges
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyTransits;
  }

  private getZodiacSign(longitude: number): string {
    const signIndex = Math.floor(longitude / 30);
    return ZODIAC_SIGNS[signIndex];
  }

  private getPlanetPosition(date: Date, planetId: number): { longitude: number; sign: string } {
    const julianDay = swisseph.swe_julday(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours() + date.getMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
    const result = swisseph.swe_calc_ut(julianDay, planetId, flags) as SwissEphResult;
    
    return {
      longitude: result.longitude,
      sign: this.getZodiacSign(result.longitude)
    };
  }

  private getMoonPhase(date: Date): string {
    const julianDay = swisseph.swe_julday(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours() + date.getMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
    const sunResult = swisseph.swe_calc_ut(julianDay, PLANETS.SUN, flags) as SwissEphResult;
    const moonResult = swisseph.swe_calc_ut(julianDay, PLANETS.MOON, flags) as SwissEphResult;
    
    // Calculate the angle between Sun and Moon
    let angle = moonResult.longitude - sunResult.longitude;
    if (angle < 0) angle += 360;
    
    // Convert to percentage (0-100)
    const percentage = (angle / 360) * 100;
    
    // Determine phase based on percentage
    if (percentage < 1 || percentage > 99) return 'New Moon';
    if (percentage < 25) return 'Waxing Crescent';
    if (percentage < 49) return 'First Quarter';
    if (percentage < 51) return 'Full Moon';
    if (percentage < 75) return 'Last Quarter';
    return 'Waning Crescent';
  }

  public generateReport(): string {
    const dailyTransits = this.calculateTransits();
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    let report = `Weekly Transit Report\n`;
    report += `Period: ${this.startDate.toLocaleDateString('en-GB', dateOptions)} to ${this.endDate.toLocaleDateString('en-GB', dateOptions)}\n\n`;

    if (dailyTransits.length === 0) {
      report += 'No significant transits or aspect changes found during this period.\n';
    } else {
      dailyTransits.forEach(day => {
        report += `\n${day.date.toLocaleDateString('en-GB', dateOptions)}:\n`;
        
        // Report Moon phase
        const moonPhase = this.getMoonPhase(day.date);
        report += `Moon Phase: ${moonPhase}\n\n`;
        
        // Report planet positions
        report += 'Planet Positions:\n';
        for (const [planetName, planetId] of Object.entries(PLANETS)) {
          const position = this.getPlanetPosition(day.date, planetId);
          const retrogradeStatus = this.getRetrogradePlanets(day.date).includes(planetName) ? ' (R)' : '';
          report += `  ${planetName}${retrogradeStatus}: ${position.sign}\n`;
        }
        
        // Report retrograde planets
        const retrogradePlanets = this.getRetrogradePlanets(day.date);
        report += '\nRetrograde Planets:\n';
        if (retrogradePlanets.length > 0) {
          report += `  ${retrogradePlanets.map(p => `${p} (R)`).join(', ')}\n`;
        } else {
          report += '  None\n';
        }
        
        // Report aspect changes
        if (day.aspectChanges.length > 0) {
          report += '\nAspect Changes:\n';
          day.aspectChanges.forEach(change => {
            const planet1Status = change.planet1Retrograde ? ' (R)' : '';
            const planet2Status = change.planet2Retrograde ? ' (R)' : '';
            report += `  ${change.planet1}${planet1Status} ${change.aspect} ${change.planet2}${planet2Status} (orb: ${change.orb.toFixed(1)}°)\n`;
          });
        }

        // Report current transits
        if (day.transits.length > 0) {
          report += '\nCurrent Transits:\n';
          day.transits.forEach(transit => {
            const planet1Status = transit.planet1Retrograde ? ' (R)' : '';
            const planet2Status = transit.planet2Retrograde ? ' (R)' : '';
            report += `  ${transit.planet1}${planet1Status} ${transit.aspect} ${transit.planet2}${planet2Status} (orb: ${transit.orb.toFixed(1)}°)\n`;
          });
        }
      });
    }

    return report;
  }
}

