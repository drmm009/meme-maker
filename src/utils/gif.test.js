import { describe, it, expect } from 'vitest';
import { isGifUrl, gifPaletteFilter, frameIndexAt } from './gif';

describe('gif helpers', () => {
  it('spots GIF URLs, with or without a query', () => {
    expect(isGifUrl('https://media.giphy.com/media/abc/200w.gif')).toBe(true);
    expect(isGifUrl('https://x/a.GIF?cid=1')).toBe(true);
    expect(isGifUrl('https://x/a.gifv')).toBe(false);
    expect(isGifUrl('/images/a.png')).toBe(false);
    expect(isGifUrl(null)).toBe(false);
  });

  it('builds a palette GIF chain sized by the long side', () => {
    const wide = gifPaletteFilter('[bg3]', 1280, 720, '[out]');
    expect(wide.startsWith('[bg3]fps=15,scale=480:-2:flags=lanczos,split[gifa][gifb];')).toBe(true);
    expect(wide).toContain('[gifa]palettegen=stats_mode=diff[gifpal]');
    expect(wide.endsWith('[gifb][gifpal]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[out]')).toBe(true);
    expect(gifPaletteFilter('[0:v]', 720, 1280, '[o]')).toContain('scale=-2:480');
  });

  it('finds the showing frame in a looping animation', () => {
    const d = [100, 50, 150];
    expect(frameIndexAt(d, 0)).toBe(0);
    expect(frameIndexAt(d, 120)).toBe(1);
    expect(frameIndexAt(d, 299)).toBe(2);
    expect(frameIndexAt(d, 300)).toBe(0);
    expect(frameIndexAt(d, 420)).toBe(1);
    expect(frameIndexAt(d, -10)).toBe(2);
    expect(frameIndexAt([], 50)).toBe(0);
  });
});
