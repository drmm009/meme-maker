import { describe, it, expect } from 'vitest';
import { historyLabel, historyTimeline } from './historyTimeline';

const caps = [{ id: 'a' }];

describe('history list', () => {
  it('says what each step did', () => {
    expect(historyLabel({ captions: [] }, { captions: caps })).toBe('Added text');
    expect(historyLabel({ captions: caps }, { captions: [] })).toBe('Removed text');
    expect(historyLabel({ stickers: [{}] }, { stickers: [{ x: 1 }] })).toBe('Changed sticker');
    expect(historyLabel({ activeTemplate: { a: 1 } }, { activeTemplate: { a: 2 } })).toBe('Changed the photo');
    expect(historyLabel({ canvasFlipX: false }, { canvasFlipX: true })).toBe('Mirrored');
    const same = { captions: caps };
    expect(historyLabel(same, same)).toBe('Edit');
  });

  it('lays the steps out oldest first with the current one at 0', () => {
    const s0 = { captions: [] };
    const s1 = { captions: caps };
    const s2 = { captions: caps, stickers: [{}] };
    const s3 = { captions: caps, stickers: [] };
    // Undone once: s3 is the next redo (futureStates holds it last).
    const timeline = historyTimeline([s0, s1], s2, [s3]);
    expect(timeline).toEqual([
      { label: 'Start', offset: -2 },
      { label: 'Added text', offset: -1 },
      { label: 'Added a sticker', offset: 0 },
      { label: 'Removed a sticker', offset: 1 },
    ]);
  });
});
