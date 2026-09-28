import type { PriceQuote, PriceUnit } from "./pricing";

export const COUNTERPARTY_ROLES = ["PRODUCER", "MANUFACTURER", "TRADER", "BROKER", "BUYER"] as const;
export type CounterpartyRole = (typeof COUNTERPARTY_ROLES)[number];

export const RISK_LEVELS = ["LOW", "MODERATE", "HIGH", "SCAM"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Globe marker + search/filter facet — intentionally tiny. */
export interface SupplierPoint {
  id: string;
  name: string;
  countryId: string;
  city: string;
  region: string | null;
  lat: number;
  lng: number;
  verified: boolean;
  role: CounterpartyRole;
  riskLevel: RiskLevel;
  /** Every mineral the counterparty offers (or, for buyers, wants) — priced or not. */
  mineralIds: string[];
}

export interface SupplierOffer {
  mineralId: string;
  productName: string | null;
  specifications: string | null;
  availableQuantity: number | null;
  monthlyCapacity: { min: number | null; max: number | null; unit: PriceUnit | null } | null;
  /** Current quote, or null when the supplier lists the mineral without a price. */
  price: PriceQuote | null;
}

/** Full supplier profile, loaded on demand when a country is opened. */
export interface SupplierProfile extends SupplierPoint {
  slug: string;
  countryCode: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
  address: string | null;
  description: string;
  assessment: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  offers: SupplierOffer[];
}

export interface SupplierWithHistory extends SupplierProfile {
  priceHistory: PriceQuote[];
}
