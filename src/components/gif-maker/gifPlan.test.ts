import { describe, it, expect } from 'vitest';
import { clock, defaultTrim, frameOrder, gifDimensions, gifSeconds, moveTrim, photosGifArgs, slideTrim, videoGifArgs, wrapCaption, MAX_CLIP_S } from './gifPlan';

describe('gifPlan', () => {
  it('starts a video on its first five seconds, or the whole of a shorter one', () => {
    expect(defaultTrim(30)).toEqual({ start: 0, end: 5 });
    expect(defaultTrim(2.4)).toEqual({ start: 0, end: 2.4 });
  });

  it('keeps a trim inside the video, at least half a second and at most ten long', () => {
    const d = 60;
    expect(moveTrim({ start: 0, end: 5 }, 'end', 30, d)).toEqual({ start: 30 - MAX_CLIP_S, end: 30 });
    expect(moveTrim({ start: 10, end: 15 }, 'start', 2, d)).toEqual({ start: 2, end: 12 });
    expect(moveTrim({ start: 10, end: 15 }, 'start', 14.9, d)).toEqual({ start: 14.5, end: 15 });
    expect(moveTrim({ start: 10, end: 15 }, 'end', 99, d)).toEqual({ start: 50, end: 60 });
    expect(moveTrim({ start: 0, end: 5 }, 'start', -3, d)).toEqual({ start: 0, end: 5 });
    expect(slideTrim({ start: 0, end: 5 }, 58, d)).toEqual({ start: 55, end: 60 });
  });

  it('sizes the GIF by its longer side, never larger than the picture, both sides even', () => {
    expect(gifDimensions(1920, 1080, 480)).toEqual({ w: 480, h: 270 });
    expect(gifDimensions(1080, 1920, 320)).toEqual({ w: 180, h: 320 });
    expect(gifDimensions(201, 151, 480)).toEqual({ w: 202, h: 152 });
  });

  it('times the GIF, and bounces photos forwards then back without doubling the ends', () => {
    expect(gifSeconds({ clip: 4, speed: 2, loop: 'loop' })).toBe(2);
    expect(gifSeconds({ photos: 4, frameS: 0.5, loop: 'bounce' })).toBe(4);
    expect(frameOrder(4, 'loop')).toEqual([0, 1, 2, 3]);
    expect(frameOrder(4, 'bounce')).toEqual([0, 1, 2, 3, 2, 1]);
    expect(frameOrder(2, 'bounce')).toEqual([0, 1]);
  });

  it('builds the video command: cut, speed, size, bounce, caption, palette', () => {
    const args = videoGifArgs({ input: 'in.mp4', output: 'out.gif', trim: { start: 2, end: 5 }, speed: 2, loop: 'bounce', w: 480, h: 270, caption: 'cap.png' });
    expect(args.slice(0, 6)).toEqual(['-ss', '2.000', '-t', '3.000', '-i', 'in.mp4']);
    expect(args).toContain('cap.png');
    const graph = args[args.indexOf('-filter_complex') + 1];
    expect(graph).toContain('setpts=PTS/2,fps=15,scale=480:270');
    expect(graph).toContain('reverse');
    expect(graph).toContain('[1:v]overlay=0:0');
    expect(graph).toContain('palettegen');
    expect(args.slice(-5)).toEqual(['-an', '-loop', '0', '-y', 'out.gif']);

    const plain = videoGifArgs({ input: 'in.mp4', output: 'out.gif', trim: { start: 0, end: 1 }, speed: 1, loop: 'loop', w: 320, h: 320 });
    expect(plain.join(' ')).not.toMatch(/reverse|overlay/);
  });

  it('builds the photos command at the frame rate their time gives', () => {
    expect(photosGifArgs({ pattern: 'f_%03d.png', output: 'o.gif', frameS: 0.25 }).slice(0, 4)).toEqual(['-framerate', '4.0000', '-i', 'f_%03d.png']);
  });

  it('wraps a caption in upper case to the width', () => {
    const measure = (s: string) => s.length * 10;
    expect(wrapCaption('when the code works', 100, measure)).toEqual(['WHEN THE', 'CODE WORKS']);
    expect(wrapCaption('   ', 100, measure)).toEqual([]);
    expect(clock(3.5)).toBe('0:03.5');
    expect(clock(65)).toBe('1:05.0');
  });
});
