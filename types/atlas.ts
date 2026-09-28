import type { CountrySummary } from "./country";
import type { MineralSummary } from "./mineral";
import type { ListingFacet } from "./pricing";
import type { SupplierPoint } from "./supplier";

export interface GlobalStats {
  countries: number;
  suppliers: number;
  minerals: number;
  activeListings: number;
  verifiedSuppliers: number;
  lastUpdated: string | null;
}

/**
 * Everything the globe needs on first paint. Kept deliberately small: no
 * descriptions, contacts or price history — those load per country on demand.
 */
export interface AtlasIndex {
  countries: CountrySummary[];
  minerals: MineralSummary[];
  suppliers: SupplierPoint[];
  listings: ListingFacet[];
  stats: GlobalStats;
}
