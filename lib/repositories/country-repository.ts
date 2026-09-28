import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Continent } from "@/lib/generated/prisma/enums";
import type { CountryDetail, CountrySummary } from "@/types/country";
import {
  countrySummarySelect,
  supplierProfileInclude,
  toCountrySummary,
  toSupplierProfile,
} from "./mappers";

export interface CountryInput {
  name: string;
  code: string;
  isoNumeric: string;
  continent: Continent;
  latitude: number;
  longitude: number;
}

export const countryRepository = {
  async findAll(): Promise<CountrySummary[]> {
    const rows = await prisma.country.findMany({
      select: countrySummarySelect,
      orderBy: { name: "asc" },
    });
    return rows.map(toCountrySummary);
  },

  async findByCode(code: string): Promise<CountryDetail | null> {
    const row = await prisma.country.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        ...countrySummarySelect,
        suppliers: { orderBy: { name: "asc" }, include: supplierProfileInclude },
      },
    });
    if (!row) return null;

    const suppliers = row.suppliers.map(toSupplierProfile);
    let lastUpdated: string | null = null;
    for (const supplier of suppliers) {
      for (const offer of supplier.offers) {
        const updated = offer.price?.lastUpdated;
        if (updated && (!lastUpdated || updated > lastUpdated)) lastUpdated = updated;
      }
    }

    return { ...toCountrySummary(row), suppliers, lastUpdated };
  },

  // ── admin-ready mutations ────────────────────────────────────────────────
  create(data: CountryInput) {
    return prisma.country.create({ data: { ...data, code: data.code.toUpperCase() } });
  },

  update(id: string, data: Partial<CountryInput>) {
    return prisma.country.update({ where: { id }, data });
  },

  /** Cascades to regions, suppliers, offers and prices. */
  delete(id: string) {
    return prisma.country.delete({ where: { id } });
  },
};
