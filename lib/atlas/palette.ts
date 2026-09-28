import type { ThemeMode, ThemePalette } from "@/lib/theme/themes";

type RGB = readonly [number, number, number];

/**
 * Colours for the 3D globe and the 2D fallback map, shared so both read
 * identically. The page chrome is themed in CSS (globals.css); WebGL can't read
 * CSS variables, so the map keeps its own per-theme table here.
 */
export interface MapPalette {
  ocean: string;
  land: string;
  landStroke: string;
  densityLow: RGB;
  densityHigh: RGB;
  hover: string;
  emptyHover: string;
  selected: string;
  selectedStroke: string;
  side: string;
  point: string;
  pointOnSelected: string;
  /** Rings and faint map lines, as an RGB triple so alpha can vary. */
  ink: RGB;
  atmosphere: string;
  emissive: string;
  specular: string;
  /** State/province borders drawn over the selected country. */
  stateStroke: string;
}

type Tint = Pick<MapPalette, "ocean" | "land" | "densityLow" | "densityHigh" | "hover" | "atmosphere" | "specular">;

const DARK = {
  landStroke: "rgba(235, 229, 219, 0.08)",
  emptyHover: "#25221e",
  selected: "#ebe5db",
  selectedStroke: "rgba(235, 229, 219, 0.9)",
  side: "rgba(13, 14, 12, 0.55)",
  point: "#ebe5db",
  pointOnSelected: "#2a241e",
  ink: [235, 229, 219],
  emissive: "#0a0908",
  stateStroke: "rgba(42, 36, 30, 0.55)",
} as const;

const LIGHT = {
  landStroke: "rgba(31, 28, 24, 0.14)",
  emptyHover: "#e2dbcf",
  selected: "#2b2621",
  selectedStroke: "rgba(31, 28, 24, 0.9)",
  side: "rgba(31, 28, 24, 0.22)",
  point: "#1f1c18",
  pointOnSelected: "#f3efe7",
  ink: [31, 28, 24],
  emissive: "#000000",
  stateStroke: "rgba(243, 239, 231, 0.5)",
} as const;

const TINTS: Record<ThemeMode, Record<ThemePalette, Tint>> = {
  dark: {
    sand: { ocean: "#12110f", land: "#1c1a17", densityLow: [46, 41, 35], densityHigh: [140, 124, 106], hover: "#b3a38f", atmosphere: "#a8998a", specular: "#332d26" },
    forest: { ocean: "#0f1613", land: "#1a1d18", densityLow: [31, 49, 41], densityHigh: [52, 122, 100], hover: "#3f7a66", atmosphere: "#667966", specular: "#26332c" },
    ocean: { ocean: "#0c1218", land: "#171b20", densityLow: [28, 42, 56], densityHigh: [58, 108, 150], hover: "#5b8db5", atmosphere: "#5f7f96", specular: "#243240" },
    ember: { ocean: "#140f0d", land: "#1e1916", densityLow: [52, 34, 27], densityHigh: [150, 80, 52], hover: "#c27a5a", atmosphere: "#a8705a", specular: "#3a2a22" },
  },
  light: {
    sand: { ocean: "#d9d0c2", land: "#f1ece3", densityLow: [228, 218, 203], densityHigh: [150, 128, 102], hover: "#8c7a66", atmosphere: "#cbbca8", specular: "#8a8175" },
    forest: { ocean: "#cfd9d2", land: "#eff1eb", densityLow: [208, 226, 214], densityHigh: [60, 128, 102], hover: "#2b6956", atmosphere: "#9fbfae", specular: "#7f8a83" },
    ocean: { ocean: "#cdd9e3", land: "#eff2f5", densityLow: [208, 222, 236], densityHigh: [58, 108, 150], hover: "#2c5d7c", atmosphere: "#9db8cf", specular: "#7c8792" },
    ember: { ocean: "#e2d4ca", land: "#f4ede7", densityLow: [238, 216, 202], densityHigh: [170, 92, 58], hover: "#8a4a32", atmosphere: "#d6b2a0", specular: "#8d8078" },
  },
};

export function mapPalette(mode: ThemeMode, palette: ThemePalette): MapPalette {
  return { ...(mode === "light" ? LIGHT : DARK), ...TINTS[mode][palette] };
}

export const rgb = ([r, g, b]: RGB, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

/** Supplier density → accent ramp (sqrt scale so small producers stay visible). */
export function densityColor(colors: MapPalette, count: number, max: number): string {
  const t = max > 0 ? Math.sqrt(count / max) : 0;
  const [r0, g0, b0] = colors.densityLow;
  const [r1, g1, b1] = colors.densityHigh;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(r0, r1)}, ${mix(g0, g1)}, ${mix(b0, b1)})`;
}

export interface FillState {
  supplierCount: number;
  maxSuppliers: number;
  selected: boolean;
  hovered: boolean;
}

export function countryFill(colors: MapPalette, { supplierCount, maxSuppliers, selected, hovered }: FillState): string {
  if (selected) return colors.selected;
  if (hovered && supplierCount > 0) return colors.hover;
  if (supplierCount > 0) return densityColor(colors, supplierCount, maxSuppliers);
  return hovered ? colors.emptyHover : colors.land;
}
