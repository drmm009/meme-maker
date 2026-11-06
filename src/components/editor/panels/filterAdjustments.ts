// A photo's filter presets and adjustments, shared by both editors' Filters (FilterControls).
import { PHOTO_FILTERS } from '../../../data/photoFilters';

export interface FilterPreset {
  id: string;
  name: string;
  filterString: string;
  values: Record<string, number>;
}

export const PRESETS = PHOTO_FILTERS as FilterPreset[];

// `base` is the untouched value. Warmth, sharpen and vignette are canvas/draw/photoEffects.
export const ADJUSTMENTS = [
  { key: 'brightness', label: 'Brightness', min: 40, max: 200, base: 100 },
  { key: 'contrast', label: 'Contrast', min: 40, max: 250, base: 100 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 300, base: 100 },
  { key: 'warmth', label: 'Warmth', min: -100, max: 100, base: 0 },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, base: 0 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100, base: 0 },
];

export const adjustmentBase = (key: string): number => ADJUSTMENTS.find((a) => a.key === key)?.base ?? 100;

// Is anything changed from the untouched photo (a preset, or an adjustment off its base)?
export const filtersChanged = (preset: string, value: (key: string) => number): boolean =>
  preset !== 'original' || ADJUSTMENTS.some((a) => value(a.key) !== a.base);
