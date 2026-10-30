import { describe, it, expect } from 'vitest';
import { MIN_FIT_SIZE, applyCaptionFont, captionFont, captionGradient, captionLineHeight, fittedFontSize, spacedText } from './captionFont';
import { familyFromFileName, toCustomFont } from '../../../utils/customFonts';

describe('caption text style', () => {
  it('sets the font and letter spacing (a fraction of the font size) where the browser supports it', () => {
    const ctx = { font: '', letterSpacing: '0px' } as unknown as CanvasRenderingContext2D;
    applyCaptionFont(ctx, { fontFamily: 'Anton, sans-serif', letterSpacing: 0.1, italic: true }, 50);
    expect(ctx.font).toBe('italic bold 50px Anton, sans-serif');
    expect((ctx as unknown as { letterSpacing: string }).letterSpacing).toBe('5px');
    applyCaptionFont(ctx, {}, 40);
    expect((ctx as unknown as { letterSpacing: string }).letterSpacing).toBe('0px');
    // No letterSpacing on the context (older browsers): just the font.
    const old = { font: '' } as unknown as CanvasRenderingContext2D;
    applyCaptionFont(old, { letterSpacing: 0.2 }, 40);
    expect('letterSpacing' in old).toBe(false);
    expect(captionFont({}, 40)).toBe('bold 40px Impact, sans-serif');
  });

  it('spaces lines by lineHeight times the font size (1.2 by default)', () => {
    expect(captionLineHeight({}, 50)).toBe(60);
    expect(captionLineHeight({ lineHeight: 1.6 }, 50)).toBe(80);
  });

  it('makes a left-to-right gradient across the line, or none', () => {
    const stops: [number, string][] = [];
    const grad = { addColorStop: (o: number, c: string) => stops.push([o, c]) };
    const ctx = { createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => ({ ...grad, at: [x0, y0, x1, y1] }) } as unknown as CanvasRenderingContext2D;
    const g = captionGradient(ctx, { gradient: ['#ff0000', '#0000ff'] }, 200) as unknown as { at: number[] };
    expect(g.at).toEqual([-100, 0, 100, 0]);
    expect(stops).toEqual([[0, '#ff0000'], [1, '#0000ff']]);
    expect(captionGradient(ctx, { gradient: null }, 200)).toBeNull();
  });

  it('names an uploaded font after its file', () => {
    expect(familyFromFileName('My Font-Bold.ttf')).toBe('My Font-Bold');
    expect(familyFromFileName('weird<>name!!.woff2')).toBe('weirdname');
    expect(familyFromFileName('.otf')).toBe('Custom font');
    expect(toCustomFont('Comic X').css).toBe('"Comic X", sans-serif');
  });
});

describe('shrink to fit', () => {
  // Every character is half the font size wide.
  const measuringCtx = () => {
    const ctx = { font: '', measureText: (t: string) => ({ width: t.length * Number(/(\d+)px/.exec(ctx.font)?.[1] || 10) * 0.5 }) };
    return ctx as unknown as CanvasRenderingContext2D;
  };

  it("keeps the caption's own size unless shrink-to-fit is on", () => {
    expect(fittedFontSize(measuringCtx(), { text: 'A VERY LONG CAPTION INDEED', fontSize: 60 }, 200)).toBe(60);
    expect(fittedFontSize(null, { text: 'X', fontSize: 60, autoFit: true }, 200)).toBe(60);
  });

  it('shrinks until the text fits in the allowed lines, never growing', () => {
    // "HELLO WORLD" at 60px is 330px wide: two lines of 150px in a 200px box.
    const two = fittedFontSize(measuringCtx(), { text: 'HELLO WORLD', fontSize: 60, autoFit: true }, 200);
    expect(two).toBe(60);
    const one = fittedFontSize(measuringCtx(), { text: 'HELLO WORLD', fontSize: 60, autoFit: true, maxLines: 1 }, 200);
    expect(one * 11 * 0.5).toBeLessThanOrEqual(200);
    expect(one).toBeLessThan(60);
    expect(fittedFontSize(measuringCtx(), { text: 'SUPERCALIFRAGILISTIC', fontSize: 60, autoFit: true }, 20)).toBe(MIN_FIT_SIZE);
  });
});

describe('letter spacing where the canvas has none (Safari)', () => {
  // A hair space is 2px wide here; other characters 10px.
  const noSpacingCtx = { font: '', measureText: (t: string) => ({ width: t === '\u200A' ? 2 : t.length * 10 }) } as unknown as CanvasRenderingContext2D;

  it('puts hair spaces between letters, as many as make up the gap', () => {
    // 0.1 of 40px is a 4px gap: two hair spaces.
    const g = '\u200A\u200A';
    expect(spacedText(noSpacingCtx, 'AB CD', { letterSpacing: 0.1 }, 40)).toBe(`A${g}B${g} ${g}C${g}D`);
    expect(spacedText(noSpacingCtx, 'A\nB', { letterSpacing: 0.1 }, 40)).toBe('A\nB');
  });

  it('leaves the text alone when the canvas can space letters, or the spacing is none or tighter', () => {
    const spacingCtx = { font: '', letterSpacing: '0px', measureText: () => ({ width: 2 }) } as unknown as CanvasRenderingContext2D;
    expect(spacedText(spacingCtx, 'AB', { letterSpacing: 0.1 }, 40)).toBe('AB');
    expect(spacedText(noSpacingCtx, 'AB', {}, 40)).toBe('AB');
    expect(spacedText(noSpacingCtx, 'AB', { letterSpacing: -0.1 }, 40)).toBe('AB');
  });
});
