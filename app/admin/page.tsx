import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/dashboard/Header";

export const metadata: Metadata = { title: "Administration — Mineral Atlas" };

const OPERATIONS = [
  ["Countries", "addCountry · updateCountry · removeCountry"],
  ["Suppliers", "addSupplier · updateSupplier · removeSupplier"],
  ["Minerals", "addMineral · updateMineral · removeMineral"],
  ["Pricing", "publishPrice (keeps history) · correctPrice · removePrice"],
] as const;

/** Placeholder: the write-side service exists; the UI and auth do not yet. */
export default function AdminPage() {
  return (
    <main className="h-dvh overflow-y-auto bg-ink px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-stone hover:text-cream">
          <ArrowLeft className="size-3.5" aria-hidden /> Back to the atlas
        </Link>
        <div className="mt-10 flex items-center gap-3">
          <BrandMark className="size-8 text-cream" />
          <p className="eyebrow">Mineral Atlas · Administration</p>
        </div>
        <h1 className="mt-4 font-serif text-6xl leading-none text-cream">Coming soon</h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-stone">
          Catalogue management isn’t exposed in this MVP. The data layer is ready for it: every operation below exists
          in <code className="font-mono text-xs text-beige">lib/services/admin-service.ts</code> and invalidates the
          cached catalogue on write. An admin UI only needs authentication and forms on top.
        </p>
        <dl className="mt-8 divide-y divide-line border-y border-line">
          {OPERATIONS.map(([entity, ops]) => (
            <div key={entity} className="grid grid-cols-[140px_1fr] gap-4 py-3.5">
              <dt className="font-serif text-xl text-cream">{entity}</dt>
              <dd className="self-center font-mono text-xs text-stone">{ops}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
