"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Check, KeyRound, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  SIGN_OUT_OPTIONS,
  useSettingsStore,
  type RenderQuality,
  type RotationSpeed,
} from "@/lib/settings/settings-store";
import { cn } from "@/lib/utils";
import { changePassword, type PasswordState } from "./actions";
import { MIN_PASSWORD_LENGTH } from "./constants";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="eyebrow pb-1">{title}</h3>
      <div className="divide-y divide-line rounded-xl border border-line">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] text-cream">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-stone">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-line p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs transition-colors",
            o.value === value ? "bg-cream text-ink" : "text-stone hover:text-cream",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SPEEDS: { value: RotationSpeed; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];
const QUALITIES: { value: RenderQuality; label: string }[] = [
  { value: "performance", label: "Fast" },
  { value: "balanced", label: "Balanced" },
  { value: "high", label: "Sharp" },
];
const SIGN_OUT_LABELS = SIGN_OUT_OPTIONS.map((value) => ({
  value: value as number,
  label: value === 0 ? "Never" : value < 60 ? `${value}m` : `${value / 60}h`,
}));

function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, { error: null, done: false });
  const input =
    "w-full rounded-lg border border-line-strong bg-transparent px-3 py-2 text-sm text-cream placeholder:text-dim focus:border-cream focus:outline-none";

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[13px] text-cream">Site password</p>
          <p className="mt-0.5 text-xs text-stone">Other devices are signed out when you change it.</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="glass-control inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs text-stone hover:text-cream"
        >
          <KeyRound className="size-3.5" aria-hidden /> Change
        </button>
      </div>
      {open && (
        <form action={action} className="mt-3 space-y-2">
          <input name="current" type="password" placeholder="Current password" autoComplete="current-password" required className={input} />
          <input
            name="next"
            type="password"
            placeholder={`New password (min ${MIN_PASSWORD_LENGTH} characters)`}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            className={input}
          />
          <input name="confirm" type="password" placeholder="Confirm new password" autoComplete="new-password" required className={input} />
          {state.error && (
            <p role="alert" className="text-xs text-red-400">
              {state.error}
            </p>
          )}
          {state.done && (
            <p role="status" className="flex items-center gap-1.5 text-xs text-sage">
              <Check className="size-3.5" aria-hidden /> Password updated.
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm text-cream transition-colors hover:bg-cream hover:text-ink disabled:opacity-50"
          >
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}

/** Preferences are per browser (localStorage); the password is site-wide. */
export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettingsStore();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] max-w-lg gap-5 overflow-y-auto rounded-2xl border-line bg-ink-2 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-normal">Settings</DialogTitle>
          <DialogDescription className="text-stone">
            Preferences are saved in this browser. Colour theme lives in the sun/moon menu.
          </DialogDescription>
        </DialogHeader>

        <Section title="3D globe">
          <Row label="Auto-rotate" hint="Slowly spin while nothing is selected.">
            <Switch checked={s.autoRotate} onCheckedChange={(v) => s.set("autoRotate", v)} aria-label="Auto-rotate" />
          </Row>
          <Row label="Rotation speed">
            <Segmented label="Rotation speed" value={s.rotationSpeed} options={SPEEDS} onChange={(v) => s.set("rotationSpeed", v)} />
          </Row>
          <Row label="Render quality" hint="Lower is smoother on slow GPUs.">
            <Segmented label="Render quality" value={s.quality} options={QUALITIES} onChange={(v) => s.set("quality", v)} />
          </Row>
          <Row label="Atmosphere glow">
            <Switch checked={s.showAtmosphere} onCheckedChange={(v) => s.set("showAtmosphere", v)} aria-label="Atmosphere glow" />
          </Row>
          <Row label="Grid lines">
            <Switch checked={s.showGraticules} onCheckedChange={(v) => s.set("showGraticules", v)} aria-label="Grid lines" />
          </Row>
          <Row label="Contour backdrop">
            <Switch checked={s.showBackdrop} onCheckedChange={(v) => s.set("showBackdrop", v)} aria-label="Contour backdrop" />
          </Row>
        </Section>

        <Section title="General">
          <Row label="Reduce motion" hint="Skip the intro flight and camera easing.">
            <Switch checked={s.reduceMotion} onCheckedChange={(v) => s.set("reduceMotion", v)} aria-label="Reduce motion" />
          </Row>
          <Row label="Hover tooltip" hint="Country details that follow the cursor.">
            <Switch checked={s.hoverTooltip} onCheckedChange={(v) => s.set("hoverTooltip", v)} aria-label="Hover tooltip" />
          </Row>
          <Row label="Auto sign-out" hint="After this much inactivity.">
            <Segmented
              label="Auto sign-out"
              value={s.autoSignOutMinutes}
              options={SIGN_OUT_LABELS}
              onChange={(v) => s.set("autoSignOutMinutes", v)}
            />
          </Row>
        </Section>

        <Section title="Security">{open && <PasswordForm />}</Section>

        <button
          type="button"
          onClick={s.reset}
          className="inline-flex items-center gap-1.5 self-start text-xs text-stone hover:text-cream"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reset preferences to defaults
        </button>
      </DialogContent>
    </Dialog>
  );
}
