import "server-only";
import { prisma } from "./prisma";

const PROBE_TIMEOUT_MS = 2000;

/**
 * Direct connectivity probe, used to classify failures. Errors thrown inside
 * `"use cache"` scopes are sanitised in production builds, so the original
 * message can't tell us whether the database was the cause — asking it can.
 */
export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("probe timeout")), PROBE_TIMEOUT_MS)),
    ]);
    return true;
  } catch {
    return false;
  }
}
