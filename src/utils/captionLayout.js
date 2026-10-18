// Pure caption-layout helpers extracted verbatim from MemeEditor (no JSX, no state).
// Covered by captionLayout.test.js — behavior changes here affect all caption/sticker/image placement.

export const PRESET_PHRASES = [
  'WHEN YOU...',
  'NOBODY:',
  'MY BRAIN AT 3 AM:',
  'EXPECTATION vs REALITY',
  'HOW IT STARTED vs HOW IT GOES',
  'ME TRYING TO EXPLAIN:',
  'DEBUGGING CODE LIKE:'
];

export const BUBBLE_LAYOUT_OPTIONS = [
  { id: 'imessage-send', label: 'iPhone 📤' },
  { id: 'imessage-receive', label: 'iPhone 📥' },
  { id: 'whatsapp-send', label: 'WhatsApp 📤' },
  { id: 'whatsapp-receive', label: 'WhatsApp 📥' },
  { id: 'speech-left', label: 'Tail Left ◂' },
  { id: 'speech-right', label: 'Tail Right ▸' },
  { id: 'thought', label: 'Thought 💭' },
  { id: 'shout', label: 'Shout 💥' },
];

export const COLOR_SWATCHES = ['#ffffff', '#ffff00', '#a855f7', '#ff0055', '#00ff66', '#000000'];

// Draw tool essential palette: 5 core high-impact colors (green & purple removed for clean mobile spacing)
export const DRAW_COLORS = ['#ffffff', '#ff2a5f', '#ffe600', '#00f0ff', '#000000'];

// Calculates a default canvas position (normalized 0..1) that avoids overlapping existing elements
export const getNonOverlappingPosition = (type, captions = [], stickers = [], imageLayers = []) => {
  // Estimated normalized width and height per element type
  let newW = 0.38;
  let newH = 0.12;
  if (type === 'phrase') {
    newW = 0.55;
    newH = 0.14;
  } else if (type === 'sticker' || type === 'emoji') {
    newW = 0.20;
    newH = 0.20;
  } else if (type === 'image') {
    newW = 0.28;
    newH = 0.28;
  }

  // Collect all existing elements on canvas with normalized bounds
  const existing = [
    ...captions.filter(c => !c.isHeaderCaption && !c.isFooterCaption).map((c) => ({
      x: typeof c.x === 'number' ? c.x : 0.5,
      y: typeof c.y === 'number' ? c.y : 0.5,
      w: c.width ? Math.min(Math.max(c.width, 0.35), 0.8) : 0.38,
      h: (c.fontSize || 50) > 60 ? 0.15 : 0.12
    })),
    ...stickers.map((s) => ({
      x: typeof s.x === 'number' ? s.x : 0.5,
      y: typeof s.y === 'number' ? s.y : 0.5,
      w: 0.20,
      h: 0.20
    })),
    ...imageLayers.map((img) => ({
      x: typeof img.x === 'number' ? img.x : 0.5,
      y: typeof img.y === 'number' ? img.y : 0.5,
      w: 0.28,
      h: 0.28
    }))
  ];

  const checkOverlap = (cx, cy, w, h, items, margin = 0.03) => {
    for (const it of items) {
      const minDx = (w + it.w) / 2 + margin;
      const minDy = (h + it.h) / 2 + margin;
      if (Math.abs(cx - it.x) < minDx && Math.abs(cy - it.y) < minDy) {
        return true;
      }
    }
    return false;
  };

  // If canvas is completely empty, default to center
  if (existing.length === 0) {
    return { x: 0.5, y: 0.5 };
  }

  // 1. If center is completely free, use center
  if (!checkOverlap(0.5, 0.5, newW, newH, existing, 0.03)) {
    return { x: 0.5, y: 0.5 };
  }

  // 2. Safe boundaries inside canvas
  const minX = Math.max(0.18, newW / 2 + 0.04);
  const maxX = Math.min(0.82, 1 - (newW / 2 + 0.04));
  const minY = Math.max(0.18, newH / 2 + 0.04);
  const maxY = Math.min(0.82, 1 - (newH / 2 + 0.04));

  // Build grid of candidate coordinates
  const candidates = [];
  const step = 0.05;
  for (let y = minY; y <= maxY + 0.001; y += step) {
    for (let x = minX; x <= maxX + 0.001; x += step) {
      const px = Number(x.toFixed(3));
      const py = Number(y.toFixed(3));
      const dist = Math.hypot(px - 0.5, (py - 0.5) * 1.05);
      candidates.push({ x: px, y: py, dist });
    }
  }

  // Sort candidates by closeness to center
  candidates.sort((a, b) => a.dist - b.dist);

  // Pass 1: standard margin (comfortable spacing)
  for (const cand of candidates) {
    if (!checkOverlap(cand.x, cand.y, newW, newH, existing, 0.03)) {
      return { x: cand.x, y: cand.y };
    }
  }

  // Pass 2: tighter margin
  for (const cand of candidates) {
    if (!checkOverlap(cand.x, cand.y, newW, newH, existing, 0.01)) {
      return { x: cand.x, y: cand.y };
    }
  }

  // Pass 3: least crowded point (maximize minimum distance to any existing element)
  let bestCand = null;
  let maxMinDist = -1;
  for (const cand of candidates) {
    let minDist = Infinity;
    for (const it of existing) {
      const d = Math.hypot(cand.x - it.x, cand.y - it.y);
      if (d < minDist) minDist = d;
    }
    if (minDist > maxMinDist) {
      maxMinDist = minDist;
      bestCand = cand;
    }
  }

  if (bestCand) {
    return { x: bestCand.x, y: bestCand.y };
  }

  const offset = (existing.length % 5) * 0.06;
  return {
    x: Number(Math.min(0.8, Math.max(0.2, 0.5 + offset)).toFixed(3)),
    y: Number(Math.min(0.8, Math.max(0.2, 0.5 + offset)).toFixed(3))
  };
};

export const isColorDark = (colorStr) => {
  if (!colorStr) return false;
  const str = String(colorStr).trim().toLowerCase();
  if (str === 'black' || str === '#000' || str === '#000000') return true;
  if (str === 'white' || str === '#fff' || str === '#ffffff' || str === 'transparent' || str === 'none') return false;
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.slice(4, 6), 16) || 0;
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }
  }
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10) || 0;
    const g = parseInt(rgbMatch[2], 10) || 0;
    const b = parseInt(rgbMatch[3], 10) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  return false;
};

export const hslToHex = (h, s = 100, l = 50) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export const hexToHue = (hex) => {
  if (!hex || hex === '#ffffff' || hex === '#000000') return 0;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max === min) return 0;
  const d = max - min;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
  }
  return Math.round(h * 60);
};
