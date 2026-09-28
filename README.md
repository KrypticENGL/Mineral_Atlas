# Mineral Atlas

Explore mineral suppliers and pricing around the world on an interactive 3D globe.

> **Supplier-quoted prices.** Listings are entered from offers sent directly by suppliers. They show the seller's stated terms and are not live or independently confirmed market prices. Suppliers without a verified badge have not been checked.

Stack: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Base UI) · react-globe.gl / Three.js · Motion · Zustand · PostgreSQL 17 · Prisma 7.

---

## Quick start

Prerequisites: Node 20+ and Docker (or any PostgreSQL 14+).

```bash
npm install                # also runs `prisma generate`
cp .env.example .env       # DATABASE_URL for the bundled container
npm run db:up              # starts Postgres on localhost:5433
npm run db:deploy          # applies migrations
npm run db:seed            # loads reference data + supplier offers
npm run dev                # http://localhost:3000
```

To use your own Postgres, set `DATABASE_URL` in `.env` and skip `db:up`.

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` · `npm run typecheck` | ESLint · `tsc --noEmit` |
| `npm run db:up` | Start the Postgres container (`docker-compose.yml`) |
| `npm run db:migrate` | Create/apply a migration after editing the schema (dev) |
| `npm run db:deploy` | Apply existing migrations (CI/prod) |
| `npm run db:seed` | Rebuild all data from `prisma/reference-data.ts` + `prisma/suppliers.ts` |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Browse the data in Prisma Studio |

### Environment

```bash
# .env.example
DATABASE_URL="postgresql://atlas:atlas@localhost:5433/mineral_atlas?schema=public"
```

### Useful URLs

- `/?country=CL` · `/?country=BR&supplier=<id>` · `/?mineral=lithium`: deep links (the explorer keeps the URL in sync)
- `/?webgl=off`: forces the 2D fallback map
- `/admin`: placeholder for future administration

---

## What's in the database

- **Reference data** (`prisma/reference-data.ts`): 40 countries (ISO codes and centroids) and a 31-entry catalogue: 30 minerals plus steel drums in a Packaging category.
- **Direct offers** (`prisma/suppliers.ts`): Sinchi Wayra (La Paz, Bolivia): aluminium ingot at USD 2,650/MT CIF Callao. Rated **high risk**.
- **Lead sheets** (`prisma/mining-people.ts`): 61 counterparties from the "MINING PEOPLE" Sheet1–3 CSVs.
  - They cover iron ore and copper sourcing calls, aluminium buyers and sellers, a primary-aluminium directory, and steel drum manufacturers.
  - Three rows with no location at all are kept in `unlocated` but are not placed on the globe.

Every counterparty has a **role** (producer, manufacturer, trader, broker, buyer), a **risk level** (low, verify first, high, likely scam) and the sheet's due-diligence **assessment**. Buyers' mineral entries are requirements, not offers. Only rows the sheets call "verified end-user" are marked verified.

Each offer can carry a product/grade name, specifications, stock and monthly capacity. Quotes store price, currency, unit, incoterm, loading port, payment terms, a price note (e.g. "+ GST + freight") and the MOQ. Offers without a quote still show up under mineral and category filters.

---

## Architecture

```
app/
  page.tsx                 RSC: streams the cached globe index behind a static skeleton
  admin/page.tsx           placeholder
  api/…/route.ts           thin HTTP adapters over the service layer
components/
  atlas/                   client root, context provider, URL sync, skeleton/unavailable states
  globe/                   GlobeStage (WebGL detect + lazy load), GlobeScene, CountryLayer,
                           SupplierMarkers, LocationTooltip, FlatMapFallback, geo loader
  dashboard/               Header, Search, FilterPanel, StatsBar, GlobalOverview, MineralFocus,
                           LocationDetailsPanel, SupplierCard, SupplierDetails, MineralPriceTable,
                           MobileSheet, primitives
  ui/                      shadcn/ui primitives (Base UI)
lib/
  db/                      Prisma client (pg driver adapter) + health probe
  repositories/            the only code that touches Prisma; maps rows → plain DTOs
  services/                cached reads ("use cache" + tags) and admin-service (writes + invalidation)
  atlas/                   pure, isomorphic logic: filters, search, lookups, insights, formatting, palette
  store/                   Zustand store: selection, camera, filters, per-session resource cache
  api/http.ts              response envelope, param parsing, error classification
prisma/                    schema, migrations, seed
types/                     domain DTOs shared by server and client (no Prisma types)
```

**Layers.** `route handler / RSC → service → repository → Prisma`. The UI only sees the DTOs in `types/`, so the backend can later move into a separate API service with no frontend changes: the client already talks to `/api/*` for everything after first paint.

**Data flow.**
1. **First paint:** `app/page.tsx` loads the *atlas index* (`getAtlasIndex`, cached with `"use cache"`): country summaries, supplier points, the mineral catalogue, and compact current-price facets (`supplierId, mineralId, price, currency, unit, availability`). With the full 104-supplier test catalogue this was about 66 KB of JSON.
2. **Globe, search, filters and statistics** all run in the browser against this index, so they respond instantly. The filtering logic (`lib/atlas/filters.ts`) and search ranking (`lib/atlas/search.ts`) are pure functions that the API routes reuse on the server, so the server and the client always return the same results.
3. **On selecting a country** (or hovering one for 140 ms, as a prefetch), the client fetches `/api/countries/:code`: full supplier profiles, offers and current quotes. The Zustand store caches each resource for the session and dedupes in-flight requests, so revisiting a country makes no request.
4. **Supplier price history** (`/api/suppliers/:id`) and **mineral detail** (`/api/minerals/:slug`) load lazily, only when their views open.

**Explorer hierarchy.** Global → Country → Supplier → Mineral/Pricing, all on one page. Esc steps back up one level, and the URL mirrors the current state via `history.replaceState`.

### Schema (`prisma/schema.prisma`)

| Model | Notes |
| --- | --- |
| `Country` | ISO alpha-2 `code` (URLs/API), ISO numeric `isoNumeric` (joins to the Natural Earth boundary asset), `continent`, centroid |
| `Region` | sub-national area, unique per country |
| `Supplier` | location (city, region, lat/lng), contact fields, `verified`, description |
| `Mineral` | `slug`, `category` enum, formula, description, `uses[]` |
| `SupplierMineral` | the offer (supplier × mineral, unique), available quantity |
| `MineralPrice` | `Decimal` price + `Currency` + `PriceUnit` enums, MOQ, `Availability`, `validFrom`/`validUntil`, `lastUpdated`, `source`, `externalRef` |

The row with `validUntil = null` is the current quote. Superseded quotes stay in the table as history. Indexes cover `Supplier.countryId`, `regionId`, `(latitude, longitude)`, `name` and `verified`; `Mineral.category` plus unique `name`/`slug`; and `MineralPrice` on `(supplierId, validUntil)`, `(mineralId, validUntil)`, `lastUpdated` and `(mineralId, currency, price)`. Deletes cascade from Country → Supplier → offers → prices.

Country boundaries are not stored in the database. They come from a static Natural Earth 1:110m TopoJSON file (`public/geo/countries-110m.json`, about 30 KB gzipped), fetched once by the browser and keyed by `isoNumeric`.

### Pricing rules

- Prices are structured (`Decimal(16,4)` + currency enum + unit enum), never free-text strings.
- The UI always shows the original currency code and unit, e.g. `AUD 152.70 / t` or `per troy ounce`.
- **Nothing is converted.** Price-range filters apply only once a currency is chosen, and they compare quotes as listed. Ranges in the country panel are grouped by (currency, unit).

---

## API

All responses are JSON: `{ "data": … }` on success, `{ "error": { "code", "message" } }` on failure. Error codes: `bad_request` 400, `not_found` 404, `internal_error` 500, `database_unavailable` 503.

| Endpoint | Description |
| --- | --- |
| `GET /api/atlas` | Globe index: countries, supplier points, current price facets, global stats |
| `GET /api/countries` | All countries |
| `GET /api/countries/:code` | Country with suppliers, offers and current quotes (`CL`, `BR`, …) |
| `GET /api/suppliers` | Filtered supplier points: `mineral` (slug or id), `category`, `country`, `currency`, `minPrice`, `maxPrice`, `availability` (repeatable/comma list), `verified=true`, `q` |
| `GET /api/suppliers/:id` | Supplier profile with full price history |
| `GET /api/minerals` | Mineral catalogue |
| `GET /api/minerals/:slug` | Mineral detail + price spread per (currency, unit) |
| `GET /api/pricing` | Current quotes, cursor-paginated: `mineral`, `supplier`, `country`, `currency`, `availability`, `minPrice`, `maxPrice`, `limit` (≤200), `cursor` |
| `GET /api/search?q=` | Ranked minerals, countries, suppliers and cities (`limit` ≤ 50) |

Examples:

```bash
curl "localhost:3000/api/suppliers?mineral=lithium&verified=true"
curl "localhost:3000/api/pricing?currency=AUD&limit=20"
curl "localhost:3000/api/search?q=copper"
```

---

## Adding and removing data

**Right now, with no admin UI:**
- *Add a supplier offer:* append an entry to `prisma/suppliers.ts` (country and mineral must exist in `prisma/reference-data.ts`), then run `npm run db:seed`. Keep `verified: false` until the supplier has been checked.
- *Edit rows directly:* use `npm run db:studio`.
- *New country:* add a row with its ISO alpha-2 and ISO numeric codes. The numeric code is how its boundary is found on the globe.
- *Schema change:* edit `schema.prisma`, run `npm run db:migrate -- --name <change>`, then add the field to the mapper in `lib/repositories/mappers.ts` and to the DTO in `types/`.

**Programmatically, and for the future admin UI:** `lib/services/admin-service.ts` already provides
`addCountry / updateCountry / removeCountry`, `addSupplier / updateSupplier / removeSupplier`,
`addMineral / updateMineral / removeMineral`, and for pricing `publishPrice` (closes the current quote and inserts a new current one in a single transaction, so history is kept), `correctPrice` (in-place fix) and `removePrice`.
Every write calls `revalidateTag("catalog")`, so the cached reads refresh. Before you expose these through Server Actions or routes, wrap them in authentication and input validation (e.g. zod).

Direct database edits (Studio, SQL) are not seen by the app until the cache revalidates: 15 minutes at most under the `catalog` profile in `next.config.ts`, or immediately after a restart.

---

## How to connect real mineral pricing data later

Today offers are entered by hand in `prisma/suppliers.ts`. A real feed goes into the **write side**, and the read path, the API and the UI stay as they are.

1. **Ingestion job** (new, e.g. `lib/ingestion/<provider>.ts`, run by cron or a queue worker). It fetches from the provider, normalises each record to `PriceInput` (supplier, mineral, `price`, `currency`, `unit`, MOQ, availability), and sets `source` to the provider id and `externalRef` to the provider's record id. Provenance fields are already in the schema.
2. **Upsert through the service layer.** Call `adminService.publishPrice(input)` for each changed quote. It supersedes the current quote, keeps the old one as history and invalidates the cache. Match suppliers and minerals by slug or by a stored external id (add a column if the provider has stable ids).
3. **Freshness.** Tune the `catalog` cache profile, or call `revalidateTag("catalog")` once per batch rather than per row.
4. **Currency conversion (optional, later).** Add an `FxRate` table and a *derived* display value. Never overwrite `MineralPrice.price` or `currency`: the original quote is the record of truth, and the UI should keep showing it next to any converted figure.
5. **Scale.** Beyond tens of thousands of listings, move filtering and search from the client index to the existing `/api/suppliers` and `/api/search` endpoints (swap `search-service` to Postgres `pg_trgm` or full-text search), and trim the index down to one aggregate per country.

---

## Performance notes

- **Minimal JavaScript at first paint.** Three.js and globe.gl sit in a lazily loaded chunk (`next/dynamic`, `ssr: false`). The page shell is prerendered (Partial Prerendering) and the data streams in behind a skeleton.
- **Globe created once.** Layer accessors are memoised, so only changes to hover, selection or filters reach globe.gl, and the scene is never rebuilt. Camera moves and auto-rotation run through a store subscription with no React re-render. The live coordinate readout writes straight to the DOM.
- **Cheap geometry.** Supplier points are merged into a single mesh (one draw call). Boundaries are 1:110m. The globe uses a flat material with no textures and no post-processing, pixel ratio is capped at 2, and rendering pauses while the tab is hidden.
- **Few DOM nodes.** There is one shared tooltip, at most a few dozen HTML labels, and a label collision pass on a 200 ms timer rather than every frame.
- **Data.** Filter aggregates are computed once per filter change (a shared context, not once per component). The search corpus is normalised once, and `useDeferredValue` keeps typing smooth with no debounce and no network requests. Supplier lists paginate in pages of 8.
- **Caching.** Server reads use `"use cache"` + `cacheLife("catalog")` + `cacheTag("catalog")`. The client caches each fetched resource for the session and dedupes concurrent requests. API responses send `s-maxage=300, stale-while-revalidate=600`.
- **Resilience.** If the database is unavailable, the page shows a "Database unavailable" screen and the API returns `503`. Failures are never cached, so the app recovers as soon as Postgres is back. Because production sanitises errors thrown inside cached scopes, failures are classified with a direct connectivity probe (`lib/db/health.ts`).
- **WebGL fallback.** If WebGL is unavailable, or the scene throws, the app switches to an SVG Equal Earth map with the same data and interactions.

## Responsive behaviour

- **Desktop** (≥1024 px): overview panel on the left, details panel on the right, non-modal filter popover, stats bar along the bottom.
- **Tablet and mobile:** a draggable bottom sheet with peek, half and full snap points. Opening a supplier takes it to full screen. Filters open as a bottom drawer, search as a full-screen overlay, and the camera pulls back to fit narrow screens.
