import { describe, it, expect } from 'vitest';
import { getDragStart, getRotation, moveLayer, resizeCaption, resizeImageLayer, resizeSticker } from './dragMath';
import { startStroke } from './freehand';

const canvas = { width: 800, height: 600 };
const centres = {
  canvas, canvasH: 600, headerExtH: 0, totalCanvasH: 600,
  getCaptionCenterY: (c) => c.y * 600, getStickerCenterY: (s) => s.y * 600, getImageLayerCenterY: (l) => l.y * 600
};

describe('getDragStart', () => {
  it('records the centre and distance to the pointer', () => {
    const start = getDragStart({ id: 's', type: 'resize_sticker_br', x: 0.5, y: 0.5, scale: 2 }, { x: 430, y: 340 }, centres);
    expect(start).toMatchObject({ centerX: 400, centerY: 300, scale: 2, initialDist: 50 });
  });

  it('measures a header caption still in its band against the whole canvas', () => {
    const hit = { id: 'h', type: 'caption', x: 0.5, y: 0, isHeaderCaption: true, hasCustomPos: false };
    const start = getDragStart(hit, { x: 400, y: 30 }, { ...centres, getCaptionCenterY: () => 30 });
    expect(start.y).toBeCloseTo(30 / 600);
  });
});

describe('getRotation', () => {
  it('is 0 with the pointer straight above the centre', () => {
    expect(getRotation({ x: 0, y: 0 }, { x: 0, y: -50 })).toBe(0);
  });

  it('snaps to right angles within 3.5 degrees', () => {
    const near90 = { x: 100, y: Math.tan((2 * Math.PI) / 180) * 100 }; // 92 degrees
    expect(getRotation({ x: 0, y: 0 }, near90)).toBe(90);
    const at100 = { x: 100, y: Math.tan((10 * Math.PI) / 180) * 100 };
    expect(getRotation({ x: 0, y: 0 }, at100)).toBeCloseTo(100);
  });
});

describe('moveLayer', () => {
  const lists = { captions: [], stickers: [], imageLayers: [] };
  it('moves by the pointer delta and snaps to the centre lines', () => {
    const r = moveLayer({ target: { id: 's', type: 'sticker' }, start: { x: 0.3, y: 0.3 }, dx: 0.195, dy: 0.1, canvas, canvasH: 600, ...lists });
    expect(r.x).toBe(0.5);
    expect(r.y).toBeCloseTo(0.4);
    expect(r.guides).toEqual({ horizontal: null, vertical: 0.5 });
  });

  it('snaps to other layers but not to itself', () => {
    const r = moveLayer({
      target: { id: 's', type: 'sticker' }, start: { x: 0.2, y: 0.2 }, dx: 0.005, dy: 0, canvas, canvasH: 600,
      ...lists, stickers: [{ id: 's', x: 0.21, y: 0.9 }], captions: [{ id: 'c', x: 0.21, y: 0.7 }]
    });
    expect(r.x).toBe(0.21);
    expect(r.guides.vertical).toBe(0.21);
  });

  it('keeps captions 8px inside the canvas', () => {
    const r = moveLayer({ target: { id: 'c', type: 'caption' }, start: { x: 0.5, y: 0.5, boxWidth: 200, boxHeight: 60 }, dx: -1, dy: 0, canvas, canvasH: 600, ...lists });
    expect(r.x).toBeCloseTo(108 / 800);
  });
});

describe('resizing', () => {
  it('scales a sticker with the pointer distance', () => {
    const start = { centerX: 400, centerY: 300, scale: 1, initialDist: 50 };
    expect(resizeSticker({ coords: { x: 400, y: 400 }, start, sticker: { scale: 1 }, canvasWidth: 800, headerExtH: 0, canvasH: 600 })).toEqual({ scale: 2 });
  });

  it('changes a caption\'s wrap width from a side handle', () => {
    const start = { centerX: 400, centerY: 300, rotation: 0, initialBoxHeight: 60 };
    const patch = resizeCaption({ handleType: 'resize_caption_r', coords: { x: 600, y: 300 }, start, caption: {}, canvas, headerExtH: 0, canvasH: 600 });
    expect(patch).toEqual({ width: 0.5, hasCustomWidth: true });
  });

  it('scales a caption\'s font from the corner', () => {
    const start = { centerX: 400, centerY: 300, rotation: 0, initialDist: 50, handleRelX: 30, handleRelY: 40, initialFontSize: 40, initialWidth: 0.5, initialBoxWidth: 60, initialBoxHeight: 80 };
    const patch = resizeCaption({ handleType: 'resize_caption_br', coords: { x: 460, y: 380 }, start, caption: {}, canvas, headerExtH: 0, canvasH: 600 });
    // Projection onto the (30, 40) diagonal doubles the size; the width caps at 0.98.
    expect(patch).toEqual({ fontSize: 80, width: 0.98 });
  });

  it('stretches an image layer from an edge and scales it from the corner', () => {
    const base = { coords: { x: 500, y: 300 }, start: { centerX: 400, centerY: 300, boxWidth: 100, boxHeight: 80, scale: 1, initialDist: 50 }, layer: {}, canvasWidth: 800, headerExtH: 0, canvasH: 600 };
    expect(resizeImageLayer({ ...base, handleType: 'resize_imageLayer_r' })).toEqual({ width: 200, boxWidth: 200, height: 80, boxHeight: 80, fitMode: 'stretch' });
    expect(resizeImageLayer({ ...base, handleType: 'resize_imageLayer_br' })).toMatchObject({ width: 200, height: 160, scale: 2 });
  });

  it('crops from the left edge while the right edge stays put', () => {
    const start = { centerX: 400, centerY: 300, boxWidth: 200, boxHeight: 100, crop: { x: 0, y: 0, width: 0.5, height: 1 }, fitMode: 'crop' };
    // Full image is 400px wide; the pointer moves the left edge from 300 to 400.
    const patch = resizeImageLayer({ handleType: 'resize_imageLayer_l', coords: { x: 400, y: 300 }, start, layer: { fitMode: 'crop' }, canvasWidth: 800, headerExtH: 0, canvasH: 600 });
    expect(patch.width).toBe(100);
    expect(patch.crop).toMatchObject({ x: 0.25, width: 0.25 });
    expect(patch.x * 800).toBeCloseTo(450); // right edge still at 500
  });

  it('ignores the corner while cropping', () => {
    const start = { centerX: 400, centerY: 300, boxWidth: 200, boxHeight: 100, fitMode: 'crop' };
    expect(resizeImageLayer({ handleType: 'resize_imageLayer_br', coords: { x: 0, y: 0 }, start, layer: {}, canvasWidth: 800, headerExtH: 0, canvasH: 600 })).toBeNull();
  });
});

describe('startStroke', () => {
  it('erases in the canvas background colour', () => {
    const s = startStroke({ drawTool: 'eraser', canvasBgColor: '#123456', brushColor: '#f00', brushSize: 8, point: { x: 1, y: 2 } });
    expect(s).toMatchObject({ type: 'eraser', mode: 'eraser', color: '#123456', size: 8, points: [{ x: 1, y: 2 }] });
  });

  it('maps highlighter and glow to their paint modes', () => {
    expect(startStroke({ drawTool: 'highlighter', brushColor: '#f00', point: { x: 0, y: 0 } }).mode).toBe('highlighter');
    expect(startStroke({ drawTool: 'glow', brushColor: '#f00', point: { x: 0, y: 0 } }).mode).toBe('glow');
    expect(startStroke({ drawTool: null, brushColor: '#f00', point: { x: 0, y: 0 } })).toMatchObject({ type: 'brush', mode: 'pen' });
  });
});
