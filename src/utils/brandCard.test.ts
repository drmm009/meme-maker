import { describe, it, expect } from 'vitest';
import { END_CARD_MS, WATERMARK_ID, endCardClip, endCardStart, inkFor, keepEndCardLast, watermarkClip, withWatermark, wrapLines } from './brandCard';
import type { Clip } from '../model/videoProject';

const clip = (id: string, startMs: number, endMs: number, extra = {}) => ({ id, type: 'video', url: 'blob:x', startMs, endMs, ...extra }) as unknown as Clip;

describe('watermarkClip', () => {
  it('puts the handle in the chosen corner, small and see-through, for the whole video', () => {
    const br = watermarkClip({ text: ' @me ', corner: 'br' }, 9000, 16 / 9)!;
    expect(br).toMatchObject({ id: WATERMARK_ID, type: 'text', text: '@me', startMs: 0, endMs: 9000, align: 'right', fontSize: 23, x: 18 });
    expect(br.y).toBe(450 - 18 - 23);
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
