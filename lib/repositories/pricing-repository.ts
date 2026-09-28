import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Availability, Currency, PriceUnit } from "@/lib/generated/prisma/enums";
import type { ListingFacet, PriceQuote } from "@/types/pricing";
import { toPriceQuote } from "./mappers";

export interface PriceQuery {
  mineralId?: string;
  supplierId?: string;
  countryCode?: string;
  currency?: Currency;
  availability?: Availability;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  cursor?: string;
}

export interface PriceInput {
  supplierId: string;
  mineralId: string;
  price: number;
  currency: Currency;
  unit: PriceUnit;
  minimumOrderQuantity?: number | null;
  availability?: Availability;
  validFrom?: Date;
  source?: string;
  externalRef?: string | null;
}

export const pricingRepository = {
  /** Current quotes only — the compact facet set shipped with the globe index. */
  async findCurrentFacets(): Promise<ListingFacet[]> {
    const rows = await prisma.mineralPrice.findMany({
      where: { validUntil: null },
      select: {
        supplierId: true,
        mineralId: true,
        price: true,
        currency: true,
        unit: true,
        availability: true,
      },
    });
    return rows.map((r) => ({ ...r, price: r.price.toNumber() }));
  },

  async latestUpdate(): Promise<string | null> {
    const agg = await prisma.mineralPrice.aggregate({
      where: { validUntil: null },
      _max: { lastUpdated: true },
    });
    return agg._max.lastUpdated?.toISOString() ?? null;
  },

  /** Cursor-paginated current quotes for the public pricing endpoint. */
  async findCurrent(query: PriceQuery): Promise<{ items: PriceQuote[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const where: Prisma.MineralPriceWhereInput = {
      validUntil: null,
      mineralId: query.mineralId,
      supplierId: query.supplierId,
      currency: query.currency,
      availability: query.availability,
      price:
        query.minPrice != null || query.maxPrice != null
          ? { gte: query.minPrice, lte: query.maxPrice }
          : undefined,
      supplier: query.countryCode ? { country: { code: query.countryCode.toUpperCase() } } : undefined,
    };

    const rows = await prisma.mineralPrice.findMany({
      where,
      orderBy: [{ lastUpdated: "desc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map(toPriceQuote);
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  },

  // ── admin-ready mutations ────────────────────────────────────────────────

  /**
   * Publishes a new current quote: closes the previous current quote (kept as
   * history) and inserts the new one, creating the supplier–mineral offer if needed.
   */
  publishQuote(input: PriceInput) {
    const now = input.validFrom ?? new Date();
    return prisma.$transaction(async (tx) => {
      await tx.supplierMineral.upsert({
        where: { supplierId_mineralId: { supplierId: input.supplierId, mineralId: input.mineralId } },
        create: { supplierId: input.supplierId, mineralId: input.mineralId },
        update: {},
      });
      await tx.mineralPrice.updateMany({
        where: { supplierId: input.supplierId, mineralId: input.mineralId, validUntil: null },
        data: { validUntil: now },
      });
      return tx.mineralPrice.create({
        data: { ...input, validFrom: now, lastUpdated: now, validUntil: null },
      });
    });
  },

  /** Corrects a quote in place (e.g. a typo) without creating history. */
  update(id: string, data: Partial<Omit<PriceInput, "supplierId" | "mineralId">>) {
    return prisma.mineralPrice.update({ where: { id }, data: { ...data, lastUpdated: new Date() } });
  },

  delete(id: string) {
    return prisma.mineralPrice.delete({ where: { id } });
  },
};
