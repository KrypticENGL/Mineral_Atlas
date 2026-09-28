"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid h-dvh place-items-center bg-ink px-6 text-center">
      <div className="max-w-md">
        <p className="eyebrow">Mineral Atlas</p>
        <h1 className="mt-2 font-serif text-5xl leading-none text-cream">Something went wrong</h1>
        <p className="mt-4 text-sm text-stone">An unexpected error interrupted the atlas. Your data is unaffected.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 border border-line-strong px-4 py-2 text-sm text-cream transition-colors hover:bg-cream hover:text-ink"
        >
          <RotateCcw className="size-4" aria-hidden /> Try again
        </button>
      </div>
    </main>
  );
}
