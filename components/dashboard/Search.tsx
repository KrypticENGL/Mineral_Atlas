"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Building2, Gem, Globe2, MapPin, Search as SearchIcon, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { useAtlas } from "@/components/atlas/AtlasProvider";
import { searchAtlas } from "@/lib/atlas/search";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { cn } from "@/lib/utils";
import type { SearchResult, SearchResultKind } from "@/types/search";

const KIND_ICON: Record<SearchResultKind, typeof Gem> = {
  mineral: Gem,
  country: Globe2,
  supplier: Building2,
  city: MapPin,
};

function groupTitle(result: SearchResult): string {
  if (result.kind === "country" && result.mineralId) return "Where to source it";
  return { mineral: "Minerals", country: "Countries", supplier: "Suppliers", city: "Cities & regions" }[result.kind];
}

/** Applies a search result to the atlas: filter, select, fly, open. */
function useApplyResult() {
  const { lookups } = useAtlas();
  const selectCountry = useAtlasStore((s) => s.selectCountry);
  const openSupplier = useAtlasStore((s) => s.openSupplier);
  const setFilter = useAtlasStore((s) => s.setFilter);

  return useCallback(
    (r: SearchResult) => {
      if (r.mineralId) setFilter("mineralId", r.mineralId);
      if (r.kind === "mineral" || !r.countryCode) return;
      const country = lookups.countryByCode.get(r.countryCode);
      if (!country) return;
      if (r.kind === "supplier" && r.supplierId && r.lat !== undefined && r.lng !== undefined) {
        selectCountry(country.code, { lat: r.lat, lng: r.lng });
        openSupplier(r.supplierId, country.code);
      } else if (r.kind === "city" && r.lat !== undefined && r.lng !== undefined) {
        selectCountry(country.code, { lat: r.lat, lng: r.lng });
      } else {
        selectCountry(country.code, { lat: country.lat, lng: country.lng });
      }
    },
    [lookups, openSupplier, selectCountry, setFilter],
  );
}

interface GlobalSearchProps {
  variant: "inline" | "overlay";
  className?: string;
  onDone?: () => void;
}

/**
 * GlobalSearch — instant, in-memory search across minerals, countries,
 * suppliers and cities. No network round-trip and no debounce: the corpus is
 * pre-normalised and `useDeferredValue` keeps typing responsive.
 */
export function GlobalSearch({ variant, className, onDone }: GlobalSearchProps) {
  const { lookups } = useAtlas();
  const apply = useApplyResult();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(variant === "overlay");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const deferred = useDeferredValue(query);
  const results = useMemo(() => searchAtlas(lookups, deferred), [lookups, deferred]);
  const pending = query !== deferred;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  // "/" or ⌘K / Ctrl+K focuses the inline search from anywhere.
  useEffect(() => {
    if (variant !== "inline") return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  useEffect(() => {
    if (variant === "overlay") inputRef.current?.focus();
  }, [variant]);

  const choose = (r: SearchResult) => {
    apply(r);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    onDone?.();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      choose(results[activeIndex]);
    } else if (e.key === "Escape") {
      if (query) setQuery("");
      else {
        setOpen(false);
        inputRef.current?.blur();
        onDone?.();
      }
    }
  };

  const showResults = open && query.trim().length > 0;
  const overlay = variant === "overlay";
  // Inline results sit over the right-hand column. They're portalled out of the
  // navbar because its backdrop-filter would otherwise contain `position: fixed`.
  const inPortal = (node: React.ReactNode) =>
    overlay || typeof document === "undefined" ? node : createPortal(node, document.body);

  return (
    <div className={cn(overlay && "relative", className)}>
      <div
        className={cn(
          cn("group flex items-center gap-2.5 rounded-full border px-3.5 transition-colors", overlay ? "h-10" : "h-9"),
          overlay
            ? "border-line-strong bg-ink-2"
            : "glass-control focus-within:border-line-strong",
        )}
      >
        {overlay ? (
          <button type="button" aria-label="Close search" onClick={onDone} className="text-stone hover:text-cream">
            <ArrowLeft className="size-4" />
          </button>
        ) : (
          <SearchIcon className="size-4 shrink-0 text-dim" aria-hidden />
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showResults && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
          aria-label="Search minerals, suppliers, countries and cities"
          placeholder="Search minerals, suppliers, places"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => !overlay && window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-cream outline-none placeholder:text-dim [&::-webkit-search-cancel-button]:hidden"
        />
        {pending && <span className="size-3 animate-spin rounded-full border border-dim border-t-cream" aria-hidden />}
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="text-dim hover:text-cream"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          !overlay && (
            <kbd className="hidden font-mono text-[10px] text-dim lg:inline" aria-hidden>
              ⌘K
            </kbd>
          )
        )}
      </div>

      {inPortal(
        <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              overlay
                ? "mt-3"
                : "atlas-panel fixed top-[76px] right-6 z-50 max-h-[min(70vh,560px)] w-[420px] overflow-y-auto",
              "scroll-quiet",
            )}
          >
            <ul id={listId} role="listbox" aria-label="Search results" className="py-1.5">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-stone">
                  No minerals, suppliers or places match “{query.trim()}”.
                </li>
              )}
              {results.map((r, i) => {
                const Icon = KIND_ICON[r.kind];
                const title = groupTitle(r);
                const showTitle = i === 0 || groupTitle(results[i - 1]) !== title;
                return (
                  <li key={`${r.kind}:${r.id}`} role="presentation" className="rise" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                    {showTitle && (
                      <p className="eyebrow px-4 pt-3 pb-1.5" role="presentation">
                        {title}
                      </p>
                    )}
                    <div
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(r)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors",
                        i === activeIndex ? "bg-cream/[0.06]" : "hover:bg-cream/[0.03]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-3.5 shrink-0 transition-[color,transform] duration-300 ease-atlas",
                          i === activeIndex ? "scale-110 text-cream" : "text-dim",
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm text-cream transition-transform duration-300 ease-atlas",
                          i === activeIndex && "translate-x-0.5",
                        )}
                      >
                        {r.label}
                      </span>
                      <span className="shrink-0 truncate font-mono text-[10.5px] text-dim">{r.sublabel}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>,
      )}
    </div>
  );
}
