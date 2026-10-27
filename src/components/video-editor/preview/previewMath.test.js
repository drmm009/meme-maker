import { describe, it, expect } from 'vitest';
import {
  dropSlotIndex, effectCanvasSize, fitPlacement, fitStage, isOnScreen, punchCrop, rotateAboutCenter,
  textResize, videoSyncPlan, videoTimeSec
} from './previewMath';
import { rotatedCenter } from '../../../utils/rotation';

const canvas = { width: 800, height: 450 };

describe('fitPlacement', () => {
  it('fits a photo or video inside the canvas, centred', () => {
    expect(fitPlacement({ type: 'image' }, 300, 200, canvas)).toEqual({ isPositioned: true, x: 62.5, y: 0, width: 675, height: 450 });
    expect(fitPlacement({ type: 'video' }, 640, 360, canvas)).toEqual({ isPositioned: true, x: 0, y: 0, width: 800, height: 450 });
  });

  it('keeps stickers at their natural size', () => {
    expect(fitPlacement({ type: 'sticker' }, 160, 120, canvas)).toEqual({ isPositioned: true, x: 320, y: 165, width: 160, height: 120 });
  });

  it('fits into the clip\'s layout panel, dropping any crop', () => {
    const slots = [{ x: 0, y: 0, width: 800, height: 225 }, { x: 0, y: 225, width: 800, height: 225 }];
    expect(fitPlacement({ type: 'video', slotIndex: 1 }, 640, 360, canvas, slots)).toEqual({
      isPositioned: true, x: 200, y: 225, width: 400, height: 225, scaleX: 1, scaleY: 1, crop: undefined
    });
  });

  it('leaves placed media alone', () => {
    expect(fitPlacement({ type: 'image', isPositioned: true }, 300, 200, canvas)).toBeNull();
    expect(fitPlacement({ type: 'image' }, 300, 200, null)).toBeNull();
  });
});

describe('dropSlotIndex', () => {
  const slots = [{ x: 0, y: 0, width: 400, height: 450 }, { x: 400, y: 0, width: 400, height: 450 }];
  it('finds the panel under the clip\'s centre', () => {
    expect(dropSlotIndex({ type: 'image', width: 200, height: 100 }, 450, 10, slots)).toBe(1);
    expect(dropSlotIndex({ type: 'video', width: 200, height: 100, scaleX: 2 }, 0, 0, slots)).toBe(0);
  });

  it('never puts stickers in a panel, and needs a layout', () => {
    expect(dropSlotIndex({ type: 'sticker', width: 50, height: 50 }, 450, 10, slots)).toBeUndefined();
    expect(dropSlotIndex({ type: 'image', width: 50, height: 50 }, 450, 10, [])).toBeUndefined();
    expect(dropSlotIndex({ type: 'image', width: 50, height: 50 }, 900, 900, slots)).toBeUndefined();
  });
});

describe('timing', () => {
  const clip = { startMs: 1000, endMs: 3000 };
  it('shows a clip from its start to its end, inclusive, unless hidden', () => {
    expect([999, 1000, 3000, 3001].map((p) => isOnScreen(clip, p))).toEqual([false, true, true, false]);
    expect(isOnScreen({ ...clip, hidden: true }, 2000)).toBe(false);
  });

  it('maps the playhead into the footage, after the trim and at the clip\'s speed', () => {
    expect(videoTimeSec({ startMs: 1000, trimStartMs: 500 }, 2000)).toBe(1.5);
    expect(videoTimeSec({ startMs: 1000, playbackRate: 2 }, 2000)).toBe(2);
  });
});

describe('videoSyncPlan', () => {
  const plan = (o) => videoSyncPlan({ playing: false, visible: true, paused: true, pending: false, drift: 0, frameCallbacks: true, ...o });

  it('follows a scrub while paused, past 0.05s of drift', () => {
    expect(plan({ drift: 0.3 })).toEqual({ seek: true, play: false, pause: false, redraw: false });
    expect(plan({ drift: 0.03 }).seek).toBe(false);
    expect(plan({ drift: 0.3, paused: false })).toMatchObject({ seek: true, pause: true });
  });

  it('starts playback, seeking first only when off by more than 0.1s', () => {
    expect(plan({ playing: true, drift: 0.05 })).toMatchObject({ play: true, seek: false });
    expect(plan({ playing: true, drift: 0.5 })).toMatchObject({ play: true, seek: true });
  });

  it('leaves a running video alone unless it drifts over a second', () => {
    expect(plan({ playing: true, paused: false, drift: 0.8 })).toMatchObject({ play: false, seek: false });
    expect(plan({ playing: true, paused: false, drift: 1.2 })).toMatchObject({ play: false, seek: true });
  });

  it('never seeks or pauses while a play() is starting', () => {
    expect(plan({ pending: true, paused: false, drift: 2 })).toEqual({ seek: false, play: false, pause: false, redraw: false });
    expect(plan({ playing: true, pending: true, drift: 2 })).toMatchObject({ seek: false, play: false });
    expect(plan({ visible: false, pending: true, paused: false }).pause).toBe(false);
  });

  it('pauses clips off screen', () => {
    expect(plan({ visible: false, paused: false, playing: true })).toEqual({ seek: false, play: false, pause: true, redraw: false });
  });

  it('redraws itself where the browser has no frame callbacks', () => {
    expect(plan({ playing: true, paused: false, frameCallbacks: false }).redraw).toBe(true);
    expect(plan({ drift: 0.3, frameCallbacks: false }).redraw).toBe(true);
    expect(plan({ drift: 0.01, frameCallbacks: false }).redraw).toBe(false);
  });
});

describe('frames', () => {
  it('crops the centre of the frame for a zoom-punch', () => {
    expect(punchCrop(640, 360, 2)).toEqual({ x: 160, y: 90, width: 320, height: 180 });
    expect(punchCrop(640, 360, 1)).toBeNull();
  });

  it('keys video at up to 640px and processes photos at up to 1280px', () => {
    expect(effectCanvasSize(1920, 1080, true)).toEqual({ width: 640, height: 360 });
    expect(effectCanvasSize(1920, 1080, false)).toEqual({ width: 1280, height: 720 });
    expect(effectCanvasSize(320, 200, true)).toEqual({ width: 320, height: 200 });
  });
});

describe('rotateAboutCenter', () => {
  it('turns a clip in place, moving its corner so the centre stays put', () => {
    const photo = { x: 100, y: 50, width: 200, height: 100 };
    const turned = rotateAboutCenter(photo, 90);
    expect(turned.rotation).toBe(90);
    const centre = rotatedCenter(turned.x, turned.y, 200, 100, 90);
    expect(centre.x).toBeCloseTo(200);
    expect(centre.y).toBeCloseTo(100);
  });

  it('accounts for scale and the current rotation', () => {
    const sticker = { x: 10, y: 20, width: 50, height: 50, scaleX: 2, scaleY: 2, rotation: 90 };
    const before = rotatedCenter(10, 20, 100, 100, 90);
    const turned = rotateAboutCenter(sticker, 180);
    const after = rotatedCenter(turned.x, turned.y, 100, 100, 180);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });
});

describe('text', () => {
  it('turns a resize into font size (and wrap width), at least 10px', () => {
    expect(textResize({ fontSize: 40 }, { x: 1, y: 2, rotation: 15, scaleX: 2 })).toEqual({ x: 1, y: 2, rotation: 15, fontSize: 80 });
    expect(textResize({ fontSize: 40, width: 300 }, { x: 0, y: 0, rotation: 0, scaleX: 0.5 })).toMatchObject({ fontSize: 20, width: 150 });
    expect(textResize({}, { x: 0, y: 0, rotation: 0, scaleX: 0.1 }).fontSize).toBe(10);
  });
});

describe('fitStage', () => {
  it('fills the width when the height allows, else the height', () => {
    expect(fitStage(350, 600, 16 / 9)).toEqual({ width: 350, height: 196.875, scale: 0.4375 });
    const tall = fitStage(800, 300, 16 / 9);
    expect(tall.height).toBe(300);
    expect(tall.width).toBeCloseTo(533.33);
    expect(tall.scale).toBeCloseTo(0.6667);
  });
});
