// A video's effect (item.filter.fx): Pixel, Glitch, VHS, Mirror, Thermal, Y2K and Pop, drawn over
// each frame after the colour filter. The preview and the frame-by-frame export draw them with the
// same code (preview/frameEffects); FFmpeg can't, so a clip with one exports frame by frame.
// The pixel maths (the colour maps and the time-seeded randomness) is pure and tested; the rest
// draws on a 2D canvas.

export type ClipFxId = 'pixel' | 'glitch' | 'vhs' | 'mirror' | 'thermal' | 'y2k' | 'pop';

export const CLIP_FX: { id: ClipFxId; label: string }[] = [
  { id: 'glitch', label: 'Glitch' },
  { id: 'pixel', label: 'Pixel' },
  { id: 'vhs', label: 'VHS' },
  { id: 'y2k', label: 'Y2K' },
  { id: 'thermal', label: 'Thermal' },
  { id: 'pop', label: 'Pop' },
  { id: 'mirror', label: 'Mirror' },
];

export const isClipFx = (v: unknown): v is ClipFxId => CLIP_FX.some((f) => f.id === v);

// A repeatable random number in [0, 1) for a seed (the same frame always glitches the same way,
// in the preview and the export).
export const seeded = (seed: number): number => {
  let t = (Math.imul(seed | 0, 0x9e3779b1) + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
const mix = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * t);

// Thermal camera: dark blue through purple, red and orange to yellow-white.
const HEAT = [[8, 8, 60], [90, 20, 150], [220, 30, 80], [255, 140, 0], [255, 240, 120]];
export const thermalColour = (r: number, g: number, b: number): number[] => {
  const x = (lum(r, g, b) / 255) * (HEAT.length - 1);
  const i = Math.min(HEAT.length - 2, Math.floor(x));
  return mix(HEAT[i], HEAT[i + 1], x - i).map(Math.round);
};

// Y2K duotone: shadows electric blue, highlights hot pink.
const Y2K_DARK = [30, 20, 160];
const Y2K_LIGHT = [255, 110, 200];
export const y2kColour = (r: number, g: number, b: number): number[] => mix(Y2K_DARK, Y2K_LIGHT, lum(r, g, b) / 255).map(Math.round);

// Pop: four flat levels a channel, colours pushed apart from grey.
export const popColour = (r: number, g: number, b: number): number[] => {
  const grey = lum(r, g, b);
  return [r, g, b].map((c) => {
    const vivid = Math.min(255, Math.max(0, grey + (c - grey) * 1.6));
    return Math.round(Math.round((vivid / 255) * 3) * 85);
  });
};

// A colour map by brightness as a table (256 levels, r g b each), built once: mapping every pixel
// through it is quick enough for every frame.
const tables = new Map<string, Uint8ClampedArray>();
const tableOf = (key: string, map: (r: number, g: number, b: number) => number[]) => {
  let t = tables.get(key);
  if (!t) {
    t = new Uint8ClampedArray(256 * 3);
    for (let l = 0; l < 256; l++) t.set(map(l, l, l), l * 3);
    tables.set(key, t);
  }
  return t;
};

function mapByBrightness(data: Uint8ClampedArray, table: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const l = ((data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8) * 3;
    data[i] = table[l];
    data[i + 1] = table[l + 1];
    data[i + 2] = table[l + 2];
  }
}

// Pop, inline (it depends on each channel, not just brightness).
function popPixels(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const grey = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.round((grey + (r - grey) * 1.6) / 85) * 85;
    data[i + 1] = Math.round((grey + (g - grey) * 1.6) / 85) * 85;
    data[i + 2] = Math.round((grey + (b - grey) * 1.6) / 85) * 85;
  }
}

// Red and blue moved sideways by their own amounts (pixels; green stays), the edges repeated.
function splitChannels(data: Uint8ClampedArray, w: number, h: number, shiftR: number, shiftB: number) {
  const src = data.slice();
  const last = w - 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const xr = x - shiftR;
      const xb = x - shiftB;
      const i = (row + x) * 4;
      data[i] = src[(row + (xr < 0 ? 0 : xr > last ? last : xr)) * 4];
      data[i + 2] = src[(row + (xb < 0 ? 0 : xb > last ? last : xb)) * 4 + 2];
    }
  }
}

const scratchOf = (holder: { fx?: HTMLCanvasElement | null }, w: number, h: number) => {
  const c = holder.fx || (holder.fx = document.createElement('canvas'));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
};

// Draws effect `fx` over the frame on `ctx` (w x h), at `ms` into the clip's footage.
export function applyClipFx(ctx: CanvasRenderingContext2D, w: number, h: number, fx: ClipFxId, ms: number, holder: { fx?: HTMLCanvasElement | null }) {
  if (fx === 'pixel') {
    // Blocks about 1/28 of the picture's width.
    const block = Math.max(4, Math.round(w / 28));
    const small = scratchOf(holder, Math.max(1, Math.round(w / block)), Math.max(1, Math.round(h / block)));
    const sctx = small.getContext('2d');
    if (!sctx) return;
    sctx.imageSmoothingEnabled = true;
    sctx.clearRect(0, 0, small.width, small.height);
    sctx.drawImage(ctx.canvas, 0, 0, small.width, small.height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(small, 0, 0, w, h);
    ctx.restore();
    return;
  }
  if (fx === 'mirror') {
    // The left half, mirrored onto the right.
    const half = Math.floor(w / 2);
    const copy = scratchOf(holder, w, h);
    const cctx = copy.getContext('2d');
    if (!cctx) return;
    cctx.clearRect(0, 0, w, h);
    cctx.drawImage(ctx.canvas, 0, 0);
    ctx.save();
    ctx.clearRect(w - half, 0, half, h);
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(copy, 0, 0, half, h, 0, 0, half, h);
    ctx.restore();
    return;
  }
  const frame = ctx.getImageData(0, 0, w, h);
  const { data } = frame;
  if (fx === 'thermal') mapByBrightness(data, tableOf('thermal', thermalColour));
  else if (fx === 'y2k') mapByBrightness(data, tableOf('y2k', y2kColour));
  else if (fx === 'pop') popPixels(data);
  else if (fx === 'glitch') {
    // A new glitch every 90 ms: the colours split sideways, and now and then a burst tears bands of
    // the picture across.
    const step = Math.floor(ms / 90);
    const r = (n: number) => seeded(step * 31 + n);
    const burst = r(0) < 0.35;
    const amp = Math.max(2, Math.round(w * (burst ? 0.03 : 0.008)));
    splitChannels(data, w, h, Math.round((r(1) - 0.2) * amp * 2), -Math.round((r(2) - 0.2) * amp * 2));
    if (burst) {
      const src = data.slice();
      const bands = 2 + Math.floor(r(3) * 4);
      for (let b = 0; b < bands; b++) {
        const top = Math.floor(r(10 + b) * h);
        const height = Math.max(2, Math.floor(r(20 + b) * h * 0.08));
        const shift = Math.round((r(30 + b) - 0.5) * w * 0.15);
        for (let y = top; y < Math.min(h, top + height); y++) {
          for (let x = 0; x < w; x++) {
            const sx = (((x - shift) % w) + w) % w;
            const i = (y * w + x) * 4;
            const j = (y * w + sx) * 4;
            data[i] = src[j];
            data[i + 1] = src[j + 1];
            data[i + 2] = src[j + 2];
          }
        }
      }
    }
  } else if (fx === 'vhs') {
    // Soft colour bleed, a little warm and washed out, scan lines, grain, and a tracking band
    // rolling down the picture.
    const src = data.slice();
    const last = w - 1;
    const shiftR = Math.max(1, Math.round(w * 0.006));
    const shiftB = -Math.max(1, Math.round(w * 0.004));
    // Grain from a quick generator seeded per 40 ms (cheap enough for every pixel of every frame).
    let n = Math.imul(Math.floor(ms / 40) + 1, 2654435761) | 0;
    const band = ((ms / 3000) % 1) * h;
    const bandHeight = Math.max(4, h * 0.05);
    for (let y = 0; y < h; y++) {
      const dim = y % 3 === 2 ? 0.82 : 1;
      const grain = Math.abs(y - band) < bandHeight ? 70 : 22;
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const xr = x - shiftR;
        const xb = x - shiftB;
        const i = (row + x) * 4;
        const R = src[(row + (xr < 0 ? 0 : xr > last ? last : xr)) * 4];
        const G = src[i + 1];
        const B = src[(row + (xb < 0 ? 0 : xb > last ? last : xb)) * 4 + 2];
        n = (Math.imul(n, 1664525) + 1013904223) | 0;
        const noise = (((n >>> 16) & 255) / 255 - 0.5) * grain;
        const g = 0.299 * R + 0.587 * G + 0.114 * B;
        data[i] = (g * 0.2 + R * 0.8 + 12 + noise) * dim;
        data[i + 1] = (g * 0.2 + G * 0.8 + 4 + noise) * dim;
        data[i + 2] = (g * 0.2 + B * 0.8 - 6 + noise) * dim;
      }
    }
  }
  ctx.putImageData(frame, 0, 0);
}
