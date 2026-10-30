import { describe, it, expect } from 'vitest';
import { isGifUrl, gifPaletteFilter, frameIndexAt, gifFramesRGBA } from './gif';

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

describe('GIFs without ImageDecoder (Safari)', () => {
  // 4x4, two frames: all red for 50ms, then the left half green (the right half see-through, so the
  // red stays) for 120ms.
  const GIF = 'R0lGODlhBAAEAIEAAP8AAAD/AAAAAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQFBQACACwAAAAABAAEAAAICQABCBxIsCCAgAAh+QQFDAACACwAAAAABAAEAIH/AAAA/wAAAAD///8IDgADBBAgQCBBgwUHCggIADs=';
  const bytes = Uint8Array.from(atob(GIF), (c) => c.charCodeAt(0));
  const pixel = (rgba, x, y) => Array.from(rgba.slice((y * 4 + x) * 4, (y * 4 + x) * 4 + 4));

  it('decodes every frame as the whole picture at that moment, with its timing', async () => {
    const { GifReader } = await import('omggif');
    const gif = gifFramesRGBA(bytes, GifReader);
    expect([gif.width, gif.height]).toEqual([4, 4]);
    expect(gif.durations).toEqual([50, 120]);
    expect(pixel(gif.frames[0], 3, 0)).toEqual([255, 0, 0, 255]);
    expect(pixel(gif.frames[1], 0, 0)).toEqual([0, 255, 0, 255]);
    // Drawn over the first frame: its see-through half keeps the red.
    expect(pixel(gif.frames[1], 3, 3)).toEqual([255, 0, 0, 255]);
  });
});
