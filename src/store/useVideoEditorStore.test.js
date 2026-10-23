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

  it('places a video at the playhead and pads the duration by 3s', () => {
    store().addItem({ type: 'video', url: 'a.mp4', durationMs: 10000 });
    const [video] = store().items;
    expect(video).toMatchObject({ type: 'video', startMs: 0, endMs: 10000, muted: false, playbackRate: 1 });
    expect(video.id).toMatch(/^item-/);
    expect(store().duration).toBe(13000);
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
