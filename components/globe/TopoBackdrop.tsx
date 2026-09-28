"use client";

import { useEffect, useRef } from "react";

/** Grid spacing (CSS px) the height field is sampled at. */
const CELL = 6;
/** Number of contour levels across the field. */
const LEVELS = 34;
/** Rough size of one "hill", in CSS px. */
const FEATURE = 260;

// Seeded value noise, so the map is identical on every load.
const LATTICE = 64;
const lattice = (() => {
  let seed = 7;
  return Float64Array.from({ length: LATTICE * LATTICE }, () => (seed = (seed * 16807) % 2147483647) / 2147483647);
})();
const smooth = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const g = (i: number, j: number) => lattice[(j & (LATTICE - 1)) * LATTICE + (i & (LATTICE - 1))];
  const a = g(xi, yi);
  const b = g(xi + 1, yi);
  const c = g(xi, yi + 1);
  const d = g(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

/** Domain-warped fBm: long, flowing ridges like a topographic survey. */
function height(x: number, y: number) {
  const u = x / FEATURE;
  const v = y / FEATURE;
  const wu = u + 1.4 * noise(u * 0.7, v * 0.7);
  const wv = v + 1.4 * noise(u * 0.7 + 9.3, v * 0.7 + 4.1);
  let sum = 0;
  let amp = 1;
  let freq = 1;
  for (let o = 0; o < 4; o++) {
    sum += amp * noise(wu * freq, wv * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return sum + u * 0.12; // a gentle tilt so the bands sweep diagonally
}

/** Marching-squares segments per case, as pairs of edges (0 top, 1 right, 2 bottom, 3 left). */
const CASES: number[][] = [
  [], [3, 2], [2, 1], [3, 1], [0, 1], [0, 1, 3, 2], [0, 2], [0, 3],
  [0, 3], [0, 2], [0, 3, 2, 1], [0, 1], [3, 1], [2, 1], [3, 2], [],
];

function draw(canvas: HTMLCanvasElement) {
  const { width, height: h } = canvas.getBoundingClientRect();
  if (width === 0 || h === 0) return;
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(h / CELL) + 1;
  const field = new Float64Array(cols * rows);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const value = height(i * CELL, j * CELL);
      field[j * cols + i] = value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, h);
  ctx.strokeStyle = getComputedStyle(canvas).color;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.beginPath();

  for (let level = 0; level < LEVELS; level++) {
    const t = min + ((max - min) * (level + 0.5)) / LEVELS;
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i];
        const b = field[j * cols + i + 1];
        const c = field[(j + 1) * cols + i + 1];
        const d = field[(j + 1) * cols + i];
        const segments = CASES[(a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0)];
        if (segments.length === 0) continue;
        const x = i * CELL;
        const y = j * CELL;
        const point = (edge: number): [number, number] => {
          if (edge === 0) return [x + ((t - a) / (b - a)) * CELL, y];
          if (edge === 1) return [x + CELL, y + ((t - b) / (c - b)) * CELL];
          if (edge === 2) return [x + ((t - d) / (c - d)) * CELL, y + CELL];
          return [x, y + ((t - a) / (d - a)) * CELL];
        };
        for (let s = 0; s < segments.length; s += 2) {
          const [x1, y1] = point(segments[s]);
          const [x2, y2] = point(segments[s + 1]);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
      }
    }
  }
  ctx.stroke();
}

/**
 * TopoBackdrop — contour-line artwork behind the globe, drawn once to a canvas
 * (and again on resize or theme change). Colour comes from CSS `color`.
 */
export function TopoBackdrop({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let timer: number | undefined;
    const redraw = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => draw(canvas), 120);
    };
    draw(canvas);
    const resize = new ResizeObserver(redraw);
    resize.observe(canvas);
    // Theme switches change the stroke colour.
    const theme = new MutationObserver(redraw);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-mode", "data-palette"] });
    return () => {
      window.clearTimeout(timer);
      resize.disconnect();
      theme.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
