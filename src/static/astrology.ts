import * as swisseph from 'swisseph';

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';

export interface ZodiacSign {
  name: string;
  wholeSignDegree: number;
  element: Element;
  modality: Modality;
  rulingPlanet: string;
  symbol: string;
  dates: string; // Approximate dates when the sun is in this sign
}

// Base array for iteration and order preservation
export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    name: 'Aries',
    wholeSignDegree: 0,
    element: 'Fire',
    modality: 'Cardinal',
    rulingPlanet: 'Mars',
    symbol: '♈',
    dates: 'March 21 - April 19'
  },
  {
    name: 'Taurus',
    wholeSignDegree: 30,
    element: 'Earth',
    modality: 'Fixed',
    rulingPlanet: 'Venus',
    symbol: '♉',
    dates: 'April 20 - May 20'
  },
  {
    name: 'Gemini',
    wholeSignDegree: 60,
    element: 'Air',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    symbol: '♊',
    dates: 'May 21 - June 20'
  },
  {
    name: 'Cancer',
    wholeSignDegree: 90,
    element: 'Water',
    modality: 'Cardinal',
    rulingPlanet: 'Moon',
    symbol: '♋',
    dates: 'June 21 - July 22'
  },
  {
    name: 'Leo',
    wholeSignDegree: 120,
    element: 'Fire',
    modality: 'Fixed',
    rulingPlanet: 'Sun',
    symbol: '♌',
    dates: 'July 23 - August 22'
  },
  {
    name: 'Virgo',
    wholeSignDegree: 150,
    element: 'Earth',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    symbol: '♍',
    dates: 'August 23 - September 22'
  },
  {
    name: 'Libra',
    wholeSignDegree: 180,
    element: 'Air',
    modality: 'Cardinal',
    rulingPlanet: 'Venus',
    symbol: '♎',
    dates: 'September 23 - October 22'
  },
  {
    name: 'Scorpio',
    wholeSignDegree: 210,
    element: 'Water',
    modality: 'Fixed',
    rulingPlanet: 'Pluto',
    symbol: '♏',
    dates: 'October 23 - November 21'
  },
  {
    name: 'Sagittarius',
    wholeSignDegree: 240,
    element: 'Fire',
    modality: 'Mutable',
    rulingPlanet: 'Jupiter',
    symbol: '♐',
    dates: 'November 22 - December 21'
  },
  {
    name: 'Capricorn',
    wholeSignDegree: 270,
    element: 'Earth',
    modality: 'Cardinal',
    rulingPlanet: 'Saturn',
    symbol: '♑',
    dates: 'December 22 - January 19'
  },
  {
    name: 'Aquarius',
    wholeSignDegree: 300,
    element: 'Air',
    modality: 'Fixed',
    rulingPlanet: 'Uranus',
    symbol: '♒',
    dates: 'January 20 - February 18'
  },
  {
    name: 'Pisces',
    wholeSignDegree: 330,
    element: 'Water',
    modality: 'Mutable',
    rulingPlanet: 'Neptune',
    symbol: '♓',
    dates: 'February 19 - March 20'
  }
] as const;

// Maps for efficient lookups
export const SIGN_BY_NAME = new Map<string, ZodiacSign>(
  ZODIAC_SIGNS.map(sign => [sign.name.toLowerCase(), sign])
);

export const SIGN_BY_DEGREE = new Map<number, ZodiacSign>(
  ZODIAC_SIGNS.map(sign => [sign.wholeSignDegree, sign])
);

const ELEMENTS: Element[] = ['Fire', 'Earth', 'Air', 'Water'];
export const SIGNS_BY_ELEMENT = new Map<Element, ZodiacSign[]>(
  ELEMENTS.map(element => [
    element,
    ZODIAC_SIGNS.filter(sign => sign.element === element)
  ])
);

const MODALITIES: Modality[] = ['Cardinal', 'Fixed', 'Mutable'];
export const SIGNS_BY_MODALITY = new Map<Modality, ZodiacSign[]>(
  MODALITIES.map(modality => [
    modality,
    ZODIAC_SIGNS.filter(sign => sign.modality === modality)
  ])
);

export const SIGNS_BY_RULING_PLANET = new Map<string, ZodiacSign[]>(
  Array.from(new Set(ZODIAC_SIGNS.map(sign => sign.rulingPlanet))).map(planet => [
    planet,
    ZODIAC_SIGNS.filter(sign => sign.rulingPlanet === planet)
  ])
);

export const PLANETS = [
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
] as const;

// Map for planet lookups
export const PLANET_BY_ID = new Map<number, typeof PLANETS[number]>(
  PLANETS.map(planet => [planet.id, planet])
);

export const PLANET_BY_NAME = new Map<string, typeof PLANETS[number]>(
  PLANETS.map(planet => [planet.name.toLowerCase(), planet])
);

// Static house cusps in Whole Sign system
export const WHOLE_SIGN_HOUSES = ZODIAC_SIGNS.map(sign => sign.wholeSignDegree);

export const DEGREES_PER_SIGN = 30;
export const TOTAL_DEGREES = 360;

// Helper functions
export function getSignByDegree(degree: number): ZodiacSign {
  const normalizedDegree = degree % TOTAL_DEGREES;
  const signIndex = Math.floor(normalizedDegree / DEGREES_PER_SIGN);
  return ZODIAC_SIGNS[signIndex];
}

export function getSignByName(name: string): ZodiacSign | undefined {
  return SIGN_BY_NAME.get(name.toLowerCase());
}

export function getPlanetById(id: number): typeof PLANETS[number] | undefined {
  return PLANET_BY_ID.get(id);
}

export function getPlanetByName(name: string): typeof PLANETS[number] | undefined {
  return PLANET_BY_NAME.get(name.toLowerCase());
}

export function getSignsByElement(element: Element): ZodiacSign[] {
  return SIGNS_BY_ELEMENT.get(element) || [];
}

export function getSignsByModality(modality: Modality): ZodiacSign[] {
  return SIGNS_BY_MODALITY.get(modality) || [];
}

export function getSignsByRulingPlanet(planet: string): ZodiacSign[] {
  return SIGNS_BY_RULING_PLANET.get(planet) || [];
} 