"use client";

import { animate, motion, useDragControls, useMotionValue, type PanInfo } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { MapLegend, OverviewInsights, OverviewStats } from "./GlobalOverview";
import { LocationDetails } from "./LocationDetailsPanel";

type Snap = "peek" | "half" | "full";

const HANDLE = 28;
const TOP_GAP = 64;
const spring = { type: "spring", damping: 36, stiffness: 320, mass: 0.9 } as const;

function useViewportHeight(): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange);
      return () => window.removeEventListener("resize", onChange);
    },
    () => window.innerHeight,
    () => 800,
  );
}

/**
 * MobileSheet — the phone/tablet counterpart of the side panels: a draggable
 * bottom sheet with peek / half / full snap points. Selecting a country opens
 * it to half height; opening a supplier takes it full-screen.
 */
export function MobileSheet() {
  const isDesktop = useIsDesktop();
  const vh = useViewportHeight();
  const selected = useAtlasStore((s) => s.selectedCountry);
  const supplierId = useAtlasStore((s) => s.selectedSupplierId);
  const controls = useDragControls();
  const dragged = useRef(false);

  const key = `${selected ?? ""}|${supplierId ?? ""}`;
  const defaultSnap: Snap = supplierId ? "full" : selected ? "half" : "peek";
  const [manual, setManual] = useState<{ key: string; snap: Snap } | null>(null);
  const snap = manual?.key === key ? manual.snap : defaultSnap;

  const full = vh - TOP_GAP;
  const heights: Record<Snap, number> = { peek: 176, half: Math.round(vh * 0.56), full };
  const yFor = (s: Snap) => full - heights[s];
  const targetY = yFor(snap);

  const y = useMotionValue(full);
  useEffect(() => {
    const controlsAnim = animate(y, targetY, spring);
    return () => controlsAnim.stop();
  }, [y, targetY]);

  if (isDesktop) return null;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    dragged.current = Math.abs(info.offset.y) > 4;
    const projected = y.get() + info.velocity.y * 0.18;
    const order: Snap[] = ["full", "half", "peek"];
    const next = order.reduce((best, s) => (Math.abs(yFor(s) - projected) < Math.abs(yFor(best) - projected) ? s : best));
    setManual({ key, snap: next });
    animate(y, yFor(next), spring);
  };

  const cycle = () => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    setManual({ key, snap: snap === "peek" ? "half" : snap === "half" ? "full" : "peek" });
  };

  return (
    <motion.section
      aria-label={selected ? "Location details" : "Global overview"}
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: yFor("peek") }}
      dragElastic={0.06}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      style={{ y, height: full }}
      className="atlas-panel fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-b-none rounded-t-3xl border-b-0 bg-ink-2/95"
    >
      <button
        type="button"
        aria-label={snap === "full" ? "Collapse panel" : "Expand panel"}
        onPointerDown={(e) => controls.start(e)}
        onClick={cycle}
        className="flex h-7 w-full shrink-0 touch-none items-center justify-center"
      >
        <span className="h-1 w-10 rounded-full bg-cream/25" />
      </button>
      <div style={{ height: heights[snap] - HANDLE }} className="min-h-0 overflow-hidden">
        {selected ? (
          <LocationDetails />
        ) : (
          <div className="scroll-quiet h-full space-y-6 overflow-y-auto px-5 pb-8">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Global mineral market</p>
              <p className="font-mono text-[10px] text-ochre">Supplier quotes</p>
            </div>
            <OverviewStats compact />
            <OverviewInsights />
            <MapLegend />
          </div>
        )}
      </div>
    </motion.section>
  );
}
