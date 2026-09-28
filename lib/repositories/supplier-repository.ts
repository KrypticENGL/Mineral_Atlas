import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { SupplierPoint, SupplierWithHistory } from "@/types/supplier";
import {
  supplierPointSelect,
  supplierProfileInclude,
  toPriceQuote,
  toSupplierPoint,
  toSupplierProfile,
} from "./mappers";

export interface SupplierInput {
  name: string;
  slug: string;
  countryId: string;
  regionId?: string | null;
  city: string;
  latitude: number;
  longitude: number;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  description: string;
  verified?: boolean;
}

export const supplierRepository = {
  async findAllPoints(): Promise<SupplierPoint[]> {
    const rows = await prisma.supplier.findMany({
      select: supplierPointSelect,
      orderBy: { name: "asc" },
    });
    return rows.map(toSupplierPoint);
  },

  async findById(id: string): Promise<SupplierWithHistory | null> {
    const row = await prisma.supplier.findUnique({
      where: { id },
      include: {
        ...supplierProfileInclude,
        prices: { orderBy: [{ mineralId: "asc" }, { validFrom: "desc" }] },
      },
    });
    if (!row) return null;
    return { ...toSupplierProfile(row), priceHistory: row.prices.map(toPriceQuote) };
  },

  // ── admin-ready mutations ────────────────────────────────────────────────
  create(data: SupplierInput) {
    return prisma.supplier.create({ data });
  },

  update(id: string, data: Partial<SupplierInput>) {
    return prisma.supplier.update({ where: { id }, data });
  },

  /** Cascades to the supplier's offers and price records. */
  delete(id: string) {
    return prisma.supplier.delete({ where: { id } });
  },
};
