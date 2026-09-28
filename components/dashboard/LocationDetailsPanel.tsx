"use client";

import { AnimatePresence, motion } from "motion/react";
import { DatabaseZap, MapPinOff, RotateCcw, SearchX, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import {
  CONTINENT_LABEL,
  formatAmount,
  formatCoordinates,
  formatDate,
  formatPrice,
  pluralize,
  UNIT_LABEL,
} from "@/lib/atlas/format";
import { countryMinerals, type CountryMineralRow } from "@/lib/atlas/insights";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { cn } from "@/lib/utils";
import type { CountryDetail, CountrySummary } from "@/types/country";
import { CategoryDot, CountUp, EmptyState, IconButton, SectionLabel, Skeleton, Stat, stagger, TextButton } from "./primitives";
import { SupplierCard } from "./SupplierCard";
import { SupplierDetails } from "./SupplierDetails";

const PAGE_SIZE = 8;
const ease = [0.22, 1, 0.36, 1] as const;

function priceRangeLabel(row: CountryMineralRow): string | null {
  const group = row.priceGroups[0];
  if (!group) return null;
  if (group.min === group.max) return formatPrice(group.min, group.currency, group.unit);
  return `${group.currency} ${formatAmount(group.min, group.currency)}–${formatAmount(group.max, group.currency)} / ${UNIT_LABEL[group.unit].short}`;
}

function MineralRows({ rows }: { rows: CountryMineralRow[] }) {
  const mineralId = useAtlasStore((s) => s.filters.mineralId);
  const setFilter = useAtlasStore((s) => s.setFilter);
  return (
    <ul className="mt-1">
      {rows.map((row, i) => {
        const active = mineralId === row.mineral.id;
        const range = priceRangeLabel(row);
        const others = row.priceGroups.length - 1;
        return (
          <li key={row.mineral.id} className="rise" style={stagger(Math.min(i, 10), 80)}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => setFilter("mineralId", active ? null : row.mineral.id)}
              title={active ? "Clear mineral filter" : `Show only ${row.mineral.name} suppliers`}
              className={cn(
                "press press-soft group grid w-full grid-cols-[1fr_auto] items-baseline gap-x-3 border-b border-line py-2 text-left",
                active ? "bg-cream text-ink" : "hover:bg-cream/[0.03]",
              )}
            >
              <span
                className={cn(
                  "flex min-w-0 items-center gap-2 pl-1 text-[13px] transition-transform duration-300 ease-atlas group-hover:translate-x-1",
                  active ? "text-ink" : "text-cream",
                )}
              >
                <CategoryDot category={row.mineral.category} />
                <span className="truncate">{row.mineral.name}</span>
                <span className={cn("font-mono text-[10px]", active ? "text-umber" : "text-dim")}>×{row.suppliers}</span>
              </span>
              <span className={cn("tabular pr-1 text-right font-mono text-[11px]", active ? "text-umber" : "text-stone")}>
                {range ?? (row.quoted > 0 ? "Currently unavailable" : "No pricing available")}
                {others > 0 && <span className={active ? "text-umber" : "text-dim"}> +{others}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SupplierListSkeleton() {
  return (
    <div className="space-y-5 pt-3" aria-busy aria-label="Loading suppliers">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2 border-t border-line pt-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function CountryHeader({ country }: { country: CountrySummary }) {
  const clearSelection = useAtlasStore((s) => s.clearSelection);
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <p className="eyebrow rise" style={stagger(0, 120)}>
          {CONTINENT_LABEL[country.continent]} · {country.code}
        </p>
        <h2 className="mt-1.5 font-serif text-[46px] leading-[0.95] text-cream">
          <span className="focus-in" style={stagger(1, 120)}>
            {country.name}
          </span>
        </h2>
        <p className="rise tabular mt-2 font-mono text-[11px] text-dim" style={stagger(2, 120)}>
          {formatCoordinates(country.lat, country.lng)}
        </p>
      </div>
      <IconButton label="Close country panel" onClick={clearSelection} className="-mr-1.5">
        <X className="size-4" />
      </IconButton>
    </header>
  );
}

function CountryBody({ country, detail }: { country: CountrySummary; detail: CountryDetail | null }) {
  const { lookups, base } = useAtlas();
  const { result, activeFilters } = useFiltered();
  const filters = useAtlasStore((s) => s.filters);
  const resetFilters = useAtlasStore((s) => s.resetFilters);
  const openSupplier = useAtlasStore((s) => s.openSupplier);
  const resource = useAtlasStore((s) => s.countries[country.code]);
  const loadCountry = useAtlasStore((s) => s.loadCountry);
  const [pageState, setPageState] = useState({ key: "", count: PAGE_SIZE });

  // Instant stats from the globe index; details stream in underneath.
  const agg = result.byCountry.get(country.id);
  const baseAgg = base.byCountry.get(country.id);
  const filtered = activeFilters > 0;

  const minerals = useMemo(() => (detail ? countryMinerals(detail.suppliers, lookups) : []), [detail, lookups]);
  const suppliers = useMemo(
    () => (detail ? detail.suppliers.filter((s) => result.supplierIds.has(s.id)) : []),
    [detail, result],
  );
  const currencies = useMemo(() => {
    const set = new Set<string>();
    for (const s of detail?.suppliers ?? []) for (const o of s.offers) if (o.price) set.add(o.price.currency);
    return [...set].sort();
  }, [detail]);

  // Reset pagination whenever the country or filters change.
  const pageKey = `${country.code}:${result.totals.suppliers}:${activeFilters}`;
  const visibleCount = pageState.key === pageKey ? pageState.count : PAGE_SIZE;

  const onOpen = useCallback((id: string) => openSupplier(id, country.code), [openSupplier, country.code]);

  return (
    <div className="scroll-quiet min-h-0 flex-1 space-y-7 overflow-y-auto px-5 pt-5 pb-6">
      <div className="rise grid grid-cols-3 gap-4 border-y border-line py-4" style={stagger(3, 120)}>
        <Stat
          label="Suppliers"
          value={<CountUp value={agg?.supplierCount ?? 0} />}
          sub={filtered ? `of ${baseAgg?.supplierCount ?? 0}` : undefined}
        />
        <Stat
          label="Minerals"
          value={<CountUp value={agg?.mineralIds.length ?? 0} />}
          sub={filtered ? `of ${baseAgg?.mineralIds.length ?? 0}` : undefined}
        />
        <Stat
          label="Listings"
          value={<CountUp value={agg?.listingCount ?? 0} />}
          sub={filtered ? `of ${baseAgg?.listingCount ?? 0}` : "active"}
        />
      </div>

      {resource?.status === "error" ? (
        <EmptyState
          icon={resource.notFound ? <MapPinOff className="size-5" /> : <DatabaseZap className="size-5" />}
          title={resource.notFound ? "Country not found" : "Couldn’t load suppliers"}
          action={
            !resource.notFound && (
              <TextButton onClick={() => void loadCountry(country.code)}>
                <RotateCcw className="size-3" aria-hidden /> Try again
              </TextButton>
            )
          }
        >
          {resource.message}
        </EmptyState>
      ) : !detail ? (
        <>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
          <SupplierListSkeleton />
        </>
      ) : (
        <>
          <dl className="rise grid grid-cols-2 gap-x-5 text-[12px]">
            <div>
              <dt className="eyebrow">Last price update</dt>
              <dd className="mt-1 text-cream">{formatDate(detail.lastUpdated)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Quote currencies</dt>
              <dd className="mt-1 font-mono text-cream">{currencies.join(" · ") || "—"}</dd>
            </div>
          </dl>

          <section className="rise" style={stagger(1)}>
            <SectionLabel>Available minerals</SectionLabel>
            {minerals.length ? (
              <MineralRows rows={minerals} />
            ) : (
              <p className="mt-3 text-xs text-dim">No pricing available for this country yet.</p>
            )}
          </section>

          <section>
            <SectionLabel
              action={
                <span className="tabular font-mono text-[10px] text-dim">
                  {filtered ? `${suppliers.length} of ${detail.suppliers.length}` : suppliers.length}
                </span>
              }
            >
              Suppliers in {country.name}
            </SectionLabel>

            {suppliers.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<SearchX className="size-5" />}
                  title="No suppliers found"
                  action={
                    <TextButton onClick={resetFilters}>
                      <RotateCcw className="size-3" aria-hidden /> Reset filters
                    </TextButton>
                  }
                >
                  None of the {pluralize(detail.suppliers.length, "supplier")} in {country.name} match the current
                  filters.
                </EmptyState>
              </div>
            ) : (
              <motion.ul
                className="mt-2"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.045 } } }}
              >
                {suppliers.slice(0, visibleCount).map((s) => (
                  <motion.li
                    key={s.id}
                    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.45, ease }}
                  >
                    <SupplierCard supplier={s} filters={filters} onOpen={onOpen} />
                  </motion.li>
                ))}
              </motion.ul>
            )}
            {suppliers.length > visibleCount && (
              <button
                type="button"
                onClick={() => setPageState({ key: pageKey, count: visibleCount + PAGE_SIZE })}
                className="press mt-1 w-full rounded-full border border-line py-2.5 text-xs text-stone hover:border-line-strong hover:bg-cream/[0.03] hover:text-cream"
              >
                Show {Math.min(PAGE_SIZE, suppliers.length - visibleCount)} more of {suppliers.length - visibleCount}
              </button>
            )}
          </section>

          <p className="font-mono text-[10px] leading-relaxed text-dim">
            Prices as quoted by suppliers, in original currency and unit — not live market pricing.
          </p>
        </>
      )}
    </div>
  );
}

/** Country → supplier drill-down content; shared by the desktop panel and mobile sheet. */
export function LocationDetails() {
  const { lookups } = useAtlas();
  const code = useAtlasStore((s) => s.selectedCountry);
  const supplierId = useAtlasStore((s) => s.selectedSupplierId);
  const resource = useAtlasStore((s) => (code ? s.countries[code] : undefined));

  const country = code ? lookups.countryByCode.get(code) : undefined;
  const detail = resource?.status === "ready" ? resource.data : null;
  const supplier = supplierId ? detail?.suppliers.find((s) => s.id === supplierId) : undefined;

  if (!code) return null;
  if (!country) {
    return (
      <div className="p-5">
        <EmptyState icon={<MapPinOff className="size-5" />} title="Country not found">
          “{code}” isn’t part of the atlas.
        </EmptyState>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {supplierId ? (
        <motion.div
          key={`supplier:${supplierId}`}
          className="flex h-full flex-col"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.35, ease }}
        >
          {supplier ? (
            <SupplierDetails supplier={supplier} countryName={country.name} />
          ) : resource?.status === "ready" ? (
            <div className="p-5">
              <EmptyState icon={<SearchX className="size-5" />} title="Supplier not found">
                This supplier is no longer listed in {country.name}.
              </EmptyState>
            </div>
          ) : (
            <div className="space-y-3 p-5" aria-busy>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <SupplierListSkeleton />
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key={`country:${code}`}
          className="flex h-full flex-col"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.35, ease }}
        >
          <CountryHeader country={country} />
          <CountryBody country={country} detail={detail} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** LocationDetailsPanel — desktop right-hand panel for the selected location. */
export function LocationDetailsPanel() {
  const isOpen = useAtlasStore((s) => s.selectedCountry !== null);
  const isDesktop = useIsDesktop();

  return (
    <AnimatePresence>
      {isOpen && isDesktop && (
        <motion.aside
          aria-label="Location details"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.6, ease }}
          className="atlas-panel absolute top-[76px] right-6 bottom-[64px] z-20 w-[420px] overflow-hidden"
        >
          <LocationDetails />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
