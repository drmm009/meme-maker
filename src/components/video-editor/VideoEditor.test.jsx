// @vitest-environment jsdom
// Smoke tests for the video editor shell: what the tool rail, timeline and modes do to the store.
// The Konva preview, FFmpeg export and the meme API are replaced; everything else is real.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import VideoEditor from './VideoEditor';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { exportVideoFFmpeg } from '../../utils/ffmpegExport';

vi.mock('./CanvasPreview', () => ({ default: () => <div data-testid="canvas-preview" /> }));
vi.mock('../../utils/ffmpegExport', () => ({
  exportVideoFFmpeg: vi.fn(() => Promise.resolve({ blob: new Blob(['x'], { type: 'video/mp4' }), fileName: 'meme-studio-1.mp4' })),
  cancelExport: vi.fn(),
}));
vi.mock('../../utils/clipEffects', () => ({
  captureFrame: vi.fn(() => Promise.resolve('blob:still')),
  renderClipEffect: vi.fn(() => Promise.resolve({ url: 'blob:rev', durationMs: 2000 })),
}));
vi.mock('../../services/memeService', () => ({ fetchOpenSourceMemes: () => Promise.resolve([]) }));

const store = () => useEditorStore.getState();
const clips = (container) => [...container.querySelectorAll('.vt-clip')];

beforeEach(() => {
  store().clearItems();
  store().setLayoutSlots([]);
});
afterEach(cleanup);

describe('VideoEditor', () => {
  it('starts in edit mode with an empty-state prompt and the add tools', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
    expect(screen.getByText('Start with a video or photo')).toBeTruthy();
    expect(screen.getByText('Add a video')).toBeTruthy();
    for (const label of ['Text', 'Stickers', 'Emoji', 'Photo', 'Video', 'Sounds']) expect(screen.getByText(label)).toBeTruthy();
  });

  it('adds a text clip from the rail and shows it on the timeline', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    expect(store().items).toHaveLength(1);
    expect(store().items[0]).toMatchObject({ type: 'text', text: 'NEW TEXT' });
    expect(clips(container)).toHaveLength(1);
    expect(clips(container)[0].className).toContain('vt-clip--text');
    expect(screen.queryByText('Start with a video or photo')).toBeNull();
  });

  it('swaps the rail to clip tools on select and back on Done', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(clips(container)[0]);
    expect(store().activeItemId).toBe(store().items[0].id);
    expect(clips(container)[0].className).toContain('is-selected');
    expect(screen.getByText('Background')).toBeTruthy();
    expect(screen.queryByText('Stickers')).toBeNull();
    fireEvent.click(screen.getByText('Done'));
    expect(store().activeItemId).toBe(null);
    expect(screen.getByText('Stickers')).toBeTruthy();
  });

  it('duplicates and deletes the selected clip', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Duplicate'));
    expect(store().items).toHaveLength(2);
    fireEvent.click(screen.getByText('Delete'));
    expect(store().items).toHaveLength(1);
    expect(store().activeItemId).toBe(null);
  });

  it('hides a clip with its eye button and mutes video clips', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Hide clip'));
    expect(store().items[0].hidden).toBe(true);
    expect(clips(container)[0].className).toContain('is-hidden');
    fireEvent.click(screen.getByLabelText('Mute clip'));
    expect(store().items[0].muted).toBe(true);
    expect(screen.getByLabelText('Unmute clip')).toBeTruthy();
  });

  it('cycles video speed and keeps the clip covering the same footage', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('1×'));
    expect(store().items[0]).toMatchObject({ playbackRate: 1.5 });
    expect(store().items[0].endMs).toBeCloseTo(2000 / 1.5);
  });

  it('switches between edit and full-screen preview', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Full screen preview'));
    expect(container.querySelector('.vt-editor.is-preview')).toBeTruthy();
    fireEvent.click(screen.getByText('Edit'));
    expect(container.querySelector('.vt-editor.is-edit')).toBeTruthy();
  });

  it('plays and pauses from the transport and the space bar', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Play'));
    expect(store().isPlaying).toBe(true);
    fireEvent.keyDown(window, { code: 'Space' });
    expect(store().isPlaying).toBe(false);
  });

  it('splits the selected clip at the playhead', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    act(() => store().setPlayhead(1500));
    fireEvent.click(screen.getByText('Split'));
    expect(store().items.map((i) => [i.startMs, i.endMs])).toEqual([[0, 1500], [1500, 4000]]);
    expect(clips(container)).toHaveLength(2);
  });

  it('sets volume and fades from the volume panel', () => {
    act(() => store().addItem({ type: 'audio', url: 'boom.mp3', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Volume'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } });
    fireEvent.click(screen.getByText('Fade in'));
    expect(store().items[0]).toMatchObject({ volume: 0.4, fadeInMs: 600 });
    fireEvent.click(screen.getByText('Fade in'));
    expect(store().items[0].fadeInMs).toBe(0);
  });

  it('edits, resizes and aligns text from the rail', () => {
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByPlaceholderText('Type your text'), { target: { value: 'WHEN IT WORKS' } });
    fireEvent.click(screen.getByText('Size'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '150' } });
    fireEvent.click(screen.getByText('Align'));
    expect(store().items[0]).toMatchObject({ text: 'WHEN IT WORKS', fontSize: 150, align: 'right' });
  });

  it('turns green-screen removal on, tunes it and turns it off', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Green screen'));
    expect(store().items[0].chromaKey).toEqual({ color: 'auto', similarity: 0.22, blend: 0.08 });
    const [strength, edges] = screen.getAllByRole('slider');
    fireEvent.change(strength, { target: { value: '30' } });
    fireEvent.change(edges, { target: { value: '12' } });
    expect(store().items[0].chromaKey).toMatchObject({ similarity: 0.3, blend: 0.12 });
    fireEvent.click(screen.getByText('Turn off'));
    expect(store().items[0].chromaKey).toBe(null);
  });

  it('picks a text animation and previews it', () => {
    const previews = [];
    const onPreview = (e) => previews.push(e.detail.id);
    window.addEventListener('vt-preview-text-animation', onPreview);
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Text'));
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Animate'));
    fireEvent.click(screen.getByText('Typewriter'));
    expect(store().items[0].animation).toBe('typewriter');
    expect(previews).toEqual([store().items[0].id]);
    fireEvent.click(screen.getByText('None'));
    expect(store().items[0].animation).toBe(null);
    window.removeEventListener('vt-preview-text-animation', onPreview);
  });

  it('sets the canvas background from the rail', () => {
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByText('Background'));
    fireEvent.click(screen.getByLabelText('#000000'));
    expect(store().backgroundColor).toBe('#000000');
    expect(screen.getByLabelText('#000000').getAttribute('aria-checked')).toBe('true');
    act(() => store().setBackgroundColor('#ffffff'));
  });

  it('exports without auto-downloading and shows the ready card', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(screen.getByLabelText('Export'));
    await act(async () => { fireEvent.click(screen.getByText('720p · faster')); });
    expect(exportVideoFFmpeg.mock.calls.at(-1)[6]).toMatchObject({ format: 'mp4', resolution: 720, download: false, backgroundColor: '#ffffff' });
    expect(await screen.findByText('Your video is ready')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('Your video is ready')).toBeNull();
  });

  it('drops a sound effect at the playhead with one tap', () => {
    window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 5000 }));
    render(<VideoEditor onBack={() => {}} />);
    act(() => store().setPlayhead(1200));
    fireEvent.click(screen.getByText('SFX'));
    fireEvent.click(screen.getByText('Vine Boom'));
    const sound = store().items.find((i) => i.type === 'audio');
    expect(sound).toMatchObject({ name: 'Vine Boom', url: '/sounds/vine_boom.mp3', startMs: 1200 });
  });

  it('freezes the frame under the playhead', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    act(() => store().setPlayhead(1500));
    await act(async () => { fireEvent.click(screen.getByText('Freeze')); });
    const still = store().items.find((i) => i.isFreeze);
    expect(still).toMatchObject({ url: 'blob:still', startMs: 1500, endMs: 3000 });
    expect(store().busy).toBe(null);
  });

  it('reverses a clip and switches it back', async () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    await act(async () => { fireEvent.click(screen.getByText('Reverse')); });
    expect(store().items[0]).toMatchObject({ url: 'blob:rev', effect: 'reverse' });
    fireEvent.click(screen.getByText('Reverse'));
    expect(store().items[0]).toMatchObject({ url: 'a.mp4', effect: null });
  });

  it('adds zoom punches at the playhead and clears them', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 4000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Punch'));
    act(() => store().setPlayhead(1200));
    fireEvent.click(screen.getByText('Punch at playhead'));
    act(() => store().setPlayhead(2500));
    fireEvent.click(screen.getByText('Punch at playhead'));
    expect(store().items[0].punches).toEqual([1200, 2500]);
    expect(container.querySelectorAll('.vt-punch-mark')).toHaveLength(2);
    fireEvent.click(screen.getByText('Remove nearest'));
    expect(store().items[0].punches).toEqual([1200]);
    fireEvent.click(screen.getByText(/Clear all/));
    expect(store().items[0].punches).toEqual([]);
  });

  it('brings a sticker in front of text', async () => {
    const { drawOrder } = await import('../../utils/layerOrder');
    act(() => {
      store().addItem({ type: 'sticker', url: 'a.png' });
      store().addItem({ type: 'text', text: 'TOP' });
    });
    const { container } = render(<VideoEditor onBack={() => {}} />);
    expect(drawOrder(store().items).map((i) => i.type)).toEqual(['sticker', 'text']);
    fireEvent.click(clips(container).find((c) => c.className.includes('vt-clip--sticker')));
    fireEvent.click(screen.getByText('Forward'));
    expect(drawOrder(store().items).map((i) => i.type)).toEqual(['text', 'sticker']);
  });

  it('applies a filter preset and adjustments to a video', () => {
    act(() => store().addItem({ type: 'video', url: 'a.mp4', durationMs: 2000 }));
    const { container } = render(<VideoEditor onBack={() => {}} />);
    fireEvent.click(clips(container)[0]);
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText('Vintage'));
    const [bright] = screen.getAllByRole('slider');
    fireEvent.change(bright, { target: { value: '30' } });
    expect(store().items[0].filter).toEqual({ preset: 'vintage', brightness: 30 });
    expect(screen.getAllByText('Vintage').length).toBeGreaterThan(1);
  });

  it('calls onBack from the close button', () => {
    const onBack = vi.fn();
    render(<VideoEditor onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('Close editor'));
    expect(onBack).toHaveBeenCalled();
  });
});
