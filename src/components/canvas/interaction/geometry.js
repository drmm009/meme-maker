// Pure geometry used by canvas hit testing. Coordinates are canvas pixels.

// Stickers are drawn as a square of this many pixels at scale 1.
export const STICKER_BASE_SIZE = 52;

export const getStickerBoxSize = (stk) => (stk.scale || 1.0) * STICKER_BASE_SIZE;

// Rotate (px, py) around (cx, cy) by `angle` degrees.
export const rotatePoint = (px, py, cx, cy, angle) => {
  const rad = angle * Math.PI / 180;
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
  };
};

// Is `p` inside the w x h box centred on (cx, cy), grown by `pad` on every side?
export const isInBox = (p, cx, cy, w, h, pad = 0) =>
  p.x >= cx - w / 2 - pad && p.x <= cx + w / 2 + pad && p.y >= cy - h / 2 - pad && p.y <= cy + h / 2 + pad;

// Mouse or touch event -> canvas pixel coordinates (the canvas may be drawn scaled by CSS).
export const clientToCanvas = (e, canvas) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  let clientX = 0, clientY = 0;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
    clientY = e.changedTouches[0].clientY;
  } else if (e.clientX !== undefined && e.clientY !== undefined) {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
};
