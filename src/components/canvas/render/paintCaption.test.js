import { describe, it, expect } from 'vitest';
import { paintCaption } from './paintCaption';
import { getCaptionBox } from '../interaction/layerBoxes';
import { createRecordingCanvas, createRecordingContext, callsNamed, rotationOf, textsDrawn } from '../testing/recordingContext';

// Paint one caption on an 800x600 canvas and return the recording, plus the selection-handle
// drawer it registered (if any). Text is 0.6 x font size wide per character: 30px at size 50.
function paint(cap, { activeLayerId = null, isDrawingMode = false, dragging = null } = {}) {
  const canvas = createRecordingCanvas(800, 600);
  let drawer = null;
  paintCaption({
    activeLayerId,
    canvas,
    dragTarget: { current: dragging },
    getCaptionCenterY: (c) => (c.y ?? 0.5) * 600,
    isDragging: { current: Boolean(dragging) },
    isDrawingMode,
    layer: cap,
    setActiveHandleDrawer: (fn) => { drawer = fn; },
    targetCtx: canvas.ctx,
  });
  const drawHandles = () => {
    const ui = createRecordingContext();
    drawer(ui);
    return ui;
  };
  return { ctx: canvas.ctx, drawer, drawHandles };
}

const base = { id: 'c1', x: 0.5, y: 0.2, fontSize: 50 };

describe('paintCaption: text', () => {
  it('draws a short caption once, centred on its position, in white Impact', () => {
    const [t] = textsDrawn(paint({ ...base, text: 'TOP TEXT' }).ctx);
    expect(t).toMatchObject({ text: 'TOP TEXT', at: { x: 400, y: 120 }, color: '#ffffff', align: 'center' });
    expect(t.font).toBe('bold 50px Impact, "Mukta", "Baloo Bhai 2", sans-serif');
  });

  it('wraps long text and stacks the lines around the centre', () => {
    // width 0.3 -> 240px, i.e. 8 characters per line.
    const texts = textsDrawn(paint({ ...base, text: 'WHEN YOU FINALLY FIX THE BUG', width: 0.3 }).ctx);
    expect(texts.map((t) => t.text)).toEqual(['WHEN YOU', 'FINALLY', 'FIX THE', 'BUG']);
    expect(texts.map((t) => t.at.y)).toEqual([30, 90, 150, 210]); // 1.2 x 50 apart around y = 120
  });

  it('outlines the text when it has a stroke colour', () => {
    const { ctx } = paint({ ...base, text: 'HI', stroke: '#000000' });
    const [outline] = callsNamed(ctx, 'strokeText');
    expect(outline.args[0]).toBe('HI');
    expect(outline.state.strokeStyle).toBe('#000000');
    expect(outline.state.lineWidth).toBeCloseTo(50 / 7);
  });

  it('applies opacity (as a fraction or a percentage) and blur', () => {
    expect(textsDrawn(paint({ ...base, text: 'A', opacity: 0.4 }).ctx)[0].alpha).toBe(0.4);
    expect(textsDrawn(paint({ ...base, text: 'A', opacity: 50 }).ctx)[0].alpha).toBe(0.5);
    expect(callsNamed(paint({ ...base, text: 'A', blur: 4 }).ctx, 'fillText')[0].state.filter).toBe('blur(4px)');
  });

  it('rotates around the caption centre', () => {
    const [call] = callsNamed(paint({ ...base, text: 'SPIN', rotation: 30 }).ctx, 'fillText');
    expect(rotationOf(call)).toBe(30);
    expect(call.at.x).toBeCloseTo(400);
    expect(call.at.y).toBeCloseTo(120);
  });

  it('left-aligns text inside its box padding', () => {
    // "HI" is 60px; handle padding 16 -> box 92px, so the left anchor is 30px left of centre.
    const [t] = textsDrawn(paint({ ...base, text: 'HI', align: 'left' }).ctx);
    expect(t).toMatchObject({ align: 'left', at: { x: 370, y: 120 } });
  });
});

describe('paintCaption: bold, italic, underline', () => {
  it('is bold unless bold is false, and italic when asked', () => {
    expect(textsDrawn(paint({ ...base, text: 'A', bold: false }).ctx)[0].font).toBe('normal 50px Impact, "Mukta", "Baloo Bhai 2", sans-serif');
    expect(textsDrawn(paint({ ...base, text: 'A', italic: true }).ctx)[0].font).toBe('italic bold 50px Impact, "Mukta", "Baloo Bhai 2", sans-serif');
  });

  it('underlines each line under its own text, in the text colour', () => {
    // "HI" is 60px wide, centred on 400; the line sits 0.42 x 50 below the line's middle.
    const { ctx } = paint({ ...base, text: 'HI', underline: true, color: '#ff0000' });
    const [line] = callsNamed(ctx, 'fillRect');
    expect(line.args.slice(0, 3)).toEqual([-30, 21, 60]);
    expect(line.state.fillStyle).toBe('#ff0000');
    expect(callsNamed(paint({ ...base, text: 'HI' }).ctx, 'fillRect')).toHaveLength(0);
  });

  it('draws its own drop shadow when asked', () => {
    const { ctx } = paint({ ...base, text: 'HI', shadowSize: 10, shadowColor: '#ff0000' });
    const [t] = callsNamed(ctx, 'fillText');
    expect(t.state).toMatchObject({ shadowBlur: 10, shadowColor: '#ff0000' });
    const plain = callsNamed(paint({ ...base, text: 'HI' }).ctx, 'fillText')[0];
    expect(plain.state.shadowBlur).toBe(0);
  });

  it('spaces lines by its line height', () => {
    const texts = textsDrawn(paint({ ...base, text: 'WHEN YOU FINALLY', width: 0.3, lineHeight: 2 }).ctx);
    expect(texts[1].at.y - texts[0].at.y).toBe(100);
  });

  it('measures its box with the same font it draws with', () => {
    const ctx = createRecordingContext();
    getCaptionBox(ctx, { ...base, text: 'A', italic: true, bold: false }, 800);
    expect(ctx.font).toBe('italic normal 50px Impact, "Mukta", "Baloo Bhai 2", sans-serif');
  });
});

describe('paintCaption: backgrounds', () => {
  it('draws a rounded box behind the text and flips white text to black on white', () => {
    const { ctx } = paint({ ...base, text: 'HI', bgColor: 'white', color: '#ffffff' });
    const [box] = callsNamed(ctx, 'roundRect');
    expect(box.at.x).toBeLessThan(400 - 30); // starts left of the text
    expect(callsNamed(ctx, 'fill')[0].state.fillStyle).toBe('#ffffff');
    expect(textsDrawn(ctx)[0].color).toBe('#000000');
  });

  it('flips black text to white on a black box', () => {
    expect(textsDrawn(paint({ ...base, text: 'HI', bgColor: 'black', color: 'black' }).ctx)[0].color).toBe('#ffffff');
  });

  it('draws a banner across the full canvas width', () => {
    const { ctx } = paint({ ...base, x: 0.3, text: 'HI', bgColor: 'black', bgStyle: 'banner' });
    const [banner] = callsNamed(ctx, 'fillRect');
    expect(banner.at.x).toBe(0);
    expect(banner.args[2]).toBe(800);
    expect(banner.state.fillStyle).toBe('#000000');
  });

  it('does not stroke text in its own background colour', () => {
    expect(callsNamed(paint({ ...base, text: 'HI', bgColor: '#ff0000', stroke: '#ff0000' }).ctx, 'strokeText')).toHaveLength(0);
  });

  it('draws social cards with their own painter instead of caption text', () => {
    const { ctx } = paint({ ...base, isTweetCard: true, text: 'just shipped to prod on a friday', authorName: 'Dev' });
    const words = textsDrawn(ctx).map((t) => t.text).join(' ');
    expect(words).toContain('friday');
    expect(textsDrawn(ctx).some((t) => t.font === 'bold 50px Impact, "Mukta", "Baloo Bhai 2", sans-serif')).toBe(false);
  });
});

describe('paintCaption: selection handles', () => {
  const selectionBox = (ui) => callsNamed(ui, 'roundRect')[0];

  it('registers handles only for the selected caption, and not while drawing', () => {
    expect(paint({ ...base, text: 'HI' }).drawer).toBeNull();
    expect(paint({ ...base, text: 'HI' }, { activeLayerId: 'c1', isDrawingMode: true }).drawer).toBeNull();
    expect(paint({ ...base, text: 'HI' }, { activeLayerId: 'c1' }).drawer).toBeTypeOf('function');
  });

  it('draws the selection box exactly where the hit test puts the handles', () => {
    const caps = [
      { ...base, text: 'WHEN YOU FINALLY FIX THE BUG', width: 0.3 },
      { ...base, text: 'BOXED', bgColor: '#222222' },
      { ...base, text: 'BUBBLE', bubbleStyle: 'imessage-send', bgColor: '#0a84ff' },
      { ...base, text: 'CUSTOM', hasCustomWidth: true, width: 0.6 },
      { ...base, text: 'tweet body', isTweetCard: true },
    ];
    for (const cap of caps) {
      const box = selectionBox(paint(cap, { activeLayerId: 'c1' }).drawHandles());
      const expected = getCaptionBox(createRecordingContext(), cap, 800, { handles: true });
      expect([box.args[2], box.args[3]], cap.text).toEqual([expected.boxWidth, expected.boxHeight]);
      expect(box.at.x).toBeCloseTo(400 - expected.boxWidth / 2);
    }
  });

  it('shows a dashed amber outline and no handles when locked', () => {
    const ui = paint({ ...base, text: 'HI', locked: true }, { activeLayerId: 'c1' }).drawHandles();
    expect(callsNamed(ui, 'strokeRect')[0].state).toMatchObject({ strokeStyle: '#f59e0b', lineDash: [4, 4] });
    expect(textsDrawn(ui).map((t) => t.text)).toEqual(['🔒 LOCKED']);
    expect(callsNamed(ui, 'arc')).toHaveLength(0);
  });

  it('labels the size while resizing and the angle while rotating', () => {
    const resizing = paint({ ...base, text: 'HI', fontSize: 64 }, { activeLayerId: 'c1', dragging: { id: 'c1', type: 'resize_caption_br' } });
    expect(textsDrawn(resizing.drawHandles()).map((t) => t.text)).toContain('Font: 64px');
    const widening = paint({ ...base, text: 'HI' }, { activeLayerId: 'c1', dragging: { id: 'c1', type: 'resize_caption_r' } });
    expect(textsDrawn(widening.drawHandles()).map((t) => t.text)).toContain('Width: 92px');
    const rotating = paint({ ...base, text: 'HI', rotation: -90 }, { activeLayerId: 'c1', dragging: { id: 'c1', type: 'rotate_caption' } });
    expect(textsDrawn(rotating.drawHandles()).map((t) => t.text)).toContain('270°');
  });
});
