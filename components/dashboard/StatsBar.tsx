"use client";

import { useEffect, useMemo, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { cameraReadout } from "@/lib/atlas/camera-readout";
import { CATEGORY_LABEL, formatCoordinates, formatMonth, pluralize } from "@/lib/atlas/format";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { cn } from "@/lib/utils";
import { MINERAL_CATEGORIES, type MineralCategory } from "@/types/mineral";
import { CategoryDot, TextButton } from "./primitives";

const READOUT_INTERVAL_MS = 120;

/**
 * Live camera coordinates, written straight to the DOM (no re-renders). The
 * globe emits every frame while rotating; text writes are throttled because
 * each one invalidates layout.
 */
function CameraReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let lastWrite = 0;
    let pending: number | undefined;
    let latest: { lat: number; lng: number; altitude: number } | null = null;
    const write = () => {
      pending = undefined;
      lastWrite = performance.now();
      const el = ref.current;
      if (!el || !latest) return;
      const text = `${formatCoordinates(latest.lat, latest.lng)} · ALT ${latest.altitude.toFixed(2)}`;
      if (el.textContent !== text) el.textContent = text;
    };
    const unsubscribe = cameraReadout.subscribe((pos) => {
      latest = pos;
      if (pending !== undefined) return;
      const wait = READOUT_INTERVAL_MS - (performance.now() - lastWrite);
      if (wait <= 0) write();
      else pending = window.setTimeout(write, wait);
    });
    return () => {
      unsubscribe();
      window.clearTimeout(pending);
    };
  }, []);
  return <span ref={ref} className="tabular" aria-hidden />;
}

/** StatsBar — category index, filter summary and data status along the bottom edge. */
export function StatsBar() {
  const { lookups } = useAtlas();
  const { result, activeFilters } = useFiltered();
  const category = useAtlasStore((s) => s.filters.category);
  const setFilter = useAtlasStore((s) => s.setFilter);
  const resetFilters = useAtlasStore((s) => s.resetFilters);

  // Suppliers offering at least one mineral of each category (unfiltered catalogue).
  const categoryCounts = useMemo(() => {
    const counts = new Map<MineralCategory, Set<string>>();
    for (const supplier of lookups.index.suppliers) {
      for (const mineralId of supplier.mineralIds) {
        const c = lookups.mineralById.get(mineralId)?.category;
        if (!c) continue;
        let set = counts.get(c);
        if (!set) counts.set(c, (set = new Set()));
        set.add(supplier.id);
      }
    }
    return counts;
  }, [lookups]);

  return (
    <footer className="lift-in pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden h-12 items-center gap-6 border-t border-line bg-ink/90 px-6 lg:flex"
      style={{ "--rise-delay": "250ms" } as React.CSSProperties}>
      <nav aria-label="Mineral categories" className="pointer-events-auto flex items-center gap-1">
        <span className="eyebrow mr-2">Categories</span>
        {MINERAL_CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter("category", active ? null : c)}
              className={cn(
                "press group relative inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-xs",
                active ? "text-ink" : "text-stone hover:bg-cream/[0.05] hover:text-cream",
              )}
            >
              {/* One pill that glides between categories. */}
              {active && (
                <motion.span
                  layoutId="category-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-cream"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <CategoryDot
                category={c}
                className="relative transition-transform duration-500 ease-atlas group-hover:rotate-[135deg]"
              />
              <span className="relative">{CATEGORY_LABEL[c]}</span>
              <span className={cn("tabular relative font-mono text-[10px]", active ? "text-umber" : "text-dim")}>
                {categoryCounts.get(c)?.size ?? 0}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-3" aria-live="polite">
        <AnimatePresence>
          {activeFilters > 0 && (
            <motion.span
              key="summary"
              className="flex min-w-0 items-center gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="truncate font-mono text-[11px] text-lichen">
                {pluralize(result.totals.suppliers, "supplier")} · {pluralize(result.totals.countries, "country", "countries")}
              </span>
              <TextButton onClick={resetFilters} className="group">
                <RotateCcw className="size-3 transition-transform duration-500 ease-atlas group-hover:-rotate-180" aria-hidden />{" "}
                Reset
              </TextButton>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex shrink-0 items-center gap-5 font-mono text-[10.5px] text-dim">
        <span className="hidden 2xl:inline">
          <CameraReadout />
        </span>
        <span className="flex items-center gap-1.5 text-ochre/90">
          <span className="size-1 rounded-full bg-ochre" aria-hidden />
          Supplier quotes — not live market pricing
        </span>
        <span className="hidden xl:inline">Updated {formatMonth(lookups.index.stats.lastUpdated)}</span>
      </div>
    </footer>
  );
}
