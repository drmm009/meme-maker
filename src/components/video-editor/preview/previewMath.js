// Pure decisions behind the Konva preview (CanvasPreview and its parts). Positions and sizes are
// in the preview's 800-wide stage units.

export const STAGE_WIDTH = 800;

// Green-screen frames are keyed at most this many pixels on the long side; Konva scales them up.
const KEY_MAX_SIDE = 640;
// Photos with a filter are processed once, so they keep more detail.
const STILL_FX_MAX_SIDE = 1280;

// Where newly loaded media goes (null once it has been placed): fitted inside its layout panel,
// or fitted and centred on the canvas. Stickers keep their natural size.
export function fitPlacement(item, naturalWidth, naturalHeight, canvas, slots = []) {
  if (item.isPositioned || !canvas) return null;
  const slot = item.slotIndex !== undefined ? slots[item.slotIndex] : null;
  if (slot) {
    const scale = Math.min(slot.width / naturalWidth, slot.height / naturalHeight);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    return {
      isPositioned: true,
      x: slot.x + (slot.width - width) / 2,
      y: slot.y + (slot.height - height) / 2,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      crop: undefined
    };
  }
  const scale = item.type === 'sticker' ? 1 : Math.min(canvas.width / naturalWidth, canvas.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return { isPositioned: true, x: (canvas.width - width) / 2, y: (canvas.height - height) / 2, width, height };
}

// The layout panel a photo or video was dropped on (by its centre), or undefined. Stickers float
// over the layout and never join a panel.
export function dropSlotIndex(item, x, y, slots = []) {
  if (item.type === 'sticker' || slots.length === 0) return undefined;
  const cx = x + (item.width * (item.scaleX || 1)) / 2;
  const cy = y + (item.height * (item.scaleY || 1)) / 2;
  const index = slots.findIndex((s) => cx >= s.x && cx <= s.x + s.width && cy >= s.y && cy <= s.y + s.height);
  return index === -1 ? undefined : index;
}

// Is the clip on screen at this playhead (ms)? Both ends are inclusive.
export const isOnScreen = (item, playhead) => !item.hidden && playhead >= item.startMs && playhead <= item.endMs;

// The time (s) in a video's own footage that the preview should show at this playhead.
export const videoTimeSec = (item, playhead) =>
  (item.trimStartMs || 0) / 1000 + ((playhead - item.startMs) / 1000) * (item.playbackRate || 1);

// What a preview <video> should do on a store update, as { seek, play, pause, redraw }:
// - playing: start it if it's paused (seeking first if it's off by more than 0.1s); if it's already
//   running, only re-seek when it has drifted over 1s, because seeking a playing video flushes the
//   decoder and stutters;
// - paused: pause it and follow the playhead to within 0.05s (a scrub);
// - off screen: just pause it.
// `pending`: a play() is still starting (seeking or pausing then would abort it).
// `frameCallbacks`: the browser redraws on each new frame (requestVideoFrameCallback); without it
// the preview redraws itself while playing and after a scrub's seek.
export function videoSyncPlan({ playing, visible, paused, pending, drift, frameCallbacks }) {
  const plan = { seek: false, play: false, pause: false, redraw: false };
  if (!visible) {
    plan.pause = !paused && !pending;
  } else if (playing) {
    if (paused && !pending) {
      plan.play = true;
      plan.seek = drift > 0.1;
    } else {
      plan.seek = !pending && drift > 1.0;
    }
    plan.redraw = !frameCallbacks;
  } else {
    plan.pause = !paused && !pending;
    plan.seek = !pending && drift > 0.05;
    plan.redraw = plan.seek && !frameCallbacks;
  }
  return plan;
}

// Zoom-punch: the centred part of an iw x ih frame to show at this zoom, or null for the full frame.
export const punchCrop = (iw, ih, zoom) => {
  if (zoom <= 1.0001) return null;
  const width = iw / zoom;
  const height = ih / zoom;
  return { x: (iw - width) / 2, y: (ih - height) / 2, width, height };
};

// Size of the offscreen canvas a green-screen or filtered frame is drawn into.
export const effectCanvasSize = (sourceWidth, sourceHeight, isVideo) => {
  const scale = Math.min(1, (isVideo ? KEY_MAX_SIDE : STILL_FX_MAX_SIDE) / Math.max(sourceWidth, sourceHeight));
  return { width: Math.max(1, Math.round(sourceWidth * scale)), height: Math.max(1, Math.round(sourceHeight * scale)) };
};

// How a text clip is drawn. With a background box, the outline is off unless one was picked.
export function textStyle(item) {
  const fontSize = item.fontSize || 32;
  const hasBg = Boolean(item.bgColor) && item.bgColor !== 'none' && item.bgColor !== 'transparent';
  return {
    text: item.text !== undefined ? item.text : 'Sample Text',
    x: item.x || 50,
    y: item.y || 50,
    width: item.width || undefined,
    fontSize,
    fontFamily: item.fontFamily || 'Impact, sans-serif',
    fill: item.color || (item.bgColor === 'white' ? '#000000' : '#ffffff'),
    stroke: item.stroke || (hasBg ? 'transparent' : '#000000'),
    strokeWidth: hasBg && item.stroke === 'transparent' ? 0 : (item.strokeWidth || Math.max(2, fontSize / 25)),
    letterSpacing: -fontSize * 0.05,
    align: item.align || 'center',
    hasBg,
    bgFill: item.bgColor === 'white' ? '#ffffff' : (item.bgColor === 'black' ? '#000000' : item.bgColor),
  };
}

// The background box around text at (x, y) of the given size and scale: 8px wider each side, 4px taller.
export const textBoxAround = ({ x, y, width, height, scaleX = 1, scaleY = 1 }) => ({
  x: x - 8,
  y: y - 4,
  width: width * scaleX + 16,
  height: height * scaleY + 8,
});

// What a transformer resize of text saves: the scale goes into the font size (and wrap width),
// so the text stays crisp at scale 1.
export const textResize = (item, { x, y, rotation, scaleX }) => ({
  x,
  y,
  rotation,
  fontSize: Math.max(10, (item.fontSize || 32) * scaleX),
  ...(item.width ? { width: item.width * scaleX } : {})
});

// The stage size that fits the available space at this aspect ratio, and its scale from the
// 800-wide stage units.
export const fitStage = (availableWidth, availableHeight, aspect) => {
  let width = availableWidth;
  let height = availableWidth / aspect;
  if (height > availableHeight) {
    height = availableHeight;
    width = height * aspect;
  }
  return { width, height, scale: width / STAGE_WIDTH };
};
