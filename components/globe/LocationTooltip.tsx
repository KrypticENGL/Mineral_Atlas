"use client";

import type { Ref } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { CONTINENT_LABEL, pluralize } from "@/lib/atlas/format";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { useSelectedStates, useStateSupplierCounts } from "./CountryLayer";

/**
 * Single hover tooltip for the map. Its position is written directly to the DOM
 * by the parent's pointer handler; only the hovered country re-renders it.
 */
export function LocationTooltip({ ref }: { ref?: Ref<HTMLDivElement> }) {
  const { lookups } = useAtlas();
  const { result, activeFilters } = useFiltered();
  const hovered = useAtlasStore((s) => s.hovered);
  const selected = useAtlasStore((s) => s.selectedCountry);

  const country = hovered?.code ? lookups.countryByCode.get(hovered.code) : undefined;
  const agg = country ? result.byCountry.get(country.id) : undefined;
  const listed = country ? lookups.suppliersByCountry.has(country.id) : false;
  const states = useSelectedStates(selected);
  const stateCounts = useStateSupplierCounts(states);
  const region = hovered?.region;
  const visible = hovered !== null && (region !== undefined || hovered.code !== selected);

  const topMinerals = (agg?.mineralIds ?? [])
    .slice(0, 3)
    .map((id) => lookups.mineralById.get(id)?.name)
    .filter(Boolean);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-20 will-change-transform [@media(hover:none)]:hidden"
    >
      <div
        className="atlas-panel min-w-44 origin-top-left rounded-xl px-3 py-2.5 transition-[opacity,transform] duration-300 ease-atlas"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "scale(0.94) translateY(4px)" }}
      >
        {hovered && region !== undefined && (
          <>
            <p className="eyebrow">{hovered.name}</p>
            <p className="mt-0.5 font-serif text-xl leading-tight text-cream">{region}</p>
            {stateCounts.get(hovered.iso) ? (
              <p className="mt-1.5 font-mono text-[11px] text-lichen">
                {pluralize(stateCounts.get(hovered.iso)!, "supplier")} here
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-dim">No suppliers in this region</p>
            )}
          </>
        )}
        {hovered && region === undefined && (
          <>
            <p className="eyebrow">{country ? CONTINENT_LABEL[country.continent] : "Not in atlas"}</p>
            <p className="mt-0.5 font-serif text-xl leading-tight text-cream">{hovered.name}</p>
            {agg ? (
              <>
                <p className="mt-1.5 font-mono text-[11px] text-lichen">
                  {pluralize(agg.supplierCount, "supplier")} · {pluralize(agg.mineralIds.length, "mineral")}
                </p>
                {topMinerals.length > 0 && <p className="mt-0.5 text-xs text-stone">{topMinerals.join(" · ")}</p>}
                <p className="mt-2 text-[10px] tracking-wide text-dim">Click to explore</p>
              </>
            ) : (
              <p className="mt-1.5 text-xs text-dim">
                {listed && activeFilters > 0 ? "No suppliers match the current filters" : "No suppliers listed yet"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
