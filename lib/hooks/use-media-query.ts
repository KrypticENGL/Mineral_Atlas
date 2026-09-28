"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a media query. The server snapshot assumes desktop, which is
 * also the primary layout; layout differences themselves are CSS-driven so the
 * first paint never depends on this value.
 */
export function useMediaQuery(query: string, serverValue = true): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
