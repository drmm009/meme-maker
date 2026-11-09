import { describe, it, expect } from 'vitest';
import { END_CARD_MS, WATERMARK_ID, WATERMARK_LOGO_ID, endCardClip, endCardStart, inkFor, keepEndCardLast, watermarkClip, watermarkLogoClip, withWatermark, wrapLines } from './brandCard';
import type { Clip } from '../model/videoProject';

const clip = (id: string, startMs: number, endMs: number, extra = {}) => ({ id, type: 'video', url: 'blob:x', startMs, endMs, ...extra }) as unknown as Clip;

describe('watermarkClip', () => {
  it('puts the handle in the chosen corner, small and see-through, for the whole video', () => {
    const br = watermarkClip({ text: ' @me ', corner: 'br' }, 9000, 16 / 9)!;
    expect(br).toMatchObject({ id: WATERMARK_ID, type: 'text', text: '@me', startMs: 0, endMs: 9000, align: 'right', fontSize: 23, x: 18 });
    // Its box: the line (1.2 x the font) and the padding above and below.
    expect(br.y).toBe(450 - 18 - Math.round(23 * 1.2 + 2 * 10));
    const tl = watermarkClip({ text: '@me', corner: 'tl' }, 9000, 9 / 16)!;
    expect(tl).toMatchObject({ align: 'left', y: 32, fontSize: 40 });
  });

  it('is nothing without text', () => {
    expect(watermarkClip(null, 9000, 1)).toBeNull();
    expect(watermarkClip({ text: '  ', corner: 'br' }, 9000, 1)).toBeNull();
    const items = [clip('a', 0, 1000)];
    expect(withWatermark(items, null, 1000, 1)).toBe(items);
    expect(withWatermark(items, { text: '@me', corner: 'br' }, 1000, 1).map((i) => i.id)).toEqual(['a', WATERMARK_ID]);
  });

  it('takes its colour, size and opacity, and is nothing while switched off', () => {
    const wm = { text: '@me', corner: 'br' as const, color: '#000000', size: 48, opacity: 0.4 };
    // Twice the standard size; dark text gets a light edge.
    expect(watermarkClip(wm, 9000, 16 / 9)).toMatchObject({ color: '#000000', fontSize: 45, opacity: 0.4, stroke: 'rgba(255, 255, 255, 0.55)' });
    expect(watermarkClip({ ...wm, enabled: false }, 9000, 16 / 9)).toBeNull();
    expect(watermarkLogoClip({ ...wm, logo: 'x', enabled: false }, 9000, 16 / 9)).toBeNull();
  });

  it('puts a logo in the corner with the text beside it', () => {
    const wm = { text: '@me', corner: 'br' as const, logo: 'instagram' as const };
    const logo = watermarkLogoClip(wm, 9000, 16 / 9)!;
    const text = watermarkClip(wm, 9000, 16 / 9)!;
    // 1.3 x the font, against the right margin, centred on the text's line.
    expect(logo).toMatchObject({ id: WATERMARK_LOGO_ID, type: 'sticker', width: 30, height: 30, x: 800 - 18 - 30, startMs: 0, endMs: 9000 });
    expect(logo.url.startsWith('data:image/svg+xml')).toBe(true);
    expect(logo.y! + 15).toBe(text.y! + Math.round(23 * 1.2 + 2 * 10) / 2);
    // The text's box stops short of it.
    expect(text.x! + text.width!).toBe(800 - 18 - 30 - 5);
    // In a left corner the logo is on the left and the text after it.
    const left = watermarkClip({ ...wm, corner: 'tl' }, 9000, 16 / 9)!;
    expect(left.x).toBe(18 + 35);
    expect(watermarkLogoClip({ ...wm, corner: 'tl' }, 9000, 16 / 9)!.x).toBe(18);
    // An uploaded logo is its own picture; a logo with no name still shows.
    expect(watermarkLogoClip({ text: '', corner: 'br', logo: 'custom', logoUrl: 'data:image/png;base64,x' }, 9000, 1)!.url).toBe('data:image/png;base64,x');
    expect(withWatermark([], { text: '', corner: 'br', logo: 'x' }, 9000, 1).map((i) => i.id)).toEqual([WATERMARK_LOGO_ID]);
  });
});

describe('end card', () => {
  it('goes after every other clip (not after itself) and fills the frame', () => {
    const items = [clip('a', 0, 4000), clip('b', 2000, 6000), clip('e', 6000, 8500, { type: 'image', endCard: { title: 'x' } })];
    expect(endCardStart(items)).toBe(6000);
    expect(endCardStart([])).toBe(0);
    const card = endCardClip({ title: 'Bye', subtitle: '', color: '#000000' }, 'data:x', items, 16 / 9);
    expect(card).toMatchObject({ type: 'image', startMs: 6000, endMs: 6000 + END_CARD_MS, x: 0, y: 0, width: 800, height: 450, isPositioned: true });
  });

  it('follows the other clips when they get longer or shorter, unless it was moved earlier', () => {
    const card = clip('e', 6000, 8500, { type: 'image', endCard: { title: 'x' } });
    const prev = [clip('a', 0, 6000), card];
    const longer = keepEndCardLast(prev, [clip('a', 0, 9000), card]);
    expect(longer[1]).toMatchObject({ startMs: 9000, endMs: 11500 });
    const shorter = keepEndCardLast(prev, [clip('a', 0, 4000), card]);
    expect(shorter[1]).toMatchObject({ startMs: 4000, endMs: 6500 });
    const unchanged = [clip('a', 0, 6000), card];
    expect(keepEndCardLast(prev, unchanged)).toBe(unchanged);
    const movedEarlier = [clip('a', 0, 6000), { ...card, startMs: 2000, endMs: 4500 }];
    expect(keepEndCardLast(movedEarlier, [clip('a', 0, 9000), movedEarlier[1]])[1].startMs).toBe(2000);
  });

  it('writes in black or white, whichever reads on the colour', () => {
    expect(inkFor('#ffffff')).toBe('#111111');
    expect(inkFor('#facc15')).toBe('#111111');
    expect(inkFor('#111111')).toBe('#ffffff');
    expect(inkFor('#3b82f6')).toBe('#ffffff');
  });

  it('wraps words to the width', () => {
    const measure = (s: string) => s.length * 10;
    expect(wrapLines('Thanks for watching this', 120, measure)).toEqual(['Thanks for', 'watching', 'this']);
    expect(wrapLines('Supercalifragilistic', 50, measure)).toEqual(['Supercalifragilistic']);
    expect(wrapLines('  ', 50, measure)).toEqual([]);
  });
});
