import type { SupplierProfile } from "./supplier";

export const CONTINENTS = [
  "AFRICA",
  "ASIA",
  "EUROPE",
  "MIDDLE_EAST",
  "NORTH_AMERICA",
  "SOUTH_AMERICA",
  "OCEANIA",
] as const;
export type Continent = (typeof CONTINENTS)[number];

/** Lightweight country record used by the globe and search. */
export interface CountrySummary {
  id: string;
  code: string;
  isoNumeric: string;
  name: string;
  continent: Continent;
  lat: number;
  lng: number;
}

export interface CountryDetail extends CountrySummary {
  suppliers: SupplierProfile[];
  lastUpdated: string | null;
}
