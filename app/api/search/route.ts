import type { NextRequest } from "next/server";
import { BadRequestError, handle, numberParam, ok } from "@/lib/api/http";
import { search } from "@/lib/services/search-service";

/** GET /api/search?q=lithium&limit=20 — minerals, countries, suppliers and cities. */
export function GET(req: NextRequest) {
  return handle(async () => {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length > 100) throw new BadRequestError("Query too long");
    const limit = Math.min(numberParam(req.nextUrl.searchParams.get("limit"), "limit") ?? 20, 50);
    return ok(q ? await search(q, limit) : []);
  });
}
