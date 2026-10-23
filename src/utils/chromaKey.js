// Green-screen (chroma key) removal shared by the live preview and the FFmpeg export.
// The preview mirrors FFmpeg's `chromakey` (alpha from the pixel's chroma distance to the key
// colour in YUV) and `despill` (pull the key colour's tint off the edges), so both look the same.

export const DEFAULT_CHROMA_KEY = { color: '#00ff00', similarity: 0.22, blend: 0.08 };

// A key's colour is a hex value, or 'auto' until the preview samples it from the video.
export const resolveKeyColor = (color) => (/^#[0-9a-f]{6}$/i.test(color || '') ? color : DEFAULT_CHROMA_KEY.color);

const hexToRgb = (hex) => {
  const n = parseInt((hex || '#00ff00').replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r, g, b) => `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

// BT.601 chroma, as FFmpeg computes it for the key colour.
export const rgbToUV = (r, g, b) => [
  -0.169 * r - 0.331 * g + 0.5 * b + 128,
  0.5 * r - 0.419 * g - 0.081 * b + 128,
];

// Opacity (0..1) for a pixel: 0 when its chroma is within `similarity` of the key, ramping to 1 over `blend`.
export const keyAlpha = (r, g, b, keyUV, similarity, blend) => {
  const [u, v] = rgbToUV(r, g, b);
  const du = u - keyUV[0];
  const dv = v - keyUV[1];
  const diff = Math.sqrt((du * du + dv * dv) / (255 * 255 * 2));
  if (blend > 0.0001) return Math.min(1, Math.max(0, (diff - similarity) / blend));
  return diff > similarity ? 1 : 0;
};

// Which channel the key colour is (green or blue screens get despill; anything else doesn't).
export const spillChannel = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  if (g > r && g > b) return 'green';
  if (b > r && b > g) return 'blue';
  return null;
};

// Key an RGBA buffer in place: transparent background, key-colour spill removed from what's left.
export const applyChromaKey = (data, key) => {
  const color = resolveKeyColor(key.color);
  const keyUV = rgbToUV(...hexToRgb(color));
  const spill = spillChannel(color);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i + 3] = Math.round(data[i + 3] * keyAlpha(r, g, b, keyUV, key.similarity, key.blend));
    // FFmpeg despill defaults (mix 0.5): the key channel can't exceed the average of the other two.
    if (spill === 'green') data[i + 1] = Math.min(g, (r + b) / 2);
    else if (spill === 'blue') data[i + 2] = Math.min(b, (r + g) / 2);
  }
  return data;
};

// How far the key colour is from grey, on the same 0..1 scale as similarity. Every neutral pixel
// (black, white, grey clothing) sits exactly this far from the key.
export const keySaturation = (hex) => {
  const [u, v] = rgbToUV(...hexToRgb(resolveKeyColor(hex)));
  return Math.sqrt(((u - 128) ** 2 + (v - 128) ** 2) / (255 * 255 * 2));
};

// Tolerances that suit a key colour: fully transparent within 40% of its saturation, fully opaque
// by 60%, so neutral colours stay solid even on dull, dark green screens.
export const suggestTolerance = (hex) => {
  const sat = keySaturation(hex);
  return { similarity: Number((sat * 0.4).toFixed(3)), blend: Number((sat * 0.2).toFixed(3)) };
};

// Guess the screen colour from a frame's four corners (5% squares). Falls back to pure green
// when the corners aren't a green or blue screen.
export const sampleKeyColor = (data, width, height) => {
  const size = Math.max(1, Math.round(Math.min(width, height) * 0.05));
  const sum = [0, 0, 0];
  let n = 0;
  for (const [x0, y0] of [[0, 0], [width - size, 0], [0, height - size], [width - size, height - size]]) {
    for (let y = y0; y < y0 + size; y++) {
      for (let x = x0; x < x0 + size; x++) {
        const i = (y * width + x) * 4;
        sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2];
        n++;
      }
    }
  }
  const hex = toHex(sum[0] / n, sum[1] / n, sum[2] / n);
  return spillChannel(hex) ? hex : DEFAULT_CHROMA_KEY.color;
};

// FFmpeg filter chain (leading comma) that keys a scaled video stream, or '' when off.
export const chromaKeyFilter = (key) => {
  if (!key) return '';
  const hex = resolveKeyColor(key.color);
  const color = `0x${hex.replace('#', '').toUpperCase()}`;
  const sim = Math.min(1, Math.max(0.01, key.similarity)).toFixed(3);
  const blend = Math.min(1, Math.max(0, key.blend)).toFixed(3);
  const spill = spillChannel(hex);
  return `,format=yuva420p,chromakey=${color}:${sim}:${blend}${spill ? `,despill=type=${spill}` : ''}`;
};
