import type { NextRequest } from "next/server";
import { handle, numberParam, ok, parseAvailability, parseCurrency } from "@/lib/api/http";
import { listCurrentPrices } from "@/lib/services/pricing-service";

/**
 * GET /api/pricing?mineral=&supplier=&country=&currency=&availability=&minPrice=&maxPrice=&limit=&cursor=
 * Current quotes in their original currency and unit, cursor-paginated.
 */
export function GET(req: NextRequest) {
  return handle(async () => {
    const p = req.nextUrl.searchParams;
    const result = await listCurrentPrices({
      mineralId: p.get("mineral") || undefined,
      supplierId: p.get("supplier") || undefined,
      countryCode: p.get("country") || undefined,
      currency: parseCurrency(p.get("currency")),
      availability: parseAvailability(p.get("availability")),
      minPrice: numberParam(p.get("minPrice"), "minPrice"),
      maxPrice: numberParam(p.get("maxPrice"), "maxPrice"),
      limit: numberParam(p.get("limit"), "limit"),
      cursor: p.get("cursor") || undefined,
    });
    return ok(result);
  });
}
