import type { AtlasIndex } from "@/types/atlas";
import type { CountrySummary } from "@/types/country";
import type { MineralSummary } from "@/types/mineral";
import type { ListingFacet } from "@/types/pricing";
import type { SupplierPoint } from "@/types/supplier";

/** O(1) lookups derived once from the atlas index (client and server). */
export interface AtlasLookups {
  index: AtlasIndex;
  countryById: Map<string, CountrySummary>;
  countryByCode: Map<string, CountrySummary>;
  countryByIso: Map<string, CountrySummary>;
  mineralById: Map<string, MineralSummary>;
  supplierById: Map<string, SupplierPoint>;
  suppliersByCountry: Map<string, SupplierPoint[]>;
  listingsBySupplier: Map<string, ListingFacet[]>;
}

function group<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export function buildAtlasLookups(index: AtlasIndex): AtlasLookups {
  return {
    index,
    countryById: new Map(index.countries.map((c) => [c.id, c])),
    countryByCode: new Map(index.countries.map((c) => [c.code, c])),
    countryByIso: new Map(index.countries.map((c) => [c.isoNumeric, c])),
    mineralById: new Map(index.minerals.map((m) => [m.id, m])),
    supplierById: new Map(index.suppliers.map((s) => [s.id, s])),
    suppliersByCountry: group(index.suppliers, (s) => s.countryId),
    listingsBySupplier: group(index.listings, (l) => l.supplierId),
  };
}
