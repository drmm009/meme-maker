// Zooming and panning the editor's view of the canvas: a CSS transform on the canvas wrapper, so
// the meme itself (and the export) never changes. Points are screen pixels measured from the
// centre of the wrapper's unzoomed box; the wrapper scales about that centre, then moves by (x, y).

export interface CanvasView {
  zoom: number;
  x: number;
  y: number;
}

export interface Pt {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Two fingers: their midpoint and how far apart they are.
export interface Pinch {
  mid: Pt;
  dist: number;
}

export const IDENTITY_VIEW: CanvasView = { zoom: 1, x: 0, y: 0 };
export const MAX_ZOOM = 5;

export const isZoomed = (v: CanvasView): boolean => v.zoom > 1.01;

// Keeps the zoom between 1x and MAX_ZOOM and the zoomed canvas covering its unzoomed box, so it
// can't be pushed out of sight. Back at 1x the view snaps home.
export function clampView(v: CanvasView, size: Size): CanvasView {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom));
  if (!isZoomed({ ...v, zoom })) return IDENTITY_VIEW;
  const maxX = ((zoom - 1) * size.width) / 2;
  const maxY = ((zoom - 1) * size.height) / 2;
  return { zoom, x: Math.min(maxX, Math.max(-maxX, v.x)), y: Math.min(maxY, Math.max(-maxY, v.y)) };
}

// Zooms to `zoom`, keeping the content under `at` where it is.
export function zoomAt(v: CanvasView, zoom: number, at: Pt, size: Size): CanvasView {
  const ux = (at.x - v.x) / v.zoom;
  const uy = (at.y - v.y) / v.zoom;
  return clampView({ zoom, x: at.x - zoom * ux, y: at.y - zoom * uy }, size);
}

// The zoom follows the fingers' spread, and the content under their midpoint follows the midpoint
// (so two fingers moving together pan).
export function pinchView(start: CanvasView, from: Pinch, to: Pinch, size: Size): CanvasView {
  const zoom = start.zoom * (to.dist / Math.max(1, from.dist));
  const ux = (from.mid.x - start.x) / start.zoom;
  const uy = (from.mid.y - start.y) / start.zoom;
  return clampView({ zoom, x: to.mid.x - zoom * ux, y: to.mid.y - zoom * uy }, size);
}

export const panView = (start: CanvasView, dx: number, dy: number, size: Size): CanvasView =>
  clampView({ ...start, x: start.x + dx, y: start.y + dy }, size);

// How much one wheel event zooms: a trackpad pinch sends small deltas, a ctrl + mouse wheel
// notch about 100 (roughly 1.4x).
export const wheelZoomFactor = (deltaY: number): number => Math.exp(-deltaY * 0.0035);

export function pinchOf(touches: ArrayLike<{ clientX: number; clientY: number }> | undefined): Pinch | null {
  if (!touches || touches.length < 2) return null;
  const a = touches[0];
  const b = touches[1];
  return {
    mid: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
    dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
  };
}
