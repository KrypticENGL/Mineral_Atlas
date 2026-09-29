"use client";

import dynamic from "next/dynamic";
import { Component, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MonitorX } from "lucide-react";
import { bootReady } from "@/lib/boot";
import { whenIdle } from "@/lib/idle";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { cn } from "@/lib/utils";
import { GlobeLoader } from "./GlobeLoader";
import { loadCountryFeatures } from "./geo";
import { LocationTooltip } from "./LocationTooltip";
import { TopoBackdrop } from "./TopoBackdrop";

// WebGL code (three, globe.gl) is split out of the main bundle and never SSR'd.
const importScene = () => import("./GlobeScene");
const GlobeScene = dynamic(importScene, { ssr: false, loading: () => <GlobeLoader /> });

// Start the two network dependencies immediately instead of in sequence
// (chunk → boundaries fetch); the scene itself is mounted later, see useIdleGate.
if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("webgl") !== "off") {
  void importScene();
  loadCountryFeatures().catch(() => {}); // the scene surfaces the error itself
}

/**
 * True once the browser has painted the page shell and gone idle. Building the
 * globe (WebGL context, ~180 polygon meshes) is the heaviest work on the page;
 * doing it during hydration would delay the first paint and janks the intro.
 */
function useIdleGate(timeout = 1200) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelIdle = () => {};
    const frame = requestAnimationFrame(() => {
      cancelIdle = whenIdle(() => setReady(true), timeout);
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelIdle();
    };
  }, [timeout]);
  return ready;
}
const FlatMapFallback = dynamic(() => import("./FlatMapFallback"), {
  ssr: false,
  loading: () => <GlobeLoader label="Preparing map" />,
});

type WebGLSupport = "pending" | "supported" | "unsupported";

let detected: WebGLSupport | null = null;
function detectWebGL(): WebGLSupport {
  if (detected) return detected;
  const forcedOff = new URLSearchParams(window.location.search).get("webgl") === "off";
  let ok = false;
  if (!forcedOff) {
    try {
      const canvas = document.createElement("canvas");
      ok = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      ok = false;
    }
  }
  detected = ok ? "supported" : "unsupported";
  return detected;
}
const subscribeNoop = () => () => {};

/** Falls back to the 2D map if the WebGL scene throws (e.g. context creation fails). */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[globe] scene failed, falling back to 2D map", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FallbackNotice() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 lg:top-24">
      <p className="atlas-panel flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-stone">
        <MonitorX className="size-3.5 text-ochre" aria-hidden />
        3D globe unavailable (WebGL not supported) — showing a 2D map instead.
      </p>
    </div>
  );
}

function Fallback() {
  // No globe to wait for: let the boot screen go.
  useEffect(() => bootReady(), []);
  return (
    <>
      <FallbackNotice />
      <Suspense fallback={<GlobeLoader label="Preparing map" />}>
        <FlatMapFallback />
      </Suspense>
    </>
  );
}

/**
 * GlobeStage — decides between the WebGL globe and the 2D fallback, hosts the
 * hover tooltip, and slides the scene aside when a detail panel opens.
 */
export function GlobeStage() {
  const support = useSyncExternalStore(subscribeNoop, detectWebGL, () => "pending" as const);
  const sceneReady = useIdleGate();
  const panelOpen = useAtlasStore((s) => s.selectedCountry !== null);
  const docked = useAtlasStore((s) => s.overviewDocked);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Pointer events can fire several times per frame; position the tooltip at
  // most once per frame so layout is read (bounds, width) only once per frame.
  const pointer = useRef<{ x: number; y: number; target: HTMLDivElement } | null>(null);
  const frame = useRef<number | undefined>(undefined);
  useEffect(() => () => cancelAnimationFrame(frame.current ?? 0), []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    pointer.current = { x: event.clientX, y: event.clientY, target: event.currentTarget };
    if (frame.current !== undefined) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      const el = tooltipRef.current;
      const p = pointer.current;
      if (!el || !p) return;
      const bounds = p.target.getBoundingClientRect();
      const x = p.x - bounds.left + 18;
      const y = p.y - bounds.top + 18;
      const maxX = bounds.width - el.offsetWidth - 12;
      el.style.transform = `translate3d(${Math.min(x, maxX)}px, ${y}px, 0)`;
    });
  }, []);

  const clearHover = useAtlasStore((s) => s.hover);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerLeave={() => clearHover(null)}
    >
      {/*
        Desktop: centre the globe in the gap between the side panels.
        Left edge is the intro card (24 + 320px) or the docked tab (56px);
        right edge is the 420px column at 24px. Offset = (left − right) / 2.
      */}
      <div
        className={cn(
          "absolute inset-0 transition-transform duration-[1400ms] ease-atlas",
          docked ? "lg:-translate-x-[194px]" : "lg:-translate-x-[50px]",
          panelOpen && support === "supported" ? "max-lg:translate-y-[calc(30px-28dvh)]" : "max-lg:-translate-y-[58px]",
        )}
      >
        {/* Cartographic backdrop: soft vignette, moves with the globe. */}
        <div
          aria-hidden
          className="breathe absolute -inset-x-[200px] inset-y-0 bg-[radial-gradient(ellipse_at_50%_46%,var(--atlas-glow-1)_0%,var(--atlas-glow-2)_42%,var(--atlas-ink)_75%)]"
        />
        {/* Contour-line artwork; extends past the edges so the slides never expose a border. */}
        <TopoBackdrop className="pointer-events-none absolute -inset-x-[200px] -inset-y-[30dvh] h-[calc(100%+60dvh)] w-[calc(100%+400px)] text-dim opacity-20" />
        {(support === "pending" || (support === "supported" && !sceneReady)) && <GlobeLoader />}
        {support === "supported" && sceneReady && (
          <SceneBoundary fallback={<Fallback />}>
            <Suspense fallback={<GlobeLoader label="Loading boundaries" />}>
              <GlobeScene />
            </Suspense>
          </SceneBoundary>
        )}
        {support === "unsupported" && <Fallback />}
      </div>
      <LocationTooltip ref={tooltipRef} />
    </div>
  );
}
