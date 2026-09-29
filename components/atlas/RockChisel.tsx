"use client";

import { useState, type CSSProperties } from "react";
import { ELEMENTS } from "./elements";

/** One swing, in seconds. The hammer lands at HIT of it; symbols are re-rolled at SWAP_AT, when no chunk is visible. */
const CYCLE_S = 1.9;
const SWAP_AT = 0.97;

/** Where the chisel tip meets the rock, in rock.svg units (viewBox 217.57 × 272.25). */
const IMPACT = { x: 158, y: 100 };
/** Chisel leans 35° at 1.3×, so its head sits ~78 units back along its axis. The hammer (1.35×) pivots where its face lands there. */
const HAMMER_PIVOT = { x: 202.7, y: -66.5 };

/** Irregular chunks, centred on their own origin. */
const CHUNK_SHAPES = [
  "M-12 -3 L-4 -12 L8 -9 L13 1 L8 11 L-3 12 L-11 6 Z",
  "M-10 -7 L2 -13 L12 -4 L10 8 L0 12 L-12 5 Z",
  "M-9 -9 L7 -11 L13 2 L5 11 L-7 10 L-13 0 Z",
];

/** Flight of each chunk: peak and landing offsets from the impact point, plus its spin. */
const CHUNKS = [
  { px: 30, py: -46, dx: 58, dy: 52, rot: 210 },
  { px: 56, py: -20, dx: 100, dy: 66, rot: -170 },
  { px: 12, py: -64, dx: 26, dy: 74, rot: 120 },
] as const;

/**
 * RockChisel — a chisel is hammered into rock.svg; each blow chips off two or three
 * mineral chunks that carry their symbol. The rock is the stage's centre and is what
 * the boot screen finally grows and fades. Everything runs off one CSS clock; a
 * phase-shifted twin reports the iteration boundary so symbols change between blows.
 */
export function RockChisel({ className }: { className?: string }) {
  const [cycle, setCycle] = useState(0);
  const chunkCount = cycle % 2 === 0 ? 3 : 2;

  return (
    <div className={`rc-stage relative aspect-[217.57/272.25] ${className ?? ""}`} aria-hidden>
      <div className="rc-rock absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- a small static line drawing */}
        <img src="/rock.svg" alt="" draggable={false} className="rc-rock-img absolute inset-0 size-full" />
      </div>

      <svg viewBox="0 0 217.57 272.25" className="rc-tools absolute inset-0 size-full overflow-visible" fill="none">
        <rect
          width="0"
          height="0"
          className="rc-clock"
          style={{ animationDuration: `${CYCLE_S}s`, animationDelay: `${-(1 - SWAP_AT) * CYCLE_S}s` }}
          onAnimationIteration={() => setCycle((c) => c + 1)}
        />

        {/* Chunks fly from the impact point; they sit under the chisel. */}
        <g transform={`translate(${IMPACT.x} ${IMPACT.y})`}>
          {CHUNKS.slice(0, chunkCount).map((c, k) => {
            const el = ELEMENTS[(cycle * 3 + k) % ELEMENTS.length];
            return (
              <g
                key={k}
                className="rc-chunk"
                style={
                  {
                    "--mb-color": el.color,
                    "--px": `${c.px}px`,
                    "--py": `${c.py}px`,
                    "--dx": `${c.dx}px`,
                    "--dy": `${c.dy}px`,
                    "--rot": `${c.rot}deg`,
                    animationDuration: `${CYCLE_S}s`,
                  } as CSSProperties
                }
              >
                <g transform="scale(1.5)">
                  <path d={CHUNK_SHAPES[k]} className="rc-chunk-face rc-spin" />
                  <text y="4" textAnchor="middle" className="rc-chunk-symbol">
                    {el.symbol}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Chisel: tip at the impact point, leaning 35° back toward the hammer. */}
        <g transform={`translate(${IMPACT.x} ${IMPACT.y}) rotate(35) scale(1.3)`}>
          <g className="rc-chisel" style={{ animationDuration: `${CYCLE_S}s` }}>
            <path d="M0 0 L3.4 -13 L2.7 -52 L5.6 -54.5 L5.6 -60 L-5.6 -60 L-5.6 -54.5 L-2.7 -52 L-3.4 -13 Z" className="rc-steel" />
            <path d="M-0.9 -14 L-0.9 -50" className="rc-shine" />
          </g>
        </g>

        <g transform={`translate(${IMPACT.x} ${IMPACT.y})`}>
          <g className="rc-spark" style={{ animationDuration: `${CYCLE_S}s` }}>
            <path d="M0 -6 L0 -15 M6 -3 L14 -8 M7 3 L16 5 M-5 -4 L-11 -10 M4 -8 L8 -17" className="rc-spark-ray" />
          </g>
        </g>

        {/* Hammer: swings about a pivot above the chisel head. */}
        <g transform={`translate(${HAMMER_PIVOT.x} ${HAMMER_PIVOT.y}) scale(1.35)`}>
          <g className="rc-hammer" style={{ animationDuration: `${CYCLE_S}s` }}>
            <rect x="-2.6" y="0" width="5.2" height="64" rx="2.2" className="rc-handle" />
            <rect x="-17" y="61" width="34" height="15" rx="2.5" className="rc-steel" />
            <path d="M-13 65 L13 65" className="rc-shine" />
          </g>
        </g>
      </svg>
    </div>
  );
}
