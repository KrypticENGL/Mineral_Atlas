"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { formatPrice, pluralize } from "@/lib/atlas/format";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { CategoryTag, IconButton, Skeleton } from "./primitives";

/** Context card for the mineral currently used as a filter. */
export function MineralFocus({ mineralId }: { mineralId: string }) {
  const { lookups } = useAtlas();
  const { result } = useFiltered();
  const mineral = lookups.mineralById.get(mineralId);
  const resource = useAtlasStore((s) => (mineral ? s.minerals[mineral.slug] : undefined));
  const loadMineral = useAtlasStore((s) => s.loadMineral);
  const setFilter = useAtlasStore((s) => s.setFilter);

  useEffect(() => {
    if (mineral) void loadMineral(mineral.slug);
  }, [mineral, loadMineral]);

  if (!mineral) return null;
  const detail = resource?.status === "ready" ? resource.data : null;

  return (
    <section className="rise rounded-xl border border-line-strong bg-cream/[0.03] p-4" aria-label={`${mineral.name} focus`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CategoryTag category={mineral.category} />
          <h3 className="mt-1 font-serif text-[28px] leading-none text-cream">{mineral.name}</h3>
          {mineral.chemicalFormula && <p className="mt-1 font-mono text-[11px] text-stone">{mineral.chemicalFormula}</p>}
        </div>
        <IconButton label={`Clear ${mineral.name} filter`} onClick={() => setFilter("mineralId", null)} className="-mr-1.5 -mt-1">
          <X className="size-3.5" />
        </IconButton>
      </div>

      {resource?.status === "error" ? (
        <p className="mt-3 text-xs text-rust">{resource.message}</p>
      ) : detail ? (
        <>
          <p className="rise mt-3 text-xs leading-relaxed text-beige">{detail.description}</p>
          <p className="mt-2 text-[11px] text-stone">
            <span className="text-dim">Uses · </span>
            {detail.uses.join(", ")}
          </p>
          {detail.priceStats.length > 0 && (
            <div className="mt-3 border-t border-line pt-2.5">
              <p className="eyebrow mb-1.5">Quoted ranges · original currency</p>
              <ul className="space-y-1">
                {detail.priceStats.slice(0, 3).map((g) => (
                  <li key={`${g.currency}${g.unit}`} className="flex justify-between gap-3 font-mono text-[11px]">
                    <span className="truncate text-cream">
                      {g.min === g.max
                        ? formatPrice(g.min, g.currency, g.unit)
                        : `${formatPrice(g.min, g.currency)} – ${formatPrice(g.max, g.currency, g.unit).replace(`${g.currency} `, "")}`}
                    </span>
                    <span className="shrink-0 text-dim">{pluralize(g.quotes, "quote")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      )}
      <p className="mt-3 font-mono text-[11px] text-lichen">
        {pluralize(result.totals.suppliers, "supplier")} in {pluralize(result.totals.countries, "country", "countries")}
      </p>
    </section>
  );
}
