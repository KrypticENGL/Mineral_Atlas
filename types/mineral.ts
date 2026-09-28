import type { Currency, PriceUnit } from "./pricing";

export const MINERAL_CATEGORIES = ["METALLIC", "INDUSTRIAL", "PRECIOUS", "ENERGY", "GEMSTONE", "PACKAGING"] as const;
export type MineralCategory = (typeof MINERAL_CATEGORIES)[number];

export interface MineralSummary {
  id: string;
  name: string;
  slug: string;
  category: MineralCategory;
  chemicalFormula: string | null;
}

export interface MineralPriceStat {
  currency: Currency;
  unit: PriceUnit;
  min: number;
  max: number;
  quotes: number;
}

export interface MineralDetail extends MineralSummary {
  description: string;
  uses: string[];
  supplierCount: number;
  countryCodes: string[];
  /** Price spread grouped by original currency + unit (no conversion). */
  priceStats: MineralPriceStat[];
}
