import { describe, expect, it } from 'vitest';
import { wrapTextLines } from '../draw/text';
import { canvasToCaption, captionCaret, captionIndexAt, captionSelectionBoxes, captionTextLayout, caretInLines, caretOnCanvas, wordAt } from './captionTextLayout';

// A fake 2D context where every character is 10px wide (and the font is whatever was set last).
const fakeCtx = () => ({
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  measureText: (s: string) => ({ width: s.length * 10 }),
}) as unknown as CanvasRenderingContext2D;

const caretFor = (cap: Record<string, unknown>, index: number, canvasWidth = 1000) => {
  const ctx = fakeCtx();
  const layout = captionTextLayout(ctx, cap, canvasWidth);
  return { layout, spot: captionCaret(ctx, cap, layout, index) };
};

describe('wrapTextLines', () => {
  it('keeps where each line came from in the text', () => {
    const lines = wrapTextLines(fakeCtx(), 'WHEN YOU FINALLY', 100);
    expect(lines.map((l: { text: string }) => l.text)).toEqual(['WHEN YOU', 'FINALLY']);
    expect(lines.map((l: { start: number; end: number }) => [l.start, l.end])).toEqual([[0, 8], [9, 16]]);
  });

  it('maps a run of spaces drawn as one to the last of them', () => {
    const [line] = wrapTextLines(fakeCtx(), 'A   B', 100);
    expect(line.text).toBe('A B');
    expect(line.map).toEqual([0, 3, 4]);
  });

  it('counts explicit line breaks and broken words', () => {
    const lines = wrapTextLines(fakeCtx(), 'AB\nCCCCCCC', 50);
    expect(lines.map((l: { text: string; start: number }) => [l.text, l.start])).toEqual([['AB', 0], ['CCCCC', 3], ['CC', 8]]);
  });
});

describe('caretInLines', () => {
  const lines = wrapTextLines(fakeCtx(), 'WHEN YOU FINALLY', 100);
  it('keeps a cursor at a line end on that line, and moves it down past the dropped space', () => {
    expect(caretInLines(lines, 8)).toEqual({ line: 0, before: 8 });
    expect(caretInLines(lines, 9)).toEqual({ line: 1, before: 0 });
    expect(caretInLines(lines, 12)).toEqual({ line: 1, before: 3 });
  });
});

describe('captionCaret', () => {
  it('runs along a centred line', () => {
    const cap = { text: 'HELLO', fontSize: 50 };
    expect(caretFor(cap, 0).spot).toMatchObject({ x: -25, y: 0, angle: 0 });
    expect(caretFor(cap, 2).spot).toMatchObject({ x: -5, y: 0 });
    expect(caretFor(cap, 5).spot).toMatchObject({ x: 25, y: 0 });
    expect(caretFor(cap, 5).spot?.height).toBeCloseTo(55);
  });

  it('starts a left-aligned line at the box padding', () => {
    const { layout, spot } = caretFor({ text: 'HI', fontSize: 50, align: 'left' }, 1);
    expect(spot?.x).toBe(layout.textAnchorX + 10);
  });

  it('goes to the next line, and past spaces typed at the end', () => {
    const cap = { text: 'WHEN YOU FINALLY ', fontSize: 40, width: 0.1 };
    const { layout, spot } = caretFor(cap, 9);
    expect(layout.lines.map((l) => l.text)).toEqual(['WHEN YOU', 'FINALLY']);
    expect(spot).toMatchObject({ x: -35, y: layout.startY + layout.lineHeight });
    // After the trailing space: a space past the end of FINALLY.
    expect(caretFor(cap, 17).spot?.x).toBe(45);
  });

  it('sits in the middle of an empty caption', () => {
    expect(caretFor({ text: '', fontSize: 40 }, 0).spot).toMatchObject({ x: 0, y: 0 });
  });

  it('follows the arc of curved text, turned with it', () => {
    const mid = caretFor({ text: 'ABCD', fontSize: 40, curve: 50 }, 2).spot;
    expect(mid?.x).toBeCloseTo(0);
    expect(mid?.angle).toBeCloseTo(0);
    const end = caretFor({ text: 'ABCD', fontSize: 40, curve: 50 }, 4).spot;
    expect(end?.angle).toBeGreaterThan(0);
  });

  it('has none for a social card', () => {
    expect(caretFor({ text: 'HI', isTweetCard: true }, 1).spot).toBeNull();
  });
});

describe('caretOnCanvas', () => {
  it('turns the cursor with the caption about its centre', () => {
    const at = caretOnCanvas({ x: 10, y: 0, height: 20, angle: 0 }, 100, 50, 90);
    expect(at.x).toBeCloseTo(100);
    expect(at.y).toBeCloseTo(60);
    expect(at.rotation).toBe(90);
  });
});

describe('canvasToCaption', () => {
  it('undoes caretOnCanvas', () => {
    const at = caretOnCanvas({ x: 12, y: -7, height: 20, angle: 0 }, 100, 50, 33);
    const back = canvasToCaption(at.x, at.y, 100, 50, 33);
    expect(back.x).toBeCloseTo(12);
    expect(back.y).toBeCloseTo(-7);
  });
});

describe('captionIndexAt', () => {
  const near = (cap: Record<string, unknown>, x: number, y: number) => {
    const ctx = fakeCtx();
    const layout = captionTextLayout(ctx, cap, 1000);
    return captionIndexAt(ctx, cap, layout, x, y);
  };

  it('picks the letter gap nearest a tap', () => {
    const cap = { text: 'HELLO', fontSize: 50 };
    expect(near(cap, -24, 3)).toBe(0);
    expect(near(cap, -7, 0)).toBe(2);
    expect(near(cap, 90, 0)).toBe(5);
  });

  it('picks the tapped line first', () => {
    const cap = { text: 'WHEN YOU FINALLY', fontSize: 40, width: 0.1 };
    const ctx = fakeCtx();
    const layout = captionTextLayout(ctx, cap, 1000);
    const second = layout.startY + layout.lineHeight;
    expect(captionIndexAt(ctx, cap, layout, -35, second)).toBe(9);
    expect(captionIndexAt(ctx, cap, layout, -40, layout.startY)).toBe(0);
  });

  it('has none for a social card', () => {
    expect(near({ text: 'HI', isTweetCard: true }, 0, 0)).toBeNull();
  });
});

describe('captionSelectionBoxes', () => {
  const boxes = (cap: Record<string, unknown>, a: number, b: number) => {
    const ctx = fakeCtx();
    const layout = captionTextLayout(ctx, cap, 1000);
    return captionSelectionBoxes(ctx, cap, layout, a, b);
  };

  it('is one box per straight line', () => {
    const [box, ...rest] = boxes({ text: 'HELLO', fontSize: 50 }, 1, 4);
    expect(rest).toHaveLength(0);
    expect(box).toMatchObject({ x: 0, width: 30, angle: 0 });
  });

  it('splits across lines and is empty with nothing selected', () => {
    expect(boxes({ text: 'WHEN YOU FINALLY', fontSize: 40, width: 0.1 }, 2, 12)).toHaveLength(2);
    expect(boxes({ text: 'HELLO', fontSize: 50 }, 3, 3)).toEqual([]);
  });

  it('follows a curve letter by letter', () => {
    const out = boxes({ text: 'ABCD', fontSize: 40, curve: 50 }, 0, 4);
    expect(out).toHaveLength(4);
    expect(out[0].angle).not.toBeCloseTo(out[3].angle);
  });
});

describe('wordAt', () => {
  it('finds the word a spot touches', () => {
    expect(wordAt('WHEN YOU FINALLY', 6)).toEqual([5, 8]);
    expect(wordAt('WHEN YOU FINALLY', 8)).toEqual([5, 8]);
    expect(wordAt('A  B', 2)).toEqual([2, 2]);
  });
});
