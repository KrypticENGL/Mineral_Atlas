"use client";

import { create } from "zustand";
import { DEFAULT_FILTERS, type AtlasFilters } from "@/lib/atlas/filters";
import type { CountryDetail } from "@/types/country";
import type { MineralDetail } from "@/types/mineral";
import type { SupplierWithHistory } from "@/types/supplier";

export type Resource<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string; notFound: boolean };

export interface HoverInfo {
  iso: string;
  name: string;
  /** ISO alpha-2 when the country is part of the atlas. */
  code: string | null;
  /** Set when hovering a state/province of the selected country. */
  region?: string;
}

export interface CameraTarget {
  lat?: number;
  lng?: number;
  altitude: number;
  /** Frame this country (alpha-2) so it fills the free viewport; lat/lng/altitude are fallbacks. */
  fitCountry?: string;
  /** Monotonic id so identical targets still trigger a move. */
  id: number;
}

interface AtlasState {
  selectedCountry: string | null;
  /** Hovered land polygon (any country, listed in the atlas or not). */
  hovered: HoverInfo | null;
  selectedSupplierId: string | null;
  camera: CameraTarget | null;
  filters: AtlasFilters;
  filtersOpen: boolean;
  /** The left introduction panel collapses to an edge tab once the user drills in. */
  overviewDocked: boolean;
  searchOpen: boolean;

  /** Client-side resource caches: each entry is fetched at most once per session. */
  countries: Record<string, Resource<CountryDetail>>;
  suppliers: Record<string, Resource<SupplierWithHistory>>;
  minerals: Record<string, Resource<MineralDetail>>;
}

interface AtlasActions {
  selectCountry: (code: string, focus?: { lat: number; lng: number; altitude?: number }) => void;
  clearSelection: () => void;
  /** Back to the global view: clears the selection and restores the introduction panel. */
  showOverview: () => void;
  hover: (info: HoverInfo | null) => void;
  openSupplier: (supplierId: string, countryCode: string) => void;
  closeSupplier: () => void;
  flyTo: (target: Omit<CameraTarget, "id">) => void;

  setFilter: <K extends keyof AtlasFilters>(key: K, value: AtlasFilters[K]) => void;
  resetFilters: () => void;
  setFiltersOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;

  loadCountry: (code: string) => Promise<void>;
  loadSupplier: (id: string) => Promise<void>;
  loadMineral: (key: string) => Promise<void>;
}

export const COUNTRY_ALTITUDE = 1.7;
export const OVERVIEW_ALTITUDE = 2.1;

let cameraSeq = 0;
const inflight = new Map<string, Promise<void>>();

interface ApiEnvelope<T> {
  data?: T;
  error?: { code: string; message: string };
}

async function fetchResource<T>(url: string): Promise<Resource<T>> {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
    if (res.ok && body.data !== undefined) return { status: "ready", data: body.data };
    return {
      status: "error",
      notFound: res.status === 404,
      message:
        body.error?.message ??
        (res.status === 503 ? "The mineral database is temporarily unavailable." : "Something went wrong."),
    };
  } catch {
    return { status: "error", notFound: false, message: "Network error — check your connection and retry." };
  }
}

type CacheKey = "countries" | "suppliers" | "minerals";

export const useAtlasStore = create<AtlasState & AtlasActions>()((set, get) => {
  /** Dedupe concurrent requests and never refetch a ready resource. */
  function load(cache: CacheKey, key: string, url: string): Promise<void> {
    const flightKey = `${cache}:${key}`;
    const current = get()[cache][key];
    if (current && current.status !== "error") return inflight.get(flightKey) ?? Promise.resolve();

    const write = (resource: Resource<unknown>) =>
      set((s) => ({ [cache]: { ...s[cache], [key]: resource } }) as unknown as Partial<AtlasState>);

    write({ status: "loading" });
    const promise = fetchResource<unknown>(url).then((resource) => {
      write(resource);
      inflight.delete(flightKey);
    });
    inflight.set(flightKey, promise);
    return promise;
  }

  return {
    selectedCountry: null,
    hovered: null,
    selectedSupplierId: null,
    camera: null,
    filters: DEFAULT_FILTERS,
    filtersOpen: false,
    overviewDocked: false,
    searchOpen: false,
    countries: {},
    suppliers: {},
    minerals: {},

    selectCountry(code, focus) {
      set({
        selectedCountry: code,
        selectedSupplierId: null,
        overviewDocked: true,
        camera: focus
          ? {
              lat: focus.lat,
              lng: focus.lng,
              altitude: focus.altitude ?? COUNTRY_ALTITUDE,
              fitCountry: focus.altitude === undefined ? code : undefined,
              id: ++cameraSeq,
            }
          : get().camera,
      });
      void get().loadCountry(code);
    },

    clearSelection() {
      set({
        selectedCountry: null,
        selectedSupplierId: null,
        // Closing a country returns to the global view, intro included.
        overviewDocked: false,
        camera: { altitude: OVERVIEW_ALTITUDE, id: ++cameraSeq },
      });
    },

    showOverview() {
      get().clearSelection();
    },

    hover(info) {
      if (get().hovered?.iso !== info?.iso) set({ hovered: info });
    },

    openSupplier(supplierId, countryCode) {
      if (get().selectedCountry !== countryCode) {
        set({
          selectedCountry: countryCode,
          camera: { altitude: COUNTRY_ALTITUDE, fitCountry: countryCode, id: ++cameraSeq },
        });
        void get().loadCountry(countryCode);
      }
      set({ selectedSupplierId: supplierId, overviewDocked: true });
    },

    closeSupplier() {
      set({ selectedSupplierId: null });
    },

    flyTo(target) {
      set({ camera: { ...target, id: ++cameraSeq } });
    },

    setFilter(key, value) {
      set((s) => ({
        filters: { ...s.filters, [key]: value },
        overviewDocked: key === "mineralId" && value !== null ? true : s.overviewDocked,
      }));
    },

    resetFilters() {
      set({ filters: DEFAULT_FILTERS });
    },

    setFiltersOpen(open) {
      set({ filtersOpen: open, searchOpen: open ? false : get().searchOpen });
    },

    setSearchOpen(open) {
      set({ searchOpen: open, filtersOpen: open ? false : get().filtersOpen });
    },

    loadCountry: (code) => load("countries", code, `/api/countries/${encodeURIComponent(code)}`),
    loadSupplier: (id) => load("suppliers", id, `/api/suppliers/${encodeURIComponent(id)}`),
    loadMineral: (key) => load("minerals", key, `/api/minerals/${encodeURIComponent(key)}`),
  };
});
