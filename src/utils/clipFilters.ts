// Colour filters for video and photo clips, shared by the preview (a CSS filter string on a canvas)
// and the export (an FFmpeg chain doing the same maths). item.filter = { preset, brightness,
// contrast, saturation } with the three adjustments in -100..100.
import type { ClipFilter } from '../model/videoProject';

// A filter as numbers: CSS filter amounts (1 = unchanged; hue in degrees).
export interface FilterValues {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  hue: number;
}
type Matrix = number[][];

export const FILTER_PRESETS: { id: string | null; label: string; values: Partial<FilterValues> }[] = [
  { id: null, label: 'None', values: {} },
  { id: 'bw', label: 'B&W', values: { saturate: 0, contrast: 1.1 } },
  { id: 'vintage', label: 'Vintage', values: { sepia: 0.45, saturate: 0.85, contrast: 1.05, brightness: 1.05 } },
  { id: 'vivid', label: 'Vivid', values: { saturate: 1.6, contrast: 1.15 } },
  { id: 'faded', label: 'Faded', values: { saturate: 0.75, contrast: 0.8, brightness: 1.1 } },
  { id: 'noir', label: 'Noir', values: { saturate: 0, contrast: 1.5, brightness: 0.9 } },
  { id: 'deepfried', label: 'Deep fried', values: { saturate: 3, contrast: 1.8, brightness: 1.15, hue: -12 } },
];

const NEUTRAL: FilterValues = { brightness: 1, contrast: 1, saturate: 1, sepia: 0, hue: 0 };

// Numbers for a clip's filter: the preset's, then the sliders on top (brightness and contrast
// 0.5x-1.5x, saturation 0x-2x). Null when the result changes nothing.
export const resolveFilter = (filter: ClipFilter | null | undefined): FilterValues | null => {
  if (!filter) return null;
  const preset = FILTER_PRESETS.find((p) => p.id === (filter.preset ?? null)) || FILTER_PRESETS[0];
  const v: FilterValues = { ...NEUTRAL, ...preset.values };
  const adj = (key: 'brightness' | 'contrast' | 'saturation') => {
    const amount = filter[key];
    return typeof amount === 'number' && Number.isFinite(amount) ? amount / 100 : 0;
  };
  v.brightness *= 1 + adj('brightness') * 0.5;
  v.contrast *= 1 + adj('contrast') * 0.5;
  v.saturate *= 1 + adj('saturation');
  const neutral = (Object.keys(NEUTRAL) as (keyof FilterValues)[]).every((k) => Math.abs(v[k] - NEUTRAL[k]) < 1e-6);
  return neutral ? null : v;
};

// CSS filter for the preview. Order matters and matches the export: colour matrix
// (saturate, sepia, hue) first, then brightness, then contrast.
export const filterCss = (v: FilterValues | null): string => (v
  ? `saturate(${v.saturate}) sepia(${v.sepia}) hue-rotate(${v.hue}deg) brightness(${v.brightness}) contrast(${v.contrast})`
  : '');

const mul = (a: Matrix, b: Matrix): Matrix => a.map((row) => [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));

// The CSS Filter Effects matrices for saturate, sepia and hue-rotate, combined in that order.
export const colorMatrix = (v: Pick<FilterValues, 'saturate' | 'sepia' | 'hue'>): Matrix => {
  const s = v.saturate;
  const sat = [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ];
  const k = 1 - v.sepia;
  const sepia = [
    [0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k],
    [0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k],
    [0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k],
  ];
  const a = (v.hue * Math.PI) / 180;
  const c = Math.cos(a);
  const n = Math.sin(a);
  const hue = [
    [0.213 + c * 0.787 - n * 0.213, 0.715 - c * 0.715 - n * 0.715, 0.072 - c * 0.072 + n * 0.928],
    [0.213 - c * 0.213 + n * 0.143, 0.715 + c * 0.285 + n * 0.14, 0.072 - c * 0.072 - n * 0.283],
    [0.213 - c * 0.213 - n * 0.787, 0.715 - c * 0.715 + n * 0.715, 0.072 + c * 0.928 + n * 0.072],
  ];
  return mul(hue, mul(sepia, sat));
};

const NO_COLOUR = { saturate: 1, sepia: 0, hue: 0 };
// FFmpeg's colorchannelmixer takes coefficients in -2..2; saturate() passes that above ~2.27,
// so a stronger saturation is applied as equal passes (saturate(a)·saturate(b) = saturate(ab)).
const MAX_SATURATE_PASS = 2.2;

// The browser applies saturate, sepia and hue-rotate one after another, clamping after each; the
// export does the same, so these are the colour matrices to apply, in order (identities skipped).
export const colorPasses = (v: FilterValues): Matrix[] => {
  const passes: Matrix[] = [];
  if (Math.abs(v.saturate - 1) > 1e-6) {
    const count = v.saturate > MAX_SATURATE_PASS ? Math.ceil(Math.log(v.saturate) / Math.log(MAX_SATURATE_PASS)) : 1;
    const s = v.saturate ** (1 / count);
    for (let i = 0; i < count; i++) passes.push(colorMatrix({ ...NO_COLOUR, saturate: s }));
  }
  if (v.sepia > 1e-6) passes.push(colorMatrix({ ...NO_COLOUR, sepia: v.sepia }));
  if (Math.abs(v.hue) > 1e-6) passes.push(colorMatrix({ ...NO_COLOUR, hue: v.hue }));
  return passes;
};

// The same filter for one RGB pixel (0..255), step by step with clamping, as the export computes it.
export const applyFilterToPixel = (v: FilterValues, rgb: number[]): number[] => {
  const clamp = (x: number) => Math.min(255, Math.max(0, x));
  let px = rgb;
  for (const m of colorPasses(v)) px = m.map((row) => clamp(row[0] * px[0] + row[1] * px[1] + row[2] * px[2]));
  return px.map((x) => clamp((clamp(x * v.brightness) - 127.5) * v.contrast + 127.5));
};

// FFmpeg filters (leading comma) for a clip's filter, or ''.
export const filterChain = (v: FilterValues | null): string => {
  if (!v) return '';
  const mixers = colorPasses(v).map((matrix) => {
    const m = matrix.map((row) => row.map((x) => x.toFixed(4)));
    return `colorchannelmixer=rr=${m[0][0]}:rg=${m[0][1]}:rb=${m[0][2]}:gr=${m[1][0]}:gg=${m[1][1]}:gb=${m[1][2]}:br=${m[2][0]}:bg=${m[2][1]}:bb=${m[2][2]}`;
  });
  const curve = `clip((min(val*${v.brightness.toFixed(4)},255)-127.5)*${v.contrast.toFixed(4)}+127.5,0,255)`;
  return `,${[...mixers, `lutrgb=r='${curve}':g='${curve}':b='${curve}'`].join(',')}`;
};
