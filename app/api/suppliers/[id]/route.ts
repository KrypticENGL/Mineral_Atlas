import { handle, notFound, ok } from "@/lib/api/http";
import { getSupplier } from "@/lib/services/supplier-service";

/** GET /api/suppliers/:id — full profile including price history. */
export function GET(_req: Request, ctx: RouteContext<"/api/suppliers/[id]">) {
  return handle(async () => {
    const { id } = await ctx.params;
    const supplier = await getSupplier(id);
    return supplier ? ok(supplier) : notFound("Supplier");
  });
}
