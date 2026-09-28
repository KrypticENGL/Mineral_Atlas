import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { countryRepository } from "@/lib/repositories/country-repository";
import type { CountryDetail, CountrySummary } from "@/types/country";
import { CacheTags } from "./cache-tags";

export async function listCountries(): Promise<CountrySummary[]> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CacheTags.catalog);
  return countryRepository.findAll();
}

export async function getCountryDetail(code: string): Promise<CountryDetail | null> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CacheTags.catalog, CacheTags.country(code));
  return countryRepository.findByCode(code);
}
