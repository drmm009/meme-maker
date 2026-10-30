// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { paintLayers } from './paintLayers';
import { paintSticker } from './paintSticker';
import { paintImageLayer } from './paintImageLayer';
import { getImageLayerBox } from '../interaction/layerBoxes';
import { createRecordingCanvas, createRecordingContext, callsNamed, textsDrawn } from '../testing/recordingContext';

// An 800x600 canvas with no header band: layer centres are (x * 800, y * 600).
const setup = (imageCache = {}) => {
  const canvas = createRecordingCanvas(800, 600);
  let drawer = null;
  const common = {
    baseImgRef: { current: null },
    canvas,
    imageCacheRef: { current: imageCache },
    isDrawingMode: false,
    renderCanvas: () => {},
    setActiveHandleDrawer: (fn) => { drawer = fn; },
    targetCtx: canvas.ctx,
  };
  const handles = () => {
    const ui = createRecordingContext();
    drawer(ui);
    return ui;
  };
  return { canvas, ctx: canvas.ctx, common, handles, getDrawer: () => drawer };
};

const paintStk = (layer, opts = {}) => {
  const s = setup(opts.imageCache);
  const loadingMediaRef = { current: {} };
  paintSticker({ ...s.common, activeLayerId: opts.activeLayerId ?? null, getStickerCenterY: (l) => l.y * 600, layer, loadingMediaRef });
  return { ...s, loadingMediaRef };
};

const paintImg = (layer, opts = {}) => {
  const s = setup(opts.imageCache);
  paintImageLayer({ ...s.common, activeLayerId: opts.activeLayerId ?? null, getImageLayerCenterY: (l) => l.y * 600, layer });
  return s;
};

describe('paintSticker', () => {
  it('draws an emoji centred at the sticker, sized by its scale', () => {
    const { ctx } = paintStk({ id: 's1', emoji: '😂', x: 0.25, y: 0.5, scale: 2 });
    const [t] = textsDrawn(ctx);
    expect(t).toMatchObject({ text: '😂', at: { x: 200, y: 300 } });
    expect(t.font.startsWith('104px')).toBe(true);
  });

  it('mirrors a flipped sticker', () => {
    const [call] = callsNamed(paintStk({ id: 's1', emoji: '😂', x: 0.5, y: 0.5, flipX: true }).ctx, 'fillText');
    expect(call.state.matrix[0]).toBe(-1);
  });

  it('fits an image sticker into its square, keeping the aspect', () => {
    const img = { complete: true, naturalWidth: 200, naturalHeight: 100 };
    const { ctx } = paintStk({ id: 's1', url: 'a.png', x: 0.5, y: 0.5, scale: 1 }, { imageCache: { 'a.png': img } });
    const [draw] = callsNamed(ctx, 'drawImage');
    expect(draw.args.slice(1)).toEqual([-26, -13, 52, 26]);
  });

  it('starts loading an image sticker once', () => {
    const { loadingMediaRef, ctx } = paintStk({ id: 's1', url: 'b.png', x: 0.5, y: 0.5 });
    expect(loadingMediaRef.current['b.png']).toBe(true);
    expect(callsNamed(ctx, 'drawImage')).toHaveLength(0);
  });

  it('draws its selection box on the hit-test box (6px slack all round)', () => {
    const { handles } = paintStk({ id: 's1', emoji: '😂', x: 0.5, y: 0.5, scale: 1.5 }, { activeLayerId: 's1' });
    const [box] = callsNamed(handles(), 'roundRect');
    expect(box.args).toEqual([-45, -45, 90, 90, 10]); // 78px sticker + 12
    expect(box.at).toEqual({ x: 355, y: 255 });
  });
});

describe('layer look', () => {
  it('turns a sticker upside down, fades it, blends it and gives it a shadow', () => {
    const [call] = callsNamed(paintStk({ id: 's1', emoji: '😂', x: 0.5, y: 0.5, flipY: true, opacity: 0.5, blend: 'multiply', shadowSize: 10 }).ctx, 'fillText');
    expect(call.state.matrix[3]).toBe(-1);
    expect(call.state).toMatchObject({ globalAlpha: 0.5, globalCompositeOperation: 'multiply', shadowBlur: 10 });
  });

  it('draws a rounded, bordered photo on its own canvas, then that with the shadow', () => {
    const img = { width: 320, height: 160 };
    const off = createRecordingContext();
    const offCanvas = { width: 0, height: 0, getContext: () => off };
    const realCreate = document.createElement.bind(document);
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tag) => (tag === 'canvas' ? offCanvas : realCreate(tag)));
    const { ctx } = paintImg({ id: 'i1', url: 'p.png', x: 0.5, y: 0.5, fitMode: 'stretch', cornerRadius: 0.5, borderWidth: 10, borderColor: '#ff0000', shadowSize: 12 }, { imageCache: { 'p.png': img } });
    spy.mockRestore();
    // 320 x 160 photo + a 10px border each side.
    expect([offCanvas.width, offCanvas.height]).toEqual([340, 180]);
    expect(callsNamed(off, 'clip')).toHaveLength(1);
    expect(callsNamed(off, 'stroke')[0].state).toMatchObject({ lineWidth: 10, strokeStyle: '#ff0000' });
    const [onMeme] = callsNamed(ctx, 'drawImage');
    expect(onMeme.args[0]).toBe(offCanvas);
    expect(onMeme.state.shadowBlur).toBe(12);
  });
});

describe('paintImageLayer', () => {
  const wide = { width: 640, height: 320 };

  it('fits the image in the 320px square by default', () => {
    const { ctx } = paintImg({ id: 'i1', url: 'w.png', x: 0.5, y: 0.5 }, { imageCache: { 'w.png': wide } });
    const [draw] = callsNamed(ctx, 'drawImage');
    expect(draw.args.slice(1)).toEqual([0, 0, 640, 320, -160, -80, 320, 160]);
    expect(draw.at).toEqual({ x: 240, y: 220 });
  });

  it('letterboxes in "fit" and fills the box in "stretch"', () => {
    const square = { id: 'i1', url: 'w.png', x: 0.5, y: 0.5, boxWidth: 300, boxHeight: 300 };
    const fit = callsNamed(paintImg(square, { imageCache: { 'w.png': wide } }).ctx, 'drawImage')[0];
    expect(fit.args.slice(5)).toEqual([-150, -75, 300, 150]);
    const stretch = callsNamed(paintImg({ ...square, fitMode: 'stretch' }, { imageCache: { 'w.png': wide } }).ctx, 'drawImage')[0];
    expect(stretch.args.slice(5)).toEqual([-150, -150, 300, 300]);
  });

  it('draws only the cropped part of the source in crop mode, clipped to the box', () => {
    const layer = { id: 'i1', url: 'w.png', x: 0.5, y: 0.5, fitMode: 'crop', width: 160, height: 160, crop: { x: 0.5, y: 0, width: 0.5, height: 1 } };
    const { ctx } = paintImg(layer, { imageCache: { 'w.png': wide } });
    expect(callsNamed(ctx, 'drawImage')[0].args.slice(1, 5)).toEqual([320, 0, 320, 320]);
    expect(callsNamed(ctx, 'rect')[0].args).toEqual([-80, -80, 160, 160]);
    expect(callsNamed(ctx, 'clip')).toHaveLength(1);
  });

  it('clips face swaps to an oval and applies opacity', () => {
    const { ctx } = paintImg({ id: 'i1', url: 'w.png', x: 0.5, y: 0.5, isFaceMorph: true, opacity: 0.7 }, { imageCache: { 'w.png': wide } });
    expect(callsNamed(ctx, 'ellipse')).toHaveLength(1);
    expect(callsNamed(ctx, 'drawImage')[0].state.globalAlpha).toBe(0.7);
  });

  it('draws its selection box on the hit-test box', () => {
    const layer = { id: 'i1', url: 'w.png', x: 0.5, y: 0.5, scale: 1.25 };
    const { handles } = paintImg(layer, { activeLayerId: 'i1', imageCache: { 'w.png': wide } });
    const { w, h } = getImageLayerBox(layer, wide);
    expect(callsNamed(handles(), 'roundRect')[0].args).toEqual([-(w / 2 + 6), -(h / 2 + 6), w + 12, h + 12, 10]);
  });

  it('shows crop guides instead of rotate/delete handles while cropping', () => {
    const layer = { id: 'i1', url: 'w.png', x: 0.5, y: 0.5, fitMode: 'crop', width: 200, height: 100 };
    const ui = paintImg(layer, { activeLayerId: 'i1', imageCache: { 'w.png': wide } }).handles();
    const dashed = callsNamed(ui, 'stroke').filter((c) => c.state.lineDash.length > 0);
    expect(dashed.length).toBeGreaterThan(0);
    expect(callsNamed(ui, 'arc')).toHaveLength(0); // no round delete / resize / rotate badges
  });
});

describe('paintLayers', () => {
  const paintAll = ({ captions = [], stickers = [], imageLayers = [], activeLayerId = null }) => {
    const { common, ctx } = setup();
    const drawer = paintLayers({
      ...common, activeLayerId, captions, stickers, imageLayers,
      dragTarget: { current: null }, isDragging: { current: false }, loadingMediaRef: { current: {} },
      getCaptionCenterY: (c) => c.y * 600, getStickerCenterY: (s) => s.y * 600, getImageLayerCenterY: (l) => l.y * 600,
    });
    return { ctx, drawer };
  };

  it('paints layers bottom to top by zIndex and skips hidden ones', () => {
    const { ctx } = paintAll({
      captions: [{ id: 'c', text: 'CAPTION', x: 0.5, y: 0.5, zIndex: 2 }, { id: 'h', text: 'HIDDEN', x: 0.5, y: 0.5, hidden: true }],
      stickers: [{ id: 's', emoji: '🔥', x: 0.5, y: 0.5, zIndex: 3 }, { id: 's0', emoji: '💀', x: 0.5, y: 0.5, zIndex: 1 }],
    });
    expect(textsDrawn(ctx).map((t) => t.text)).toEqual(['💀', 'CAPTION', '🔥']);
  });

  it('returns the selected layer\'s handle drawer', () => {
    expect(paintAll({ stickers: [{ id: 's', emoji: '🔥', x: 0.5, y: 0.5 }] }).drawer).toBeNull();
    expect(paintAll({ stickers: [{ id: 's', emoji: '🔥', x: 0.5, y: 0.5 }], activeLayerId: 's' }).drawer).toBeTypeOf('function');
  });
});
