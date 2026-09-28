import type { MineralCategory } from "@/types/mineral";
import type { Availability, Currency, ListingFacet } from "@/types/pricing";
import type { CounterpartyRole } from "@/types/supplier";
import type { AtlasLookups } from "./lookups";

export interface AtlasFilters {
  category: MineralCategory | null;
  mineralId: string | null;
  countryCode: string | null;
  supplierQuery: string;
  /** Price bounds only apply together with a currency — prices are never converted. */
  currency: Currency | null;
  priceMin: number | null;
  priceMax: number | null;
  availability: Availability[];
  verifiedOnly: boolean;
  role: CounterpartyRole | null;
  /** Hides counterparties assessed as high risk or likely scams. */
  hideRisky: boolean;
}

export const DEFAULT_FILTERS: AtlasFilters = {
  category: null,
  mineralId: null,
  countryCode: null,
  supplierQuery: "",
  currency: null,
  priceMin: null,
  priceMax: null,
  availability: [],
  verifiedOnly: false,
  role: null,
  hideRisky: false,
};

export function countActiveFilters(f: AtlasFilters): number {
  return (
    Number(f.category !== null) +
    Number(f.mineralId !== null) +
    Number(f.countryCode !== null) +
    Number(f.supplierQuery.trim() !== "") +
    Number(f.currency !== null) +
    Number(f.currency !== null && (f.priceMin !== null || f.priceMax !== null)) +
    Number(f.availability.length > 0) +
    Number(f.verifiedOnly) +
    Number(f.role !== null) +
    Number(f.hideRisky)
  );
}

/** True when any filter narrows *listings* (not just suppliers). */
export function hasListingFilters(f: AtlasFilters): boolean {
  return f.category !== null || f.mineralId !== null || f.currency !== null || f.availability.length > 0;
}

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function listingMatches(listing: ListingFacet, f: AtlasFilters, lookups: AtlasLookups): boolean {
  if (f.mineralId && listing.mineralId !== f.mineralId) return false;
  if (f.category && lookups.mineralById.get(listing.mineralId)?.category !== f.category) return false;
  if (f.availability.length && !f.availability.includes(listing.availability)) return false;
  if (f.currency) {
    if (listing.currency !== f.currency) return false;
    if (f.priceMin !== null && listing.price < f.priceMin) return false;
    if (f.priceMax !== null && listing.price > f.priceMax) return false;
  }
  return true;
}

/**
 * An offer without a current quote can still match mineral/category filters,
 * but never price, currency or availability filters.
 */
export function unpricedMatches(mineralId: string, f: AtlasFilters, lookups: AtlasLookups): boolean {
  if (f.currency || f.availability.length) return false;
  if (f.mineralId && mineralId !== f.mineralId) return false;
  if (f.category && lookups.mineralById.get(mineralId)?.category !== f.category) return false;
  return true;
}

export function isRisky(supplier: { riskLevel: string }): boolean {
  return supplier.riskLevel === "HIGH" || supplier.riskLevel === "SCAM";
}

export interface CountryAggregate {
  countryId: string;
  supplierCount: number;
  listingCount: number;
  /** Mineral ids ordered by how many matching suppliers offer them. */
  mineralIds: string[];
}

export interface FilterResult {
  supplierIds: Set<string>;
  byCountry: Map<string, CountryAggregate>;
  totals: { countries: number; suppliers: number; minerals: number; listings: number };
}

/** Pure and allocation-light: safe to run on every filter change for thousands of rows. */
export function applyFilters(lookups: AtlasLookups, f: AtlasFilters): FilterResult {
  const query = normalize(f.supplierQuery);
  const listingFiltered = hasListingFilters(f);
  const countryId = f.countryCode ? lookups.countryByCode.get(f.countryCode)?.id : null;

  const supplierIds = new Set<string>();
  const mineralTally = new Map<string, Map<string, number>>();
  const listingTally = new Map<string, number>();
  const supplierTally = new Map<string, number>();
  const allMinerals = new Set<string>();
  let listings = 0;

  for (const supplier of lookups.index.suppliers) {
    if (countryId && supplier.countryId !== countryId) continue;
    if (f.verifiedOnly && !supplier.verified) continue;
    if (f.role && supplier.role !== f.role) continue;
    if (f.hideRisky && isRisky(supplier)) continue;
    if (query && !normalize(supplier.name).includes(query)) continue;

    const offers = lookups.listingsBySupplier.get(supplier.id) ?? [];
    const matching = listingFiltered ? offers.filter((l) => listingMatches(l, f, lookups)) : offers;
    const unpriced = supplier.mineralIds.filter(
      (id) => !offers.some((l) => l.mineralId === id) && (!listingFiltered || unpricedMatches(id, f, lookups)),
    );
    if (listingFiltered && matching.length === 0 && unpriced.length === 0) continue;

    supplierIds.add(supplier.id);
    supplierTally.set(supplier.countryId, (supplierTally.get(supplier.countryId) ?? 0) + 1);

    let tally = mineralTally.get(supplier.countryId);
    if (!tally) mineralTally.set(supplier.countryId, (tally = new Map()));
    for (const listing of matching) {
      tally.set(listing.mineralId, (tally.get(listing.mineralId) ?? 0) + 1);
      allMinerals.add(listing.mineralId);
      if (listing.availability !== "UNAVAILABLE") {
        listingTally.set(supplier.countryId, (listingTally.get(supplier.countryId) ?? 0) + 1);
        listings++;
      }
    }
    for (const id of unpriced) {
      tally.set(id, (tally.get(id) ?? 0) + 1);
      allMinerals.add(id);
    }
  }

  const byCountry = new Map<string, CountryAggregate>();
  for (const [id, supplierCount] of supplierTally) {
    const tally = mineralTally.get(id) ?? new Map<string, number>();
    byCountry.set(id, {
      countryId: id,
      supplierCount,
      listingCount: listingTally.get(id) ?? 0,
      mineralIds: [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([mineralId]) => mineralId),
    });
  }

  return {
    supplierIds,
    byCountry,
    totals: {
      countries: byCountry.size,
      suppliers: supplierIds.size,
      minerals: allMinerals.size,
      listings,
    },
  };
}
