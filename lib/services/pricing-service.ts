import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { pricingRepository, type PriceQuery } from "@/lib/repositories/pricing-repository";
import type { PriceQuote } from "@/types/pricing";
import { CacheTags } from "./cache-tags";

export async function listCurrentPrices(
  query: PriceQuery,
): Promise<{ items: PriceQuote[]; nextCursor: string | null }> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CacheTags.catalog);
  return pricingRepository.findCurrent(query);
}
