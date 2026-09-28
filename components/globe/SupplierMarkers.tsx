"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { rgb } from "@/lib/atlas/palette";
import { useMapPalette } from "@/lib/theme/theme-store";
import { useAtlasStore } from "@/lib/store/atlas-store";
import type { SupplierPoint } from "@/types/supplier";

interface LabelDatum {
  key: string;
  kind: "country" | "city";
  lat: number;
  lng: number;
  text: string;
  count?: number;
  selected: boolean;
}

const MAX_CITY_LABELS = 8;
/** Pulse rings are per-frame animated meshes; cap them for countries with many suppliers. */
const MAX_RINGS = 12;

function createLabel(datum: object): HTMLElement {
  const d = datum as LabelDatum;
  const el = document.createElement("div");
  el.className = "globe-label";
  el.dataset.kind = d.kind;
  el.dataset.selected = String(d.selected);
  // City labels outrank country labels; bigger producers outrank smaller ones.
  el.dataset.priority = String(d.kind === "city" ? 1000 : (d.count ?? 0));
  el.textContent = d.text;
  if (d.count !== undefined) {
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = String(d.count);
    el.appendChild(count);
  }
  return el;
}

/** Called by the globe every frame for every label — write only on change to avoid style recalcs. */
function setLabelVisibility(el: HTMLElement, visible: boolean) {
  const value = visible ? "true" : "false";
  if (el.dataset.visible !== value) el.dataset.visible = value;
}

const COLLISION_INTERVAL_MS = 200;
const LABEL_PADDING = 3;

/**
 * Hides lower-priority labels that overlap higher-priority ones. Runs on a slow
 * timer (not per frame) over at most a few dozen elements, so it stays cheap.
 */
export function useLabelCollisions(container: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const tick = () => {
      const root = container.current;
      if (!root || document.hidden) return;
      const labels = [...root.querySelectorAll<HTMLElement>(".globe-label")]
        .filter((el) => el.dataset.visible !== "false")
        .sort((a, b) => Number(b.dataset.priority) - Number(a.dataset.priority));
      const placed: DOMRect[] = [];
      for (const el of labels) {
        const r = el.getBoundingClientRect();
        const hit = placed.some(
          (p) =>
            r.left < p.right + LABEL_PADDING &&
            r.right > p.left - LABEL_PADDING &&
            r.top < p.bottom + LABEL_PADDING &&
            r.bottom > p.top - LABEL_PADDING,
        );
        const collided = hit ? "true" : "false";
        if (el.dataset.collided !== collided) el.dataset.collided = collided;
        if (!hit) placed.push(r);
      }
    };
    const id = window.setInterval(tick, COLLISION_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [container]);
}


/**
 * SupplierMarkers — supplier locations as one merged point mesh (a single draw
 * call regardless of count), pulse rings on the selected country's suppliers,
 * and a small set of HTML labels (countries + the selection's cities).
 */
export function useSupplierMarkers() {
  const { lookups } = useAtlas();
  const { result } = useFiltered();
  const selectedCode = useAtlasStore((s) => s.selectedCountry);
  const selectedId = selectedCode ? (lookups.countryByCode.get(selectedCode)?.id ?? null) : null;
  const colors = useMapPalette();
  const selectedSupplierId = useAtlasStore((s) => s.selectedSupplierId);
  const ringColor = useCallback(() => (t: number) => rgb(colors.ink, Math.max(0, 0.75 * (1 - t))), [colors]);

  const points = useMemo(
    () => lookups.index.suppliers.filter((s) => result.supplierIds.has(s.id)),
    [lookups, result],
  );

  const selectedPoints = useMemo(
    () => (selectedId ? points.filter((p) => p.countryId === selectedId) : []),
    [points, selectedId],
  );

  // One ring per distinct location, capped.
  const rings = useMemo(() => {
    const seen = new Set<string>();
    const out: SupplierPoint[] = [];
    for (const p of selectedPoints) {
      const key = `${p.lat.toFixed(1)}:${p.lng.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
      if (out.length >= MAX_RINGS) break;
    }
    return out;
  }, [selectedPoints]);

  const pointColor = useCallback(
    (p: object) => {
      const point = p as SupplierPoint;
      if (point.id === selectedSupplierId) return colors.hover;
      return point.countryId === selectedId ? colors.pointOnSelected : colors.point;
    },
    [selectedId, selectedSupplierId, colors],
  );

  const pointAltitude = useCallback(
    (p: object) => {
      const point = p as SupplierPoint;
      if (point.id === selectedSupplierId) return 0.05;
      return point.countryId === selectedId ? 0.026 : 0.01;
    },
    [selectedId, selectedSupplierId],
  );

  const labels = useMemo<LabelDatum[]>(() => {
    const out: LabelDatum[] = [];
    for (const [countryId, agg] of result.byCountry) {
      const country = lookups.countryById.get(countryId);
      if (!country) continue;
      out.push({
        key: `c:${country.code}:${countryId === selectedId}`,
        kind: "country",
        lat: country.lat,
        lng: country.lng,
        text: country.name,
        count: agg.supplierCount,
        selected: countryId === selectedId,
      });
    }
    const seen = new Set<string>();
    for (const p of selectedPoints) {
      if (seen.has(p.city) || seen.size >= MAX_CITY_LABELS) continue;
      seen.add(p.city);
      out.push({ key: `city:${p.id}`, kind: "city", lat: p.lat, lng: p.lng, text: p.city, selected: true });
    }
    // The selected country's own label would collide with its city labels.
    return selectedPoints.length ? out.filter((l) => !(l.kind === "country" && l.selected)) : out;
  }, [lookups, result, selectedId, selectedPoints]);

  return {
    pointsData: points,
    pointLat: "lat",
    pointLng: "lng",
    pointColor,
    pointAltitude,
    pointRadius: 0.19,
    pointResolution: 8,
    pointsMerge: true,

    ringsData: rings,
    ringLat: "lat",
    ringLng: "lng",
    ringColor,
    ringAltitude: 0.024,
    ringMaxRadius: 2.4,
    ringPropagationSpeed: 1.1,
    ringRepeatPeriod: 1800,
    ringResolution: 32,

    htmlElementsData: labels,
    htmlLat: "lat",
    htmlLng: "lng",
    htmlAltitude: 0.012,
    htmlElement: createLabel,
    htmlElementVisibilityModifier: setLabelVisibility,
    htmlTransitionDuration: 0,
  } as const;
}
