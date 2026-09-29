"use client";

import Link from "next/link";
import { useState } from "react";
import { Database, Info, LogOut, Menu, Search as SearchIcon, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFiltered } from "@/components/atlas/AtlasProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/login/actions";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./Search";
import { ThemeMenu } from "./ThemeMenu";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle cx="16" cy="16" r="14.5" strokeWidth="1" opacity="0.5" />
      <ellipse cx="16" cy="16" rx="6.5" ry="14.5" strokeWidth="1" opacity="0.5" />
      <path d="M1.5 16h29M4 9h24M4 23h24" strokeWidth="1" opacity="0.35" />
      <path d="M16 8.5l5 7.5-5 7.5-5-7.5z" style={{ fill: "var(--atlas-sage)" }} stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

const ENDPOINTS = [
  ["GET /api/atlas", "Globe index: countries, supplier points, price facets, stats"],
  ["GET /api/countries", "All countries"],
  ["GET /api/countries/:code", "Country with suppliers, offers and current prices"],
  ["GET /api/suppliers", "Filterable supplier points (?mineral, country, currency…)"],
  ["GET /api/suppliers/:id", "Supplier profile with price history"],
  ["GET /api/minerals", "Mineral catalogue"],
  ["GET /api/minerals/:slug", "Mineral detail with price spread per currency/unit"],
  ["GET /api/pricing", "Paginated current quotes (?mineral, supplier, country…)"],
  ["GET /api/search?q=", "Minerals, countries, suppliers and cities"],
] as const;

type InfoDialog = "about" | "api" | null;

function InfoDialogs({ open, onClose }: { open: InfoDialog; onClose: () => void }) {
  return (
    <Dialog open={open !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl border-line bg-ink-2 sm:max-w-lg">
        {open === "about" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl font-normal">About this data</DialogTitle>
              <DialogDescription className="text-stone">
                Where the prices and suppliers on Mineral Atlas come from.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm leading-relaxed text-beige">
              <p>
                Listings are entered from offers sent directly by suppliers. Prices are the seller&apos;s quoted terms, not{" "}
                <strong className="font-medium text-cream">live or independently confirmed market prices</strong>. Suppliers
                without a verified badge have not been checked — do your own due diligence before any transaction.
              </p>
              <p>
                Prices are always shown in the currency and unit in which they were quoted. No currency conversion is
                applied anywhere in the interface.
              </p>
              <p className="text-stone">
                Each quote records its incoterm, loading port and payment terms where the supplier stated them.
              </p>
            </div>
          </>
        )}
        {open === "api" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl font-normal">API endpoints</DialogTitle>
              <DialogDescription className="text-stone">
                JSON over HTTP. Responses are wrapped as <code className="font-mono">{"{ data }"}</code> or{" "}
                <code className="font-mono">{"{ error }"}</code>.
              </DialogDescription>
            </DialogHeader>
            <dl className="divide-y divide-line border-y border-line">
              {ENDPOINTS.map(([route, description]) => (
                <div key={route} className="py-2.5">
                  <dt className="font-mono text-xs text-cream">{route}</dt>
                  <dd className="mt-0.5 text-xs text-stone">{description}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Header — identity, global search, filters and a small application menu. */
export function Header() {
  const { activeFilters } = useFiltered();
  const filtersOpen = useAtlasStore((s) => s.filtersOpen);
  const setFiltersOpen = useAtlasStore((s) => s.setFiltersOpen);
  const searchOpen = useAtlasStore((s) => s.searchOpen);
  const setSearchOpen = useAtlasStore((s) => s.setSearchOpen);
  const [dialog, setDialog] = useState<InfoDialog>(null);

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-3 lg:px-6">
        <nav
          aria-label="Main"
          className="liquid-glass liquid-glass-interactive drop-in pointer-events-auto mx-auto flex h-12 w-full max-w-[720px] items-center gap-2 rounded-full py-1.5 pr-1.5 pl-2.5 sm:pl-3.5"
        >
          <Link href="/" className="group flex min-w-0 items-center gap-2 rounded-full" aria-label="Mineral Atlas home">
            <BrandMark className="size-6 shrink-0 text-cream transition-transform duration-700 ease-atlas group-hover:rotate-[60deg]" />
            <span className="font-mono text-[11px] font-medium tracking-[0.3em] whitespace-nowrap text-cream transition-[letter-spacing] duration-500 ease-atlas group-hover:tracking-[0.36em]">
              MINERAL ATLAS
            </span>
          </Link>

          <div className="flex-1" />

          <GlobalSearch variant="inline" className="hidden w-[240px] md:block xl:w-[280px]" />

          <div className="flex items-center gap-1">
            <ThemeMenu />
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="glass-control inline-flex size-9 items-center justify-center rounded-full text-stone hover:text-cream md:hidden"
            >
              <SearchIcon className="size-4" />
            </button>
            <button
              type="button"
              data-filter-trigger
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                "group inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px]",
                filtersOpen || activeFilters > 0
                  ? "glass-control border-cream/50! bg-cream/[0.12]! text-cream"
                  : "glass-control text-stone hover:text-cream",
              )}
            >
              <SlidersHorizontal className="size-3.5 transition-transform duration-500 ease-atlas group-hover:rotate-90" aria-hidden />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && (
                <span
                  key={activeFilters}
                  className="pop tabular grid h-4 min-w-4 place-items-center rounded-full bg-cream px-1 font-mono text-[10px] text-ink"
                >
                  {activeFilters}
                </span>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Menu"
                className="glass-control group inline-flex size-9 items-center justify-center rounded-full text-stone hover:text-cream"
              >
                <Menu className="size-4 transition-transform duration-300 ease-atlas group-hover:scale-x-75" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={14} className="w-60 rounded-2xl border border-line bg-ink-2 p-1.5 ring-0">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="eyebrow">Mineral Atlas</DropdownMenuLabel>
                  <DropdownMenuItem className="rounded-lg" onClick={() => setDialog("about")}>
                    <Info /> About the data
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg" onClick={() => setDialog("api")}>
                    <Database /> API endpoints
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg" render={<Link href="/admin" />}>
                  <ShieldCheck /> Administration
                  <span className="ml-auto font-mono text-[9px] tracking-widest text-dim uppercase">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg" onClick={() => logout()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-ink/95 p-4 md:hidden"
          >
            <GlobalSearch variant="overlay" onDone={() => setSearchOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <InfoDialogs open={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
