import { connection } from "next/server";
import { Suspense } from "react";
import { AtlasApp } from "@/components/atlas/AtlasApp";
import { AtlasSkeleton } from "@/components/atlas/AtlasSkeleton";
import { AtlasUnavailable } from "@/components/atlas/AtlasUnavailable";
import { isDatabaseReachable } from "@/lib/db/health";
import { getAtlasIndex } from "@/lib/services/atlas-service";
import type { AtlasIndex } from "@/types/atlas";

/**
 * Loads the cached globe index at request time (so a database outage renders a
 * graceful state instead of failing the build) and streams it behind a static
 * skeleton shell.
 */
async function AtlasData() {
  await connection();

  let index: AtlasIndex | null = null;
  try {
    index = await getAtlasIndex();
  } catch (error) {
    if (await isDatabaseReachable()) throw error;
    console.error("[atlas] database unavailable", error);
  }

  return index ? <AtlasApp index={index} /> : <AtlasUnavailable />;
}

export default function Home() {
  return (
    <Suspense fallback={<AtlasSkeleton />}>
      <AtlasData />
    </Suspense>
  );
}
