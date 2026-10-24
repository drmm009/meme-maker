import { describe, it, expect } from 'vitest';
import { captionFrames, concatList, splitCaptionTrack } from './captionTrack';

const cap = (id, startMs, endMs, extra = {}) => ({ id, type: 'text', autoCaption: true, text: 'HI', startMs, endMs, ...extra });

describe('captionTrack', () => {
  it('puts non-overlapping auto captions on the track and leaves the rest', () => {
    const items = [cap('b', 1000, 2000), cap('a', 0, 1000), cap('c', 1500, 2500), cap('s', 3000, 4000, { animation: 'shake' }), { id: 't', type: 'text', startMs: 0, endMs: 9000 }];
    const { track, rest } = splitCaptionTrack(items);
    expect(track.map((i) => i.id)).toEqual(['a', 'b']);
    expect(rest.map((i) => i.id).sort()).toEqual(['c', 's', 't']);
  });

  it('gives each animation step its own frame', () => {
    const frames = captionFrames([cap('a', 1000, 2000), cap('p', 2000, 3000, { animation: 'pop' })]);
    expect(frames[0]).toMatchObject({ fromMs: 1000, toMs: 2000 });
    expect(frames.length).toBeGreaterThan(3);
    expect(frames[1].fromMs).toBe(2000);
    expect(frames[frames.length - 1].toMs).toBe(3000);
  });

  it('writes a concat list with blanks in the gaps', () => {
    const frames = [{ fromMs: 500, toMs: 1500 }, { fromMs: 1500, toMs: 2000 }];
    expect(concatList(frames, ['c0.png', 'c1.png'], 'blank.png', 3000)).toBe([
      'ffconcat version 1.0',
      'file blank.png', 'duration 0.500',
      'file c0.png', 'duration 1.000',
      'file c1.png', 'duration 0.500',
      'file blank.png', 'duration 1.000',
      'file blank.png', '',
    ].join('\n'));
  });
});
