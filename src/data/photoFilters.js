export const PHOTO_FILTERS = [
  {
    id: 'original',
    name: 'Original',
    badge: 'ORIGINAL',
    filterString: 'none',
    values: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, invert: 0, hueRotate: 0, blur: 0 }
  },
  {
    id: 'deep-fried',
    name: 'Deep Fried 🔥',
    badge: 'DEEP FRIED',
    filterString: 'contrast(220%) saturate(260%) brightness(115%)',
    values: { brightness: 115, contrast: 220, saturation: 260, grayscale: 0, sepia: 0, invert: 0, hueRotate: 0, blur: 0 }
  },
  {
    id: 'punchy',
    name: 'Punchy Contrast',
    badge: 'PUNCHY CONTRAST',
    filterString: 'contrast(140%) saturate(130%) brightness(104%)',
    values: { brightness: 104, contrast: 140, saturation: 130, grayscale: 0, sepia: 0, invert: 0, hueRotate: 0, blur: 0 }
  },
  {
    id: 'vintage',
    name: '90s Vintage',
    badge: '90S VINTAGE',
    filterString: 'sepia(35%) contrast(95%) saturate(120%) brightness(105%) hue-rotate(-8deg)',
    values: { brightness: 105, contrast: 95, saturation: 120, grayscale: 0, sepia: 35, invert: 0, hueRotate: -8, blur: 0 }
  },
  {
    id: 'bw',
    name: 'Black & White',
    badge: 'GRAYSCALE',
    filterString: 'grayscale(100%) contrast(120%) brightness(100%)',
    values: { brightness: 100, contrast: 120, saturation: 100, grayscale: 100, sepia: 0, invert: 0, hueRotate: 0, blur: 0 }
  },
  {
    id: 'sepia',
    name: 'Warm Sepia',
    badge: 'WARM SEPIA',
    filterString: 'sepia(75%) saturate(115%) contrast(100%) brightness(98%)',
    values: { brightness: 98, contrast: 100, saturation: 115, grayscale: 0, sepia: 75, invert: 0, hueRotate: 0, blur: 0 }
  },
  {
    id: 'invert',
    name: 'Invert Color',
    badge: 'INVERT COLOR',
    filterString: 'invert(100%)',
    values: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, invert: 100, hueRotate: 0, blur: 0 }
  }
];

export const getFilterCss = (f) => {
  if (!f) return 'none';
  if (typeof f === 'string') return f;
  if (f.filterString) return f.filterString;
  const b = f.brightness ?? 100;
  const c = f.contrast ?? 100;
  const s = f.saturate ?? (f.saturation ?? 100);
  const g = f.grayscale ?? 0;
  const sep = f.sepia ?? 0;
  const inv = f.invert ?? 0;
  const hue = f.hueRotate ?? 0;
  const bl = f.blur ?? 0;
  const parts = [];
  if (b !== 100) parts.push(`brightness(${b}%)`);
  if (c !== 100) parts.push(`contrast(${c}%)`);
  if (s !== 100) parts.push(`saturate(${s}%)`);
  if (g > 0) parts.push(`grayscale(${g}%)`);
  if (sep > 0) parts.push(`sepia(${sep}%)`);
  if (inv > 0) parts.push(`invert(${inv}%)`);
  if (hue !== 0) parts.push(`hue-rotate(${hue}deg)`);
  if (bl > 0) parts.push(`blur(${bl}px)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
};
