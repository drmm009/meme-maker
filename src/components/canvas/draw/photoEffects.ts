// Photo effects beyond CSS filters (data/photoFilters): warmth, sharpen and vignette, applied to a
// region of a canvas after it is drawn, and a soft blur for the portrait background. None of them
// uses ctx.filter, so iOS Safari (which ignores canvas filters) looks the same.

export interface PhotoEffects {
  // -100 (cool, blue) .. 100 (warm, orange).
  warmth?: number;
  // 0 .. 100.
  sharpen?: number;
  // 0 .. 100: how dark the edges get.
  vignette?: number;
}

export const hasPhotoEffects = (e: PhotoEffects | null | undefined): boolean =>
  Boolean(e && ((e.warmth || 0) !== 0 || (e.sharpen || 0) > 0 || (e.vignette || 0) > 0));

// Shift colours towards orange (positive) or blue (negative), in place.
export function warmPixels(data: Uint8ClampedArray, amount: number): void {
  const shift = (amount / 100) * 40;
  if (!shift) return;
  for (let i = 0; i < data.length; i += 4) {
    data[i] += shift;
    data[i + 1] += shift * 0.25;
    data[i + 2] -= shift;
  }
}

// Unsharp mask with a 3x3 cross: each pixel pushed away from the average of its neighbours.
export function sharpenPixels(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  const k = (amount / 100) * 0.9;
  if (k <= 0 || w < 3 || h < 3) return;
  const src = new Uint8ClampedArray(data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const centre = src[i + c];
        const around = src[i - 4 + c] + src[i + 4 + c] + src[i - w * 4 + c] + src[i + w * 4 + c];
        data[i + c] = centre + k * (4 * centre - around);
      }
    }
  }
}

// Apply the effects to the w x h region at (x, y) of ctx. A canvas holding cross-origin pixels
// can't be read back, so warmth and sharpen are skipped there; the vignette still applies.
export function applyPhotoEffects(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, e: PhotoEffects): void {
  const rx = Math.max(0, Math.round(x));
  const ry = Math.max(0, Math.round(y));
  const rw = Math.round(w);
  const rh = Math.round(h);
  if (rw < 1 || rh < 1) return;
  if ((e.warmth || 0) !== 0 || (e.sharpen || 0) > 0) {
    try {
      const img = ctx.getImageData(rx, ry, rw, rh);
      if (e.warmth) warmPixels(img.data, e.warmth);
      if ((e.sharpen || 0) > 0) sharpenPixels(img.data, rw, rh, e.sharpen || 0);
      ctx.putImageData(img, rx, ry);
    } catch {
      // Tainted canvas: no pixel access.
    }
  }
  const v = Math.max(0, Math.min(100, e.vignette || 0)) / 100;
  if (v > 0) {
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    const outer = Math.hypot(rw, rh) / 2;
    const g = ctx.createRadialGradient(cx, cy, outer * 0.45, cx, cy, outer);
    if (!g) return;
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, `rgba(0, 0, 0, ${(v * 0.85).toFixed(3)})`);
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();
  }
}

// A blurred copy of `img` at w x h: shrunk by about the radius and smoothly scaled back up (twice,
// so it is soft rather than blocky).
export function blurredCopy(img: CanvasImageSource, w: number, h: number, radius: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(w));
  out.height = Math.max(1, Math.round(h));
  const k = Math.max(1, radius / 2);
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(w / k));
  small.height = Math.max(1, Math.round(h / k));
  const mid = document.createElement('canvas');
  mid.width = Math.max(1, Math.round(w / Math.sqrt(k)));
  mid.height = Math.max(1, Math.round(h / Math.sqrt(k)));
  const sctx = small.getContext('2d');
  const mctx = mid.getContext('2d');
  const octx = out.getContext('2d');
  if (!sctx || !mctx || !octx) return null;
  for (const c of [sctx, mctx, octx]) {
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
  }
  sctx.drawImage(img, 0, 0, small.width, small.height);
  mctx.drawImage(small, 0, 0, mid.width, mid.height);
  octx.drawImage(mid, 0, 0, out.width, out.height);
  return out;
}
