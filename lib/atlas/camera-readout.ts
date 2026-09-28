/**
 * Tiny pub/sub for the live camera position. The globe emits on every frame of
 * movement; subscribers write straight to the DOM so React never re-renders.
 */
export interface CameraPosition {
  lat: number;
  lng: number;
  altitude: number;
}

type Listener = (pos: CameraPosition) => void;

const listeners = new Set<Listener>();
let last: CameraPosition | null = null;

export const cameraReadout = {
  emit(pos: CameraPosition) {
    last = pos;
    for (const listener of listeners) listener(pos);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    if (last) listener(last);
    return () => listeners.delete(listener);
  },
};
