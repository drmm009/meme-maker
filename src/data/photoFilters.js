/**
 * iOS Safari does not support ctx.filter on Canvas 2D.
 * This file provides a pixel-level image filter implementation
 * that works cross-platform including iOS Safari.
 */

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
  },
  {
    id: 'wasted',
    name: 'Wasted',
    badge: 'WASTED',
    filterString: 'grayscale(100%) contrast(150%) brightness(80%) sepia(20%)',
    values: { brightness: 80, contrast: 150, saturation: 100, grayscale: 100, sepia: 20, invert: 0, hueRotate: 0, blur: 0 }
  }
,
  {
    id: 'blur',
    name: 'Panic Blur',
    badge: 'BLUR',
    filterString: 'blur(4px) contrast(110%)',
    values: { brightness: 100, contrast: 110, saturation: 100, grayscale: 0, sepia: 0, invert: 0, hueRotate: 0, blur: 4 }
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

// Check if ctx.filter actually RENDERS correctly (iOS Safari accepts it but silently ignores it).
// We test by drawing a white pixel with brightness(0) - if the filter works, the pixel becomes black.
let _ctxFilterSupported = null;
export const isCtxFilterSupported = () => {
  if (_ctxFilterSupported !== null) return _ctxFilterSupported;
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    const ctx = c.getContext('2d');
    ctx.filter = 'brightness(0)'; // should make white -> black
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1, 1);
    ctx.filter = 'none';
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    _ctxFilterSupported = pixel[0] < 128; // pixel should be dark if filter worked
  } catch {
    _ctxFilterSupported = false;
  }
  return _ctxFilterSupported;
};

// Parse CSS filter string into values object
const parseFilterString = (css) => {
  if (!css || css === 'none') return null;
  const vals = {
    brightness: 100, contrast: 100, saturate: 100,
    grayscale: 0, sepia: 0, invert: 0, hueRotate: 0, blur: 0
  };
  const patterns = [
    { re: /brightness\(([0-9.]+)%\)/, key: 'brightness' },
    { re: /contrast\(([0-9.]+)%\)/, key: 'contrast' },
    { re: /saturate\(([0-9.]+)%\)/, key: 'saturate' },
    { re: /grayscale\(([0-9.]+)%\)/, key: 'grayscale' },
    { re: /sepia\(([0-9.]+)%\)/, key: 'sepia' },
    { re: /invert\(([0-9.]+)%\)/, key: 'invert' },
    { re: /hue-rotate\((-?[0-9.]+)deg\)/, key: 'hueRotate' },
    { re: /blur\(([0-9.]+)px\)/, key: 'blur' },
  ];
  patterns.forEach(({ re, key }) => {
    const m = css.match(re);
    if (m) vals[key] = parseFloat(m[1]);
  });
  return vals;
};

// Clamp a value between 0 and 255
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));


// Horizontal motion blur (looks like panic blur)
const horizontalMotionBlur = (imageData, radius) => {
  const { data, width, height } = imageData;
  const src = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let ix = Math.max(0, x - radius); ix <= Math.min(width - 1, x + radius); ix++) {
        const i = (y * width + ix) * 4;
        r += src[i]; g += src[i+1]; b += src[i+2];
        count++;
      }
      const idx = (y * width + x) * 4;
      data[idx] = r / count;
      data[idx+1] = g / count;
      data[idx+2] = b / count;
    }
  }
};

// Apply pixel-level filters to ImageData (works on all browsers including iOS Safari)
export const applyPixelFilters = (imageData, filterCss) => {
  if (!filterCss || filterCss === 'none') return imageData;
  const vals = parseFilterString(filterCss);
  if (!vals) return imageData;

  const data = imageData.data;
  const brightness = vals.brightness / 100;
  const contrast = vals.contrast / 100;
  const grayscale = vals.grayscale / 100;
  const sepia = vals.sepia / 100;
  const invert = vals.invert / 100;
  const saturate = vals.saturate / 100;

  // Contrast: (v - 128) * contrast + 128
  const contrastOffset = 128 - 128 * contrast;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r *= brightness;
    g *= brightness;
    b *= brightness;

    // Contrast
    r = r * contrast + contrastOffset;
    g = g * contrast + contrastOffset;
    b = b * contrast + contrastOffset;

    // Grayscale
    if (grayscale > 0) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = r + (gray - r) * grayscale;
      g = g + (gray - g) * grayscale;
      b = b + (gray - b) * grayscale;
    }

    // Sepia
    if (sepia > 0) {
      const sr = Math.min(r * 0.393 + g * 0.769 + b * 0.189, 255);
      const sg = Math.min(r * 0.349 + g * 0.686 + b * 0.168, 255);
      const sb = Math.min(r * 0.272 + g * 0.534 + b * 0.131, 255);
      r = r + (sr - r) * sepia;
      g = g + (sg - g) * sepia;
      b = b + (sb - b) * sepia;
    }

    // Invert
    if (invert > 0) {
      r = r + (255 - 2 * r) * invert;
      g = g + (255 - 2 * g) * invert;
      b = b + (255 - 2 * b) * invert;
    }

    // Saturate
    if (saturate !== 1) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = gray + (r - gray) * saturate;
      g = gray + (g - gray) * saturate;
      b = gray + (b - gray) * saturate;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }


  if (vals.blur > 0) {
    horizontalMotionBlur(imageData, Math.round(vals.blur * 2)); // multiply by 2 for more exaggerated motion blur
  }
  return imageData;

};

/**
 * Draws an image with CSS filters onto a canvas context.
 * - On desktop: uses native ctx.filter (fast).
 * - On iOS Safari (ctx.filter silently ignored): uses pixel-level manipulation.
 * - For cross-origin images where getImageData fails: falls back to native ctx.filter (best effort).
 */
export const drawImageFiltered = (ctx, img, filterCss, dx, dy, dw, dh) => {
  if (!filterCss || filterCss === 'none') {
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }

  if (isCtxFilterSupported()) {
    // Desktop path: use fast native ctx.filter
    ctx.filter = filterCss;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    return;
  }

  // iOS Safari path: pixel-level manipulation
  const w = Math.max(1, Math.round(dw));
  const h = Math.max(1, Math.round(dh));
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const offCtx = offscreen.getContext('2d');

  // Draw image to offscreen canvas at destination size
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  offCtx.drawImage(img, 0, 0, srcW, srcH, 0, 0, w, h);

  try {
    // Pixel manipulation (fails for cross-origin tainted canvases)
    const imageData = offCtx.getImageData(0, 0, w, h);
    applyPixelFilters(imageData, filterCss);
    offCtx.putImageData(imageData, 0, 0);
  } catch {
    // Cross-origin image: can't read pixels. Try native ctx.filter as last resort.
    offscreen.width = 0;
    offscreen.height = 0;
    ctx.filter = filterCss;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    return;
  }

  ctx.drawImage(offscreen, dx, dy, dw, dh);
  offscreen.width = 0;
  offscreen.height = 0;
};