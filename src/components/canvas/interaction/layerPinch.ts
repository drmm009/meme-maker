// Two fingers on a layer: their spread scales it and their turn rotates it. Points are screen
// pixels (the ratio and the angle don't depend on the canvas's scale).
import type { Pt } from './viewZoom';

export interface TwoFingers {
  a: Pt;
  b: Pt;
}

export const fingerSpread = ({ a, b }: TwoFingers): number => Math.hypot(b.x - a.x, b.y - a.y);
export const fingerAngle = ({ a, b }: TwoFingers): number => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

// Within this many degrees of a quarter turn, a rotation snaps onto it.
export const ROTATION_SNAP_DEG = 4;

export function snapRotation(deg: number): number {
  const norm = ((deg % 360) + 360) % 360;
  const nearest = Math.round(norm / 90) * 90;
  return Math.abs(norm - nearest) <= ROTATION_SNAP_DEG ? nearest % 360 : norm;
}

// How much bigger, and how far turned, the layer is now than when the fingers came down.
export function pinchChange(from: TwoFingers, to: TwoFingers, startRotation: number): { scale: number; rotation: number } {
  const scale = fingerSpread(to) / Math.max(1, fingerSpread(from));
  const rotation = snapRotation(startRotation + fingerAngle(to) - fingerAngle(from));
  return { scale, rotation };
}

interface PinchableLayer {
  scale?: number;
  fontSize?: number;
  rotation?: number;
  width?: number;
  height?: number;
  boxWidth?: number;
  boxHeight?: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// What to patch on the layer (as it was when the fingers came down) for this change.
export function pinchPatch(kind: 'caption' | 'sticker' | 'imageLayer', start: PinchableLayer, change: { scale: number; rotation: number }): Partial<PinchableLayer> {
  const k = change.scale;
  if (kind === 'caption') return { fontSize: Math.round(clamp((start.fontSize || 50) * k, 12, 300)), rotation: change.rotation };
  if (kind === 'sticker') return { scale: clamp((start.scale || 1) * k, 0.3, 6), rotation: change.rotation };
  const patch: Partial<PinchableLayer> = { scale: clamp((start.scale || 1) * k, 0.05, 20), rotation: change.rotation };
  if (start.boxWidth && start.boxHeight) Object.assign(patch, { boxWidth: start.boxWidth * k, boxHeight: start.boxHeight * k });
  if (start.width && start.height) Object.assign(patch, { width: start.width * k, height: start.height * k });
  return patch;
}
