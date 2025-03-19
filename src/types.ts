export interface BirthData {
  date: string;       // ISO format date string (YYYY-MM-DD)
  time: string;       // 24-hour format (HH:MM)
  latitude: number;   // Decimal degrees (positive for North)
  longitude: number;  // Decimal degrees (positive for East)
  timezone: number;   // UTC offset in hours
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  sign: string;
  house: number;
  retrograde: boolean;
}

export interface BirthChart {
  ascendant: number;
  midheaven: number;
  houses: number[];
  planets: PlanetPosition[];
}