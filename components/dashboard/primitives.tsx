"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { BadgeCheck, CircleDashed, ShieldAlert } from "lucide-react";
import { animate, useReducedMotion } from "motion/react";
import { AVAILABILITY_LABEL, CATEGORY_LABEL, formatCount, RISK_LABEL } from "@/lib/atlas/format";
import { cn } from "@/lib/utils";
import type { MineralCategory } from "@/types/mineral";
import type { Availability } from "@/types/pricing";
import type { RiskLevel } from "@/types/supplier";

export const CATEGORY_COLOR: Record<MineralCategory, string> = {
  METALLIC: "#8fb8a3",
  INDUSTRIAL: "#cec1b4",
  PRECIOUS: "#c9a45c",
  ENERGY: "#c27a5a",
  GEMSTONE: "#a99cb4",
  PACKAGING: "#7f93a6",
};

const AVAILABILITY_COLOR: Record<Availability, string> = {
  AVAILABLE: "#8fb8a3",
  LIMITED: "#c9a45c",
  ON_REQUEST: "#aea49a",
  UNAVAILABLE: "#c27a5a",
};

/** Stagger index for the .rise / .focus-in / .grow-x entrance utilities. */
export function stagger(i: number, delayMs?: number): CSSProperties {
  return { "--i": i, ...(delayMs !== undefined && { "--rise-delay": `${delayMs}ms` }) } as CSSProperties;
}

/**
 * A count that rolls to its new value (from zero on first paint). Text is
 * written straight to the DOM on each frame, so the tween never re-renders React.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const reduced = useReducedMotion();
  const [initial] = useState(() => formatCount(0));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || shown.current === value) {
      shown.current = value;
      el.textContent = formatCount(value);
      return;
    }
    const controls = animate(shown.current, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = formatCount(Math.round(v));
      },
      onComplete: () => {
        shown.current = value;
      },
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span ref={ref} aria-label={formatCount(value)}>
      {initial}
    </span>
  );
}

export function SectionLabel({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <h3 className="eyebrow shrink-0">{children}</h3>
      <span aria-hidden className="grow-x h-px flex-1 bg-line" />
      {action}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p className="tabular mt-1 font-serif text-[34px] leading-none text-cream">{value}</p>
      {sub && <p className="mt-1 truncate text-[11px] text-dim">{sub}</p>}
    </div>
  );
}

export function CategoryDot({ category, className }: { category: MineralCategory; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-1.5 shrink-0 rotate-45", className)}
      style={{ background: CATEGORY_COLOR[category] }}
    />
  );
}

export function CategoryTag({ category }: { category: MineralCategory }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-stone uppercase">
      <CategoryDot category={category} />
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export function AvailabilityBadge({ availability, className }: { availability: Availability; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap text-stone", className)}>
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: AVAILABILITY_COLOR[availability] }}
      />
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}

export function VerifiedBadge({ verified, compact = false }: { verified: boolean; compact?: boolean }) {
  if (!verified) {
    return compact ? null : (
      <span className="inline-flex items-center gap-1 text-[11px] text-dim">
        <CircleDashed className="size-3" aria-hidden />
        Unverified
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] text-lichen"
      title="Verified supplier"
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      {!compact && "Verified"}
      {compact && <span className="sr-only">Verified</span>}
    </span>
  );
}

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: "#8fb8a3",
  MODERATE: "#c9a45c",
  HIGH: "#c27a5a",
  SCAM: "#e0604e",
};

/** Due-diligence rating. `compact` renders nothing for low/moderate risk. */
export function RiskBadge({ risk, compact = false }: { risk: RiskLevel; compact?: boolean }) {
  const alarming = risk === "HIGH" || risk === "SCAM";
  if (compact && !alarming) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] whitespace-nowrap"
      style={{ color: RISK_COLOR[risk] }}
      title={RISK_LABEL[risk]}
    >
      {alarming ? (
        <ShieldAlert className="size-3.5" aria-hidden />
      ) : (
        <span aria-hidden className="size-1.5 rounded-full" style={{ background: RISK_COLOR[risk] }} />
      )}
      {RISK_LABEL[risk]}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("shimmer rounded-md", className)} />;
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-8 text-center">
      {icon && <div className="mb-3 text-dim">{icon}</div>}
      <p className="font-serif text-xl text-cream">{title}</p>
      {children && <div className="mt-1.5 max-w-72 text-xs leading-relaxed text-stone">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TextButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "press inline-flex items-center gap-1.5 text-xs text-stone underline decoration-line-strong underline-offset-4 hover:text-cream hover:decoration-cream disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, label, ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "press inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-transparent text-stone hover:border-line hover:bg-cream/[0.04] hover:text-cream [&_.lucide-x]:transition-transform [&_.lucide-x]:duration-500 [&_.lucide-x]:ease-atlas hover:[&_.lucide-x]:rotate-90",
        className,
      )}
      {...props}
    />
  );
}

/** Thin horizontal proportion bar for ranked lists. */
export function Bar({
  value,
  max,
  tone = "var(--atlas-sage)",
  index = 0,
}: {
  value: number;
  max: number;
  tone?: string;
  /** Position in its list, for a staggered grow-in. */
  index?: number;
}) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <span aria-hidden className="relative block h-px w-full bg-line">
      {/* Grows in on mount; later changes glide via the width transition. */}
      <span
        className="grow-x absolute inset-y-[-0.5px] left-0 h-[2px] rounded-full transition-[width,background-color] duration-700 ease-atlas"
        style={{ width: `${pct}%`, background: tone, ...stagger(index) }}
      />
    </span>
  );
}
