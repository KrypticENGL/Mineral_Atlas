import type { NextRequest } from "next/server";
import { handle, ok, parseFilters } from "@/lib/api/http";
import { listMinerals } from "@/lib/services/mineral-service";
import { listSuppliers } from "@/lib/services/supplier-service";

/**
 * GET /api/suppliers?mineral=&category=&country=&currency=&minPrice=&maxPrice=&availability=&verified=&q=
 * `mineral` accepts a slug or an id.
 */
export function GET(req: NextRequest) {
  return handle(async () => {
    const filters = parseFilters(req.nextUrl.searchParams);
    if (filters.mineralId) {
      const key = filters.mineralId;
      const mineral = (await listMinerals()).find((m) => m.slug === key || m.id === key);
      filters.mineralId = mineral?.id ?? key;
    }
    return ok(await listSuppliers(filters));
  });
}
