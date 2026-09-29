"use client";

import { create } from "zustand";

export const SETTINGS_STORAGE_KEY = "atlas-settings";

export type RotationSpeed = "slow" | "normal" | "fast";
export type RenderQuality = "performance" | "balanced" | "high";

export interface Settings {
  /** Globe */
  autoRotate: boolean;
  rotationSpeed: RotationSpeed;
  quality: RenderQuality;
  showAtmosphere: boolean;
  showGraticules: boolean;
  showBackdrop: boolean;
  /** General */
  reduceMotion: boolean;
  hoverTooltip: boolean;
  /** Minutes of inactivity before signing out; 0 = never. */
  autoSignOutMinutes: number;
}

export const DEFAULT_SETTINGS: Settings = {
  autoRotate: true,
  rotationSpeed: "normal",
  quality: "balanced",
  showAtmosphere: true,
  showGraticules: true,
  showBackdrop: true,
  reduceMotion: false,
  hoverTooltip: true,
  autoSignOutMinutes: 0,
};

export const ROTATION_SPEED: Record<RotationSpeed, number> = { slow: 0.15, normal: 0.32, fast: 0.7 };
/** Cap on the WebGL pixel ratio per quality level. */
export const QUALITY_PIXEL_RATIO: Record<RenderQuality, number> = { performance: 1, balanced: 1.5, high: 2 };
export const SIGN_OUT_OPTIONS = [0, 15, 30, 60, 120] as const;

interface SettingsState extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
  /** Adopt saved settings. Call once after mount, so server and first client render match. */
  hydrate: () => void;
}

function persist(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked (private mode): settings still apply for this visit.
  }
}

/** Keeps only known keys whose value has the same type as the default. */
function sanitize(raw: unknown): Settings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  if (raw && typeof raw === "object") {
    for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) {
      const value = (raw as Record<string, unknown>)[key];
      if (typeof value === typeof fallback) out[key] = value;
    }
  }
  const s = out as unknown as Settings;
  if (!(s.rotationSpeed in ROTATION_SPEED)) s.rotationSpeed = DEFAULT_SETTINGS.rotationSpeed;
  if (!(s.quality in QUALITY_PIXEL_RATIO)) s.quality = DEFAULT_SETTINGS.quality;
  if (!(SIGN_OUT_OPTIONS as readonly number[]).includes(s.autoSignOutMinutes)) {
    s.autoSignOutMinutes = DEFAULT_SETTINGS.autoSignOutMinutes;
  }
  return s;
}

function snapshot(state: SettingsState): Settings {
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS)) out[key] = state[key as keyof Settings];
  return out as unknown as Settings;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULT_SETTINGS,
  set(key, value) {
    set({ [key]: value } as Partial<Settings>);
    persist(snapshot(get()));
  },
  reset() {
    set(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  },
  hydrate() {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) set(sanitize(JSON.parse(saved)));
    } catch {
      // Unreadable or blocked: keep the defaults.
    }
  },
}));
