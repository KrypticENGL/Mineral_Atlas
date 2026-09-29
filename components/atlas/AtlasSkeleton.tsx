/** Streamed while the atlas index loads. The boot screen covers it; this is just the matching background. */
export function AtlasSkeleton() {
  return <main className="h-dvh w-full bg-ink" aria-busy />;
}
