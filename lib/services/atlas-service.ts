import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { countryRepository } from "@/lib/repositories/country-repository";
import { mineralRepository } from "@/lib/repositories/mineral-repository";
import { pricingRepository } from "@/lib/repositories/pricing-repository";
import { supplierRepository } from "@/lib/repositories/supplier-repository";
import type { AtlasIndex } from "@/types/atlas";
import { CacheTags } from "./cache-tags";

/**
 * The globe index: countries, supplier points, mineral catalogue and compact
 * current-price facets. One cached query set serves every visitor; detailed
 * profiles are fetched per country on demand.
 */
export async function getAtlasIndex(): Promise<AtlasIndex> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CacheTags.catalog);

  const [countries, minerals, suppliers, listings, lastUpdated] = await Promise.all([
    countryRepository.findAll(),
    mineralRepository.findAll(),
    supplierRepository.findAllPoints(),
    pricingRepository.findCurrentFacets(),
    pricingRepository.latestUpdate(),
  ]);

  const countriesWithSuppliers = new Set(suppliers.map((s) => s.countryId));

  return {
    countries,
    minerals,
    suppliers,
    listings,
    stats: {
      countries: countriesWithSuppliers.size,
      suppliers: suppliers.length,
      minerals: minerals.length,
      activeListings: listings.filter((l) => l.availability !== "UNAVAILABLE").length,
      verifiedSuppliers: suppliers.filter((s) => s.verified).length,
      lastUpdated,
    },
  };
}
