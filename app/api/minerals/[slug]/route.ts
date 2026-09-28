import { handle, notFound, ok } from "@/lib/api/http";
import { getMineral } from "@/lib/services/mineral-service";

/** GET /api/minerals/:slug — accepts a slug or id; includes price spread per currency/unit. */
export function GET(_req: Request, ctx: RouteContext<"/api/minerals/[slug]">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const mineral = await getMineral(slug);
    return mineral ? ok(mineral) : notFound("Mineral");
  });
}
