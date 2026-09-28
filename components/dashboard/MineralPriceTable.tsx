"use client";

import { useAtlas } from "@/components/atlas/AtlasProvider";
import { formatAmount, formatDate, formatQuantity, UNIT_LABEL } from "@/lib/atlas/format";
import { cn } from "@/lib/utils";
import type { PriceQuote } from "@/types/pricing";
import { AvailabilityBadge, CategoryDot } from "./primitives";

export interface PriceRow {
  mineralId: string;
  quote: PriceQuote | null;
  highlighted?: boolean;
}

/**
 * MineralPriceTable — structured quotes exactly as listed: original currency,
 * original unit, minimum order, availability and update date.
 */
export function MineralPriceTable({ rows, caption }: { rows: PriceRow[]; caption: string }) {
  const { lookups } = useAtlas();

  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-line">
          <th scope="col" className="eyebrow pb-2 font-medium">Mineral</th>
          <th scope="col" className="eyebrow pb-2 text-right font-medium">Price</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ mineralId, quote, highlighted }) => {
          const mineral = lookups.mineralById.get(mineralId);
          if (!mineral) return null;
          return (
            <tr
              key={quote?.id ?? mineralId}
              className={cn("border-b border-line align-top", highlighted && "bg-cream/[0.035]")}
            >
              <th scope="row" className="py-3 pr-3 font-normal">
                <span className="flex items-center gap-2 text-[13px] text-cream">
                  <CategoryDot category={mineral.category} />
                  {mineral.name}
                </span>
                {quote && (
                  <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-3.5 text-[11px] text-dim">
                    {quote.minimumOrderQuantity !== null && (
                      <span>MOQ {formatQuantity(quote.minimumOrderQuantity, quote.unit)}</span>
                    )}
                    {quote.loadingPort && <span>Loads at {quote.loadingPort}</span>}
                    <span>Updated {formatDate(quote.lastUpdated)}</span>
                  </span>
                )}
              </th>
              <td className="py-3 text-right">
                {quote ? (
                  <>
                    <span className="tabular block font-mono text-[13px] whitespace-nowrap text-cream">
                      <span className="mr-1 text-[10px] text-stone">{quote.currency}</span>
                      {formatAmount(quote.price, quote.currency)}
                    </span>
                    <span className="block text-[11px] text-stone">
                      per {UNIT_LABEL[quote.unit].long}
                      {quote.incoterm && <span className="ml-1 font-mono text-[10px] text-beige">{quote.incoterm}</span>}
                    </span>
                    {quote.priceNote && (
                      <span className="block max-w-44 text-[10.5px] leading-snug text-ochre">{quote.priceNote}</span>
                    )}
                    <AvailabilityBadge availability={quote.availability} className="mt-1 justify-end" />
                  </>
                ) : (
                  <span className="text-[11px] text-dim">No price quoted</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
