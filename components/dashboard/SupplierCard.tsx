"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
import { memo } from "react";
import { useAtlas } from "@/components/atlas/AtlasProvider";
import type { AtlasFilters } from "@/lib/atlas/filters";
import { formatPrice, ROLE_LABEL } from "@/lib/atlas/format";
import { headlineOffer, offerMatches } from "@/lib/atlas/insights";
import { cn } from "@/lib/utils";
import type { SupplierProfile } from "@/types/supplier";
import { AvailabilityBadge, RiskBadge, VerifiedBadge } from "./primitives";

interface SupplierCardProps {
  supplier: SupplierProfile;
  filters: AtlasFilters;
  onOpen: (supplierId: string) => void;
}

/** SupplierCard — one supplier in a country list, with its headline quote. */
export const SupplierCard = memo(function SupplierCard({ supplier, filters, onOpen }: SupplierCardProps) {
  const { lookups } = useAtlas();
  const headline = headlineOffer(supplier, filters, lookups);
  const headlineMineral = headline ? lookups.mineralById.get(headline.mineralId) : undefined;

  return (
    <button
      type="button"
      onClick={() => onOpen(supplier.id)}
      className="press press-soft group relative block w-full rounded-lg border-t border-line px-2 py-4 text-left hover:bg-cream/[0.03] focus-visible:bg-cream/[0.04]"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate font-serif text-[21px] leading-tight text-cream transition-transform duration-300 ease-atlas group-hover:translate-x-0.5">
              {supplier.name}
            </span>
            <VerifiedBadge verified={supplier.verified} compact />
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-stone">
            <MapPin className="size-3 shrink-0 text-dim" aria-hidden />
            <span className="truncate">
              {ROLE_LABEL[supplier.role]} · {[supplier.city, supplier.region].filter((v, i, a) => v && a.indexOf(v) === i).join(", ")}
            </span>
          </span>
          <RiskBadge risk={supplier.riskLevel} compact />
        </span>
        <ArrowUpRight
          className="mt-1 size-4 shrink-0 text-dim transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cream"
          aria-hidden
        />
      </span>

      <span className="mt-2.5 flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-[10px] tracking-[0.1em] uppercase">
        {supplier.offers.map((offer) => {
          const mineral = lookups.mineralById.get(offer.mineralId);
          return (
            <span
              key={offer.mineralId}
              className={cn(offerMatches(offer, filters, lookups) ? "text-beige" : "text-dim/70 line-through")}
            >
              {mineral?.name}
            </span>
          );
        })}
      </span>

      {headline?.price && headlineMineral && (
        <span className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-line pt-2.5">
          <span className="min-w-0">
            <span className="eyebrow block">{headlineMineral.name} · from</span>
            <span className="tabular mt-0.5 block font-mono text-sm text-cream">
              {formatPrice(headline.price.price, headline.price.currency, headline.price.unit)}
              {headline.price.incoterm && <span className="ml-1.5 text-[10px] text-stone">{headline.price.incoterm}</span>}
            </span>
          </span>
          <AvailabilityBadge availability={headline.price.availability} />
        </span>
      )}
      <span className="sr-only">View details</span>
    </button>
  );
});
