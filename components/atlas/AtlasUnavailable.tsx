import { DatabaseZap } from "lucide-react";
import { BrandMark } from "@/components/dashboard/Header";

/** Full-page state when the catalogue cannot be read (e.g. Postgres is down). */
export function AtlasUnavailable({ onRetryHref = "/" }: { onRetryHref?: string }) {
  return (
    <main className="relative grid h-dvh w-full place-items-center overflow-hidden bg-ink px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,#161a15_0%,#0d0e0c_70%)]" />
      <div className="relative max-w-md text-center">
        <BrandMark className="mx-auto size-10 text-cream" />
        <p className="eyebrow mt-6">Mineral Atlas</p>
        <h1 className="mt-2 font-serif text-5xl leading-none text-cream">Database unavailable</h1>
        <p className="mt-4 text-sm leading-relaxed text-stone">
          The mineral catalogue can’t be reached right now. If you’re running locally, make sure PostgreSQL is up (
          <code className="font-mono text-xs text-beige">npm run db:up</code>) and migrated.
        </p>
        <a
          href={onRetryHref}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm text-cream transition-colors hover:bg-cream hover:text-ink"
        >
          <DatabaseZap className="size-4" aria-hidden /> Try again
        </a>
      </div>
    </main>
  );
}
