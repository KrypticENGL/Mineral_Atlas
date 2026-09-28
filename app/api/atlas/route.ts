import { handle, ok } from "@/lib/api/http";
import { getAtlasIndex } from "@/lib/services/atlas-service";

/** GET /api/atlas — the compact globe index (countries, supplier points, facets, stats). */
export function GET() {
  return handle(async () => ok(await getAtlasIndex()));
}
