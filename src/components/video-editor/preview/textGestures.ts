// Pure maths for the preview's text gestures (as the image editor's: interaction/dragMath and
// layerPinch): snapping a dragged layer to the canvas's centre lines, and keeping a layer's
// centre still while a pinch resizes and turns it. Units are stage units.

export interface Rect { x: number; y: number; width: number; height: number }
export interface Size { width: number; height: number }

// Within this share of the canvas width of a centre line, a dragged layer's centre snaps onto it
// (the image editor's SNAP_DIST).
export const SNAP_SHARE = 0.015;

export interface Snap {
  dx: number;
  dy: number;
  // The guide lines to show: x of the vertical one, y of the horizontal one.
  vertical: number | null;
  horizontal: number | null;
}

// How far to shift a layer whose box (on screen, turned or not) is `box` so its centre lands on the
// canvas's centre lines when it is close to them.
export function snapToCentre(box: Rect, canvas: Size, share = SNAP_SHARE): Snap {
  const tol = canvas.width * share;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const midX = canvas.width / 2;
  const midY = canvas.height / 2;
  const snapX = Math.abs(cx - midX) <= tol;
  const snapY = Math.abs(cy - midY) <= tol;
  return {
    dx: snapX ? midX - cx : 0,
    dy: snapY ? midY - cy : 0,
    vertical: snapX ? midX : null,
    horizontal: snapY ? midY : null,
  };
}

// The top-left corner (the point a text box turns about) that puts a `width` × `height` box,
// turned `rotation` degrees, with its centre at `centre`.
export function cornerForCentre(centre: { x: number; y: number }, width: number, height: number, rotation: number): { x: number; y: number } {
  const r = (rotation * Math.PI) / 180;
  const hx = width / 2;
  const hy = height / 2;
  return {
    x: centre.x - (hx * Math.cos(r) - hy * Math.sin(r)),
    y: centre.y - (hx * Math.sin(r) + hy * Math.cos(r)),
  };
}

// The centre of a box whose top-left corner is (x, y), turned `rotation` degrees about it.
export function centreOf(x: number, y: number, width: number, height: number, rotation: number): { x: number; y: number } {
  const r = (rotation * Math.PI) / 180;
  const hx = width / 2;
  const hy = height / 2;
  return { x: x + hx * Math.cos(r) - hy * Math.sin(r), y: y + hx * Math.sin(r) + hy * Math.cos(r) };
}
