"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import { applyFilters, countActiveFilters, DEFAULT_FILTERS, type FilterResult } from "@/lib/atlas/filters";
import { buildAtlasLookups, type AtlasLookups } from "@/lib/atlas/lookups";
import { useAtlasStore } from "@/lib/store/atlas-store";
import type { AtlasIndex } from "@/types/atlas";

interface AtlasStatic {
  lookups: AtlasLookups;
  /** Aggregates for the unfiltered catalogue. */
  base: FilterResult;
}

interface AtlasFiltered {
  result: FilterResult;
  activeFilters: number;
}

const StaticContext = createContext<AtlasStatic | null>(null);
const FilteredContext = createContext<AtlasFiltered | null>(null);

/**
 * Holds the immutable atlas index plus the single, shared filter computation.
 * Filtering runs once per filter change here — never per consumer.
 */
export function AtlasProvider({ index, children }: { index: AtlasIndex; children: ReactNode }) {
  const staticValue = useMemo<AtlasStatic>(() => {
    const lookups = buildAtlasLookups(index);
    return { lookups, base: applyFilters(lookups, DEFAULT_FILTERS) };
  }, [index]);

  const filters = useAtlasStore((s) => s.filters);
  const filtered = useMemo<AtlasFiltered>(() => {
    const activeFilters = countActiveFilters(filters);
    return {
      activeFilters,
      result: activeFilters === 0 ? staticValue.base : applyFilters(staticValue.lookups, filters),
    };
  }, [filters, staticValue]);

  return (
    <StaticContext value={staticValue}>
      <FilteredContext value={filtered}>{children}</FilteredContext>
    </StaticContext>
  );
}

export function useAtlas(): AtlasStatic {
  const value = use(StaticContext);
  if (!value) throw new Error("useAtlas must be used inside <AtlasProvider>");
  return value;
}

export function useFiltered(): AtlasFiltered {
  const value = use(FilteredContext);
  if (!value) throw new Error("useFiltered must be used inside <AtlasProvider>");
  return value;
}
