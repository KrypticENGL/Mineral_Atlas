import type { MineralSummary } from "@/types/mineral";
import type { Availability, Currency, PriceUnit } from "@/types/pricing";
import type { SupplierOffer, SupplierProfile } from "@/types/supplier";
import { hasListingFilters, listingMatches, unpricedMatches, type AtlasFilters } from "./filters";
import type { AtlasLookups } from "./lookups";

export interface PriceGroup {
  currency: Currency;
  unit: PriceUnit;
  min: number;
  max: number;
  quotes: number;
}

export interface CountryMineralRow {
  mineral: MineralSummary;
  suppliers: number;
  /** Offers carrying a current quote (including unavailable ones). */
  quoted: number;
  /** Groups by original currency + unit, most common first. Never converted. */
  priceGroups: PriceGroup[];
}

const AVAILABILITY_RANK: Record<Availability, number> = {
  AVAILABLE: 0,
  LIMITED: 1,
  ON_REQUEST: 2,
  UNAVAILABLE: 3,
};

/** Minerals offered in a country with their price spread, for the given suppliers. */
export function countryMinerals(suppliers: SupplierProfile[], lookups: AtlasLookups): CountryMineralRow[] {
  const rows = new Map<string, { suppliers: Set<string>; quoted: number; groups: Map<string, PriceGroup> }>();

  for (const supplier of suppliers) {
    for (const offer of supplier.offers) {
      let row = rows.get(offer.mineralId);
      if (!row) rows.set(offer.mineralId, (row = { suppliers: new Set(), quoted: 0, groups: new Map() }));
      row.suppliers.add(supplier.id);
      const p = offer.price;
      if (p) row.quoted++;
      if (!p || p.availability === "UNAVAILABLE") continue;
      const key = `${p.currency}:${p.unit}`;
      const group = row.groups.get(key);
      if (group) {
        group.min = Math.min(group.min, p.price);
        group.max = Math.max(group.max, p.price);
        group.quotes++;
      } else {
        row.groups.set(key, { currency: p.currency, unit: p.unit, min: p.price, max: p.price, quotes: 1 });
      }
    }
  }

  const out: CountryMineralRow[] = [];
  for (const [mineralId, row] of rows) {
    const mineral = lookups.mineralById.get(mineralId);
    if (!mineral) continue;
    out.push({
      mineral,
      suppliers: row.suppliers.size,
      quoted: row.quoted,
      priceGroups: [...row.groups.values()].sort((a, b) => b.quotes - a.quotes),
    });
  }
  return out.sort((a, b) => b.suppliers - a.suppliers || a.mineral.name.localeCompare(b.mineral.name));
}

export function offerMatches(offer: SupplierOffer, filters: AtlasFilters, lookups: AtlasLookups): boolean {
  if (!hasListingFilters(filters)) return true;
  if (!offer.price) return unpricedMatches(offer.mineralId, filters, lookups);
  return listingMatches(offer.price, filters, lookups);
}

/**
 * The offer to headline on a supplier card: the best-availability offer that
 * matches the active filters (e.g. the filtered mineral), else the best overall.
 */
export function headlineOffer(
  supplier: SupplierProfile,
  filters: AtlasFilters,
  lookups: AtlasLookups,
): SupplierOffer | null {
  const priced = supplier.offers.filter((o) => o.price);
  const pool = priced.filter((o) => offerMatches(o, filters, lookups));
  const candidates = pool.length ? pool : priced;
  return (
    [...candidates].sort(
      (a, b) => AVAILABILITY_RANK[a.price!.availability] - AVAILABILITY_RANK[b.price!.availability],
    )[0] ?? null
  );
}

