/** Quiet cartographic loading state shown while the WebGL bundle and boundaries load. */
export function GlobeLoader({ label = "Preparing globe" }: { label?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
      <div className="relative grid size-[min(62vh,62vw)] place-items-center">
        <div className="absolute inset-0 rounded-full border border-line" />
        <div className="absolute inset-[12%] rounded-full border border-line/60" />
        <div className="absolute inset-0 animate-[spin_14s_linear_infinite] rounded-full border-t border-sage/60" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <p className="eyebrow relative bg-ink px-3 py-1">{label}</p>
      </div>
    </div>
  );
}
