export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CNY", "AUD", "CAD", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PRICE_UNITS = [
  "METRIC_TON",
  "KILOGRAM",
  "GRAM",
  "POUND",
  "OUNCE",
  "CUBIC_METER",
  "CARAT",
] as const;
export type PriceUnit = (typeof PRICE_UNITS)[number];

/** ICC Incoterms 2020 — what a quoted price includes. */
export const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"] as const;
export type Incoterm = (typeof INCOTERMS)[number];

export const AVAILABILITIES = ["AVAILABLE", "LIMITED", "ON_REQUEST", "UNAVAILABLE"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

/** A current (or historical) structured price quote. Prices are never converted. */
export interface PriceQuote {
  id: string;
  supplierId: string;
  mineralId: string;
  price: number;
  currency: Currency;
  unit: PriceUnit;
  minimumOrderQuantity: number | null;
  availability: Availability;
  incoterm: Incoterm | null;
  loadingPort: string | null;
  paymentTerms: string | null;
  /** Qualifiers on the quoted price, e.g. "+ GST + freight". */
  priceNote: string | null;
  validFrom: string;
  validUntil: string | null;
  lastUpdated: string;
  source: string;
}

/** Minimal listing facet shipped with the globe index for instant client filtering. */
export interface ListingFacet {
  supplierId: string;
  mineralId: string;
  price: number;
  currency: Currency;
  unit: PriceUnit;
  availability: Availability;
}
