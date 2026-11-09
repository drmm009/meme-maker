import { rotateKnobGap, screenScaleOf } from '../interaction/layerBoxes';

// Selection UI drawn over the active layer: box, delete/resize/side badges, rotate knob. The same
// look as the video editor's selection (video-editor/preview/selectionStyle.ts): an orange rounded
// frame with a soft dark shadow, plain white discs and pills with a soft shadow, a red bin for
// Delete and a dark turning arrow on the rotate knob.
export const THEME_CORAL = '#ff5a36';
const DELETE_RED = '#ff3b30';
const INK = '#1c1c1e';
const RING = 'rgba(0, 0, 0, 0.12)';
// Lucide's trash and rotate-cw (24-unit box).
const TRASH_ICON = 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2';
const ROTATE_ICON = 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5';
// Sizes below are screen pixels, turned into canvas pixels by the canvas's on-screen scale (the
// hit test's own: interaction/layerBoxes' screenScaleOf), so the handles are as big on a phone as
// the video editor's however big the canvas is.
const FRAME_RADIUS = 10;

export const THEME_BADGE_BG = '#ffffff';

const unit = (uiCtx) => screenScaleOf(uiCtx.canvas);

// A soft shadow under a disc or pill.
const softShadow = (uiCtx, k) => {
  uiCtx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  uiCtx.shadowBlur = 6 * k;
  uiCtx.shadowOffsetY = 1 * k;
};

// A Lucide icon, `size` across, centred on (x, y).
const drawIcon = (uiCtx, path, x, y, size, colour) => {
  if (typeof Path2D === 'undefined') return;
  uiCtx.save();
  uiCtx.shadowColor = 'transparent';
  uiCtx.translate(x - size / 2, y - size / 2);
  uiCtx.scale(size / 24, size / 24);
  uiCtx.strokeStyle = colour;
  uiCtx.lineWidth = 2.2;
  uiCtx.lineCap = 'round';
  uiCtx.lineJoin = 'round';
  uiCtx.stroke(new Path2D(path));
  uiCtx.restore();
};

// A white disc with a soft shadow and a faint ring.
const drawDisc = (uiCtx, x, y, r, k) => {
  uiCtx.save();
  softShadow(uiCtx, k);
  uiCtx.beginPath();
  uiCtx.arc(x, y, r, 0, Math.PI * 2);
  uiCtx.fillStyle = THEME_BADGE_BG;
  uiCtx.fill();
  uiCtx.shadowColor = 'transparent';
  uiCtx.strokeStyle = RING;
  uiCtx.lineWidth = k;
  uiCtx.stroke();
  uiCtx.restore();
};

// 1. Selection box: an orange rounded frame with a soft dark shadow. `radius` is in screen pixels
// unless `onScreen` is false (a caller that has already scaled it).
export const drawSelectionBox = (uiCtx, bx, by, bw, bh, radius = FRAME_RADIUS, { onScreen = true } = {}) => {
  const k = unit(uiCtx);
  uiCtx.save();
  uiCtx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  uiCtx.shadowBlur = 6 * k;
  uiCtx.shadowOffsetY = 0;
  uiCtx.strokeStyle = THEME_CORAL;
  uiCtx.lineWidth = 2.5 * k;
  uiCtx.beginPath();
  if (uiCtx.roundRect) {
    uiCtx.roundRect(bx, by, bw, bh, onScreen ? radius * k : radius);
  } else {
    uiCtx.rect(bx, by, bw, bh);
  }
  uiCtx.stroke();
  uiCtx.restore();
};

// 2. Delete (top-left): a plain white disc with a red bin.
export const drawDeleteHandle = (uiCtx, hx, hy) => {
  const k = unit(uiCtx);
  drawDisc(uiCtx, hx, hy, 14 * k, k);
  drawIcon(uiCtx, TRASH_ICON, hx, hy, 16 * k, DELETE_RED);
};

// 3. Resize (bottom-right): a white dot on the middle of the frame's rounded corner.
export const drawResizeHandle = (uiCtx, hx, hy) => {
  const k = unit(uiCtx);
  const inset = FRAME_RADIUS * k * (1 - Math.SQRT1_2);
  drawDisc(uiCtx, hx - inset, hy - inset, 7 * k, k);
};

// 5. Side stretch handle: a slim white pill on the frame's line.
export const drawSideHandle = (uiCtx, hx, hy, isVertical = true) => {
  const k = unit(uiCtx);
  const w = (isVertical ? 7 : 20) * k;
  const h = (isVertical ? 20 : 7) * k;
  uiCtx.save();
  softShadow(uiCtx, k);
  uiCtx.beginPath();
  if (uiCtx.roundRect) {
    uiCtx.roundRect(hx - w / 2, hy - h / 2, w, h, 3.5 * k);
  } else {
    uiCtx.rect(hx - w / 2, hy - h / 2, w, h);
  }
  uiCtx.fillStyle = THEME_BADGE_BG;
  uiCtx.fill();
  uiCtx.shadowColor = 'transparent';
  uiCtx.strokeStyle = RING;
  uiCtx.lineWidth = k;
  uiCtx.stroke();
  uiCtx.restore();
};

// 6. Rotation knob: a white disc with a dark turning arrow, without a stem, the hit test's gap above
// the frame's top (`startY`; the callers' own knob position is for the old fixed gap).
export const drawRotateHandle = (uiCtx, startX, startY, knobX) => {
  const k = unit(uiCtx);
  const knobY = startY - rotateKnobGap(k);
  drawDisc(uiCtx, knobX, knobY, 15 * k, k);
  drawIcon(uiCtx, ROTATE_ICON, knobX, knobY, 17 * k, INK);
};

// A round grab point (a shape's end or corner), radius `r` in canvas pixels.
export const drawPointHandle = (uiCtx, hx, hy, r) => {
  uiCtx.save();
  uiCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  uiCtx.shadowBlur = r * 0.7;
  uiCtx.beginPath();
  uiCtx.arc(hx, hy, r, 0, Math.PI * 2);
  uiCtx.fillStyle = THEME_BADGE_BG;
  uiCtx.fill();
  uiCtx.shadowColor = 'transparent';
  uiCtx.strokeStyle = RING;
  uiCtx.lineWidth = Math.max(1, r * 0.12);
  uiCtx.stroke();
  uiCtx.restore();
};
