import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { mineralRepository } from "@/lib/repositories/mineral-repository";
import type { MineralDetail, MineralSummary } from "@/types/mineral";
import { CacheTags } from "./cache-tags";

export async function listMinerals(): Promise<MineralSummary[]> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CacheTags.catalog);
  return mineralRepository.findAll();
}

/** Accepts a slug (`iron-ore`) or an id. */
export async function getMineral(key: string): Promise<MineralDetail | null> {
  "use cache";
  cacheLife("catalog");
  cacheTag(CacheTags.catalog, CacheTags.mineral(key));
  return mineralRepository.findBySlugOrId(key);
}
