import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './useVideoEditorStore';

const store = () => useEditorStore.getState();

beforeEach(() => {
  store().clearItems();
  store().setLayoutSlots([]);
});

describe('video editor store', () => {
  it('starts empty with the 7s minimum duration', () => {
    expect(store().items).toEqual([]);
    expect(store().duration).toBe(7000);
  });

  it('starts the first video at 0 and pads the duration by 3s', () => {
    store().setPlayhead(4000);
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 10000 });
    const [video] = store().items;
    expect(video).toMatchObject({ type: 'video', startMs: 0, endMs: 10000, muted: false, playbackRate: 1, sourceDurationMs: 10000 });
    expect(video.id).toMatch(/^item-/);
    expect(store().duration).toBe(13000);
  });

  it('appends later videos after the last one, wherever the playhead is', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 3000 });
    store().setPlayhead(1000);
    store().addItem({ type: 'video', url: 'b.mp4', durationMs: 2000 });
    expect(store().items[1]).toMatchObject({ startMs: 3000, endMs: 5000 });
  });

  it('puts sounds at the playhead and honours an explicit start', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 8000 });
    store().setPlayhead(2500);
    store().addItem({ type: 'audio', url: 'boom.mp3', durationMs: 1000 });
    store().addItem({ type: 'video', url: 'c.mp4', durationMs: 1000, startMs: 500 });
    expect(store().items[1]).toMatchObject({ startMs: 2500, endMs: 3500 });
    expect(store().items[2]).toMatchObject({ startMs: 500, endMs: 1500 });
  });

  it('plays layout-slot videos side by side from the playhead', () => {
    store().setLayoutSlots([{ x: 0 }, { x: 1 }]);
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 3000 });
    store().addItem({ type: 'video', url: 'b.mp4', durationMs: 3000 });
    expect(store().items.map((i) => i.startMs)).toEqual([0, 0]);
  });

  it('splits a clip at a time and keeps the footage continuous', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 });
    const { id } = store().items[0];
    store().updateItem(id, { playbackRate: 2, trimStartMs: 500, fadeInMs: 300, fadeOutMs: 300 });
    store().splitItem(id, 1000);
    const [left, right] = store().items;
    expect(left).toMatchObject({ id, startMs: 0, endMs: 1000, fadeInMs: 300, fadeOutMs: 0 });
    expect(right).toMatchObject({ startMs: 1000, endMs: 4000, trimStartMs: 2500, fadeInMs: 0, fadeOutMs: 300 });
    expect(right.id).not.toBe(id);
    expect(store().activeItemId).toBe(right.id);
  });

  it('ignores a split too close to a clip edge', () => {
    store().addItem({ type: 'text', text: 'A' });
    const { id } = store().items[0];
    store().splitItem(id, 50);
    store().splitItem(id, 99999);
    expect(store().items).toHaveLength(1);
  });

  it('freezes a frame mid-clip: split, hold, and push everything after it', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 });
    store().addItem({ type: 'text', text: 'T' });
    store().setPlayhead(3000);
    store().addItem({ type: 'audio', url: 'boom.mp3', durationMs: 500 });
    const [video] = store().items;
    store().updateItem(video.id, { x: 10, y: 20, width: 400, height: 225, scaleX: 2, scaleY: 2, playbackRate: 2 });
    store().insertFreeze(video.id, 1000, 'blob:still', 1500);
    const [left, still, right, text, boom] = store().items;
    expect(left).toMatchObject({ id: video.id, startMs: 0, endMs: 1000 });
    expect(still).toMatchObject({ type: 'image', url: 'blob:still', isFreeze: true, startMs: 1000, endMs: 2500, x: 10, y: 20, width: 400, height: 225, scaleX: 2, isPositioned: true });
    expect(right).toMatchObject({ startMs: 2500, endMs: 5500, trimStartMs: 2000 });
    expect(text).toMatchObject({ startMs: 0, endMs: 5500 });
    expect(boom).toMatchObject({ startMs: 4500, endMs: 5000 });
    expect(store().activeItemId).toBe(still.id);
  });

  it('puts the freeze before or after the clip when the playhead is at an edge', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 });
    store().addItem({ type: 'video', url: 'b.mp4', durationMs: 2000 });
    const [a] = store().items;
    store().insertFreeze(a.id, 1950, 'blob:end', 1000);
    expect(store().items.map((i) => [i.type, i.startMs, i.endMs])).toEqual([
      ['video', 0, 2000], ['image', 2000, 3000], ['video', 3000, 5000],
    ]);
    store().insertFreeze(a.id, 0, 'blob:start', 500);
    expect(store().items.slice(0, 2).map((i) => [i.type, i.startMs, i.endMs])).toEqual([['image', 0, 500], ['video', 500, 2500]]);
  });

  it('swaps in reversed and boomerang renders and restores the original', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 6000 });
    const { id } = store().items[0];
    store().updateItem(id, { trimStartMs: 1000, endMs: 2000 });
    store().applyClipEffect(id, 'reverse', { url: 'blob:rev', durationMs: 2000 });
    expect(store().items[0]).toMatchObject({ url: 'blob:rev', effect: 'reverse', trimStartMs: 0, sourceDurationMs: 2000, endMs: 2000 });
    store().applyClipEffect(id, 'boomerang', { url: 'blob:boom', durationMs: 4000 });
    expect(store().items[0]).toMatchObject({ url: 'blob:boom', effect: 'boomerang', endMs: 4000 });
    expect(store().items[0].original).toMatchObject({ url: 'a.mp4', trimStartMs: 1000, endMs: 2000 });
    store().applyClipEffect(id, null);
    expect(store().items[0]).toMatchObject({ url: 'a.mp4', trimStartMs: 1000, endMs: 2000, sourceDurationMs: 6000, effect: null, original: null });
  });

  it('duplicates media after the original and nudges overlays, keeping settings', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 });
    store().addItem({ type: 'text', text: 'T' });
    const [video, text] = store().items;
    store().updateItem(video.id, { muted: true, playbackRate: 2 });
    store().updateItem(text.id, { rotation: 45 });
    store().duplicateItem(video.id);
    store().duplicateItem(text.id);
    const [, , videoCopy, textCopy] = store().items;
    expect(videoCopy).toMatchObject({ startMs: 2000, endMs: 4000, muted: true, playbackRate: 2 });
    expect(textCopy).toMatchObject({ rotation: 45, x: text.x + 20, y: text.y + 20 });
    expect(store().activeItemId).toBe(textCopy.id);
  });

  it('stretches overlays across the whole video', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 10000 });
    store().setPlayhead(4000);
    store().addItem({ type: 'text', text: 'HI' });
    const text = store().items[1];
    expect(text.startMs).toBe(0);
    expect(text.endMs).toBe(10000);
  });

  it('gives overlays 7s when there is no video', () => {
    store().addItem({ type: 'sticker', url: 'x.png' });
    expect(store().items[0]).toMatchObject({ startMs: 0, endMs: 7000 });
  });

  it('staggers new overlays so they do not stack exactly', () => {
    store().addItem({ type: 'text', text: 'A' });
    store().addItem({ type: 'text', text: 'B' });
    expect(store().items.map((i) => [i.x, i.y])).toEqual([[50, 50], [85, 85]]);
  });

  it('fills the first free layout slot with media', () => {
    store().setLayoutSlots([{ x: 0 }, { x: 1 }]);
    store().addItem({ type: 'image', url: 'a.png' });
    store().addItem({ type: 'video', url: 'b.mp4', durationMs: 1000 });
    store().addItem({ type: 'text', text: 'T' });
    expect(store().items.map((i) => i.slotIndex)).toEqual([0, 1, undefined]);
  });

  it('recomputes the duration on update and caps it at 100s', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 });
    const { id } = store().items[0];
    store().updateItem(id, { endMs: 20000 });
    expect(store().duration).toBe(23000);
    store().updateItem(id, { endMs: 200000 });
    expect(store().duration).toBe(100000);
  });

  it('clears the selection when the selected item is removed', () => {
    store().addItem({ type: 'text', text: 'A' });
    const { id } = store().items[0];
    store().setActiveItem(id);
    store().removeItem(id);
    expect(store().items).toEqual([]);
    expect(store().activeItemId).toBe(null);
    expect(store().duration).toBe(7000);
  });

  it('clamps the playhead to the project', () => {
    store().setPlayhead(-50);
    expect(store().playhead).toBe(0);
    store().setPlayhead(999999);
    expect(store().playhead).toBe(7000);
  });
});
