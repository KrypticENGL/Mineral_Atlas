"use client";

import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeStore } from "@/lib/theme/theme-store";
import { PALETTE_META, THEME_PALETTES, type ThemeMode, type ThemePalette } from "@/lib/theme/themes";

const MODES: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "light", label: "Light", Icon: Sun },
];

/** Appearance picker: light/dark mode plus an accent palette. Persisted per browser. */
export function ThemeMenu() {
  const mode = useThemeStore((s) => s.mode);
  const palette = useThemeStore((s) => s.palette);
  const setMode = useThemeStore((s) => s.setMode);
  const setPalette = useThemeStore((s) => s.setPalette);
  const ModeIcon = mode === "light" ? Sun : Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Appearance"
        title="Appearance"
        className="glass-control group inline-flex size-9 items-center justify-center rounded-full text-stone transition-colors hover:text-cream"
      >
        <ModeIcon className="size-4 transition-transform duration-500 ease-atlas group-hover:rotate-[24deg]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={14} className="w-56 rounded-2xl border border-line bg-ink-2 p-1.5 ring-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="eyebrow">Mode</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as ThemeMode)}>
            {MODES.map(({ value, label, Icon }) => (
              <DropdownMenuRadioItem key={value} value={value} closeOnClick={false} className="rounded-lg">
                <Icon className="text-stone" /> {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="eyebrow">Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={palette} onValueChange={(v) => setPalette(v as ThemePalette)}>
            {THEME_PALETTES.map((value) => (
              <DropdownMenuRadioItem key={value} value={value} closeOnClick={false} className="rounded-lg">
                <span
                  aria-hidden
                  className="size-3.5 rounded-full ring-1 ring-line-strong"
                  style={{ background: PALETTE_META[value].swatch }}
                />
                {PALETTE_META[value].label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
