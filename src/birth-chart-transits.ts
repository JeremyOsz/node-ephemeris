import * as swisseph from 'swisseph';
import { BirthChart, PlanetPosition } from './types';
import { getTransitInterpretation } from './transit-interpretations';

// Define major aspects and their orbs
const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 8 },
  { name: 'Trine', angle: 120, orb: 6 },
  { name: 'Square', angle: 90, orb: 6 },
  { name: 'Sextile', angle: 60, orb: 4 }
];

// Define planet IDs
const PLANET_IDS = {
  SUN: swisseph.SE_SUN as number,
  MOON: swisseph.SE_MOON as number,
  MERCURY: swisseph.SE_MERCURY as number,
  VENUS: swisseph.SE_VENUS as number,
  MARS: swisseph.SE_MARS as number,
  JUPITER: swisseph.SE_JUPITER as number,
  SATURN: swisseph.SE_SATURN as number,
  URANUS: swisseph.SE_URANUS as number,
  NEPTUNE: swisseph.SE_NEPTUNE as number,
  PLUTO: swisseph.SE_PLUTO as number
};

interface Transit {
  date: Date;
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  transitPlanetRetrograde: boolean;
  natalPlanetRetrograde: boolean;
  transitPlanetSign: string;
  natalPlanetSign: string;
  transitPlanetHouse: number;
  natalPlanetHouse: number;
}

interface DailyTransits {
  date: Date;
  transits: Transit[];
  aspectChanges: {
    transitPlanet: string;
    natalPlanet: string;
    aspect: string;
    orb: number;
    transitPlanetRetrograde: boolean;
    natalPlanetRetrograde: boolean;
    transitPlanetSign: string;
    natalPlanetSign: string;
    transitPlanetHouse: number;
    natalPlanetHouse: number;
  }[];
}

export class BirthChartTransits {
  private birthChart: BirthChart;
  private startDate: Date;
  private endDate: Date;
  private previousAspects: Map<string, string> = new Map();

  constructor(birthChart: BirthChart, startDate: Date, endDate: Date) {
    this.birthChart = birthChart;
    this.startDate = startDate;
    this.endDate = endDate;
    
    // Initialize previousAspects with yesterday's aspects
    const yesterday = new Date(startDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Calculate aspects for yesterday
    for (const natalPlanet of this.birthChart.planets) {
      const natalPlanetId = Object.entries(PLANET_IDS).find(([key, value]) => 
        key.includes(natalPlanet.name.toUpperCase())
      )?.[1];

      if (!natalPlanetId) continue;

      for (const [planetName, planetId] of Object.entries(PLANET_IDS)) {
        const transitPlanetPos = this.getPlanetPosition(yesterday, planetId);
        const diff = this.calculateAspect(transitPlanetPos.longitude, natalPlanet.longitude);
        const aspect = this.findAspect(diff);

        if (aspect) {
          const aspectKey = this.getAspectKey(planetName, natalPlanet.name);
          this.previousAspects.set(aspectKey, aspect.name);
        }
      }
    }
  }

  private getPlanetName(planetId: number): string {
    return Object.entries(swisseph).find(([key, value]) => 
      key.startsWith('SE_') && value === planetId
    )?.[0].replace('SE_', '') || 'Unknown';
  }

  private getAspectKey(transitPlanet: string, natalPlanet: string): string {
    return `${transitPlanet}-${natalPlanet}`;
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

  private getZodiacSign(longitude: number): string {
    const ZODIAC_SIGNS = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    const signIndex = Math.floor(longitude / 30);
    return ZODIAC_SIGNS[signIndex];
  }

  private getPlanetPosition(date: Date, planetId: number): { 
    longitude: number; 
    sign: string; 
    retrograde: boolean;
    house: number;
  } {
    const julianDay = swisseph.swe_julday(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours() + date.getMinutes() / 60,
      swisseph.SE_GREG_CAL
    );

    const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
    const result = swisseph.swe_calc_ut(julianDay, planetId, flags) as { longitude: number; longitudeSpeed: number };
    
    // Calculate houses for the current date
    let houses = swisseph.swe_houses(
      julianDay,
      this.birthChart.latitude,
      this.birthChart.longitude,
      'P' // Placidus house system
    );

    // Try Porphyry house system for extreme latitudes
    if ('error' in houses) {
      houses = swisseph.swe_houses(
        julianDay,
        this.birthChart.latitude,
        this.birthChart.longitude,
        'O' // Porphyry house system
      );
      
      if ('error' in houses) {
        throw new Error(`Failed to calculate houses: ${houses.error}`);
      }
    }

    // Determine house
    let house = 1;
    for (let i = 1; i <= 12; i++) {
      const nextHouse = i % 12 + 1;
      if (this.isBetween(result.longitude, houses.house[i], houses.house[nextHouse])) {
        house = i;
        break;
      }
    }
    
    return {
      longitude: result.longitude,
      sign: this.getZodiacSign(result.longitude),
      retrograde: result.longitudeSpeed < 0,
      house
    };
  }

  private isBetween(longitude: number, start: number, end: number): boolean {
    if (start <= end) {
      return longitude >= start && longitude < end;
    } else {
      // Handle case where the range crosses 0°
      return longitude >= start || longitude < end;
    }
  }

  private checkTransits(date: Date): Transit[] {
    const transits: Transit[] = [];
    
    // Check transits from each planet to each natal planet
    for (const natalPlanet of this.birthChart.planets) {
      const natalPlanetId = Object.entries(PLANET_IDS).find(([key, value]) => 
        key.includes(natalPlanet.name.toUpperCase())
      )?.[1];

      if (!natalPlanetId) continue;

      // Check transits from each planet to this natal planet
      for (const [planetName, planetId] of Object.entries(PLANET_IDS)) {
        const transitPlanetPos = this.getPlanetPosition(date, planetId);
        const diff = this.calculateAspect(transitPlanetPos.longitude, natalPlanet.longitude);
        
        for (const aspect of ASPECTS) {
          if (Math.abs(diff - aspect.angle) <= aspect.orb) {
            transits.push({
              date,
              transitPlanet: planetName,
              natalPlanet: natalPlanet.name,
              aspect: aspect.name,
              orb: Math.abs(diff - aspect.angle),
              transitPlanetRetrograde: transitPlanetPos.retrograde,
              natalPlanetRetrograde: natalPlanet.retrograde,
              transitPlanetSign: transitPlanetPos.sign,
              natalPlanetSign: natalPlanet.sign,
              transitPlanetHouse: transitPlanetPos.house,
              natalPlanetHouse: natalPlanet.house
            });
          }
        }
      }
    }

    return transits;
  }

  private checkAspectChanges(date: Date): Transit[] {
    const aspectChanges: Transit[] = [];
    
    for (const natalPlanet of this.birthChart.planets) {
      const natalPlanetId = Object.entries(PLANET_IDS).find(([key, value]) => 
        key.includes(natalPlanet.name.toUpperCase())
      )?.[1];

      if (!natalPlanetId) continue;

      for (const [planetName, planetId] of Object.entries(PLANET_IDS)) {
        const transitPlanetPos = this.getPlanetPosition(date, planetId);
        const diff = this.calculateAspect(transitPlanetPos.longitude, natalPlanet.longitude);
        const aspect = this.findAspect(diff);

        if (aspect) {
          const aspectKey = this.getAspectKey(planetName, natalPlanet.name);
          const previousAspect = this.previousAspects.get(aspectKey);

          if (previousAspect !== aspect.name) {
            this.previousAspects.set(aspectKey, aspect.name);
            aspectChanges.push({
              date,
              transitPlanet: planetName,
              natalPlanet: natalPlanet.name,
              aspect: aspect.name,
              orb: Math.abs(diff - aspect.angle),
              transitPlanetRetrograde: transitPlanetPos.retrograde,
              natalPlanetRetrograde: natalPlanet.retrograde,
              transitPlanetSign: transitPlanetPos.sign,
              natalPlanetSign: natalPlanet.sign,
              transitPlanetHouse: transitPlanetPos.house,
              natalPlanetHouse: natalPlanet.house
            });
          }
        }
      }
    }

    return aspectChanges;
  }

  public calculateSingleDayTransits(date: Date): DailyTransits {
    const transits = this.checkTransits(date);
    const aspectChanges = this.checkAspectChanges(date);

    return {
      date: new Date(date),
      transits,
      aspectChanges
    };
  }

  public calculateTransits(): DailyTransits[] {
    const dailyTransits: DailyTransits[] = [];
    const currentDate = new Date(this.startDate);

    while (currentDate <= this.endDate) {
      const dayTransits = this.calculateSingleDayTransits(currentDate);
      
      if (dayTransits.transits.length > 0 || dayTransits.aspectChanges.length > 0) {
        dailyTransits.push(dayTransits);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyTransits;
  }

  public generateSingleDayReport(date: Date): string {
    const dayTransits = this.calculateSingleDayTransits(date);
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    
    let report = `Transit Report for ${date.toLocaleDateString('en-US', dateOptions)}\n\n`;

    // Report aspect changes
    if (dayTransits.aspectChanges.length > 0) {
      report += 'New Aspects Forming:\n';
      dayTransits.aspectChanges.forEach(change => {
        const transitStatus = change.transitPlanetRetrograde ? ' (R)' : '';
        const natalStatus = change.natalPlanetRetrograde ? ' (R)' : '';
        report += `  ${change.transitPlanet}${transitStatus} ${change.aspect} ${change.natalPlanet}${natalStatus}\n`;
        report += `    Transit: ${change.transitPlanetSign} in House ${change.transitPlanetHouse}\n`;
        report += `    Natal: ${change.natalPlanetSign} in House ${change.natalPlanetHouse}\n`;
        report += `    Orb: ${change.orb.toFixed(1)}°\n`;
        report += `    Interpretation:\n`;
        report += `    ${getTransitInterpretation(change.aspect, change.transitPlanet, change.natalPlanet)}\n\n`;
      });
      report += '\n';
    }

    // Report current transits
    if (dayTransits.transits.length > 0) {
      report += 'Active Transits:\n';
      dayTransits.transits.forEach(transit => {
        const transitStatus = transit.transitPlanetRetrograde ? ' (R)' : '';
        const natalStatus = transit.natalPlanetRetrograde ? ' (R)' : '';
        report += `  ${transit.transitPlanet}${transitStatus} ${transit.aspect} ${transit.natalPlanet}${natalStatus}\n`;
        report += `    Transit: ${transit.transitPlanetSign} in House ${transit.transitPlanetHouse}\n`;
        report += `    Natal: ${transit.natalPlanetSign} in House ${transit.natalPlanetHouse}\n`;
        report += `    Orb: ${transit.orb.toFixed(1)}°\n`;
        report += `    Interpretation:\n`;
        report += `    ${getTransitInterpretation(transit.aspect, transit.transitPlanet, transit.natalPlanet)}\n\n`;
      });
    } else if (dayTransits.aspectChanges.length === 0) {
      report += 'No significant transits or aspect changes for this day.\n';
    }

    return report;
  }

  public generateReport(): string {
    const dailyTransits = this.calculateTransits();
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    let report = `Birth Chart Transit Report\n`;
    report += `Period: ${this.startDate.toLocaleDateString('en-GB', dateOptions)} to ${this.endDate.toLocaleDateString('en-GB', dateOptions)}\n\n`;

    if (dailyTransits.length === 0) {
      report += 'No significant transits or aspect changes found during this period.\n';
    } else {
      dailyTransits.forEach(day => {
        report += `\n${day.date.toLocaleDateString('en-GB', dateOptions)}:\n`;
        
        // Report aspect changes
        if (day.aspectChanges.length > 0) {
          report += '\nAspect Changes:\n';
          day.aspectChanges.forEach(change => {
            const transitStatus = change.transitPlanetRetrograde ? ' (R)' : '';
            const natalStatus = change.natalPlanetRetrograde ? ' (R)' : '';
            report += `  ${change.transitPlanet}${transitStatus} ${change.aspect} ${change.natalPlanet}${natalStatus}\n`;
            report += `    Transit: ${change.transitPlanetSign} in House ${change.transitPlanetHouse}\n`;
            report += `    Natal: ${change.natalPlanetSign} in House ${change.natalPlanetHouse}\n`;
            report += `    Orb: ${change.orb.toFixed(1)}°\n`;
          });
        }

        // Report current transits
        if (day.transits.length > 0) {
          report += '\nCurrent Transits:\n';
          day.transits.forEach(transit => {
            const transitStatus = transit.transitPlanetRetrograde ? ' (R)' : '';
            const natalStatus = transit.natalPlanetRetrograde ? ' (R)' : '';
            report += `  ${transit.transitPlanet}${transitStatus} ${transit.aspect} ${transit.natalPlanet}${natalStatus}\n`;
            report += `    Transit: ${transit.transitPlanetSign} in House ${transit.transitPlanetHouse}\n`;
            report += `    Natal: ${transit.natalPlanetSign} in House ${transit.natalPlanetHouse}\n`;
            report += `    Orb: ${transit.orb.toFixed(1)}°\n`;
          });
        }
      });
    }

    return report;
  }
} 