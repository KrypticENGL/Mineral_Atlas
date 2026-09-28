import { BrandMark } from "@/components/dashboard/Header";
import { GlobeLoader } from "@/components/globe/GlobeLoader";

/** Static shell streamed immediately while the atlas index loads. Never a blank screen. */
export function AtlasSkeleton() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink" aria-busy>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,var(--atlas-glow-1)_0%,var(--atlas-glow-2)_42%,var(--atlas-ink)_75%)]" />
      <GlobeLoader label="Loading atlas" />
      <header className="absolute inset-x-0 top-0 px-3 pt-3 lg:px-6">
        <div className="liquid-glass flex h-12 items-center gap-2 rounded-full pl-2.5 sm:pl-3.5">
          <BrandMark className="size-6 text-cream" />
          <span className="font-mono text-[11px] font-medium tracking-[0.3em] text-cream">MINERAL ATLAS</span>
        </div>
      </header>
      <div className="atlas-panel absolute top-[76px] left-6 hidden w-[320px] space-y-5 p-5 lg:block">
        <div className="h-2.5 w-32 animate-pulse rounded-md bg-cream/[0.06]" />
        <div className="h-16 w-56 animate-pulse rounded-md bg-cream/[0.06]" />
        <div className="grid grid-cols-2 gap-5 pt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-cream/[0.05]" />
          ))}
        </div>
      </div>
    </main>
  );
}
