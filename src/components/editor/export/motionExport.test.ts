import { describe, it, expect } from 'vitest';
import { MAX_MOTION_MS, isMotionFormat, motionDuration, motionFps, motionSize } from './motionExport';
import { animatedSpecs, isAnimatedGifUrl } from '../../canvas/media/animatedSources';

describe('animated export', () => {
  it('runs one loop of the longest moving layer, within limits', () => {
    expect(motionDuration([800, 2400], 'gif')).toBe(2400);
    expect(motionDuration([300], 'gif')).toBe(1000);
    expect(motionDuration([60000], 'mp4')).toBe(MAX_MOTION_MS);
    // MP4s run at least three seconds, in whole loops.
    expect(motionDuration([1200], 'mp4')).toBe(3600);
    expect(motionDuration([], 'gif')).toBe(1000);
  });

  it('keeps GIFs small and MP4 sides even', () => {
    expect(motionSize(1080, 675, 'gif', 'full')).toEqual({ w: 480, h: 300 });
    expect(motionSize(301, 301, 'gif', 'full')).toEqual({ w: 300, h: 300 });
    expect(motionSize(1080, 675, 'mp4', 'full')).toEqual({ w: 1080, h: 674 });
    expect(motionSize(1080, 675, 'mp4', 720)).toEqual({ w: 720, h: 450 });
    expect(motionFps('gif')).toBeLessThan(motionFps('mp4'));
    expect(isMotionFormat('gif')).toBe(true);
    expect(isMotionFormat('png')).toBe(false);
  });

  it('finds the moving layers: GIFs and videos, once per picture', () => {
    expect(isAnimatedGifUrl('data:image/gif;base64,R0lG')).toBe(true);
    expect(isAnimatedGifUrl('https://x.test/cat.GIF?w=2')).toBe(true);
    expect(isAnimatedGifUrl('data:image/png;base64,iVBO')).toBe(false);
    const specs = animatedSpecs(
      [
        { url: 'data:video/mp4;base64,AAAA', trimStart: 1, trimEnd: 3 },
        { url: 'data:image/png;base64,iVBO' },
        { url: 'data:image/gif;base64,R0lG' },
      ],
      [{ url: 'data:image/gif;base64,R0lG' }, { imageUrl: '/stickers/dance.gif' }, { url: '/stickers/still.png' }],
    );
    expect(specs).toEqual([
      { url: 'data:video/mp4;base64,AAAA', kind: 'video', trimStart: 1, trimEnd: 3 },
      { url: 'data:image/gif;base64,R0lG', kind: 'gif' },
      { url: '/stickers/dance.gif', kind: 'gif' },
    ]);
  });
});
