// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react';
import VideoStartArea from './VideoStartArea';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { DEFAULT_VIDEO_BAND } from '../../utils/videoBands';
import { setDragPoint } from './preview/panelDrag';

type AnyState = Record<string, unknown>;
const store = () => useEditorStore.getState() as unknown as AnyState & { addItem: (i: AnyState) => void; items: AnyState[] };
const set = (s: AnyState) => useEditorStore.setState(s as never);
const slots = (n: number) => Array.from({ length: n }, (_, i) => ({ x: (i % 2) * 400, y: Math.floor(i / 2) * 300, width: 400, height: 300 }));

beforeEach(() => set({
  items: [], layoutId: null, layoutSlots: [], targetSlot: null, canvasAspectRatio: 4 / 3,
  videoHeader: DEFAULT_VIDEO_BAND, videoFooter: DEFAULT_VIDEO_BAND,
}));
afterEach(() => { cleanup(); setDragPoint(null); });

describe('VideoStartArea', () => {
  it('puts a start card in each empty panel of a 4-panel grid, and none on a bigger grid', () => {
    set({ layoutId: '4-grid', layoutSlots: slots(4) });
    render(<VideoStartArea open onPick={() => {}} />);
    expect(screen.getAllByRole('group', { name: /^Panel \d$/ })).toHaveLength(4);
    expect(screen.queryByRole('group', { name: 'Start your video' })).toBeNull();
    cleanup();
    set({ layoutId: 'custom-grid', layoutSlots: slots(6) });
    render(<VideoStartArea open onPick={() => {}} />);
    expect(screen.queryAllByRole('group')).toHaveLength(0);
  });

  it('targets its panel, so the clip added next goes there, and the panel\u2019s card goes', () => {
    set({ layoutId: '4-grid', layoutSlots: slots(4) });
    const onPick = vi.fn();
    render(<VideoStartArea open onPick={onPick} />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Panel 3' })).getByRole('button', { name: 'Add video' }));
    expect(onPick).toHaveBeenCalledWith('video');
    expect(useEditorStore.getState().targetSlot).toBe(2);
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    expect(store().items[0].slotIndex).toBe(2);
    expect(useEditorStore.getState().targetSlot).toBeNull();
    expect(screen.getAllByRole('group', { name: /^Panel \d$/ }).map((g) => g.getAttribute('aria-label'))).toEqual(['Panel 1', 'Panel 2', 'Panel 4']);
  });

  it('hides a panel’s card for anything placed in it, or dragged over it', () => {
    set({ layoutId: '4-grid', layoutSlots: slots(4), items: [
      { id: 'st', type: 'sticker', x: 450, y: 50, width: 100, height: 100, startMs: 0, endMs: 1000 }, // in panel 2
      { id: 'v', type: 'video', x: 0, y: 0, width: 400, height: 300, slotIndex: 0, startMs: 0, endMs: 1000 },
    ] });
    render(<VideoStartArea open onPick={() => {}} />);
    const names = () => screen.queryAllByRole('group', { name: /^Panel \d$/ }).map((g) => g.getAttribute('aria-label'));
    expect(names()).toEqual(['Panel 3', 'Panel 4']);
    act(() => setDragPoint({ x: 600, y: 450 })); // over panel 4
    expect(names()).toEqual(['Panel 3']);
    act(() => setDragPoint(null));
    expect(names()).toEqual(['Panel 3', 'Panel 4']);
  });

  it('puts a new sticker or clip in the first empty panel', () => {
    set({ layoutId: '4-grid', layoutSlots: slots(4), items: [{ id: 'v', type: 'video', slotIndex: 0, startMs: 0, endMs: 1000 }] });
    act(() => store().addItem({ type: 'sticker', url: 's.png' }));
    expect(store().items[1].startSlot).toBe(1);
    act(() => useEditorStore.getState().updateItem?.(store().items[1].id as string, { x: 450, y: 50, width: 100, height: 100, isPositioned: true } as never));
    act(() => store().addItem({ type: 'image', url: 'p.png' }));
    expect(store().items[2].slotIndex).toBe(2);
  });

  it('shows the start card between caption bars while there is only text', () => {
    const band = { enabled: true, bgColor: '#000000', height: 120 };
    set({ canvasAspectRatio: 1, videoHeader: band, videoFooter: band, items: [{ id: 't', type: 'text', text: 'TOP TEXT', startMs: 0, endMs: 1000 }] });
    const { container } = render(<VideoStartArea open onPick={() => {}} />);
    expect(screen.getByRole('group', { name: 'Start your video' })).toBeTruthy();
    const area = container.querySelector('.ie-image-area') as HTMLElement;
    expect(area.style.getPropertyValue('--canvas-img-top')).toBe('15%');
    expect(area.style.getPropertyValue('--canvas-img-h')).toBe('70%');
  });

  it('shows nothing while the timeline is open', () => {
    render(<VideoStartArea open={false} onPick={() => {}} />);
    expect(screen.queryAllByRole('group')).toHaveLength(0);
  });
});
