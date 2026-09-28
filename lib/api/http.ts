import "server-only";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { AVAILABILITIES, CURRENCIES, type Availability, type Currency } from "@/types/pricing";
import { COUNTERPARTY_ROLES, type CounterpartyRole } from "@/types/supplier";
import { MINERAL_CATEGORIES, type MineralCategory } from "@/types/mineral";
import { DEFAULT_FILTERS, type AtlasFilters } from "@/lib/atlas/filters";
import { isDatabaseReachable } from "@/lib/db/health";

export type ApiErrorCode = "not_found" | "bad_request" | "database_unavailable" | "internal_error";

const CACHE_HEADERS = {
  // Shared caches may serve for 5 min and revalidate in the background for 10.
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export function ok<T>(data: T): Response {
  return Response.json({ data }, { headers: CACHE_HEADERS });
}

export function fail(status: number, code: ApiErrorCode, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function notFound(what: string): Response {
  return fail(404, "not_found", `${what} not found`);
}

export class BadRequestError extends Error {}


/**
 * Wraps a handler body with consistent error responses. Handlers run at request
 * time (data is still served from the "use cache" layer), so a database outage
 * during a build can never be baked into a static response.
 */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    await connection();
    return await run();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof BadRequestError) return fail(400, "bad_request", error.message);
    if (!(await isDatabaseReachable())) {
      console.error("[api] database unavailable", error);
      return fail(503, "database_unavailable", "The mineral database is temporarily unavailable.");
    }
    console.error("[api] unexpected error", error);
    return fail(500, "internal_error", "Unexpected server error.");
  }
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], name: string): T | undefined {
  if (value == null || value === "") return undefined;
  const upper = value.toUpperCase();
  if ((allowed as readonly string[]).includes(upper)) return upper as T;
  throw new BadRequestError(`Invalid ${name} "${value}". Expected one of: ${allowed.join(", ")}`);
}

export function numberParam(value: string | null, name: string): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new BadRequestError(`Invalid ${name} "${value}"`);
  return n;
}

export const parseCurrency = (v: string | null) => oneOf<Currency>(v, CURRENCIES, "currency");
export const parseAvailability = (v: string | null) => oneOf<Availability>(v, AVAILABILITIES, "availability");
export const parseCategory = (v: string | null) => oneOf<MineralCategory>(v, MINERAL_CATEGORIES, "category");

/** Maps `?mineral=&country=&category=…` onto the shared filter model. */
export function parseFilters(params: URLSearchParams): AtlasFilters {
  const currency = parseCurrency(params.get("currency")) ?? null;
  const availability = params
    .getAll("availability")
    .flatMap((v) => v.split(","))
    .map((v) => parseAvailability(v))
    .filter((v): v is Availability => Boolean(v));

  return {
    ...DEFAULT_FILTERS,
    category: parseCategory(params.get("category")) ?? null,
    mineralId: params.get("mineral") || null,
    countryCode: params.get("country")?.toUpperCase() || null,
    supplierQuery: params.get("q") ?? "",
    currency,
    priceMin: numberParam(params.get("minPrice"), "minPrice") ?? null,
    priceMax: numberParam(params.get("maxPrice"), "maxPrice") ?? null,
    availability,
    verifiedOnly: params.get("verified") === "true",
    role: oneOf<CounterpartyRole>(params.get("role"), COUNTERPARTY_ROLES, "role") ?? null,
    hideRisky: params.get("hideRisky") === "true",
  };
}
