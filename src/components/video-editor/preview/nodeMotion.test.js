import { describe, it, expect } from 'vitest';
import { applyMotion, applyPunch } from './nodeMotion';

// A stand-in for a Konva image node showing a 640x360 frame.
const fakeNode = (attrs = {}) => {
  const a = { crop: { x: 0, y: 0, width: 0, height: 0 }, opacity: 1, x: 0, slid: false, image: { videoWidth: 640, videoHeight: 360 }, ...attrs };
  return {
    a,
    image: () => a.image,
    crop: (c) => { a.crop = c; },
    cropWidth: () => a.crop.width,
    opacity: (v) => (v === undefined ? a.opacity : (a.opacity = v)),
    x: (v) => (v === undefined ? a.x : (a.x = v)),
    getAttr: (k) => a[k],
    setAttr: (k, v) => { a[k] = v; },
  };
};

describe('applyPunch', () => {
  it('crops in for a zoom and back out after it', () => {
    const node = fakeNode();
    expect(applyPunch(node, 1.25)).toBe(true);
    expect(node.a.crop).toEqual({ x: 64, y: 36, width: 512, height: 288 });
    expect(applyPunch(node, 1)).toBe(true);
    expect(node.a.crop.width).toBe(0);
    expect(applyPunch(node, 1)).toBe(false); // already uncropped
  });

  it('waits for the frame to load', () => {
    expect(applyPunch(fakeNode({ image: null }), 2)).toBe(false);
  });
});

describe('applyMotion', () => {
  const a = { id: 'a', type: 'video', startMs: 0, endMs: 2000, x: 0 };
  const fade = { id: 'b', type: 'video', startMs: 2000, endMs: 4000, x: 0, transitionIn: { type: 'fade', durationMs: 1000 } };
  const slide = { ...fade, transitionIn: { type: 'slide', durationMs: 1000 } };

  it('fades a clip in across a fade transition', () => {
    const node = fakeNode({ opacity: 0 });
    expect(applyMotion(node, fade, { items: [a, fade], playhead: 2250 })).toBe(true);
    expect(node.a.opacity).toBeGreaterThan(0);
    expect(node.a.opacity).toBeLessThan(1);
    applyMotion(node, fade, { items: [a, fade], playhead: 3000 });
    expect(node.a.opacity).toBe(1);
  });

  it('slides a clip in from the side, then puts it back', () => {
    const node = fakeNode();
    applyMotion(node, slide, { items: [a, slide], playhead: 2100 });
    expect(node.a.x).toBeGreaterThan(0);
    expect(node.a.slid).toBe(true);
    applyMotion(node, slide, { items: [a, slide], playhead: 3500 });
    expect(node.a.x).toBe(0);
    expect(node.a.slid).toBe(false);
  });

  it('zooms in on a punch', () => {
    const punched = { ...a, punches: [500] };
    const node = fakeNode();
    applyMotion(node, punched, { items: [punched], playhead: 560 });
    expect(node.a.crop.width).toBeGreaterThan(0);
    expect(node.a.crop.width).toBeLessThan(640);
  });

  it('changes nothing for a plain clip mid-way', () => {
    expect(applyMotion(fakeNode(), a, { items: [a], playhead: 1000 })).toBe(false);
  });
});
