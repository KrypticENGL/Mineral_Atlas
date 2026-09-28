import { handle, notFound, ok } from "@/lib/api/http";
import { getCountryDetail } from "@/lib/services/country-service";

/** GET /api/countries/:code — country with suppliers, offers and current prices. */
export function GET(_req: Request, ctx: RouteContext<"/api/countries/[code]">) {
  return handle(async () => {
    const { code } = await ctx.params;
    const country = await getCountryDetail(code.toUpperCase());
    return country ? ok(country) : notFound("Country");
  });
}
