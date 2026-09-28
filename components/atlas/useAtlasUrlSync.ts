"use client";

import { useEffect } from "react";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { useAtlas } from "./AtlasProvider";

/**
 * Mirrors the exploration state (country / supplier / mineral) into the URL so
 * views are shareable, using `history.replaceState` — no Next.js navigation,
 * no server round-trip, no re-render of the page.
 */
export function useAtlasUrlSync() {
  const { lookups } = useAtlas();

  // Restore once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const store = useAtlasStore.getState();
    const mineral = params.get("mineral");
    const match = mineral ? lookups.index.minerals.find((m) => m.slug === mineral) : undefined;
    if (match) store.setFilter("mineralId", match.id);

    const code = params.get("country")?.toUpperCase();
    const country = code ? lookups.countryByCode.get(code) : undefined;
    if (country) {
      store.selectCountry(country.code, { lat: country.lat, lng: country.lng });
      const supplier = params.get("supplier");
      if (supplier && lookups.supplierById.get(supplier)?.countryId === country.id) {
        store.openSupplier(supplier, country.code);
      }
    }
  }, [lookups]);

  // Write on change.
  useEffect(
    () =>
      useAtlasStore.subscribe((s, prev) => {
        if (
          s.selectedCountry === prev.selectedCountry &&
          s.selectedSupplierId === prev.selectedSupplierId &&
          s.filters.mineralId === prev.filters.mineralId
        ) {
          return;
        }
        const url = new URL(window.location.href);
        const set = (key: string, value: string | null | undefined) =>
          value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
        set("country", s.selectedCountry);
        set("supplier", s.selectedSupplierId);
        set("mineral", s.filters.mineralId ? lookups.mineralById.get(s.filters.mineralId)?.slug : null);
        window.history.replaceState(window.history.state, "", url);
      }),
    [lookups],
  );
}
