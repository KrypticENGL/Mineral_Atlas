import type { Prisma } from "@/lib/generated/prisma/client";
import type { CountrySummary } from "@/types/country";
import type { MineralSummary } from "@/types/mineral";
import type { PriceQuote } from "@/types/pricing";
import type { SupplierOffer, SupplierPoint, SupplierProfile } from "@/types/supplier";

/**
 * Prisma rows → plain, serialisable DTOs. Decimals become numbers and dates
 * become ISO strings so nothing Prisma-specific leaks past the repository layer.
 */

type Decimalish = Prisma.Decimal | null | undefined;
const num = (value: Decimalish): number | null => (value == null ? null : value.toNumber());

export const countrySummarySelect = {
  id: true,
  code: true,
  isoNumeric: true,
  name: true,
  continent: true,
  latitude: true,
  longitude: true,
} satisfies Prisma.CountrySelect;

export function toCountrySummary(
  row: Prisma.CountryGetPayload<{ select: typeof countrySummarySelect }>,
): CountrySummary {
  return {
    id: row.id,
    code: row.code,
    isoNumeric: row.isoNumeric,
    name: row.name,
    continent: row.continent,
    lat: row.latitude,
    lng: row.longitude,
  };
}

export const mineralSummarySelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  chemicalFormula: true,
} satisfies Prisma.MineralSelect;

export function toMineralSummary(
  row: Prisma.MineralGetPayload<{ select: typeof mineralSummarySelect }>,
): MineralSummary {
  return { ...row };
}

export function toPriceQuote(row: Prisma.MineralPriceGetPayload<object>): PriceQuote {
  return {
    id: row.id,
    supplierId: row.supplierId,
    mineralId: row.mineralId,
    price: row.price.toNumber(),
    currency: row.currency,
    unit: row.unit,
    minimumOrderQuantity: num(row.minimumOrderQuantity),
    availability: row.availability,
    incoterm: row.incoterm,
    loadingPort: row.loadingPort,
    paymentTerms: row.paymentTerms,
    priceNote: row.priceNote,
    validFrom: row.validFrom.toISOString(),
    validUntil: row.validUntil?.toISOString() ?? null,
    lastUpdated: row.lastUpdated.toISOString(),
    source: row.source,
  };
}

export const supplierPointSelect = {
  id: true,
  name: true,
  countryId: true,
  city: true,
  latitude: true,
  longitude: true,
  verified: true,
  role: true,
  riskLevel: true,
  region: { select: { name: true } },
  minerals: { select: { mineralId: true } },
} satisfies Prisma.SupplierSelect;

export function toSupplierPoint(
  row: Prisma.SupplierGetPayload<{ select: typeof supplierPointSelect }>,
): SupplierPoint {
  return {
    id: row.id,
    name: row.name,
    countryId: row.countryId,
    city: row.city,
    region: row.region?.name ?? null,
    lat: row.latitude,
    lng: row.longitude,
    verified: row.verified,
    role: row.role,
    riskLevel: row.riskLevel,
    mineralIds: row.minerals.map((m) => m.mineralId),
  };
}

/** Supplier with its offers and only the *current* price per offer. */
export const supplierProfileInclude = {
  region: { select: { name: true } },
  country: { select: { code: true } },
  minerals: {
    orderBy: { mineral: { name: "asc" } },
    include: {
      prices: { where: { validUntil: null }, orderBy: { validFrom: "desc" }, take: 1 },
    },
  },
} satisfies Prisma.SupplierInclude;

export function toSupplierProfile(
  row: Prisma.SupplierGetPayload<{ include: typeof supplierProfileInclude }>,
): SupplierProfile {
  const offers: SupplierOffer[] = row.minerals.map((offer) => ({
    mineralId: offer.mineralId,
    productName: offer.productName,
    specifications: offer.specifications,
    availableQuantity: num(offer.availableQuantity),
    monthlyCapacity:
      offer.monthlyCapacityMin == null && offer.monthlyCapacityMax == null
        ? null
        : { min: num(offer.monthlyCapacityMin), max: num(offer.monthlyCapacityMax), unit: offer.quantityUnit },
    price: offer.prices[0] ? toPriceQuote(offer.prices[0]) : null,
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    countryId: row.countryId,
    countryCode: row.country.code,
    city: row.city,
    region: row.region?.name ?? null,
    lat: row.latitude,
    lng: row.longitude,
    verified: row.verified,
    role: row.role,
    riskLevel: row.riskLevel,
    mineralIds: row.minerals.map((m) => m.mineralId),
    assessment: row.assessment,
    source: row.source,
    website: row.website,
    email: row.email,
    phone: row.phone,
    contactName: row.contactName,
    address: row.address,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    offers,
  };
}
