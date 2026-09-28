import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { applyFilters, type AtlasFilters } from "@/lib/atlas/filters";
import { buildAtlasLookups } from "@/lib/atlas/lookups";
import { supplierRepository } from "@/lib/repositories/supplier-repository";
import type { SupplierPoint, SupplierWithHistory } from "@/types/supplier";
import { getAtlasIndex } from "./atlas-service";
import { CacheTags } from "./cache-tags";

export async function getSupplier(id: string): Promise<SupplierWithHistory | null> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CacheTags.catalog, CacheTags.supplier(id));
  return supplierRepository.findById(id);
}

/**
 * Filtered supplier points. Uses the same pure filter as the browser so the
 * API and the globe can never disagree about what matches.
 */
export async function listSuppliers(filters: AtlasFilters): Promise<SupplierPoint[]> {
  const index = await getAtlasIndex();
  const { supplierIds } = applyFilters(buildAtlasLookups(index), filters);
  return index.suppliers.filter((s) => supplierIds.has(s.id));
}
