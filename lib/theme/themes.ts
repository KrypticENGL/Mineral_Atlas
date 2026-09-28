export const THEME_MODES = ["dark", "light"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_PALETTES = ["sand", "forest", "ocean", "ember"] as const;
export type ThemePalette = (typeof THEME_PALETTES)[number];

/** Label and a representative swatch for the theme picker. */
export const PALETTE_META: Record<ThemePalette, { label: string; swatch: string }> = {
  sand: { label: "Sand", swatch: "#b3a38f" },
  forest: { label: "Forest", swatch: "#3f7a66" },
  ocean: { label: "Ocean", swatch: "#4f82ab" },
  ember: { label: "Ember", swatch: "#c27a5a" },
};

export const DEFAULT_MODE: ThemeMode = "dark";
export const DEFAULT_PALETTE: ThemePalette = "sand";
export const THEME_STORAGE_KEY = "atlas-theme";

/**
 * Runs before first paint (inlined in <head>) so the stored theme applies
 * without a flash. First visits follow the OS light/dark preference.
 */
export const THEME_BOOTSTRAP = `(()=>{try{var d=document.documentElement,s=JSON.parse(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})||"{}"),m=s.mode||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");d.dataset.mode=m;d.dataset.palette=s.palette||${JSON.stringify(
  DEFAULT_PALETTE,
)};d.style.colorScheme=m}catch(e){}})()`;
