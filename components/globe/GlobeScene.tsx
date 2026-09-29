"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { geoDistance } from "d3-geo";
import { MeshPhongMaterial, Color } from "three";
import { bootReady, onBootRevealed } from "@/lib/boot";
import { afterPaint } from "@/lib/idle";
import { cameraReadout } from "@/lib/atlas/camera-readout";
import { useAtlas } from "@/components/atlas/AtlasProvider";
import { OVERVIEW_ALTITUDE, useAtlasStore, type CameraTarget } from "@/lib/store/atlas-store";
import { QUALITY_PIXEL_RATIO, ROTATION_SPEED, useSettingsStore } from "@/lib/settings/settings-store";
import { useMapPalette } from "@/lib/theme/theme-store";
import { useCountryLayer } from "./CountryLayer";
import { fitCountryView, type Viewport } from "./fit";
import { loadCountryFeatures } from "./geo";
import { useLabelCollisions, useSupplierMarkers } from "./SupplierMarkers";

const CAMERA_MS = 1600;
const IDLE_RESUME_MS = 7000;
const INITIAL_VIEW = { lat: 14, lng: 12, altitude: OVERVIEW_ALTITUDE };
/** First load: the camera glides in from further out and slightly west. */
const INTRO_MS = 2600;
const INTRO_FROM = { lat: 22, lng: -38, altitudeScale: 1.7 };
/** How close (in screen pixels) a click must land to a supplier dot to pick it. */
const PICK_RADIUS_PX = 10;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motionReduced = () => useSettingsStore.getState().reduceMotion || prefersReducedMotion();
const cameraMs = () => (motionReduced() ? 0 : CAMERA_MS);
/** Autorotation runs only when enabled in Settings and no country is selected. */
const shouldRotate = () => useSettingsStore.getState().autoRotate && useAtlasStore.getState().selectedCountry === null;
const pixelRatio = () => Math.min(window.devicePixelRatio, QUALITY_PIXEL_RATIO[useSettingsStore.getState().quality]);

/** Narrow (portrait) viewports need the camera further out to fit the globe. */
function altitudeScale(): number {
  const w = window.innerWidth;
  return w < 480 ? 1.55 : w < 1024 ? 1.25 : 1;
}

/**
 * The part of the canvas not covered by panels. Desktop: between the docked
 * intro tab (56px) and the 420px right column, below the navbar and above the
 * footer. Mobile: the band between the navbar and the bottom sheet.
 */
function freeViewport(width: number, height: number): Viewport {
  if (window.innerWidth >= 1024) {
    return { height, freeWidth: Math.max(240, width - 56 - 444 - 48), freeHeight: Math.max(240, height - 76 - 64 - 32) };
  }
  // Between the navbar (60px) and the half-open sheet (56%), less some breathing room.
  return { height, freeWidth: width - 32, freeHeight: Math.max(160, height * 0.44 - 84) };
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        Math.round(prev.width) === Math.round(width) && Math.round(prev.height) === Math.round(height)
          ? prev
          : { width, height },
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

/**
 * GlobeScene — owns the Three.js globe and nothing else. It is created once;
 * data changes flow in as memoised layer props, camera moves arrive through a
 * store subscription (no React re-render), and autorotation is imperative.
 */
export default function GlobeScene() {
  const features = use(loadCountryFeatures());
  const { lookups } = useAtlas();
  const colors = useMapPalette();
  const showAtmosphere = useSettingsStore((s) => s.showAtmosphere);
  const showGraticules = useSettingsStore((s) => s.showGraticules);
  const quality = useSettingsStore((s) => s.quality);
  const autoRotate = useSettingsStore((s) => s.autoRotate);
  const rotationSpeed = useSettingsStore((s) => s.rotationSpeed);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const resumeTimer = useRef<number | undefined>(undefined);

  const countryLayer = useCountryLayer(features);
  const markers = useSupplierMarkers();
  useLabelCollisions(containerRef);

  // One material per theme; the previous one is released when it's replaced.
  const globeMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: new Color(colors.ocean),
        emissive: new Color(colors.emissive),
        specular: new Color(colors.specular),
        shininess: 9,
      }),
    [colors],
  );
  useEffect(() => () => globeMaterial.dispose(), [globeMaterial]);
  // On high-density screens MSAA adds little and costs a lot of fill rate.
  const rendererConfig = useMemo(
    () => ({ antialias: window.devicePixelRatio < 2, alpha: true, powerPreference: "high-performance" as const }),
    [],
  );
  // New polygons otherwise grow from zero altitude, rebuilding every country's
  // geometry each frame just as the intro camera move starts. Enabled afterwards.
  const [polygonTransitions, setPolygonTransitions] = useState(false);

  const move = useCallback(
    (target: CameraTarget) => {
      const globe = globeRef.current;
      const container = containerRef.current;
      if (!globe || !container) return;
      if (target.fitCountry) {
        const iso = lookups.countryByCode.get(target.fitCountry)?.isoNumeric;
        const feature = iso ? features.find((f) => f.id === iso) : undefined;
        if (feature) {
          globe.pointOfView(fitCountryView(feature, freeViewport(container.clientWidth, container.clientHeight)), cameraMs());
          return;
        }
      }
      const current = globe.pointOfView();
      globe.pointOfView(
        { lat: target.lat ?? current.lat, lng: target.lng ?? current.lng, altitude: target.altitude * altitudeScale() },
        cameraMs(),
      );
    },
    [containerRef, features, lookups],
  );

  const setAutoRotate = useCallback((on: boolean) => {
    const controls = globeRef.current?.controls();
    if (controls) controls.autoRotate = on && useSettingsStore.getState().autoRotate;
  }, []);

  const handleReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    // A full-viewport canvas at 2× is 4× the fragments of 1×; the default cap of 1.5 keeps edges crisp for far less GPU work.
    globe.renderer().setPixelRatio(pixelRatio());

    const controls = globe.controls();
    controls.autoRotateSpeed = ROTATION_SPEED[useSettingsStore.getState().rotationSpeed];
    controls.minDistance = 104; // altitude 0.04 — close enough for the smallest countries
    controls.maxDistance = 640;
    controls.zoomSpeed = 0.6;
    controls.rotateSpeed = 0.55;

    const state = useAtlasStore.getState();
    const scale = altitudeScale();
    const reduced = motionReduced();
    const container = containerRef.current;
    const settle = () => {
      container?.removeAttribute("data-intro"); // labels fade in
      container?.setAttribute("data-settled", ""); // drops will-change
      setPolygonTransitions(true);
    };

    if (state.camera || reduced) {
      controls.autoRotate = shouldRotate();
      globe.pointOfView({ ...INITIAL_VIEW, altitude: INITIAL_VIEW.altitude * scale }, 0);
      if (state.camera) move(state.camera);
      bootReady();
      onBootRevealed(() => {
        container?.setAttribute("data-ready", "");
        settle();
      });
    } else {
      // Park the camera at the intro's start position, then let two frames render
      // while still invisible so shader compilation and first-frame uploads don't
      // land inside the reveal. The fade and the camera glide then start together.
      globe.pointOfView({ lat: INTRO_FROM.lat, lng: INTRO_FROM.lng, altitude: INITIAL_VIEW.altitude * scale * INTRO_FROM.altitudeScale }, 0);
      afterPaint(() => {
        bootReady();
        // Wait for the boot screen to start leaving, so the intro plays in view.
        onBootRevealed(() => {
          container?.setAttribute("data-ready", "");
          globe.pointOfView({ ...INITIAL_VIEW, altitude: INITIAL_VIEW.altitude * scale }, INTRO_MS);
          // Not resumeTimer: user input clears that one, and settling must always happen.
          window.setTimeout(settle, INTRO_MS);
          // Autorotation would have fought the tween; it starts once the camera settles.
          resumeTimer.current = window.setTimeout(() => {
            if (shouldRotate()) controls.autoRotate = true;
          }, INTRO_MS);
        });
      });
    }

    // Pause on interaction; resume after a quiet period if nothing is selected.
    controls.addEventListener("start", () => {
      window.clearTimeout(resumeTimer.current);
      controls.autoRotate = false;
    });
    controls.addEventListener("end", () => {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => {
        if (shouldRotate()) controls.autoRotate = true;
      }, IDLE_RESUME_MS);
    });
  }, [containerRef, move]);

  // Camera + autorotate react to store changes without re-rendering this tree.
  useEffect(
    () =>
      useAtlasStore.subscribe((state, prev) => {
        if (state.camera && state.camera !== prev.camera) move(state.camera);
        if (state.selectedCountry !== prev.selectedCountry) {
          window.clearTimeout(resumeTimer.current);
          setAutoRotate(state.selectedCountry === null);
        }
      }),
    [move, setAutoRotate],
  );

  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  // Settings changes apply to the live globe (before it is ready, handleReady reads them).
  useEffect(() => {
    globeRef.current?.renderer().setPixelRatio(pixelRatio());
  }, [quality]);
  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotateSpeed = ROTATION_SPEED[rotationSpeed];
    controls.autoRotate = autoRotate && useAtlasStore.getState().selectedCountry === null;
  }, [autoRotate, rotationSpeed]);

  // Stop rendering entirely while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      const globe = globeRef.current;
      if (!globe) return;
      if (document.hidden) globe.pauseAnimation();
      else globe.resumeAnimation();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /**
   * Supplier dots are one merged mesh (no per-point events), so clicks are
   * resolved by proximity: the nearest visible supplier within ~10px at the
   * current zoom opens in the right-hand panel. Otherwise the click falls
   * through to the country underneath.
   */
  const supplierPoints = markers.pointsData;
  const openSupplier = useAtlasStore((s) => s.openSupplier);
  const pickSupplier = useCallback(
    (lat: number, lng: number) => {
      const globe = globeRef.current;
      const height = containerRef.current?.clientHeight;
      if (!globe || !height) return false;
      // Angle per pixel near the view centre ≈ altitude · 2·tan(fov/2) / height.
      const tolerance = (PICK_RADIUS_PX * globe.pointOfView().altitude * 2 * Math.tan((25 * Math.PI) / 180)) / height;
      let best: (typeof supplierPoints)[number] | null = null;
      let bestDistance = tolerance;
      for (const p of supplierPoints) {
        const d = geoDistance([lng, lat], [p.lng, p.lat]);
        if (d <= bestDistance) {
          best = p;
          bestDistance = d;
        }
      }
      if (!best) return false;
      const code = lookups.countryById.get(best.countryId)?.code;
      if (!code) return false;
      openSupplier(best.id, code);
      return true;
    },
    [containerRef, lookups, openSupplier, supplierPoints],
  );

  const { onPolygonClick: selectPolygon } = countryLayer;
  const onPolygonClick = useCallback(
    (polygon: object, _event: MouseEvent, coords: { lat: number; lng: number }) => {
      if (!pickSupplier(coords.lat, coords.lng)) selectPolygon(polygon);
    },
    [pickSupplier, selectPolygon],
  );
  const onGlobeClick = useCallback((coords: { lat: number; lng: number }) => void pickSupplier(coords.lat, coords.lng), [pickSupplier]);

  const handleZoom = useCallback((pov: { lat: number; lng: number; altitude: number }) => cameraReadout.emit(pov), []);

  return (
    <div
      ref={containerRef}
      data-intro=""
      className="absolute inset-0 scale-[0.96] opacity-0 will-change-[opacity,transform] transition-[opacity,transform] duration-[1600ms] ease-atlas data-ready:scale-100 data-ready:opacity-100 data-settled:will-change-auto"
    >
      {size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          rendererConfig={rendererConfig}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showGraticules={showGraticules}
          showAtmosphere={showAtmosphere}
          atmosphereColor={colors.atmosphere}
          atmosphereAltitude={0.17}
          onGlobeReady={handleReady}
          onZoom={handleZoom}
          showPointerCursor={(type) => type === "polygon"}
          {...countryLayer}
          {...markers}
          polygonsTransitionDuration={polygonTransitions ? 420 : 0}
          onPolygonClick={onPolygonClick}
          onGlobeClick={onGlobeClick}
        />
      )}
    </div>
  );
}
