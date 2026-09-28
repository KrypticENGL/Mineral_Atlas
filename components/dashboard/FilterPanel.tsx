"use client";

import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { AVAILABILITY_LABEL, CATEGORY_LABEL, pluralize, ROLE_LABEL } from "@/lib/atlas/format";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { cn } from "@/lib/utils";
import { MINERAL_CATEGORIES } from "@/types/mineral";
import { AVAILABILITIES, CURRENCIES } from "@/types/pricing";
import { COUNTERPARTY_ROLES } from "@/types/supplier";
import { CategoryDot, IconButton, TextButton } from "./primitives";

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="eyebrow block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] leading-relaxed text-dim">{hint}</p>}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "press inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs",
        active
          ? "border-cream bg-cream text-ink"
          : "border-line text-stone hover:border-line-strong hover:text-cream",
      )}
    >
      {children}
    </button>
  );
}

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-line bg-ink-2 bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M1 1l4 4 4-4' stroke='%23aea49a' fill='none'/></svg>\")] bg-[position:right_12px_center] bg-no-repeat px-3 pr-8 text-sm text-cream outline-none transition-colors hover:border-line-strong focus:border-line-strong";
const inputClass =
  "h-9 w-full rounded-lg border border-line bg-ink-2 px-3 text-sm text-cream outline-none transition-colors placeholder:text-dim hover:border-line-strong focus:border-line-strong disabled:opacity-40";

/** The filter form itself — shared by the desktop popover and the mobile drawer. */
export function FilterControls() {
  const { lookups } = useAtlas();
  const filters = useAtlasStore((s) => s.filters);
  const setFilter = useAtlasStore((s) => s.setFilter);
  const selectCountry = useAtlasStore((s) => s.selectCountry);

  const mineralsByCategory = useMemo(
    () =>
      MINERAL_CATEGORIES.map((category) => ({
        category,
        minerals: lookups.index.minerals.filter(
          (m) => m.category === category && (!filters.category || filters.category === category),
        ),
      })).filter((g) => g.minerals.length > 0),
    [lookups, filters.category],
  );

  const countries = useMemo(
    () => lookups.index.countries.filter((c) => lookups.suppliersByCountry.has(c.id)),
    [lookups],
  );

  const toggleAvailability = (value: (typeof AVAILABILITIES)[number]) =>
    setFilter(
      "availability",
      filters.availability.includes(value)
        ? filters.availability.filter((a) => a !== value)
        : [...filters.availability, value],
    );

  const priceValue = (v: number | null) => (v === null ? "" : String(v));
  const parsePrice = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Math.max(0, Number(v)));

  return (
    <div className="rise-children space-y-6">
      <Field label="Mineral category">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filters.category === null} onClick={() => setFilter("category", null)}>
            All
          </Chip>
          {MINERAL_CATEGORIES.map((c) => (
            <Chip
              key={c}
              active={filters.category === c}
              onClick={() => {
                setFilter("category", filters.category === c ? null : c);
                const mineral = filters.mineralId ? lookups.mineralById.get(filters.mineralId) : null;
                if (mineral && mineral.category !== c) setFilter("mineralId", null);
              }}
            >
              <CategoryDot category={c} />
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Mineral" htmlFor="filter-mineral">
          <select
            id="filter-mineral"
            className={selectClass}
            value={filters.mineralId ?? ""}
            onChange={(e) => setFilter("mineralId", e.target.value || null)}
          >
            <option value="">Any mineral</option>
            {mineralsByCategory.map((g) => (
              <optgroup key={g.category} label={CATEGORY_LABEL[g.category]}>
                {g.minerals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Country" htmlFor="filter-country">
          <select
            id="filter-country"
            className={selectClass}
            value={filters.countryCode ?? ""}
            onChange={(e) => {
              const code = e.target.value || null;
              setFilter("countryCode", code);
              const country = code ? lookups.countryByCode.get(code) : null;
              if (country) selectCountry(country.code, { lat: country.lat, lng: country.lng });
            }}
          >
            <option value="">Any country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Counterparty type">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filters.role === null} onClick={() => setFilter("role", null)}>
            Any
          </Chip>
          {COUNTERPARTY_ROLES.map((r) => (
            <Chip key={r} active={filters.role === r} onClick={() => setFilter("role", filters.role === r ? null : r)}>
              {ROLE_LABEL[r]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Supplier" htmlFor="filter-supplier">
        <input
          id="filter-supplier"
          className={inputClass}
          placeholder="Name contains…"
          value={filters.supplierQuery}
          onChange={(e) => setFilter("supplierQuery", e.target.value)}
        />
      </Field>

      <Field
        label="Quote currency & price"
        hint={
          filters.currency
            ? `Bounds compare ${filters.currency} quotes as listed, across their own units. Pick a mineral for like-for-like ranges.`
            : "Prices are shown in their original currency and are never converted. Choose a currency to set a price range."
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filters.currency === null} onClick={() => setFilter("currency", null)}>
            Any
          </Chip>
          {CURRENCIES.map((c) => (
            <Chip key={c} active={filters.currency === c} onClick={() => setFilter("currency", filters.currency === c ? null : c)}>
              <span className="font-mono text-[11px]">{c}</span>
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <input
            aria-label="Minimum price"
            inputMode="decimal"
            className={inputClass}
            placeholder={filters.currency ? `Min ${filters.currency}` : "Min"}
            disabled={!filters.currency}
            value={priceValue(filters.priceMin)}
            onChange={(e) => setFilter("priceMin", parsePrice(e.target.value))}
          />
          <input
            aria-label="Maximum price"
            inputMode="decimal"
            className={inputClass}
            placeholder={filters.currency ? `Max ${filters.currency}` : "Max"}
            disabled={!filters.currency}
            value={priceValue(filters.priceMax)}
            onChange={(e) => setFilter("priceMax", parsePrice(e.target.value))}
          />
        </div>
      </Field>

      <Field label="Availability">
        <div className="flex flex-wrap gap-1.5">
          {AVAILABILITIES.map((a) => (
            <Chip key={a} active={filters.availability.includes(a)} onClick={() => toggleAvailability(a)}>
              {AVAILABILITY_LABEL[a]}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
        <label htmlFor="filter-risky" className="text-sm text-cream">
          Hide high-risk leads
          <span className="block text-[11px] text-dim">Excludes counterparties rated high risk or likely scam</span>
        </label>
        <Switch
          id="filter-risky"
          checked={filters.hideRisky}
          onCheckedChange={(checked) => setFilter("hideRisky", checked)}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
        <label htmlFor="filter-verified" className="text-sm text-cream">
          Verified suppliers only
          <span className="block text-[11px] text-dim">Checked by the Mineral Atlas team</span>
        </label>
        <Switch
          id="filter-verified"
          checked={filters.verifiedOnly}
          onCheckedChange={(checked) => setFilter("verifiedOnly", checked)}
        />
      </div>
    </div>
  );
}

function FilterFooter() {
  const { result, activeFilters } = useFiltered();
  const resetFilters = useAtlasStore((s) => s.resetFilters);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
      <p className="font-mono text-[11px] text-stone" aria-live="polite">
        {pluralize(result.totals.suppliers, "supplier")} · {pluralize(result.totals.countries, "country", "countries")}
      </p>
      <TextButton onClick={resetFilters} disabled={activeFilters === 0}>
        <RotateCcw className="size-3" aria-hidden />
        Reset
      </TextButton>
    </div>
  );
}

/**
 * FilterPanel — a non-modal popover on desktop (the globe keeps updating
 * behind it) and a bottom drawer on mobile.
 */
export function FilterPanel() {
  const open = useAtlasStore((s) => s.filtersOpen);
  const setOpen = useAtlasStore((s) => s.setFiltersOpen);
  const isDesktop = useIsDesktop();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current?.contains(target) || target.closest("[data-filter-trigger]")) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open, isDesktop, setOpen]);

  if (!isDesktop) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[88dvh] gap-0 rounded-t-2xl border-line bg-ink-2 p-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div>
              <SheetTitle className="font-serif text-2xl font-normal">Filters</SheetTitle>
              <SheetDescription className="text-xs text-dim">Results update live on the globe.</SheetDescription>
            </div>
            <IconButton label="Close filters" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </IconButton>
          </div>
          <div className="scroll-quiet overflow-y-auto px-5 pb-6">
            <FilterControls />
          </div>
          <FilterFooter />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="Filters"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="atlas-panel absolute top-[76px] right-6 z-40 flex max-h-[calc(100dvh-140px)] w-[420px] flex-col"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div>
              <h2 className="font-serif text-2xl">Filters</h2>
              <p className="text-xs text-dim">Results update live on the globe.</p>
            </div>
            <IconButton label="Close filters" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </IconButton>
          </div>
          <div className="scroll-quiet overflow-y-auto px-5 pb-5">
            <FilterControls />
          </div>
          <FilterFooter />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
