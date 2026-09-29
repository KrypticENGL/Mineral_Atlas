"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { ExplorePanel, IntroPanel } from "@/components/dashboard/GlobalOverview";
import { Header } from "@/components/dashboard/Header";
import { CountUp } from "@/components/dashboard/primitives";
import { LocationDetailsPanel } from "@/components/dashboard/LocationDetailsPanel";
import { MobileSheet } from "@/components/dashboard/MobileSheet";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { GlobeStage } from "@/components/globe/GlobeStage";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { useSettingsStore } from "@/lib/settings/settings-store";
import { useThemeStore } from "@/lib/theme/theme-store";
import { cn } from "@/lib/utils";
import type { AtlasIndex } from "@/types/atlas";
import { AtlasProvider, useFiltered } from "./AtlasProvider";
import { useAtlasUrlSync } from "./useAtlasUrlSync";

const ease = [0.22, 1, 0.36, 1] as const;

/** Escape walks back up the hierarchy: supplier → country → global. */
function useEscapeNavigation() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [role=dialog], [role=menu]")) return;
      const s = useAtlasStore.getState();
      if (s.filtersOpen || s.searchOpen) return;
      if (s.selectedSupplierId) s.closeSupplier();
      else if (s.selectedCountry) s.clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

const PANEL_TOP = "top-[76px]";

/** Compact metrics shown on the docked tab. */
function DockedStats() {
  const { result } = useFiltered();
  const rows = [
    ["Ctry", result.totals.countries],
    ["Supp", result.totals.suppliers],
    ["Min", result.totals.minerals],
    ["List", result.totals.listings],
  ] as const;
  return (
    <span className="flex flex-col items-center gap-3">
      {rows.map(([label, value]) => (
        <span key={label} className="flex flex-col items-center">
          <span className="tabular font-serif text-lg leading-none text-cream">
            <CountUp value={value} />
          </span>
          <span className="mt-1 font-mono text-[8.5px] tracking-[0.14em] text-dim uppercase">{label}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Left column: the introduction and headline metrics. Once the user drills in
 * (a country or a mineral), it docks to the left edge as a slim tab; clicking the
 * tab returns to the global view.
 */
function IntroColumn() {
  const docked = useAtlasStore((s) => s.overviewDocked);
  const showOverview = useAtlasStore((s) => s.showOverview);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {docked ? (
        <motion.button
          key="dock"
          type="button"
          onClick={showOverview}
          aria-label="Back to global overview"
          title="Global overview"
          initial={{ opacity: 0, x: -56 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -56 }}
          transition={{ duration: 0.45, ease }}
          className={cn(
            "atlas-panel group absolute left-0 z-20 hidden w-14 flex-col items-center gap-5 rounded-l-none border-l-0 py-4 text-stone transition-colors hover:text-cream lg:flex",
            PANEL_TOP,
          )}
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase [writing-mode:vertical-rl] rotate-180">
            Global overview
          </span>
          <span className="h-px w-6 bg-line" aria-hidden />
          <DockedStats />
        </motion.button>
      ) : (
        <motion.aside
          key="intro"
          aria-label="Introduction"
          initial={{ opacity: 0, x: -48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -340 }}
          transition={{ duration: 0.5, ease }}
          className={cn("atlas-panel absolute left-6 z-20 hidden w-[320px] lg:block", PANEL_TOP)}
        >
          <IntroPanel />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Right column before a country is chosen: browse minerals and regions. */
function ExploreColumn() {
  const selected = useAtlasStore((s) => s.selectedCountry !== null);
  return (
    <AnimatePresence initial={false}>
      {!selected && (
        <motion.aside
          key="explore"
          aria-label="Explore"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.5, ease }}
          className={cn("atlas-panel absolute right-6 bottom-[64px] z-20 hidden w-[420px] lg:block", PANEL_TOP)}
        >
          <ExplorePanel />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function AtlasShell() {
  useAtlasUrlSync();
  // Adopt the theme the pre-paint script applied (the globe reads it from the store).
  useEffect(() => useThemeStore.getState().hydrate(), []);
  useEffect(() => useSettingsStore.getState().hydrate(), []);
  useEscapeNavigation();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink">
      <h1 className="sr-only">Mineral Atlas — explore global mineral suppliers, markets and pricing</h1>
      <GlobeStage />
      <Header />
      <FilterPanel />
      <IntroColumn />
      <ExploreColumn />
      <LocationDetailsPanel />
      <MobileSheet />
      <StatsBar />
    </main>
  );
}

/** Client root of the explorer. Receives the cached globe index from the server. */
export function AtlasApp({ index }: { index: AtlasIndex }) {
  return (
    <AtlasProvider index={index}>
      <AtlasShell />
    </AtlasProvider>
  );
}
