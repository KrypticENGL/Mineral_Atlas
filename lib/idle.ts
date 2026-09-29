/** Runs `callback` when the browser is idle (or shortly after, where unsupported). Returns a canceller. */
export function whenIdle(callback: () => void, timeout = 1200): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
}
