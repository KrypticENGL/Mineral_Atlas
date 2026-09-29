"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { bootBegin, bootEnd, bootReady, bootReveal, getBootReady, subscribeBoot } from "@/lib/boot";
import { RockChisel } from "./RockChisel";

/**
 * boot     — hammering the rock.
 * leaving  — tools and captions fade; the rock fades.
 * fading   — the backdrop dissolves onto the page, whose intro starts here.
 */
type Phase = "boot" | "leaving" | "fading" | "gone";

/** Long enough for a few blows to land, short enough not to hold a fast load. */
const MIN_MS = 2400;
/** Never trap the visitor behind the screen if something never reports ready. */
const MAX_MS = 10_000;
/** The rock has mostly faded by now; the page starts to appear. */
const LEAVE_MS = 400;
const FADE_MS = 650;
const STATUS = ["Charting territories", "Locating suppliers", "Assaying prices", "Aligning the globe"];

/** Signals a full-page state (e.g. the database being down) that has no globe to wait for. */
export function BootReady() {
  useEffect(() => bootReady(), []);
  return null;
}

/**
 * BootScreen — covers the whole interface until the globe is ready, so nothing
 * half-loaded is ever visible. It renders in the server HTML (first paint) and
 * dissolves into the globe's intro.
 */
export function BootScreen() {
  const ready = useSyncExternalStore(subscribeBoot, getBootReady, () => false);
  const [phase, setPhase] = useState<Phase>("boot");
  const [step, setStep] = useState(0);
  const mountedAt = useRef(0);

  useEffect(() => {
    const leave = () => setPhase((p) => (p === "boot" ? "leaving" : p));
    mountedAt.current = performance.now();
    bootBegin();
    const max = window.setTimeout(leave, MAX_MS);
    return () => {
      window.clearTimeout(max);
      bootEnd();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(0, MIN_MS - (performance.now() - mountedAt.current));
    const timer = window.setTimeout(() => setPhase((p) => (p === "boot" ? "leaving" : p)), wait);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (phase === "leaving") {
      const timer = window.setTimeout(() => setPhase("fading"), LEAVE_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase === "fading") {
      bootReveal(); // globe intro + panel entrances start now
      const timer = window.setTimeout(() => setPhase("gone"), FADE_MS);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "boot") return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % STATUS.length), 900);
    return () => window.clearInterval(id);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      data-boot-screen=""
      data-phase={phase}
      role="status"
      aria-label="Loading Mineral Atlas"
      aria-hidden={phase !== "boot" || undefined}
      className="boot-screen fixed inset-0 z-[70] grid place-items-center overflow-hidden"
    >
      <div className="boot-backdrop absolute inset-0 bg-ink" aria-hidden>
        <div className="boot-glow absolute inset-0" />
      </div>
      <div className="boot-content relative flex flex-col items-center">
        <RockChisel className="h-[min(34vh,250px)] -translate-x-[9%]" />

        <div className="boot-caption flex flex-col items-center">
          <p className="boot-title mt-7 font-mono text-[11px] font-medium tracking-[0.42em] whitespace-nowrap text-cream">
            MINERAL ATLAS
          </p>
          <p key={step} className="rise mt-3 h-4 font-mono text-[10px] tracking-[0.2em] text-stone uppercase">
            {STATUS[step]}
          </p>
          <div className="boot-bar mt-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
