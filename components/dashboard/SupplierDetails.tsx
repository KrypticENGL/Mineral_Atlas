"use client";

import { ArrowLeft, AtSign, ExternalLink, Globe, MapPin, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAtlas } from "@/components/atlas/AtlasProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_LABEL,
  formatCoordinates,
  formatCount,
  formatDate,
  formatPrice,
  formatQuantity,
  pluralize,
  ROLE_LABEL,
} from "@/lib/atlas/format";
import { offerMatches } from "@/lib/atlas/insights";
import { useAtlasStore } from "@/lib/store/atlas-store";
import type { SupplierOffer, SupplierProfile } from "@/types/supplier";
import { MineralPriceTable } from "./MineralPriceTable";
import {
  stagger,
  AvailabilityBadge,
  CategoryTag,
  IconButton,
  RiskBadge,
  SectionLabel,
  Skeleton,
  VerifiedBadge,
} from "./primitives";

type Tab = "overview" | "minerals" | "pricing" | "company";

function supplyLabel(offer: SupplierOffer): string {
  const cap = offer.monthlyCapacity;
  const unit = cap?.unit ?? offer.price?.unit;
  if (cap && unit && (cap.min !== null || cap.max !== null)) {
    const range =
      cap.min !== null && cap.max !== null
        ? `${formatCount(cap.min)}–${formatQuantity(cap.max, unit)}`
        : formatQuantity((cap.max ?? cap.min)!, unit);
    return `${range} per month`;
  }
  if (offer.availableQuantity !== null && offer.price) {
    return `${formatQuantity(offer.availableQuantity, offer.price.unit)} available`;
  }
  return "Quantity on request";
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-2.5">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-[13px] text-cream">{children}</dd>
    </div>
  );
}

function PriceHistory({ supplierId }: { supplierId: string }) {
  const resource = useAtlasStore((s) => s.suppliers[supplierId]);
  const loadSupplier = useAtlasStore((s) => s.loadSupplier);
  const { lookups } = useAtlas();

  useEffect(() => {
    void loadSupplier(supplierId);
  }, [supplierId, loadSupplier]);

  if (!resource || resource.status === "loading") {
    return (
      <div className="space-y-2" aria-busy>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }
  if (resource.status === "error") return <p className="text-xs text-rust">{resource.message}</p>;

  const superseded = resource.data.priceHistory.filter((q) => q.validUntil !== null);
  if (superseded.length === 0) {
    return <p className="text-xs text-dim">No earlier quotes on record — every listed price is the first quote.</p>;
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {superseded.map((q) => (
        <li key={q.id} className="flex items-baseline justify-between gap-3 py-2.5 text-xs">
          <span className="min-w-0">
            <span className="block text-cream">{lookups.mineralById.get(q.mineralId)?.name}</span>
            <span className="text-dim">
              {formatDate(q.validFrom)} → {formatDate(q.validUntil)}
            </span>
          </span>
          <span className="tabular shrink-0 font-mono text-stone line-through decoration-dim">
            {formatPrice(q.price, q.currency, q.unit)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * SupplierDetails — full profile with Overview / Minerals / Pricing / Company tabs.
 * Built from the already-loaded country payload; only price history is fetched lazily.
 */
export function SupplierDetails({ supplier, countryName }: { supplier: SupplierProfile; countryName: string }) {
  const { lookups } = useAtlas();
  const filters = useAtlasStore((s) => s.filters);
  const closeSupplier = useAtlasStore((s) => s.closeSupplier);
  const clearSelection = useAtlasStore((s) => s.clearSelection);
  const [tab, setTab] = useState<Tab>("overview");

  const priced = supplier.offers.filter((o) => o.price);
  const available = priced.filter((o) => o.price!.availability === "AVAILABLE").length;
  const website = supplier.website?.replace(/^https?:\/\//, "");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={closeSupplier}
          className="press group inline-flex items-center gap-1.5 text-xs text-stone hover:text-cream"
        >
          <ArrowLeft className="size-3.5 transition-transform duration-300 ease-atlas group-hover:-translate-x-0.5" aria-hidden />{" "}
          {countryName}
        </button>
        <IconButton label="Close panel" onClick={clearSelection}>
          <X className="size-4" />
        </IconButton>
      </div>

      <header className="px-5 pt-3">
        <p className="eyebrow rise" style={stagger(0, 100)}>
          {ROLE_LABEL[supplier.role]} · {supplier.city}
        </p>
        <h2 className="mt-1.5 font-serif text-[34px] leading-[1.02] text-cream">
          <span className="focus-in" style={stagger(1, 100)}>
            {supplier.name}
          </span>
        </h2>
        <div className="rise mt-2 flex flex-wrap items-center gap-x-4 gap-y-1" style={stagger(2, 100)}>
          <VerifiedBadge verified={supplier.verified} />
          <RiskBadge risk={supplier.riskLevel} />
          <span className="inline-flex items-center gap-1 text-[11px] text-stone">
            <MapPin className="size-3" aria-hidden />
            {[supplier.region, countryName].filter(Boolean).join(", ")}
          </span>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="rise mt-4 min-h-0 flex-1 gap-0" style={stagger(3, 100)}>
        <TabsList variant="line" className="h-9 w-full justify-start gap-0 border-b border-line px-5">
          {(["overview", "minerals", "pricing", "company"] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="flex-none rounded-none px-0 pr-5 font-mono text-[10.5px] tracking-[0.14em] text-dim uppercase transition-colors hover:text-stone data-active:text-cream after:origin-left after:scale-x-0 after:bg-cream after:transition-[opacity,transform] after:duration-500 after:ease-atlas data-active:after:scale-x-100"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-6">
          <TabsContent value="overview" className="rise space-y-5">
            <p className="text-[13px] leading-relaxed text-beige">{supplier.description}</p>
            {supplier.assessment && (
              <div className="border-l-2 border-line-strong pl-3">
                <p className="eyebrow flex items-center gap-2">
                  Assessment <RiskBadge risk={supplier.riskLevel} />
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-stone">{supplier.assessment}</p>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-5">
              <Fact label="Role">{ROLE_LABEL[supplier.role]}</Fact>
              <Fact label="Risk">
                <RiskBadge risk={supplier.riskLevel} />
              </Fact>
              <Fact label={supplier.role === "BUYER" ? "Wants" : "Minerals"}>{pluralize(supplier.offers.length, "mineral")}</Fact>
              <Fact label="Available now">{pluralize(available, "listing")}</Fact>
              <Fact label="City">{supplier.city}</Fact>
              <Fact label="Region">{supplier.region ?? "—"}</Fact>
              <Fact label="Coordinates">
                <span className="font-mono text-xs">{formatCoordinates(supplier.lat, supplier.lng)}</span>
              </Fact>
              <Fact label="Status">
                <VerifiedBadge verified={supplier.verified} />
              </Fact>
            </dl>
            <div>
              <SectionLabel>{supplier.role === "BUYER" ? "Requirements" : "Current quotes"}</SectionLabel>
              <div className="mt-2">
                <MineralPriceTable
                  caption={`Current prices from ${supplier.name}`}
                  rows={supplier.offers.map((o) => ({
                    mineralId: o.mineralId,
                    quote: o.price,
                    highlighted: filters.mineralId === o.mineralId,
                  }))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="minerals" className="rise">
            <ul className="divide-y divide-line border-y border-line">
              {supplier.offers.map((offer) => {
                const mineral = lookups.mineralById.get(offer.mineralId);
                if (!mineral) return null;
                return (
                  <li key={offer.mineralId} className="py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-serif text-xl leading-tight text-cream">{mineral.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-stone">
                          {mineral.chemicalFormula ?? CATEGORY_LABEL[mineral.category]}
                        </p>
                        {offer.productName && <p className="mt-1.5 text-[12px] text-beige">{offer.productName}</p>}
                      </div>
                      <CategoryTag category={mineral.category} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      {offer.price ? (
                        <AvailabilityBadge availability={offer.price.availability} />
                      ) : (
                        <span className="text-dim">No pricing available</span>
                      )}
                      <span className="text-stone">{supplyLabel(offer)}</span>
                    </div>
                    {offer.specifications && (
                      <details className="group mt-3 border-t border-dashed border-line pt-2.5">
                        <summary className="eyebrow cursor-pointer list-none hover:text-cream">
                          Specifications <span className="text-dim group-open:hidden">+</span>
                        </summary>
                        <pre className="scroll-quiet mt-2 overflow-x-auto font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap break-words text-stone">
                          {offer.specifications}
                        </pre>
                      </details>
                    )}
                    {!offerMatches(offer, filters, lookups) && (
                      <p className="mt-1.5 text-[10.5px] text-dim">Outside current filters</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </TabsContent>

          <TabsContent value="pricing" className="rise space-y-6">
            <MineralPriceTable
              caption={`Current prices from ${supplier.name}`}
              rows={supplier.offers.map((o) => ({
                mineralId: o.mineralId,
                quote: o.price,
                highlighted: filters.mineralId === o.mineralId,
              }))}
            />
            {supplier.offers.some((o) => o.price?.paymentTerms) && (
              <div>
                <SectionLabel>Payment terms</SectionLabel>
                <ul className="mt-2 space-y-2">
                  {supplier.offers
                    .filter((o) => o.price?.paymentTerms)
                    .map((o) => (
                      <li key={o.mineralId} className="text-[12px] leading-relaxed text-beige">
                        {supplier.offers.length > 1 && (
                          <span className="mr-1.5 text-dim">{lookups.mineralById.get(o.mineralId)?.name}:</span>
                        )}
                        {o.price!.paymentTerms}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-dim">
              Prices are shown exactly as the supplier quoted them — original currency, unit and incoterm, no
              conversion. Not live market pricing.
            </p>
            <div>
              <SectionLabel>Superseded quotes</SectionLabel>
              <div className="mt-3">{tab === "pricing" && <PriceHistory supplierId={supplier.id} />}</div>
            </div>
          </TabsContent>

          <TabsContent value="company" className="rise">
            <dl>
              <Fact label="Website">
                {supplier.website ? (
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 underline decoration-line-strong underline-offset-4 hover:decoration-cream"
                  >
                    <Globe className="size-3.5 text-dim" aria-hidden />
                    {website}
                    <ExternalLink className="size-3 text-dim" aria-hidden />
                  </a>
                ) : (
                  "—"
                )}
              </Fact>
              <Fact label="Email">
                {supplier.email ? (
                  <a href={`mailto:${supplier.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <AtSign className="size-3.5 text-dim" aria-hidden />
                    {supplier.email}
                  </a>
                ) : (
                  "—"
                )}
              </Fact>
              <Fact label="Contact">{supplier.contactName ?? "—"}</Fact>
              <Fact label="Address">{supplier.address ?? "—"}</Fact>
              <Fact label="Phone">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                  <Phone className="size-3.5 text-dim" aria-hidden />
                  {supplier.phone ?? "—"}
                </span>
              </Fact>
              <Fact label="Listed since">{formatDate(supplier.createdAt)}</Fact>
              <Fact label="Profile updated">{formatDate(supplier.updatedAt)}</Fact>
              <Fact label="Data source">
                <span className={supplier.verified ? undefined : "text-ochre"}>
                  {supplier.source ?? "Offer received from the supplier"}
                  {supplier.verified ? "" : " — not independently verified"}
                </span>
              </Fact>
            </dl>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
