import "server-only";
import { revalidateTag } from "next/cache";
import { countryRepository, type CountryInput } from "@/lib/repositories/country-repository";
import { mineralRepository, type MineralInput } from "@/lib/repositories/mineral-repository";
import { pricingRepository, type PriceInput } from "@/lib/repositories/pricing-repository";
import { supplierRepository, type SupplierInput } from "@/lib/repositories/supplier-repository";
import { CacheTags } from "./cache-tags";

/**
 * Write-side operations for a future admin UI or ingestion job. Each mutation
 * invalidates the shared catalogue tag so cached reads refresh (stale-while-
 * revalidate). Authentication/authorisation must wrap these before exposure.
 */
function invalidateCatalog() {
  revalidateTag(CacheTags.catalog, "max");
}

async function mutate<T>(operation: Promise<T>): Promise<T> {
  const result = await operation;
  invalidateCatalog();
  return result;
}

export const adminService = {
  addCountry: (input: CountryInput) => mutate(countryRepository.create(input)),
  updateCountry: (id: string, input: Partial<CountryInput>) => mutate(countryRepository.update(id, input)),
  removeCountry: (id: string) => mutate(countryRepository.delete(id)),

  addSupplier: (input: SupplierInput) => mutate(supplierRepository.create(input)),
  updateSupplier: (id: string, input: Partial<SupplierInput>) => mutate(supplierRepository.update(id, input)),
  removeSupplier: (id: string) => mutate(supplierRepository.delete(id)),

  addMineral: (input: MineralInput) => mutate(mineralRepository.create(input)),
  updateMineral: (id: string, input: Partial<MineralInput>) => mutate(mineralRepository.update(id, input)),
  removeMineral: (id: string) => mutate(mineralRepository.delete(id)),

  /** New quote supersedes the current one; the old quote is kept as history. */
  publishPrice: (input: PriceInput) => mutate(pricingRepository.publishQuote(input)),
  correctPrice: (id: string, input: Parameters<typeof pricingRepository.update>[1]) =>
    mutate(pricingRepository.update(id, input)),
  removePrice: (id: string) => mutate(pricingRepository.delete(id)),
};
