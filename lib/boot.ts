/**
 * Coordinates the boot screen with the globe. The globe reports `ready` once it
 * has rendered its first frames off-screen; the boot screen then decides when to
 * `reveal`, and the globe starts its intro at that moment. With no boot screen
 * mounted, everything is revealed immediately.
 */
let active = false;
let ready = false;
let revealed = true;
const listeners = new Set<() => void>();

const emit = () => [...listeners].forEach((l) => l());

export const subscribeBoot = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};
export const getBootReady = () => ready;

export function bootBegin() {
  active = true;
  ready = false;
  revealed = false;
  emit();
}
export function bootReady() {
  if (ready) return;
  ready = true;
  emit();
}
export function bootReveal() {
  revealed = true;
  emit();
}
export function bootEnd() {
  active = false;
  revealed = true;
  emit();
}

/** Runs `callback` once the boot screen starts leaving (immediately if there is none). Returns a canceller. */
export function onBootRevealed(callback: () => void): () => void {
  if (!active || revealed) {
    callback();
    return () => {};
  }
  const check = () => {
    if (!revealed) return;
    listeners.delete(check);
    callback();
  };
  listeners.add(check);
  return () => void listeners.delete(check);
}
