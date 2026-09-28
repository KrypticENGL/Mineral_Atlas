"use client";

import { geoContains } from "d3-geo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { countryFill } from "@/lib/atlas/palette";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { useMapPalette } from "@/lib/theme/theme-store";
import { isStateFeature, loadStateFeatures, type CountryFeature, type StateFeature } from "./geo";

const PREFETCH_DELAY_MS = 140;

type MapFeature = CountryFeature | StateFeature;

/** Shared hover/select behaviour for any map surface (3D globe or 2D fallback). */
export function useCountryInteractions() {
  const { lookups } = useAtlas();
  const hover = useAtlasStore((s) => s.hover);
  const selectCountry = useAtlasStore((s) => s.selectCountry);
  const loadCountry = useAtlasStore((s) => s.loadCountry);
  const prefetchTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(prefetchTimer.current), []);

  const onHover = useCallback(
    (feature: MapFeature | null) => {
      window.clearTimeout(prefetchTimer.current);
      if (!feature) return hover(null);
      if (isStateFeature(feature)) {
        const code = useAtlasStore.getState().selectedCountry;
        const country = code ? lookups.countryByCode.get(code) : undefined;
        return hover({ iso: feature.id, name: country?.name ?? "", code, region: feature.properties.name });
      }
      const country = lookups.countryByIso.get(feature.id);
      hover({ iso: feature.id, name: country?.name ?? feature.properties.name, code: country?.code ?? null });
      // Warm the detail cache so the click that usually follows feels instant.
      if (country && lookups.suppliersByCountry.has(country.id)) {
        prefetchTimer.current = window.setTimeout(() => void loadCountry(country.code), PREFETCH_DELAY_MS);
      }
    },
    [hover, loadCountry, lookups],
  );

  const onSelect = useCallback(
    (feature: MapFeature) => {
      if (isStateFeature(feature)) return; // already inside the selected country
      const country = lookups.countryByIso.get(feature.id);
      if (!country || !lookups.suppliersByCountry.has(country.id)) return;
      selectCountry(country.code, { lat: country.lat, lng: country.lng });
    },
    [lookups, selectCountry],
  );

  return { onHover, onSelect };
}

/** Per-country visual state derived from filters, hover and selection. */
export function useCountryStyle() {
  const { lookups } = useAtlas();
  const { result } = useFiltered();
  const colors = useMapPalette();
  const selectedCode = useAtlasStore((s) => s.selectedCountry);
  const hoveredIso = useAtlasStore((s) => s.hovered?.iso ?? null);
  const selectedIso = selectedCode ? (lookups.countryByCode.get(selectedCode)?.isoNumeric ?? null) : null;

  const maxSuppliers = useMemo(() => {
    let max = 0;
    for (const agg of result.byCountry.values()) max = Math.max(max, agg.supplierCount);
    return max;
  }, [result]);

  const supplierCount = useCallback(
    (iso: string) => {
      const country = lookups.countryByIso.get(iso);
      return country ? (result.byCountry.get(country.id)?.supplierCount ?? 0) : 0;
    },
    [lookups, result],
  );

  const fill = useCallback(
    (iso: string) =>
      countryFill(colors, {
        supplierCount: supplierCount(iso),
        maxSuppliers,
        selected: iso === selectedIso,
        hovered: iso === hoveredIso,
      }),
    [colors, supplierCount, maxSuppliers, selectedIso, hoveredIso],
  );

  return { fill, supplierCount, selectedIso, selectedCode, hoveredIso, colors };
}

/** State/province boundaries of the selected country, once loaded (else null). */
export function useSelectedStates(selectedCode: string | null) {
  const [loaded, setLoaded] = useState<{ code: string; states: StateFeature[] } | null>(null);
  useEffect(() => {
    if (!selectedCode) return;
    let live = true;
    void loadStateFeatures(selectedCode).then((states) => live && setLoaded({ code: selectedCode, states }));
    return () => {
      live = false;
    };
  }, [selectedCode]);
  return loaded && loaded.code === selectedCode && loaded.states.length > 0 ? loaded.states : null;
}

/** Suppliers (after filters) inside each state, by point-in-polygon. */
export function useStateSupplierCounts(states: StateFeature[] | null) {
  const { lookups } = useAtlas();
  const { result } = useFiltered();
  const selectedCode = useAtlasStore((s) => s.selectedCountry);
  return useMemo(() => {
    const counts = new Map<string, number>();
    const country = selectedCode ? lookups.countryByCode.get(selectedCode) : undefined;
    if (!states || !country) return counts;
    const points = (lookups.suppliersByCountry.get(country.id) ?? []).filter((s) => result.supplierIds.has(s.id));
    for (const state of states) {
      let n = 0;
      for (const p of points) if (geoContains(state, [p.lng, p.lat])) n++;
      counts.set(state.id, n);
    }
    return counts;
  }, [lookups, result, selectedCode, states]);
}

const SELECTED_ALTITUDE = 0.022;

/**
 * CountryLayer — polygon props for react-globe.gl: density-shaded land, a
 * raised cap for the selection (split into its states/provinces once they
 * load) and hairline borders. Accessors are memoised so unrelated renders never
 * touch the scene.
 */
export function useCountryLayer(features: CountryFeature[]) {
  const { fill, supplierCount, selectedIso, selectedCode, hoveredIso, colors } = useCountryStyle();
  const { onHover, onSelect } = useCountryInteractions();
  const states = useSelectedStates(selectedCode);

  // The selected country's coarse outline is swapped for its detailed states.
  const polygonsData = useMemo<MapFeature[]>(
    () => (states && selectedIso ? [...features.filter((f) => f.id !== selectedIso), ...states] : features),
    [features, states, selectedIso],
  );

  const polygonCapColor = useCallback(
    (f: object) => {
      const feature = f as MapFeature;
      if (isStateFeature(feature)) return feature.id === hoveredIso ? colors.hover : colors.selected;
      return fill(feature.id);
    },
    [fill, hoveredIso, colors],
  );

  const polygonAltitude = useCallback(
    (f: object) => {
      const feature = f as MapFeature;
      // Hover deliberately does not change altitude: an altitude change rebuilds
      // the polygon's geometry on every tween frame. Hover is shown by colour only.
      if (isStateFeature(feature) || feature.id === selectedIso) return SELECTED_ALTITUDE;
      return supplierCount(feature.id) > 0 ? 0.007 : 0.004;
    },
    [selectedIso, supplierCount],
  );

  const polygonStrokeColor = useCallback(
    (f: object) => {
      const feature = f as MapFeature;
      if (isStateFeature(feature)) return colors.stateStroke;
      return feature.id === selectedIso ? colors.selectedStroke : colors.landStroke;
    },
    [selectedIso, colors],
  );

  const onPolygonHover = useCallback((f: object | null) => onHover(f as MapFeature | null), [onHover]);
  const onPolygonClick = useCallback((f: object) => onSelect(f as MapFeature), [onSelect]);

  return {
    polygonsData,
    polygonCapColor,
    polygonSideColor: colors.side,
    polygonStrokeColor,
    polygonAltitude,
    polygonsTransitionDuration: 420,
    onPolygonHover,
    onPolygonClick,
  };
}
