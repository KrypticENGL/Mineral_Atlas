/** Runs `callback` when the browser is idle (or shortly after, where unsupported). Returns a canceller. */
export function whenIdle(callback: () => void, timeout = 1200): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
}

/**
 * Runs `callback` after the browser has painted a couple of frames. Hidden tabs
 * pause requestAnimationFrame, so a short timer backs it up and nothing waits forever.
 */
export function afterPaint(callback: () => void): () => void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    callback();
  };
  const timer = window.setTimeout(run, 300);
  requestAnimationFrame(() => requestAnimationFrame(run));
  return () => {
    done = true;
    window.clearTimeout(timer);
  };
}
