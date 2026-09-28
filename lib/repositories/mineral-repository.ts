import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { MineralCategory } from "@/lib/generated/prisma/enums";
import type { MineralDetail, MineralPriceStat, MineralSummary } from "@/types/mineral";
import { mineralSummarySelect, toMineralSummary } from "./mappers";

export interface MineralInput {
  name: string;
  slug: string;
  category: MineralCategory;
  chemicalFormula?: string | null;
  description: string;
  uses: string[];
}

export const mineralRepository = {
  async findAll(): Promise<MineralSummary[]> {
    const rows = await prisma.mineral.findMany({
      select: mineralSummarySelect,
      orderBy: { name: "asc" },
    });
    return rows.map(toMineralSummary);
  },

  async findBySlugOrId(key: string): Promise<MineralDetail | null> {
    const row = await prisma.mineral.findFirst({
      where: { OR: [{ slug: key }, { id: key }] },
      include: {
        suppliers: { select: { supplier: { select: { country: { select: { code: true } } } } } },
      },
    });
    if (!row) return null;

    // Price spread per (currency, unit), aggregated in the database.
    const groups = await prisma.mineralPrice.groupBy({
      by: ["currency", "unit"],
      where: { mineralId: row.id, validUntil: null },
      _min: { price: true },
      _max: { price: true },
      _count: { _all: true },
    });

    const priceStats: MineralPriceStat[] = groups
      .map((g) => ({
        currency: g.currency,
        unit: g.unit,
        min: g._min.price?.toNumber() ?? 0,
        max: g._max.price?.toNumber() ?? 0,
        quotes: g._count._all,
      }))
      .sort((a, b) => b.quotes - a.quotes);

    const countryCodes = [...new Set(row.suppliers.map((s) => s.supplier.country.code))].sort();

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      chemicalFormula: row.chemicalFormula,
      description: row.description,
      uses: row.uses,
      supplierCount: row.suppliers.length,
      countryCodes,
      priceStats,
    };
  },

  // ── admin-ready mutations ────────────────────────────────────────────────
  create(data: MineralInput) {
    return prisma.mineral.create({ data });
  },

  update(id: string, data: Partial<MineralInput>) {
    return prisma.mineral.update({ where: { id }, data });
  },

  /** Cascades to offers and price records for this mineral. */
  delete(id: string) {
    return prisma.mineral.delete({ where: { id } });
  },
};
