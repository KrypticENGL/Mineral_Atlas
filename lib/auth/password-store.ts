import { prisma } from "@/lib/db/prisma";

const KEY = "auth.password";
const CACHE_MS = 5000;

let cache: { value: string | null; at: number } | null = null;

/**
 * The password hash saved from the Settings dialog, or null when none has been
 * set (the ATLAS_PASSWORD env var then applies). Cached briefly because the
 * proxy asks on every request; a missing table or unreachable database also
 * reads as null so the env password keeps working.
 */
export async function getStoredPasswordHash(): Promise<string | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  let value: string | null = null;
  try {
    value = (await prisma.appSetting.findUnique({ where: { key: KEY } }))?.value ?? null;
  } catch {
    value = null;
  }
  cache = { value, at: Date.now() };
  return value;
}

export async function saveStoredPasswordHash(hash: string): Promise<void> {
  await prisma.appSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: hash }, update: { value: hash } });
  cache = { value: hash, at: Date.now() };
}
