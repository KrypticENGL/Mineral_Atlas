import "server-only";
import { buildAtlasLookups } from "@/lib/atlas/lookups";
import { searchAtlas } from "@/lib/atlas/search";
import type { SearchResult } from "@/types/search";
import { getAtlasIndex } from "./atlas-service";

/**
 * Server-side search over the cached index, sharing the ranking logic used by
 * the in-browser search. At much larger catalogue sizes this is the seam where
 * a Postgres trigram / full-text query would slot in.
 */
export async function search(query: string, limit = 20): Promise<SearchResult[]> {
  const index = await getAtlasIndex();
  return searchAtlas(buildAtlasLookups(index), query).slice(0, limit);
}
