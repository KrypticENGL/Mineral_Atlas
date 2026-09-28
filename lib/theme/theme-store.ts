"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { mapPalette, type MapPalette } from "@/lib/atlas/palette";
import {
  DEFAULT_MODE,
  DEFAULT_PALETTE,
  THEME_MODES,
  THEME_PALETTES,
  THEME_STORAGE_KEY,
  type ThemeMode,
  type ThemePalette,
} from "./themes";

interface ThemeState {
  mode: ThemeMode;
  palette: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
  /** Adopt whatever the pre-paint script applied to <html>. Call once after mount. */
  hydrate: () => void;
}

function apply(mode: ThemeMode, palette: ThemePalette) {
  const root = document.documentElement;
  root.dataset.mode = mode;
  root.dataset.palette = palette;
  root.style.colorScheme = mode;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ mode, palette }));
  } catch {
    // Storage blocked (private mode): the choice still applies for this visit.
  }
}

/** Server render and first client render both use the defaults, so hydration always matches. */
export const useThemeStore = create<ThemeState>()((set, get) => ({
  mode: DEFAULT_MODE,
  palette: DEFAULT_PALETTE,
  setMode(mode) {
    set({ mode });
    apply(mode, get().palette);
  },
  setPalette(palette) {
    set({ palette });
    apply(get().mode, palette);
  },
  hydrate() {
    const { mode, palette } = document.documentElement.dataset;
    set({
      mode: THEME_MODES.includes(mode as ThemeMode) ? (mode as ThemeMode) : DEFAULT_MODE,
      palette: THEME_PALETTES.includes(palette as ThemePalette) ? (palette as ThemePalette) : DEFAULT_PALETTE,
    });
  },
}));

/** Globe/map colours for the active theme. */
export function useMapPalette(): MapPalette {
  const mode = useThemeStore((s) => s.mode);
  const palette = useThemeStore((s) => s.palette);
  return useMemo(() => mapPalette(mode, palette), [mode, palette]);
}
