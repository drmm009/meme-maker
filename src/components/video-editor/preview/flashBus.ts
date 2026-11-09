// What CanvasFlash shows over the preview when a tool acts on the frame in view:
// - freeze: a camera flash, then the still that was made, shrinking away toward the timeline below,
//   and a "Frame frozen" pill;
// - punch: the canvas punches in and back, with a "Zoom punch" pill.
export type Flash = { kind: 'freeze'; url: string } | { kind: 'punch' };

const listeners = new Set<(flash: Flash) => void>();

// Shows `flash` over the preview (nothing happens if no preview is mounted).
export function flashCanvas(flash: Flash) {
  listeners.forEach((listener) => listener(flash));
}

// CanvasFlash listening; returns the way to stop.
export function onFlash(listener: (flash: Flash) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
