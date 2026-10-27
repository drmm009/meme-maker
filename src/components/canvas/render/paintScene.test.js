// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { paintBase } from './paintBase';
import { getImageArea } from './imageArea';
import { paintHeaderFooter } from './paintHeaderFooter';
import { paintDrawings } from './paintDrawings';
import { paintWatermark } from './paintWatermark';
import { paintOverlays } from './paintOverlays';
import { renderScene } from './renderScene';
import { createRecordingCanvas, createRecordingContext, callsNamed, textsDrawn } from '../testing/recordingContext';

describe('paintBase', () => {
  const img = { width: 400, height: 200 }; // 2:1 on a 4:3 image area
  const paint = (opts = {}) => {
    const ctx = createRecordingContext();
    const area = getImageArea({ canvasW: 800, canvasH: 600, headerExtH: opts.headerExtH || 0, demotivational: opts.demotivational });
    paintBase({
      activeIsNativeLayout: false, activeLayoutDef: null, baseImgRef: { current: img }, bgFilterCss: 'none',
      canvasFlipX: false, demotivational: null, imageCacheRef: { current: {} }, imageFit: 'contain', img,
      isNativeLayout: false, liveBgColor: '#123456', renderCanvas: () => {}, slotImages: [], slotTransforms: [],
      targetCtx: ctx, ...area, ...opts
    });
    return ctx;
  };
  const drawn = (ctx) => callsNamed(ctx, 'drawImage')[0].args.slice(1);

  it('letterboxes with "contain", crops with "cover" and fills with "stretch"', () => {
    expect(drawn(paint())).toEqual([0, 100, 800, 400]);
    expect(drawn(paint({ imageFit: 'cover' }))).toEqual([-200, 0, 1200, 600]);
    expect(drawn(paint({ imageFit: 'stretch' }))).toEqual([0, 0, 800, 600]);
  });

  it('places the image below a header band', () => {
    expect(drawn(paint({ headerExtH: 100 }))).toEqual([0, 200, 800, 400]);
  });

  it('mirrors the image when the canvas is flipped', () => {
    expect(callsNamed(paint({ canvasFlipX: true }), 'drawImage')[0].state.matrix[0]).toBe(-1);
  });

  it('frames a demotivational poster inside a white border', () => {
    const ctx = paint({ demotivational: { enabled: true } });
    expect(callsNamed(ctx, 'strokeRect')[0]).toMatchObject({ args: [59, 43, 682, 394], state: { strokeStyle: '#ffffff' } });
  });

  it('draws multi-panel layouts panel by panel, with borders and empty panels filled', () => {
    const panel = { width: 800, height: 300 };
    const ctx = paint({
      activeIsNativeLayout: true, activeLayoutDef: { id: '2-vert', slots: 2 },
      slotImages: ['top.png', null], imageCacheRef: { current: { 'top.png': panel } }
    });
    // Panel 1: the default 1.5x zoom, centred and clipped to its panel.
    expect(callsNamed(ctx, 'rect')[0].args).toEqual([0, 0, 800, 300]);
    expect(drawn(ctx)).toEqual([-200, -75, 1200, 450]);
    // Panel 2 is empty.
    expect(callsNamed(ctx, 'fillRect')[0]).toMatchObject({ args: [0, 300, 800, 300], state: { fillStyle: '#123456' } });
    expect(callsNamed(ctx, 'strokeRect').map((c) => c.args)).toEqual([[0, 0, 800, 300], [0, 300, 800, 300]]);
  });
});

describe('paintHeaderFooter', () => {
  const paint = (opts) => {
    const ctx = createRecordingContext();
    paintHeaderFooter({
      canvasBgColor: '#ffffff', canvasFooter: {}, canvasH: 600, canvasHeader: {}, canvasW: 800,
      footerExtH: 80, headerExtH: 100, isFooterEnabled: false, isHeaderEnabled: false, liveBgColor: null, targetCtx: ctx, ...opts
    });
    return ctx;
  };

  it('fills the bands in the canvas colour with a divider line', () => {
    const ctx = paint({ isHeaderEnabled: true, isFooterEnabled: true });
    expect(callsNamed(ctx, 'fillRect').map((c) => c.args)).toEqual([[0, 0, 800, 100], [0, 700, 800, 80]]);
    expect(callsNamed(ctx, 'stroke')[0].state.strokeStyle).toBe('rgba(0, 0, 0, 0.08)');
  });

  it('uses a light divider on a dark canvas, and the live colour while picking', () => {
    const ctx = paint({ isHeaderEnabled: true, liveBgColor: '#000000' });
    expect(callsNamed(ctx, 'fillRect')[0].state.fillStyle).toBe('#000000');
    expect(callsNamed(ctx, 'stroke')[0].state.strokeStyle).toBe('rgba(255, 255, 255, 0.15)');
  });

  it('draws nothing when the bands are off', () => {
    expect(paint({}).calls).toHaveLength(0);
  });
});

describe('paintDrawings', () => {
  const paint = (drawings) => {
    const ctx = createRecordingContext();
    paintDrawings({ drawings, targetCtx: ctx });
    return ctx;
  };

  it('draws a single point as a dot and a stroke as a line through its points', () => {
    const ctx = paint([
      { mode: 'pen', color: '#ff0000', size: 10, points: [{ x: 5, y: 5 }] },
      { mode: 'pen', color: '#00ff00', size: 4, points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }] },
    ]);
    expect(callsNamed(ctx, 'arc')[0].args.slice(0, 3)).toEqual([5, 5, 5]);
    expect(callsNamed(ctx, 'lineTo').map((c) => c.args)).toEqual([[10, 0], [10, 10]]);
    expect(callsNamed(ctx, 'stroke')[0].state).toMatchObject({ strokeStyle: '#00ff00', lineWidth: 4, lineCap: 'round' });
  });

  it('makes the marker see-through and the glow brush glow', () => {
    const line = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    expect(callsNamed(paint([{ mode: 'highlighter', points: line }]), 'stroke')[0].state.globalAlpha).toBe(0.45);
    expect(callsNamed(paint([{ type: 'glow', size: 10, color: '#0ff', points: line }]), 'stroke')[0].state).toMatchObject({ shadowColor: '#0ff', shadowBlur: 15 });
  });
});

describe('paintWatermark', () => {
  const paint = (watermark) => {
    const canvas = createRecordingCanvas(800, 600);
    paintWatermark({ canvas, imageCacheRef: { current: { 'logo.png': { width: 100, height: 50 } } }, targetCtx: canvas.ctx, watermark });
    return canvas.ctx;
  };

  it('puts text in the chosen corner, 20px in, half transparent by default', () => {
    // "@MEMES" = 6 chars x 24px x 0.6 = 86.4px wide, 24px tall.
    const [t] = textsDrawn(paint({ enabled: true, text: '@MEMES', size: 24 }));
    expect(t.at.x).toBeCloseTo(800 - 20 - 86.4);
    expect(t.at.y).toBe(600 - 20 - 24);
    expect(t.alpha).toBe(0.5);
    expect(textsDrawn(paint({ enabled: true, text: '@MEMES', position: 'top-left' }))[0].at).toEqual({ x: 20, y: 20 });
  });

  it('outlines black text in white', () => {
    expect(callsNamed(paint({ enabled: true, text: 'X', color: '#000000' }), 'strokeText')[0].state.strokeStyle).toBe('#ffffff');
  });

  it('draws an image watermark scaled to 3x its size setting', () => {
    const [draw] = callsNamed(paint({ enabled: true, imageUrl: 'logo.png', size: 20 }), 'drawImage');
    expect(draw.args.slice(1)).toEqual([800 - 20 - 60, 600 - 20 - 30, 60, 30]);
  });

  it('draws nothing when off', () => {
    expect(paint({ enabled: false, text: 'X' }).calls).toHaveLength(0);
  });
});

describe('paintOverlays', () => {
  const paint = ({ dragging = true, horizontal = null, vertical = null, skipHandles = false, drawer = null } = {}) => {
    const canvas = createRecordingCanvas(800, 700);
    paintOverlays({
      activeCaption: null, activeHandleDrawer: drawer, applyGlobalFilter: false, canvas, canvasH: 600,
      compCanvas: null, ctx: canvas.ctx, filterCss: 'none', headerExtH: 100,
      isDragging: { current: dragging }, skipHandles, snappingLines: { current: { horizontal, vertical } }
    });
    return canvas.ctx;
  };

  it('draws snap guides only mid-drag: cyan through the centre, purple elsewhere', () => {
    const ctx = paint({ horizontal: 0.5, vertical: 0.25 });
    const [h, v] = callsNamed(ctx, 'stroke');
    expect(h.state.strokeStyle).toBe('#00f0ff');
    expect(callsNamed(ctx, 'moveTo')[0].args).toEqual([0, 400]); // below the 100px header
    expect(v.state.strokeStyle).toBe('#a855f7');
    expect(paint({ dragging: false, horizontal: 0.5 }).calls).toHaveLength(0);
  });

  it('draws the selection handles unless exporting', () => {
    let drawn = 0;
    paint({ dragging: false, drawer: () => { drawn += 1; } });
    paint({ dragging: false, drawer: () => { drawn += 1; }, skipHandles: true });
    expect(drawn).toBe(1);
  });
});

describe('renderScene', () => {
  const makeScene = (overrides = {}) => {
    const canvas = createRecordingCanvas(100, 100);
    const base = { src: 'base.png', width: 400, height: 300 };
    return {
      canvas,
      scene: {
        activeCaption: null, activeFilters: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 },
        activeIsNativeLayout: false, activeLayerId: null, activeLayoutDef: null,
        baseImgRef: { current: base }, canvasBgColor: '#ffffff', canvasFlipX: false, canvasFooter: { enabled: false },
        canvasH: 600, canvasHeader: { enabled: true }, canvasRef: { current: canvas }, canvasW: 800,
        captions: [{ id: 'c1', text: 'HELLO', x: 0.5, y: 0.5, fontSize: 40 }], compCanvasRef: { current: null },
        demotivational: null, dragTarget: { current: null }, drawings: [], footerExtH: 0,
        getCaptionCenterY: (c) => 100 + c.y * 600, getImageLayerCenterY: (l) => 100 + l.y * 600,
        getStickerCenterY: (s) => 100 + s.y * 600, headerExtH: 100, imageCacheRef: { current: {} },
        imageFit: 'contain', imageLayers: [], imgSrc: 'base.png', isDragging: { current: false },
        isDrawingMode: false, isFooterEnabled: false, isHeaderEnabled: true, isNativeLayout: false,
        liveBgColor: '#ffffff', loadingMediaRef: { current: {} }, naturalSize: { w: 400, h: 300 },
        setNaturalSize: () => {}, slotImages: [], slotTransforms: [], snappingLines: { current: { horizontal: null, vertical: null } },
        stickers: [], totalCanvasH: 700, watermark: { enabled: false }, ...overrides
      }
    };
  };

  it('sizes the canvas, then paints background, image, header band and captions in order', () => {
    const { canvas, scene } = makeScene();
    renderScene(scene);
    expect([canvas.width, canvas.height]).toEqual([800, 700]);
    const order = canvas.ctx.calls.filter((c) => ['fillRect', 'drawImage', 'fillText'].includes(c.name)).map((c) => c.name);
    expect(order).toEqual(['fillRect', 'drawImage', 'fillRect', 'fillText']);
    expect(callsNamed(canvas.ctx, 'drawImage')[0].args.slice(1)).toEqual([0, 100, 800, 600]);
    expect(textsDrawn(canvas.ctx)[0].at).toEqual({ x: 400, y: 400 });
  });

  it('draws the selected layer\'s handles on screen but leaves them out of a clean export', () => {
    const { canvas, scene } = makeScene({ activeLayerId: 'c1' });
    renderScene(scene);
    // The selection box and its two side capsules are rounded rects; plain captions draw none.
    const handleShapes = () => callsNamed(canvas.ctx, 'roundRect').length;
    const perPass = handleShapes();
    expect(perPass).toBe(3);

    let shapesAtExport = null;
    canvas.toDataURL = () => { shapesAtExport = handleShapes(); return 'data:'; };
    canvas.exportCleanImage();
    expect(shapesAtExport).toBe(perPass); // the clean pass added no handles
    expect(handleShapes()).toBe(perPass * 2); // and they're back on screen afterwards
  });
});
