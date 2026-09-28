import type { Continent } from "@/types/country";
import type { MineralCategory } from "@/types/mineral";
import type { Availability, Currency, PriceUnit } from "@/types/pricing";
import type { CounterpartyRole, RiskLevel } from "@/types/supplier";

/**
 * Formatting helpers. A fixed locale and UTC time zone keep server and client
 * output identical (no hydration mismatches).
 */
const LOCALE = "en-US";

export const UNIT_LABEL: Record<PriceUnit, { short: string; long: string }> = {
  METRIC_TON: { short: "t", long: "metric ton" },
  KILOGRAM: { short: "kg", long: "kilogram" },
  GRAM: { short: "g", long: "gram" },
  POUND: { short: "lb", long: "pound" },
  OUNCE: { short: "oz t", long: "troy ounce" },
  CUBIC_METER: { short: "m³", long: "cubic meter" },
  CARAT: { short: "ct", long: "carat" },
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  AVAILABLE: "Available",
  LIMITED: "Limited",
  ON_REQUEST: "On request",
  UNAVAILABLE: "Unavailable",
};

export const CATEGORY_LABEL: Record<MineralCategory, string> = {
  METALLIC: "Metallic",
  INDUSTRIAL: "Industrial",
  PRECIOUS: "Precious",
  ENERGY: "Energy",
  GEMSTONE: "Gemstone",
  PACKAGING: "Packaging",
};

export const ROLE_LABEL: Record<CounterpartyRole, string> = {
  PRODUCER: "Producer",
  MANUFACTURER: "Manufacturer",
  TRADER: "Trader",
  BROKER: "Broker",
  BUYER: "Buyer",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "Low risk",
  MODERATE: "Verify first",
  HIGH: "High risk",
  SCAM: "Likely scam",
};

export const CONTINENT_LABEL: Record<Continent, string> = {
  AFRICA: "Africa",
  ASIA: "Asia",
  EUROPE: "Europe",
  MIDDLE_EAST: "Middle East",
  NORTH_AMERICA: "North America",
  SOUTH_AMERICA: "South America",
  OCEANIA: "Oceania",
};

const ZERO_DECIMAL: ReadonlySet<Currency> = new Set(["JPY"]);
const amountFormatters = new Map<string, Intl.NumberFormat>();

function amountFormatter(fraction: number): Intl.NumberFormat {
  const key = String(fraction);
  let fmt = amountFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: fraction, maximumFractionDigits: fraction });
    amountFormatters.set(key, fmt);
  }
  return fmt;
}

/** "152.30" — amount only, precision adapted to magnitude and currency. */
export function formatAmount(value: number, currency: Currency): string {
  if (ZERO_DECIMAL.has(currency) || value >= 10_000) return amountFormatter(0).format(value);
  return amountFormatter(2).format(value);
}

/** "AUD 152.30 / t" — always shows the original currency code and unit. */
export function formatPrice(value: number, currency: Currency, unit?: PriceUnit): string {
  const base = `${currency} ${formatAmount(value, currency)}`;
  return unit ? `${base} / ${UNIT_LABEL[unit].short}` : base;
}

const compact = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat(LOCALE);

export function formatQuantity(value: number, unit: PriceUnit): string {
  const n = value >= 100_000 ? compact.format(value) : integer.format(value);
  return `${n} ${UNIT_LABEL[unit].short}`;
}

export function formatCount(value: number): string {
  return integer.format(value);
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateFmt.format(new Date(iso)) : "—";
}

export function formatMonth(iso: string | null | undefined): string {
  return iso ? monthFmt.format(new Date(iso)) : "—";
}

/** "22.91°S 68.20°W" */
export function formatCoordinates(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lng).toFixed(2)}°${ew}`;
}

export function pluralize(count: number, word: string, plural = `${word}s`): string {
  return `${formatCount(count)} ${count === 1 ? word : plural}`;
}
