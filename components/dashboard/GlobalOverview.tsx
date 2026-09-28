"use client";

import { useMemo } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { CONTINENT_LABEL, formatCount, formatMonth } from "@/lib/atlas/format";
import { rgb } from "@/lib/atlas/palette";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { useMapPalette } from "@/lib/theme/theme-store";
import { cn } from "@/lib/utils";
import type { Continent } from "@/types/country";
import { MineralFocus } from "./MineralFocus";
import { Bar, CategoryDot, CountUp, SectionLabel, Stat, stagger } from "./primitives";

/** Rough visual centres used when a region row is clicked. */
const CONTINENT_VIEW: Record<Continent, { lat: number; lng: number }> = {
  AFRICA: { lat: 2, lng: 20 },
  ASIA: { lat: 28, lng: 100 },
  EUROPE: { lat: 52, lng: 14 },
  MIDDLE_EAST: { lat: 28, lng: 44 },
  NORTH_AMERICA: { lat: 42, lng: -100 },
  SOUTH_AMERICA: { lat: -18, lng: -62 },
  OCEANIA: { lat: -24, lng: 134 },
};

function useOverviewData() {
  const { lookups } = useAtlas();
  const { result } = useFiltered();

  return useMemo(() => {
    const mineralSuppliers = new Map<string, number>();
    const continentSuppliers = new Map<Continent, number>();
    for (const agg of result.byCountry.values()) {
      const country = lookups.countryById.get(agg.countryId);
      if (country) continentSuppliers.set(country.continent, (continentSuppliers.get(country.continent) ?? 0) + agg.supplierCount);
    }
    for (const supplierId of result.supplierIds) {
      for (const listing of lookups.listingsBySupplier.get(supplierId) ?? []) {
        mineralSuppliers.set(listing.mineralId, (mineralSuppliers.get(listing.mineralId) ?? 0) + 1);
      }
    }
    const topMinerals = [...mineralSuppliers.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({ mineral: lookups.mineralById.get(id)!, count }))
      .filter((r) => r.mineral);
    const regions = [...continentSuppliers.entries()].sort((a, b) => b[1] - a[1]);
    return { topMinerals, regions };
  }, [lookups, result]);
}

export function OverviewStats({ compact = false }: { compact?: boolean }) {
  const { lookups } = useAtlas();
  const { result, activeFilters } = useFiltered();
  const { stats } = lookups.index;
  const filtered = activeFilters > 0;
  const of = (n: number) => (filtered ? `of ${formatCount(n)}` : undefined);

  return (
    <div className={cn("grid gap-x-6 gap-y-5", compact ? "grid-cols-4 gap-x-3" : "grid-cols-2")}>
      <Stat label="Countries" value={<CountUp value={result.totals.countries} />} sub={compact ? undefined : of(stats.countries)} />
      <Stat label="Suppliers" value={<CountUp value={result.totals.suppliers} />} sub={compact ? undefined : of(stats.suppliers)} />
      <Stat
        label="Minerals"
        value={<CountUp value={filtered ? result.totals.minerals : stats.minerals} />}
        sub={compact ? undefined : of(stats.minerals)}
      />
      <Stat
        label="Listings"
        value={<CountUp value={result.totals.listings} />}
        sub={compact ? undefined : filtered ? of(stats.activeListings) : "active quotes"}
      />
    </div>
  );
}

export function OverviewInsights() {
  const { topMinerals, regions } = useOverviewData();
  const filters = useAtlasStore((s) => s.filters);
  const setFilter = useAtlasStore((s) => s.setFilter);
  const flyTo = useAtlasStore((s) => s.flyTo);
  const maxMineral = topMinerals[0]?.count ?? 0;

  return (
    <>
      {filters.mineralId && <MineralFocus mineralId={filters.mineralId} />}

      <section>
        <SectionLabel>Most represented minerals</SectionLabel>
        <ol className="mt-2">
          {topMinerals.map(({ mineral, count }, i) => {
            const active = filters.mineralId === mineral.id;
            return (
              <li key={mineral.id} className="rise" style={stagger(i, 120)}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter("mineralId", active ? null : mineral.id)}
                  className={cn(
                    "press press-soft group grid w-full grid-cols-[22px_1fr_auto] items-center gap-x-2 py-2 text-left",
                    active ? "text-cream" : "text-beige hover:text-cream",
                  )}
                >
                  <span className="tabular font-mono text-[10px] text-dim">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex min-w-0 items-center gap-2 text-[13px] transition-transform duration-300 ease-atlas group-hover:translate-x-1">
                    <CategoryDot category={mineral.category} className="transition-transform duration-500 ease-atlas group-hover:rotate-[135deg]" />
                    <span className={cn("truncate", active && "underline underline-offset-4")}>{mineral.name}</span>
                  </span>
                  <span className="tabular font-mono text-[11px] text-stone">{count}</span>
                  <span />
                  <span className="col-span-2 mt-1.5">
                    <Bar value={count} max={maxMineral} index={i} tone={active ? "var(--atlas-cream)" : "var(--atlas-moss)"} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <SectionLabel>Supplier regions</SectionLabel>
        <ul className="mt-2 grid grid-cols-2 gap-x-5">
          {regions.map(([continent, count], i) => (
            <li key={continent} className="rise" style={stagger(i, 300)}>
              <button
                type="button"
                onClick={() => flyTo({ ...CONTINENT_VIEW[continent], altitude: 1.9 })}
                className="press press-soft group relative flex w-full items-baseline justify-between gap-2 border-b border-line py-2 text-left text-[13px] text-beige hover:text-cream"
              >
                {/* Underline that draws across on hover. */}
                <span
                  aria-hidden
                  className="absolute -bottom-px left-0 h-px w-full origin-left scale-x-0 bg-cream/60 transition-transform duration-500 ease-atlas group-hover:scale-x-100"
                />
                <span className="truncate">{CONTINENT_LABEL[continent]}</span>
                <span className="tabular font-mono text-[11px] text-stone">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function MapLegend() {
  const colors = useMapPalette();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10.5px] text-stone">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-cream" aria-hidden /> Supplier
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-1.5 w-8 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${rgb(colors.densityLow)}, ${rgb(colors.densityHigh)})`,
          }}
        />
        Supplier density
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-sm bg-cream" aria-hidden /> Selected
      </span>
    </div>
  );
}

/** Splits a phrase into words that come into focus one after another. */
function Words({ text, start }: { text: string; start: number }) {
  return text.split(" ").map((word, i, all) => (
    <span key={i}>
      <span className="focus-in" style={stagger(start + i, 150)}>
        {word}
      </span>
      {i < all.length - 1 && " "}
    </span>
  ));
}

/** IntroPanel — left-hand introduction and headline metrics. Read-only by design. */
export function IntroPanel() {
  const { lookups } = useAtlas();
  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5">
        <p className="eyebrow rise" style={stagger(0, 150)}>
          Global mineral market
        </p>
        <h2 className="mt-2 font-serif text-[38px] leading-[0.95] text-cream">
          <Words text="Where the world’s" start={1} />
          <br />
          <em className="text-beige">
            <Words text="minerals" start={4} />
          </em>{" "}
          <Words text="come from" start={5} />
        </h2>
        <p className="rise mt-3 text-xs leading-relaxed text-stone" style={stagger(8, 150)}>
          Select a country on the globe, or search on the right, to see suppliers, what they offer and at what price.
        </p>
      </div>
      <div className="rise px-5 py-5" style={stagger(9, 150)}>
        <OverviewStats />
      </div>
      <div className="rise space-y-2 border-t border-line px-5 py-3" style={stagger(10, 150)}>
        <MapLegend />
        <p className="font-mono text-[10px] tracking-wide text-dim">
          Supplier quotes — not live market pricing · Updated {formatMonth(lookups.index.stats.lastUpdated)}
        </p>
      </div>
    </div>
  );
}

/** ExplorePanel — right-hand browsing controls shown before a country is chosen. */
export function ExplorePanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5">
        <p className="eyebrow rise" style={stagger(0, 100)}>
          Explore
        </p>
        <h2 className="mt-1.5 font-serif text-[28px] leading-none text-cream">
          <Words text="Browse the market" start={1} />
        </h2>
      </div>
      <div className="scroll-quiet mt-5 flex-1 space-y-7 overflow-y-auto px-5 pb-5">
        <OverviewInsights />
      </div>
    </div>
  );
}
